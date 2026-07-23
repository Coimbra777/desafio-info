# PRD — Aivacol Fleet Management Platform

> Product Requirements Document consolidado a partir da engenharia reversa do código-fonte.
> Descreve o produto atual (as-is), as regras de negócio implementadas, o contrato de API,
> os requisitos não-funcionais e um backlog de melhorias.

- **Produto:** Aivacol — plataforma de gestão de frotas (backend API + console web)
- **Versão do código:** `0.1.0`
- **Status:** MVP funcional / desafio técnico
- **Documento gerado em:** 2026-07-22

---

## 1. Visão geral

A Aivacol é uma plataforma de **gestão de frotas** composta por:

1. Uma **API REST** (NestJS) que centraliza autenticação, cadastro da frota, cache,
   mensageria e auditoria.
2. Um **console web** (React + Vite) que consome a API e oferece uma interface de operação
   (login, dashboard e CRUDs).

O objetivo declarado do projeto é entregar uma base **simples de rodar e de explicar**,
que demonstre domínio de um stack polyglot-persistence (SQL Server, Redis, RabbitMQ,
MongoDB) sob boas práticas de arquitetura, escala e testes.

O desenvolvimento segue **Spec-Driven Development (SDD)**: cada feature nasce de uma
`spec.md` (o quê/porquê) e uma `plan.md` (o como), governadas por uma
[constituição do projeto](specs/000-constitution.md) com princípios não-negociáveis.

### Features entregues (rastreáveis em `specs/`)

| ID  | Feature | Descrição |
|-----|---------|-----------|
| 001 | OpenAPI/Swagger | Documentação interativa do contrato da API |
| 002 | Pagination & Scale | Paginação uniforme + índices para meta de 50k+ registros |
| 003 | Fake Seeds | Seeds determinísticos e idempotentes com dados realistas |
| 004 | Test Coverage | Cobertura unitária dos services e e2e dos fluxos críticos |
| 005 | Frontend | SPA React/Vite consumindo o contrato da API |

---

## 2. Objetivos e escopo

### Objetivos de produto
- Autenticar operadores e proteger todo o acesso a dados de frota.
- Manter o cadastro estruturado da frota na hierarquia **Marca → Modelo → Veículo**.
- Rastrear (auditar) toda alteração de veículo de forma assíncrona e consultável.
- Escalar leitura de veículos com cache e suportar volume de 50.000+ registros por recurso.

### Dentro do escopo (implementado)
- Autenticação JWT (email + senha).
- CRUD de `users`, `brands`, `models`, `vehicles`.
- Integridade referencial da hierarquia de frota.
- Cache Redis em `vehicles`.
- Publicação de eventos de negócio no RabbitMQ e persistência de auditoria no MongoDB.
- Consulta de logs de auditoria.
- Paginação uniforme em todas as listagens.
- Console web com login, dashboard e telas CRUD.

### Fora do escopo (atual)
- Autorização por papéis/permissões (RBAC) — hoje qualquer usuário autenticado tem acesso total.
- Refresh token / rotação de sessão.
- Recuperação de senha e verificação de e-mail (cadastro self-service em implementação — ver [M16](#8-melhorias-propostas-backlog)).
- Auditoria de recursos além de `vehicles`.
- Soft delete / histórico de versões de registros.
- Testes de carga automatizados comprovando a meta de 50k (previsto na constituição, ainda pendente).

---

## 3. Personas

| Persona | Descrição | Necessidade principal |
|---------|-----------|-----------------------|
| **Operador de frota** | Usuário autenticado que cadastra e mantém veículos, modelos e marcas | CRUD confiável com validação e feedback claro |
| **Administrador** | Usuário que também gerencia contas de operadores | Gestão de `users` e consulta de auditoria |
| **Auditor** | Consulta o histórico de alterações em veículos | Trilha de auditoria consultável e paginada |

> Observação: o modelo atual **não distingue papéis** tecnicamente — a separação de personas
> é conceitual. Ver melhoria [M1](#8-melhorias-propostas-backlog).

---

## 4. Arquitetura e stack

### Backend (`/src`)
- **Runtime:** Node.js 20
- **Framework:** NestJS 10 (modular por domínio: `controller + service + entity + dto`)
- **ORM:** TypeORM 0.3 (`synchronize: false`, schema **somente por migration**)
- **Banco relacional:** SQL Server 2022
- **Cache:** Redis 7 (ioredis)
- **Mensageria:** RabbitMQ 3 (amqplib)
- **Auditoria:** MongoDB 7 (driver oficial)
- **Documentação:** OpenAPI/Swagger em `/api/swagger`
- **Testes:** Jest + Supertest

### Frontend (`/frontend`)
- **Framework:** React 18 + Vite 5 + TypeScript
- **Data fetching:** TanStack React Query 5
- **HTTP:** Axios
- **Roteamento:** React Router 6 (rotas protegidas via `ProtectedRoute` + `AuthContext`)
- **Telas:** Login, Dashboard, Vehicles, Models, Brands, Users, Audit

### Infraestrutura
- **Docker Compose** orquestra 5 serviços: `api`, `sqlserver`, `redis`, `rabbitmq`, `mongodb`,
  com healthchecks e dependências de startup.
- **Makefile** encapsula o ciclo de vida (`make setup` = up + database + migrate + seed).
- Configuração 100% via `.env` (nenhum segredo hardcoded).

### Fluxo de dados de auditoria
```
VehiclesService → AuditPublisherService → RabbitMQ (fila durável)
                → AuditConsumer → AuditService → MongoDB (collection audit_logs)
```
A auditoria é **assíncrona e resiliente**: falha em Redis/RabbitMQ/Mongo **degrada com log**
(`Logger` do NestJS) sem derrubar a operação de negócio principal.

### Princípios da constituição (resumo)
- **Artigo I:** Spec antes de código; entregas incrementais e rastreáveis.
- **Artigo II:** Arquitetura modular; schema só por migration; contrato como fonte da verdade.
- **Artigo III:** Toda listagem paginada; índices obrigatórios; cache com invalidação explícita; pool dimensionado.
- **Artigo IV:** Toda regra de negócio com teste unitário; fluxos críticos com e2e; seeds determinísticos.
- **Artigo V:** JWT obrigatório (exceto login); bcrypt; erros de auth genéricos; validação estrita de DTO.
- **Artigo VI:** Erros técnicos no Logger; auditoria de negócio persistida; degradação graciosa.

---

## 5. Modelo de domínio e regras de negócio

### Entidades

**User** (`users`)
- `id`, `nickname` (opcional, único), `name`, `email` (único), `passwordHash`, `createdAt`, `updatedAt`
- Senha armazenada em **bcrypt** (cost 10); `passwordHash` nunca é retornado (`@ApiHideProperty`).

**Brand** (`brands`)
- `id`, `name` (único), `createdBy`, `createdAt`, `updatedAt`
- Relação: `1 Brand → N Models`.

**Model** (`models`)
- `id`, `name`, `brandId` (FK obrigatória), `createdBy`, `createdAt`, `updatedAt`
- Relação: `1 Model → N Vehicles`; pertence a exatamente uma Brand.

**Vehicle** (`vehicles`)
- `id`, `licensePlate` (único), `chassis` (único), `renavam` (único), `year`, `modelId` (FK obrigatória),
  `createdBy`, `createdAt`, `updatedAt`

**AuditLog** (MongoDB `audit_logs`)
- `_id`, `event` (`vehicle.created|updated|deleted`), `entity` (`vehicle`), `entityId`, `userId`, `payload`, `createdAt`

### Regras de negócio implementadas

**Autenticação**
- RN-A1: Login por `email` + `password`; retorna `accessToken` (JWT) + `tokenType: "Bearer"`.
- RN-A2: Credenciais inválidas retornam mensagem **genérica** ("Invalid credentials") — não revela se o e-mail existe.
- RN-A3: Todos os recursos exigem JWT válido, exceto `POST /auth/login`. Token expira conforme `JWT_EXPIRES_IN` (default 10m).

**Usuários**
- RN-U1: `email` deve ser único; `nickname`, quando informado, também é único (conflito → `409`).
- RN-U2: Senha mínima de 8 caracteres; `email` normalizado (trim + lowercase).
- RN-U3: Update só valida unicidade quando o campo muda de valor.

**Marcas**
- RN-B1: `name` único (conflito → `409`).
- RN-B2: Marca **não pode ser excluída** se houver modelos vinculados (`409`).
- RN-B3: `createdBy` preenchido com o usuário autenticado.

**Modelos**
- RN-M1: Criação exige `brandId` de uma marca existente (senão `404`).
- RN-M2: Update pode **trocar a marca** do modelo.
- RN-M3: Modelo **não pode ser excluído** se houver veículos vinculados (`409`).
- RN-M4: `createdBy` preenchido com o usuário autenticado.

**Veículos**
- RN-V1: `licensePlate`, `chassis` e `renavam` são **únicos** individualmente (conflito → `409`).
- RN-V2: `licensePlate` e `chassis` são normalizados (trim + UPPERCASE); `renavam` sofre trim.
- RN-V3: `year` entre `1900` e `ano atual + 1`.
- RN-V4: Criação exige `modelId` existente (senão `400 Bad Request`).
- RN-V5: `createdBy` preenchido com o usuário autenticado no momento da criação.
- RN-V6: Update valida unicidade apenas dos campos que mudam de valor.
- RN-V7: Toda escrita (create/update/delete) **invalida o cache** e **publica evento de auditoria**.

**Auditoria**
- RN-AU1: Apenas eventos de `vehicles` são auditados (`created`, `updated`, `deleted`).
- RN-AU2: Eventos são publicados em fila **durável** e consumidos de forma assíncrona; mensagem inválida é ignorada e `ack`.
- RN-AU3: Logs consultáveis apenas por usuário autenticado, ordenados por `createdAt` desc.

---

## 6. Contrato da API (endpoints)

Base URL local: `http://localhost:3000` · Documentação interativa: `/api/swagger`

### Auth
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/login` | Pública | Autentica e retorna `{ accessToken, tokenType }` |

### Users (JWT)
| Método | Rota | Descrição | Erros notáveis |
|--------|------|-----------|----------------|
| POST | `/users` | Cria usuário | `409` email/nickname em uso |
| GET | `/users` | Lista paginada | — |
| GET | `/users/:id` | Detalha | `404` |
| PATCH | `/users/:id` | Atualiza | `404`, `409` |
| DELETE | `/users/:id` | Remove (`204`) | `404` |

### Brands (JWT)
| Método | Rota | Descrição | Erros notáveis |
|--------|------|-----------|----------------|
| POST | `/brands` | Cria marca | `409` nome em uso |
| GET | `/brands` | Lista paginada | — |
| GET | `/brands/:id` | Detalha | `404` |
| PATCH | `/brands/:id` | Atualiza | `404`, `409` |
| DELETE | `/brands/:id` | Remove (`204`) | `404`, `409` (modelos vinculados) |

### Models (JWT)
| Método | Rota | Descrição | Erros notáveis |
|--------|------|-----------|----------------|
| POST | `/models` | Cria modelo (exige `brandId`) | `404` marca inexistente |
| GET | `/models` | Lista paginada (com marca) | — |
| GET | `/models/:id` | Detalha | `404` |
| PATCH | `/models/:id` | Atualiza (pode trocar marca) | `404` |
| DELETE | `/models/:id` | Remove (`204`) | `404`, `409` (veículos vinculados) |

### Vehicles (JWT, com cache Redis)
| Método | Rota | Descrição | Erros notáveis |
|--------|------|-----------|----------------|
| POST | `/vehicles` | Cria veículo (invalida cache + audita) | `400` modelId inexistente, `409` placa/chassi/renavam |
| GET | `/vehicles` | Lista paginada (cacheada) | — |
| GET | `/vehicles/:id` | Detalha (cacheado) | `404` |
| PATCH | `/vehicles/:id` | Atualiza (invalida cache + audita) | `400`, `404`, `409` |
| DELETE | `/vehicles/:id` | Remove (`204`, invalida cache + audita) | `404` |

### Audit (JWT)
| Método | Rota | Descrição | Erros notáveis |
|--------|------|-----------|----------------|
| GET | `/audit` | Lista logs paginada (desc por data) | — |
| GET | `/audit/:id` | Detalha por ObjectId | `400` id inválido, `404` |

### Contrato de paginação
Query params em toda listagem: `page` (default 1, min 1) e `limit` (default 20, máx 100).
Resposta uniforme:
```json
{
  "data": [ /* itens */ ],
  "meta": {
    "page": 1, "limit": 20, "total": 0, "totalPages": 0,
    "hasNextPage": false, "hasPreviousPage": false
  }
}
```

---

## 7. Requisitos não-funcionais

### Segurança
- JWT obrigatório em todos os recursos exceto login; extraído do header `Authorization: Bearer`.
- Senhas em bcrypt; `passwordHash` nunca serializado na resposta.
- Erros de autenticação genéricos (não enumeram contas).
- Validação estrita de entrada via `ValidationPipe` global (`whitelist` + `transform` + `forbidNonWhitelisted`).
- CORS configurável por `CORS_ORIGIN`.
- Segredos exclusivamente via `.env`.

### Escala e performance (meta: 50.000+ registros por recurso)
- Todas as listagens paginadas; `limit` travado em 100.
- Índices dedicados (migration `AddPaginationIndexes`): `created_at` em todas as tabelas + `vehicles.model_id`;
  colunas únicas e FKs já indexadas.
- Cache Redis em `vehicles` com **invalidação por versionamento de chave** (`incr` da versão → invalida todas as páginas em O(1));
  detalhe invalidado por chave direta. TTL via `VEHICLES_CACHE_TTL`.
- Pool de conexões SQL Server dimensionável (`DB_POOL_MAX`/`DB_POOL_MIN`); log de queries lentas (`maxQueryExecutionTime: 100ms`).
- Seed de performance (`seed:performance`) insere usuários/veículos em batches para simular volume.

### Observabilidade
- Erros técnicos (Redis/RabbitMQ/Mongo/DB) vão para o `Logger` do NestJS.
- Auditoria de negócio persistida e consultável no MongoDB.
- Degradação graciosa: indisponibilidade de serviço auxiliar não derruba a operação principal.

### Qualidade / testes
- Testes unitários dos services (`Auth`, `Users`, `Models`, `Brands`, `Vehicles` incl. cache, `Audit`).
- Testes e2e de login, escrita autenticada e leitura de auditoria.
- Seeds determinísticos e idempotentes (prefixos fixos evitam duplicação).
- Execução em container: `make test`, `make test-e2e`, `make test-all`.

---

## 8. Melhorias propostas (backlog)

Priorizadas por impacto. Itens marcados com ⚠️ são lacunas de segurança/robustez.

| ID | Melhoria | Motivação | Prioridade |
|----|----------|-----------|------------|
| **M1** | ⚠️ **RBAC / papéis** (admin vs. operador vs. auditor) | Hoje todo usuário autenticado tem acesso total, inclusive gerir `users` e criar contas | Alta |
| **M2** | ⚠️ **Refresh token / sessão** | JWT de 10m sem refresh degrada a UX; não há revogação | Alta |
| **M3** | **Conexão AMQP persistente no publisher** | `AuditPublisherService` abre e fecha conexão RabbitMQ a **cada evento** — caro sob carga; usar conexão/canal reutilizável | Alta |
| **M4** | **Teste de carga (k6/artillery)** | Constituição (Art. III.5) exige comprovar a meta de 50k por teste, ainda pendente | Alta |
| **M5** | **Filtros e busca nas listagens** | Listagens só paginam; falta filtrar por marca, ano, placa, `createdBy` etc. | Média |
| **M6** | **Índices compostos para ordenação** | Ordenação é por `created_at, id`, mas o índice cobre só `created_at`; índice composto evita sort no volume | Média |
| **M7** | **Rate limiting no login** | `POST /auth/login` sem throttling é vetor de brute force | Média |
| **M8** | **Dead-letter queue na auditoria** | Mensagens inválidas são apenas descartadas com `ack`; sem DLQ há perda silenciosa de eventos | Média |
| **M9** | **Auditoria genérica** (brands/models/users) | Auditoria cobre só `vehicles`; ações sensíveis em `users` não são rastreadas | Média |
| **M10** | **Soft delete / trilha de exclusão** | Exclusões são físicas; auditoria guarda o payload mas o registro some do relacional | Média |
| **M11** | **Cache para models/brands** | Recursos de leitura frequente e baixa escrita se beneficiariam de cache | Baixa |
| **M12** | **Paginação por keyset (cursor)** | `OFFSET/skip` degrada em páginas profundas no volume de 50k+ | Baixa |
| **M13** | **CI (lint + testes + build)** | Não há pipeline automatizado versionado no repo | Média |
| **M14** | **Health/readiness endpoints** | Falta `/health` para orquestração e monitoramento dos serviços auxiliares | Baixa |
| **M15** | **Padronizar mensagens e feedback no frontend** | Erros já têm helper central, mas: (a) não há **feedback de sucesso** após criar/editar/excluir; (b) mensagens do backend vêm em inglês x UI em português. Padronizar com toasts de sucesso e tradução das mensagens conhecidas | Média |
| **M16** | **Signup público na tela de login** | Hoje só um usuário já autenticado cria contas (`POST /users` exige JWT). Falta um cadastro self-service acessível sem login, com endpoint público dedicado (`POST /auth/register`) | Média |

---

## 9. Como rodar (referência rápida)

```bash
cp .env.example .env
make setup        # up + database + migrate + seed
# API:      http://localhost:3000
# Swagger:  http://localhost:3000/api/swagger
# RabbitMQ: http://localhost:15672
```

Login inicial (via seed): `aivacol@example.com` / `ChangeMe123!`

Fluxo recomendado de teste: criar **brand** → criar **model** (com `brandId`) → criar **vehicle** (com `modelId`).

Frontend:
```bash
cd frontend && cp .env.example .env && npm install && npm run dev   # http://localhost:5173
```

---

## 10. Referências

- Constituição do projeto: [specs/000-constitution.md](specs/000-constitution.md)
- Specs por feature: [specs/](specs/)
- Documentação técnica: [docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md)
- Collections de teste (Postman/Insomnia): [docs/](docs/)
- README operacional: [README.md](README.md)
```