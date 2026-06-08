# Spec.md — Plano Técnico de Implementação

## 1. Stack técnica definida

### Obrigatória

- Node.js 20 LTS
- NestJS 10
- TypeScript 5
- SQL Server como banco principal
- TypeORM 0.3.x
- Redis 7 para cache obrigatório de `vehicles`
- JWT para autenticação
- bcrypt para hash de senha
- class-validator e class-transformer para validação
- Jest + Supertest para testes
- Docker + Docker Compose para execução local

### Pacotes NestJS esperados

- `@nestjs/config`
- `@nestjs/typeorm`
- `@nestjs/jwt`
- `@nestjs/passport`
- `passport`
- `passport-jwt`
- `@nestjs/cache-manager` apenas se fizer sentido; para este desafio, pode ser mais simples usar `ioredis` diretamente

### Decisões e justificativas

- Usar arquitetura modular padrão do NestJS para facilitar leitura, manutenção e defesa em entrevista.
- Usar `TypeORM Repository` padrão via `@InjectRepository(...)`; repositórios customizados não são necessários para o escopo.
- Usar `id` numérico incremental como chave primária nas entidades para manter o modelo mais simples de explicar e compatível com o fluxo atual no SQL Server.
- Não usar UUID nas entidades principais deste projeto.
- Manter `users` como módulo mínimo obrigatório para autenticação e `created_by`, mas sem expandir CRUD completo na primeira entrega.
- Tratar `brands` como bônus controlado, isolado do fluxo principal para não atrasar o escopo obrigatório.

## 2. Estrutura de pastas sugerida

```text
src/
  main.ts
  app.module.ts
  config/
    app.config.ts
    auth.config.ts
    database.config.ts
    redis.config.ts
    validation.config.ts
  common/
    decorators/
      current-user.decorator.ts
    guards/
      jwt-auth.guard.ts
    filters/
      http-exception.filter.ts
    interceptors/
      logging.interceptor.ts
    interfaces/
      jwt-payload.interface.ts
    utils/
      pagination.util.ts
  database/
    migrations/
    seeds/
    factories/
  modules/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/
        login.dto.ts
      strategies/
        jwt.strategy.ts
    users/
      users.module.ts
      users.service.ts
      entities/
        user.entity.ts
    models/
      models.module.ts
      models.controller.ts
      models.service.ts
      dto/
        create-model.dto.ts
        update-model.dto.ts
        list-models-query.dto.ts
      entities/
        model.entity.ts
    vehicles/
      vehicles.module.ts
      vehicles.controller.ts
      vehicles.service.ts
      vehicles-cache.service.ts
      dto/
        create-vehicle.dto.ts
        update-vehicle.dto.ts
        list-vehicles-query.dto.ts
      entities/
        vehicle.entity.ts
    brands/
      brands.module.ts
      brands.controller.ts
      brands.service.ts
      dto/
        create-brand.dto.ts
        update-brand.dto.ts
      entities/
        brand.entity.ts
test/
  unit/
  integration/
  e2e/
docker/
  sqlserver/
  redis/
```

### Decisão

- `vehicles-cache.service.ts` separado do `vehicles.service.ts` deixa o fluxo de cache explícito sem introduzir uma camada genérica desnecessária.

## 3. Módulos NestJS que devem ser criados

### Prioridade 1

- `AppModule`
- `ConfigModule`
- `DatabaseModule` ou configuração TypeORM direto no `AppModule`
- `AuthModule`
- `UsersModule`
- `ModelsModule`
- `VehiclesModule`

### Prioridade 2

- módulo de tratamento global de erros e validação

### Bônus controlado

- `BrandsModule`

### Decisão

- `UsersModule` existe para autenticação, seed inicial e referência de `created_by`; CRUD público de usuários não precisa entrar na primeira onda.

## 4. Entidades TypeORM

### `User`

- `id: number` incremental
- `nickname: string` único
- `name: string`
- `email: string` único
- `password_hash: string`
- `created_at: datetime2`
- `updated_at: datetime2`

### `Model`

- `id: number` incremental
- `name: string`
- `brand_id: number`
- `created_by: number`
- `created_at: datetime2`
- `updated_at: datetime2`

### `Vehicle`

- `id: number` incremental
- `license_plate: string` único
- `chassis: string` único
- `renavam: string` único
- `year: number`
- `model_id: number`
- `created_at: datetime2`
- `updated_at: datetime2`

### `Brand` — bônus controlado

- `id: number` incremental
- `name: string` único
- `created_by: number`
- `created_at: datetime2`
- `updated_at: datetime2`

### Decisões

- `password_hash` precisa existir mesmo não estando explícito no PRD; sem isso o JWT não tem credencial real.
- `created_by` deve ser FK para `users.id`, e não texto livre, para manter consistência relacional.
- `updated_by` não será adicionado agora; o PRD só exige `created_by`, `created_at` e `updated_at`.
- `created_by` de `models` e `vehicles` deve vir do usuário autenticado no JWT.

## 5. Relacionamentos entre entidades

- `User 1:N Model`
- `User 1:N Vehicle`
- `User 1:N Brand` se bônus estiver ativo
- `Model 1:N Vehicle`
- `Brand 1:N Model`

### Regras relacionais

- `Vehicle.model_id` deve referenciar um `Model` existente.
- `Model.created_by`, `Vehicle.created_by` e `Brand.created_by` devem referenciar um `User` existente.
- A remoção de `Model` deve ser bloqueada se existirem `Vehicle` associados.
- A remoção de `Brand` deve ser bloqueada se existirem `Model` associados.

### Decisão

- Preferir `ON DELETE NO ACTION` nas FKs principais. A regra de remoção segura deve ficar explícita no serviço, com erro de domínio claro.

## 6. DTOs necessários

### Auth

- `LoginDto`
  - `email: string`
  - `password: string`

### Models

- `CreateModelDto`
  - `name: string`
  - `brandId: number`
- `UpdateModelDto`
  - `name?: string`
  - `brandId?: number`
- `ListModelsQueryDto`
  - `page?: number`
  - `limit?: number`
  - `search?: string`
  - `brandId?: number`

### Vehicles

- `CreateVehicleDto`
  - `licensePlate: string`
  - `chassis: string`
  - `renavam: string`
  - `year: number`
  - `modelId: number`
- `UpdateVehicleDto`
  - `licensePlate?: string`
  - `chassis?: string`
  - `renavam?: string`
  - `year?: number`
  - `modelId?: number`
- `ListVehiclesQueryDto`
  - `page?: number`
  - `limit?: number`
  - `modelId?: number`
  - `year?: number`
  - `licensePlate?: string`

### Brands — bônus controlado

- `CreateBrandDto`
  - `name: string`
- `UpdateBrandDto`
  - `name?: string`

### Decisão

- Paginação e filtros simples entram como melhoria importante, mas sem busca avançada, ordenação complexa ou specs dinâmicas.

## 7. Controllers e endpoints

### Público

- `POST /auth/login`
  - autentica com `email` e senha
  - retorna `accessToken`, `tokenType`, `expiresIn`

### Protegidos por JWT

#### Models

- `POST /models`
- `GET /models`
- `GET /models/1`
- `PATCH /models/1`
- `DELETE /models/1`

#### Vehicles

- `POST /vehicles`
- `GET /vehicles`
- `GET /vehicles/1`
- `PATCH /vehicles/1`
- `DELETE /vehicles/1`

#### Brands — bônus controlado

- `POST /brands`
- `GET /brands`
- `GET /brands/1`
- `PATCH /brands/1`
- `DELETE /brands/1`

### Decisão

- Não expor CRUD de `users` agora. Para o desafio, autenticação + seed + referência relacional já resolvem o requisito sem ampliar superfície de API.

## 8. Services e regras de negócio

### `AuthService`

- validar credenciais por `email`
- comparar senha com `bcrypt`
- emitir JWT com `sub`, `nickname` e `email`

### `UsersService`

- buscar usuário por `email`
- buscar usuário por `id`
- garantir seed inicial idempotente

### `ModelsService`

- criar modelo com `created_by` vindo do usuário autenticado
- validar nome obrigatório e não vazio
- validar unicidade de nome no recorte adotado
- listar modelos
- buscar por ID
- atualizar modelo
- impedir remoção se houver veículos associados

### `VehiclesService`

- validar unicidade de `license_plate`, `chassis` e `renavam`
- validar `year` dentro de faixa razoável
- validar existência de `model_id`
- criar veículo e invalidar cache
- listar veículos usando Redis obrigatoriamente
- buscar veículo por ID usando Redis obrigatoriamente
- atualizar veículo e invalidar cache
- remover veículo e invalidar cache

### `VehiclesCacheService`

- gerar chave de cache de listagem
- gerar chave de cache de detalhe
- recuperar valor do Redis
- salvar valor com TTL configurável
- invalidar namespace de `vehicles`

### `BrandsService` — bônus controlado

- CRUD simples
- impedir remoção se houver modelos associados

### Regras de negócio explícitas

- todas as rotas de negócio exigem JWT válido
- parâmetros `:id` dos controllers devem ser numéricos
- `created_by` deve ser preenchido sempre com o usuário autenticado
- operações de escrita em `vehicles` sempre invalidam o cache
- `models` não podem ser removidos se houver `vehicles` vinculados

## 9. Repositories ou uso de TypeORM repositories

- Usar `Repository<Entity>` padrão do TypeORM injetado por módulo.
- Não criar camada de repository customizada na primeira entrega.
- Consultas específicas podem ser feitas via QueryBuilder apenas quando necessário para filtros e paginação.

### Repositórios previstos

- `Repository<User>`
- `Repository<Model>`
- `Repository<Vehicle>`
- `Repository<Brand>` se bônus estiver ativo

### Decisão

- O desafio não pede complexidade suficiente para justificar DDD com repositories próprios, mappers e aggregates separados.

## 10. Estratégia de autenticação JWT

- Login por `email` + senha.
- Usuário seed obrigatório: `aivacol`.
- Gerar apenas `access token` nesta etapa.
- Token assinado com `JWT_SECRET`.
- Claims mínimas:
  - `sub` (`number`)
  - `nickname`
  - `email`
- Guard global ou guard por controller para proteger todas as rotas de negócio.

### Decisões

- Não implementar refresh token agora.
- Não implementar RBAC/ACL agora.
- O endpoint `/auth/login` é a única rota pública.

## 11. Estratégia de cache Redis para `vehicles`

### Abordagem

- Usar padrão cache-aside.
- Toda leitura de `vehicles` deve consultar Redis antes do banco.
- Se não houver cache, buscar no banco, serializar o resultado e armazenar no Redis com TTL configurável.

### Chaves sugeridas

- `vehicles:list`
- `vehicles:detail:{id}`

### Decisão

- Usar chaves diretas deixa a implementação mais simples de explicar neste desafio.
- Não criar versionamento de namespace se a invalidação direta de listagem e detalhe já resolver o fluxo.

## 12. Estratégia de invalidação de cache

- Ao criar `vehicles`, invalidar `vehicles:list`.
- Ao atualizar ou remover `vehicles`, invalidar `vehicles:list` e `vehicles:detail:{id}`.
- Manter TTL curto a moderado, por exemplo `60` a `300` segundos, definido por ambiente.

### Decisão

- Invalidação total do namespace de `vehicles` é suficiente para o desafio.
- Não fazer invalidação seletiva por filtro nesta etapa; aumenta complexidade sem ganho relevante.

## 13. Migrations necessárias

### Obrigatórias

1. `create_users_table`
2. `create_models_table`
3. `create_vehicles_table`
4. `add_indexes_and_constraints_to_models_and_vehicles`

### Bônus controlado

5. `create_brands_table`
6. `add_brand_id_to_models`

### Restrições esperadas

- `users.nickname` unique
- `users.email` unique
- `vehicles.license_plate` unique
- `vehicles.chassis` unique
- `vehicles.renavam` unique
- índices em `vehicles.model_id`
- índice em `models.brand_id` se bônus ativo

### Decisão

- Separar constraints/índices em migration própria deixa o histórico mais claro e facilita ajuste fino caso SQL Server exija tipos ou tamanhos específicos.

## 14. Seeds necessários

### Obrigatórios

- seed de usuário `aivacol`
  - `nickname: aivacol`
  - `name: Aivacol`
  - `email: aivacol@example.com` ou valor via ambiente
  - senha inicial definida por ambiente ou valor documentado

### Recomendados

- seed mínimo de `models`
- carga inicial de `vehicles` a partir de `seed_vehicles.json`, se o arquivo existir na solução final

### Bônus controlado

- seed de `brands` para vincular modelos

### Decisão

- O seed deve ser idempotente para permitir reexecução sem duplicar registros.

## 15. Testes unitários e de integração

### Unitários

- `AuthService`
  - valida credenciais válidas
  - rejeita senha inválida
  - gera JWT com payload esperado
- `ModelsService`
  - cria modelo
  - bloqueia remoção com veículos relacionados
  - trata `model` inexistente
- `VehiclesService`
  - cria veículo com modelo válido
  - rejeita `model_id` inexistente
  - rejeita duplicidade de placa/chassi/renavam
  - invalida cache em create/update/delete
- `VehiclesCacheService`
  - gera chaves corretas
  - respeita TTL
  - invalida listagem e detalhe corretamente

### Integração / e2e

- `POST /auth/login` retorna token
- rotas protegidas retornam `401` sem token
- `POST /models` cria registro
- `POST /vehicles` cria registro e invalida cache
- `GET /vehicles` lê do banco e grava cache
- segunda chamada de `GET /vehicles` reaproveita cache
- `PATCH /vehicles/:id` invalida cache
- `DELETE /models/:id` falha se houver veículo vinculado

### Decisão

- Priorizar teste de serviço + teste e2e mínimo. Não tentar cobertura exaustiva de controller.

## 16. Dockerfile e docker-compose

### Dockerfile

- Dockerfile simples, sem multistage nesta etapa
- instalar dependências
- copiar arquivos do projeto
- subir a API com o comando de desenvolvimento dentro do container

### docker-compose.yml

- `api`
- `sqlserver`
- `redis`

### Configuração esperada

- `api` depende de `sqlserver` e `redis`
- volume persistente para SQL Server
- healthcheck simples para SQL Server

### Decisão

- RabbitMQ e MongoDB não entram no compose inicial.
- O compose precisa ser suficiente para rodar aplicação, migrations e seeds localmente.

## 17. Variáveis de ambiente

### Aplicação

- `NODE_ENV`
- `PORT`

### Banco SQL Server

- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `DB_ENCRYPT`
- `DB_TRUST_SERVER_CERTIFICATE`

### JWT

- `JWT_SECRET`
- `JWT_EXPIRES_IN`

### Redis

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD` opcional
- `REDIS_DB`
- `VEHICLES_CACHE_TTL`

### Seed

- `SEED_AIVACOL_EMAIL`
- `SEED_AIVACOL_PASSWORD`

### Decisão

- A senha inicial do seed deve vir de ambiente para evitar credencial fixa hardcoded em repositório público.

## 18. Critérios de aceite técnico

- projeto sobe com Docker Compose
- conexão com SQL Server funciona
- conexão com Redis funciona
- migrations criam estrutura completa obrigatória
- seed cria usuário `aivacol`
- `POST /auth/login` retorna JWT válido
- todas as rotas de negócio exigem Bearer token
- CRUD de `models` funciona
- CRUD de `vehicles` funciona
- `GET /vehicles` e `GET /vehicles/:id` passam obrigatoriamente pelo Redis
- create/update/delete de `vehicles` invalidam cache
- remoção de `models` com `vehicles` associados é bloqueada
- testes unitários e e2e mínimos passam
- documentação de setup e execução fica clara

## 19. Ordem recomendada de implementação

1. Inicializar projeto NestJS com ConfigModule, validação global e TypeORM.
2. Subir `docker-compose` com SQL Server e Redis.
3. Criar migrations de `users`, `models` e `vehicles`.
4. Implementar seeds idempotentes com usuário `aivacol`.
5. Implementar `UsersModule` mínimo para suporte ao `AuthModule`.
6. Implementar autenticação JWT.
7. Proteger rotas com guard JWT.
8. Implementar CRUD de `models`.
9. Implementar CRUD de `vehicles` sem cache, validando regras centrais.
10. Implementar `VehiclesCacheService` e acoplar cache obrigatório às consultas.
11. Implementar invalidação por versionamento de namespace.
12. Adicionar testes unitários prioritários.
13. Adicionar testes e2e mínimos.
14. Refinar Dockerfile e scripts.
15. Implementar `brands` como bônus controlado.
16. Considerar endpoints adicionais de `users` apenas se sobrar tempo.

## Não fazer agora

- refresh token
- RBAC/perfis/permissões finas
- eventos com RabbitMQ, Kafka ou SQS
- auditoria em MongoDB ou DynamoDB
- soft delete
- versionamento de API
- paginação e filtros avançados
- ordenação complexa
- observabilidade avançada
- documentação OpenAPI extremamente detalhada
- cache seletivo por combinação de filtros
- CRUD completo de `users` com administração
- upload de arquivos ou imagens

## Resumo de direcionamento

- Entregar primeiro `auth`, `models` e `vehicles` com SQL Server, JWT, Redis e testes.
- Manter `users` mínimo, suficiente para login por `email`, `nickname` como campo cadastral e `created_by`.
- Tratar `brands` como extensão isolada e opcional.
- Priorizar clareza, previsibilidade e um desenho simples de explicar e manter.
