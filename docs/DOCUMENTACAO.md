# Documentação Técnica — Aivacol Fleet Management API

Documentação de arquitetura, funcionalidades e regras de negócio da API de gestão de frotas
da Aivacol. Complementa o [README.md](../README.md), que foca em como subir e operar o ambiente.

---

## 1. Visão geral

A aplicação é uma API REST em **NestJS 10 / Node 20** que gerencia uma frota de veículos com
autenticação JWT. Além do CRUD principal, integra quatro serviços de infraestrutura:

| Serviço      | Papel na aplicação                                                        |
| ------------ | ------------------------------------------------------------------------- |
| SQL Server   | Banco relacional principal (users, brands, models, vehicles) via TypeORM  |
| Redis        | Cache de leitura exclusivo do recurso `vehicles`                          |
| RabbitMQ     | Mensageria assíncrona dos eventos de auditoria de `vehicles`             |
| MongoDB      | Persistência dos logs de auditoria de negócio (`audit_logs`)             |

Todo o ambiente sobe via Docker Compose. A API é o container `api`; os demais serviços
são acessados pelos nomes de rede do Compose (`sqlserver`, `redis`, `rabbitmq`, `mongodb`).

### Princípios de configuração

- Validação global de payloads com `ValidationPipe` (`whitelist`, `transform`,
  `forbidNonWhitelisted`) em [src/main.ts](../src/main.ts) — campos não declarados no DTO
  fazem a requisição falhar.
- Variáveis de ambiente carregadas globalmente e em cache (`ConfigModule`), com
  `getOrThrow` para variáveis obrigatórias de banco/cache — a aplicação não sobe sem elas.
- `synchronize: false` e `migrationsRun: false`: o schema é sempre controlado por
  migrations explícitas, nunca gerado automaticamente.

---

## 2. Arquitetura em módulos

A aplicação segue a modularização padrão do NestJS. Cada módulo de domínio expõe
controller + service + entidade + DTOs.

```
AppModule
├── AuthModule       → login, emissão e validação de JWT
├── UsersModule      → CRUD de usuários (base de autenticação)
├── BrandsModule     → CRUD de marcas
├── ModelsModule     → CRUD de modelos (pertencem a uma marca)
├── VehiclesModule   → CRUD de veículos + cache Redis + publicação de auditoria
└── AuditModule      → publisher, consumer RabbitMQ e consulta de logs no MongoDB
```

### Fluxo de dependências entre módulos

- `VehiclesModule` depende de `AuditModule` (publica eventos) e do repositório de `Model`.
- `ModelsModule` usa os repositórios de `Brand` e `Vehicle` (para validar integridade).
- `BrandsModule` usa o repositório de `Model` (para validar exclusão).
- `AuthModule` depende de `UsersModule` (busca de usuário por e-mail).

---

## 3. Modelo de dados

### Diagrama de relacionamento

```
User (1) ──< created_by ── Brand (1) ──< brand_id ── Model (1) ──< model_id ── Vehicle
   │                                                                              │
   └──────────────< created_by ─────────────────────────────────────────────────┘
                    (Brand, Model e Vehicle registram quem criou)
```

Cadeia principal de negócio: **Brand → Model → Vehicle**.

### Entidades (SQL Server)

**users** — [user.entity.ts](../src/modules/users/entities/user.entity.ts)

| Coluna          | Tipo           | Regras                                  |
| --------------- | -------------- | --------------------------------------- |
| id              | int PK         | auto-incremento                         |
| nickname        | nvarchar(50)   | opcional, único quando informado        |
| name            | nvarchar(120)  | obrigatório                             |
| email           | nvarchar(255)  | obrigatório, **único**                  |
| password_hash   | nvarchar(255)  | bcrypt (cost 10) — nunca exposto        |
| created_at      | datetime2      | UTC (`SYSUTCDATETIME()`)                |
| updated_at      | datetime2      | UTC                                     |

**brands** — [brand.entity.ts](../src/modules/brands/entities/brand.entity.ts)

| Coluna       | Tipo           | Regras                                      |
| ------------ | -------------- | ------------------------------------------- |
| id           | int PK         |                                             |
| name         | nvarchar(120)  | obrigatório, **único**                      |
| created_by   | int FK → users | usuário autenticado que criou (obrigatório) |

**models** — [model.entity.ts](../src/modules/models/entities/model.entity.ts)

| Coluna       | Tipo            | Regras                                       |
| ------------ | --------------- | -------------------------------------------- |
| id           | int PK          |                                              |
| name         | nvarchar(120)   | obrigatório (não precisa ser único)          |
| brand_id     | int FK → brands | obrigatório — a marca precisa existir        |
| created_by   | int FK → users  | usuário autenticado que criou                |

**vehicles** — [vehicle.entity.ts](../src/modules/vehicles/entities/vehicle.entity.ts)

| Coluna         | Tipo             | Regras                                        |
| -------------- | ---------------- | --------------------------------------------- |
| id             | int PK           |                                               |
| license_plate  | nvarchar(20)     | obrigatório, **único** (normalizado maiúsculo)|
| chassis        | nvarchar(50)     | obrigatório, **único** (normalizado maiúsculo)|
| renavam        | nvarchar(20)     | obrigatório, **único**                        |
| year           | int              | entre 1900 e (ano atual + 1)                  |
| model_id       | int FK → models  | obrigatório — o modelo precisa existir        |
| created_by     | int FK → users   | usuário autenticado que criou                 |

### Coleção de auditoria (MongoDB)

**audit_logs** — [audit-event.type.ts](../src/modules/audit/audit-event.type.ts)

```jsonc
{
  "event": "vehicle.created | vehicle.updated | vehicle.deleted",
  "entity": "vehicle",
  "entityId": 123,
  "userId": 1,            // quem criou o veículo (createdBy)
  "payload": {            // snapshot do veículo no momento do evento
    "licensePlate": "ABC1234",
    "chassis": "9BWZZZ377VT004251",
    "renavam": "12345678901",
    "year": 2024,
    "modelId": 1,
    "createdBy": 1
  },
  "createdAt": "2026-07-18T12:00:00.000Z"
}
```

---

## 4. Autenticação e autorização

### Login

`POST /auth/login` — [auth.service.ts](../src/modules/auth/auth.service.ts)

- Recebe `email` e `password`. O e-mail é normalizado (trim + lowercase) e o password
  exige no mínimo 8 caracteres ([login.dto.ts](../src/modules/auth/dto/login.dto.ts)).
- Busca o usuário por e-mail e compara a senha com `bcrypt.compare`.
- **Mensagem genérica**: usuário inexistente e senha incorreta retornam ambos
  `401 Invalid credentials` — não vaza qual dos dois falhou.
- Em sucesso, emite um JWT assinado com `JWT_SECRET`, expiração `JWT_EXPIRES_IN`,
  contendo `{ sub: id, nickname, email }`.

Resposta:

```json
{ "accessToken": "<JWT>", "tokenType": "Bearer" }
```

### Proteção de rotas

- Estratégia `passport-jwt` extrai o token do header `Authorization: Bearer <token>`
  e **respeita a expiração** (`ignoreExpiration: false`) —
  [jwt.strategy.ts](../src/modules/auth/strategies/jwt.strategy.ts).
- O `JwtAuthGuard` protege **todos** os controllers de recurso: `users`, `brands`,
  `models`, `vehicles` e `audit`. Somente `POST /auth/login` é público.
- O payload validado vira `req.user = { id, nickname, email }`, usado para preencher
  `created_by` nas criações de brand/model/vehicle.

> Observação: não há RBAC / níveis de acesso. Qualquer usuário autenticado tem acesso
> total a todos os recursos.

---

## 5. Funcionalidades e regras de negócio por módulo

### 5.1 Users — [users.service.ts](../src/modules/users/users.service.ts)

CRUD completo. Regras:

- **E-mail único**: criação/atualização validam disponibilidade (`409 Email already exists`).
- **Nickname único quando informado**: é opcional; se enviado, precisa ser único
  (`409 Nickname already exists`).
- Senha sempre armazenada como hash **bcrypt (cost 10)**; nunca retornada.
- Respostas passam por `toResponse`, expondo apenas
  `id, nickname, name, email, createdAt, updatedAt` (o hash fica de fora).
- Na atualização, cada campo só é alterado se enviado; unicidade só é reavaliada quando
  o valor muda.
- `findAll` ordena por `createdAt ASC`. Buscas por id inexistente → `404 User not found`.

> Nota: criar usuário (`POST /users`) exige estar autenticado. O primeiro usuário é
> criado via **seed** (ver seção 8), quebrando o problema do ovo-e-galinha.

### 5.2 Brands — [brands.service.ts](../src/modules/brands/brands.service.ts)

- **Nome único** (`409 Brand name already exists`).
- Na criação, `created_by` é preenchido com o usuário autenticado.
- **Regra de integridade na exclusão**: uma marca com modelos vinculados **não pode ser
  excluída** → `409 Cannot delete brand because it has models linked`.
- id inexistente → `404 Brand not found`.

### 5.3 Models — [models.service.ts](../src/modules/models/models.service.ts)

- **Exige uma marca existente**: `brandId` obrigatório; marca inexistente →
  `404 Brand not found`.
- O nome do modelo **não** precisa ser único.
- `findAll`/`findOne` retornam o modelo já com a marca (`relations: { brand }`).
- Na atualização é possível trocar a marca (`brandId`), sempre revalidando a existência.
- **Regra de integridade na exclusão**: um modelo com veículos vinculados **não pode ser
  excluído** → `409 Cannot delete model because it has vehicles linked`.

### 5.4 Vehicles — [vehicles.service.ts](../src/modules/vehicles/vehicles.service.ts)

Recurso central, com validações de unicidade, cache e auditoria.

Regras:

- **Placa, chassi e RENAVAM são únicos** — cada um valida disponibilidade na criação e,
  na atualização, apenas quando o valor muda:
  - `409 License plate already exists`
  - `409 Chassis already exists`
  - `409 Renavam already exists`
- Placa e chassi são normalizados para **maiúsculas** (trim + upper) nos DTOs; RENAVAM só
  sofre trim.
- **`year` entre 1900 e (ano atual + 1)** — o teto é calculado dinamicamente
  (`new Date().getFullYear() + 1`), permitindo cadastrar veículos do próximo ano-modelo.
- **`modelId` obrigatório e existente**; modelo inexistente →
  `400 Model not found` (aqui é `BadRequest`, diferentemente de model/brand que usam 404).
- Na criação/atualização, retorna o veículo recarregado com o `model` associado.

Efeitos colaterais de cada operação de escrita:

| Operação            | Cache invalidado           | Evento publicado   |
| ------------------- | -------------------------- | ------------------ |
| `POST /vehicles`    | lista                      | `vehicle.created`  |
| `PATCH /vehicles/:id` | lista + detalhe          | `vehicle.updated`  |
| `DELETE /vehicles/:id` | lista + detalhe         | `vehicle.deleted`  |

---

## 6. Cache Redis (exclusivo de vehicles)

Implementado em [vehicles-cache.service.ts](../src/modules/vehicles/vehicles-cache.service.ts).

- **Chaves** (paginadas por versão a partir da feature 002):
  - `vehicles:list:v{version}:p{page}:l{limit}` → uma página de `GET /vehicles`
  - `vehicles:list:version` → contador de versão da listagem
  - `vehicles:detail:{id}` → resultado de `GET /vehicles/:id`
- **TTL**: definido por `VEHICLES_CACHE_TTL` (segundos; ex.: 60).
- **Estratégia cache-aside**: nas leituras, tenta o cache; em _miss_, busca no banco e
  grava no cache com `EX ttl`.
- **Invalidação**: escritas invalidam o detalhe (`DEL`) e **todas** as páginas de listagem
  de uma vez via `INCR vehicles:list:version` (O(1); versões antigas expiram por TTL).
- Conexão Redis com senha opcional (`REDIS_PASSWORD`) e seleção de DB (`REDIS_DB`);
  encerrada no `onModuleDestroy`.

> Apenas `vehicles` usa cache. Users, brands e models sempre consultam o banco.

---

## 7. Auditoria assíncrona (RabbitMQ + MongoDB)

Fluxo ponta a ponta:

```
VehiclesService
  → AuditPublisherService  (publica na fila RABBITMQ_AUDIT_QUEUE, mensagem durável/persistente)
    → RabbitMQ
      → AuditConsumer      (consome, valida e faz ack)
        → AuditService     (persiste)
          → MongoDB (collection audit_logs)
```

### Publisher — [audit-publisher.service.ts](../src/modules/audit/audit-publisher.service.ts)

- Publica os eventos `vehicle.created | updated | deleted` com o snapshot do veículo.
- Fila declarada como `durable`, mensagens `persistent` (sobrevivem a restart do broker).
- **Tolerante a falha**: se RabbitMQ não estiver configurado, apenas loga um warning; se a
  publicação falhar, o erro é logado mas **não quebra a operação de negócio** do veículo.

### Consumer — [audit.consumer.ts](../src/modules/audit/audit.consumer.ts)

- Sobe no `onModuleInit`, declara a fila e consome mensagens.
- **Valida a mensagem** antes de salvar: exige `event`, `entity === "vehicle"` e
  `entityId` numérico; mensagens inválidas são ignoradas.
- Sempre faz `ack` da mensagem (inclusive no `finally`), evitando reprocessamento infinito.

### Consulta — [audit.controller.ts](../src/modules/audit/audit.controller.ts) / [audit.service.ts](../src/modules/audit/audit.service.ts)

- `GET /audit` — últimos **50** logs, ordenados por `createdAt` decrescente.
- `GET /audit/:id` — busca por `ObjectId`. Id inválido → `400 Invalid audit log id`;
  não encontrado → `404 Audit log not found`.
- Ambas exigem JWT.
- Conexão Mongo **opcional e resiliente**: sem `MONGODB_URI`, a auditoria é ignorada com
  warning; `findAll` retorna lista vazia em vez de quebrar.

> Distinção importante: os endpoints `/audit` mostram **auditoria de negócio** (o que foi
> feito em veículos). Erros **técnicos** (falha ao publicar/consumir/salvar) vão para os
> logs da aplicação via `Logger` do NestJS (`make logs`), não para o Mongo.

---

## 8. Inicialização e seeds

### Seed inicial — [seed.ts](../src/database/seeds/seed.ts)

- Cria o usuário base `aivacol` (nickname `aivacol`, name `Aivacol`) com e-mail/senha vindos
  de `SEED_AIVACOL_EMAIL` / `SEED_AIVACOL_PASSWORD`.
- **Idempotente**: se já existir usuário com esse nickname ou e-mail, o seed é pulado.
- É o usuário usado para o primeiro login e como `createdBy` do seed de performance.

### Seed de performance — [performance.seed.ts](../src/database/seeds/performance.seed.ts)

- Gera carga de teste em massa: recebe `<qtd_usuarios> <qtd_veiculos>` e insere em batches.
- Reutiliza/cria a brand `Performance Brand` e o model `Performance Model`.
- Usa prefixos fixos para evitar duplicidade: `perf-user-`, `perf-email-`, `PERF-PLATE-`.
- Requer que o seed inicial já tenha rodado (usa `aivacol` como `createdBy`).

```bash
make seed                                              # usuário aivacol
docker compose exec api npm run seed:performance -- 10000 50000
```

---

## 9. Referência de endpoints

Todas as rotas exigem `Authorization: Bearer <token>`, exceto o login.

| Método | Rota             | Descrição                    | Auth |
| ------ | ---------------- | ---------------------------- | :--: |
| POST   | `/auth/login`    | Autentica e emite JWT        |  —   |
| POST   | `/users`         | Cria usuário                 |  ✔   |
| GET    | `/users`         | Lista usuários               |  ✔   |
| GET    | `/users/:id`     | Detalha usuário              |  ✔   |
| PATCH  | `/users/:id`     | Atualiza usuário             |  ✔   |
| DELETE | `/users/:id`     | Remove usuário (204)         |  ✔   |
| POST   | `/brands`        | Cria marca                   |  ✔   |
| GET    | `/brands`        | Lista marcas                 |  ✔   |
| GET    | `/brands/:id`    | Detalha marca                |  ✔   |
| PATCH  | `/brands/:id`    | Atualiza marca               |  ✔   |
| DELETE | `/brands/:id`    | Remove marca (204)           |  ✔   |
| POST   | `/models`        | Cria modelo                  |  ✔   |
| GET    | `/models`        | Lista modelos (com marca)    |  ✔   |
| GET    | `/models/:id`    | Detalha modelo               |  ✔   |
| PATCH  | `/models/:id`    | Atualiza modelo              |  ✔   |
| DELETE | `/models/:id`    | Remove modelo (204)          |  ✔   |
| POST   | `/vehicles`      | Cria veículo                 |  ✔   |
| GET    | `/vehicles`      | Lista veículos (cache)       |  ✔   |
| GET    | `/vehicles/:id`  | Detalha veículo (cache)      |  ✔   |
| PATCH  | `/vehicles/:id`  | Atualiza veículo             |  ✔   |
| DELETE | `/vehicles/:id`  | Remove veículo (204)         |  ✔   |
| GET    | `/audit`         | Últimos 50 logs de auditoria |  ✔   |
| GET    | `/audit/:id`     | Detalha log de auditoria     |  ✔   |

### Paginação (todas as listagens)

Todas as listagens (`GET /users`, `/brands`, `/models`, `/vehicles`, `/audit`) são
paginadas com o mesmo contrato (feature [002](../specs/002-pagination-scale/spec.md)):

- Query params: `?page` (inteiro ≥ 1, default 1) e `?limit` (inteiro ≥ 1, default 20,
  **máx 100**). `limit` acima de 100 retorna **400** (não é cortado silenciosamente).
- Envelope de resposta uniforme:

```jsonc
{
  "data": [ /* itens da página */ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50000,
    "totalPages": 2500,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

- Ordenação estável por `(created_at ASC, id ASC)` — evita itens "pulando" entre páginas
  sob alto volume.
- `GET /:id` (detalhe) e escrita **não** mudam de shape.

Suporte a escala (meta 50k+ por recurso):

- Índices em `created_at` de todas as tabelas + `vehicles.model_id`
  (migration `AddPaginationIndexes`).
- Pool de conexões do SQL Server configurável por `DB_POOL_MAX`/`DB_POOL_MIN`.
- Cache de `vehicles` por página, invalidado em O(1) via contador de versão
  (`vehicles:list:version` incrementado a cada escrita).

### Convenção de códigos de erro

| Código | Quando ocorre                                                          |
| ------ | --------------------------------------------------------------------- |
| 400    | payload inválido; `modelId` inexistente em vehicles; id de audit inválido |
| 401    | credenciais inválidas no login; token ausente/expirado nas rotas protegidas |
| 404    | recurso não encontrado (user/brand/model/vehicle/audit)               |
| 409    | violação de unicidade ou de integridade (ex.: excluir marca com modelos) |

Coleções prontas para teste em [docs/](.):
`aivacol-postman-collection-v2.json` e `aivacol-insomnia-collection.json`.

### Documentação interativa (Swagger)

O contrato completo é gerado automaticamente via OpenAPI 3 (`@nestjs/swagger`):

- **UI interativa:** `http://localhost:3000/api/swagger` — permite testar os endpoints.
  Clique em **Authorize**, cole o `accessToken` de `POST /auth/login` e execute as rotas
  protegidas direto pela interface.
- **JSON OpenAPI:** `http://localhost:3000/api/swagger-json` (usado para gerar o client
  tipado do frontend).
- Exposição controlada por `SWAGGER_ENABLED` no `.env` (`false` desabilita as rotas).

---

## 10. Configuração (.env)

| Variável                    | Função                                              |
| --------------------------- | --------------------------------------------------- |
| `PORT`                      | Porta HTTP da API (default 3000)                    |
| `DB_HOST` … `DB_DATABASE`   | Conexão SQL Server                                  |
| `DB_ENCRYPT`                | `true` habilita criptografia da conexão             |
| `DB_TRUST_SERVER_CERTIFICATE` | aceita certificado self-signed (dev)              |
| `JWT_SECRET`                | Segredo de assinatura do JWT (**trocar em prod**)   |
| `JWT_EXPIRES_IN`            | Expiração do token (ex.: `10m`)                     |
| `REDIS_HOST` / `REDIS_PORT` | Conexão Redis                                       |
| `REDIS_PASSWORD`            | Senha do Redis (opcional)                           |
| `REDIS_DB`                  | Índice do banco Redis                               |
| `VEHICLES_CACHE_TTL`        | TTL do cache de vehicles, em segundos               |
| `RABBITMQ_URL`              | URL AMQP do RabbitMQ                                 |
| `RABBITMQ_AUDIT_QUEUE`      | Nome da fila de eventos de auditoria                |
| `MONGODB_URI`               | Conexão MongoDB da auditoria                         |
| `SEED_AIVACOL_EMAIL/PASSWORD` | Credenciais do usuário criado no seed inicial     |
| `SWAGGER_ENABLED`           | Expõe a UI Swagger em `/api/swagger` (`false` desabilita) |

Variáveis de banco e cache usam `getOrThrow`: **a aplicação não sobe se faltarem**. As de
mensageria/Mongo são opcionais (degradação graciosa com warning).

---

## 11. Testes

Executados dentro do container (`make test`, `make test-e2e`, `make test-all`).

- **Unitários**: `AuthService`, `BrandsService`, `ModelsService`,
  `VehiclesService` (incluindo comportamento de cache), `AuditService`, `AuditController`.
- **E2E** ([test/auth.e2e-spec.ts](../test/auth.e2e-spec.ts)): login, bloqueio de rotas
  protegidas sem token, escrita autenticada de `models`/`vehicles` e leitura de `audit`.

---

## 12. Como subir (resumo)

```bash
cp .env.example .env
make setup      # up + database + migrate + seed
```

Endereços locais: API `:3000`, RabbitMQ Management `:15672`, SQL Server `:1433`,
Redis `:6379`, MongoDB `:27017`. Detalhes operacionais completos no [README.md](../README.md).
