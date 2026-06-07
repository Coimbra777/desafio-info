# AGENTS.md

## Project Context

This repository is a backend technical test for the Aivacol Fleet Management Platform.

The mandatory reference documents are:

- `docs/PRD.md`
- `docs/Spec.md`

If there is any ambiguity, follow this priority:

1. `docs/PRD.md`
2. `docs/Spec.md`
3. the simplest solution that satisfies the mandatory scope

## Expected Profile

Act as a backend developer mid-level 1.

This means:

- Implement simple, correct, and easy-to-understand solutions.
- Follow the standard NestJS modular architecture.
- Use standard NestJS and TypeORM features before creating custom abstractions.
- Prioritize clarity and adherence to the technical challenge.
- Avoid complex architectural decisions that were not requested.
- Do not try to turn this project into an enterprise architecture.
- Write code that a mid-level developer can explain in a technical interview.

## Mandatory Stack

- Use Node.js 20 LTS.
- Use NestJS 10.
- Use TypeScript.
- Use TypeORM 0.3.x.
- Use SQL Server as the primary database.
- Use Redis for mandatory `vehicles` cache.
- Use JWT for authentication.
- Use Jest and Supertest for tests.

## Hard Constraints

- Do not replace SQL Server with PostgreSQL, MySQL, SQLite, or any in-memory database.
- Do not replace TypeORM with Prisma.
- Do not remove Redis.
- Do not create a frontend.
- Do not implement refresh token in this first phase.
- Do not implement RBAC in this first phase.
- Do not implement RabbitMQ in this first phase.
- Do not implement MongoDB in this first phase.
- Do not implement audit storage in this first phase.
- Do not implement `brands` in this first phase.
- Do not add unnecessary architectural complexity.

## First-Phase Scope Priority

Prioritize only the mandatory scope:

- `auth`
- minimal `users`
- `models`
- `vehicles`
- Redis cache
- migrations
- seeds
- Docker
- tests

### Scope Notes

- `users` must stay minimal and exist to support authentication and `created_by`.
- `brands` must not be implemented in the first phase.
- Keep the code modular, clean, and easy to explain in a technical interview.

## Implementation Style

- Do not create extra layers without a clear need.
- Do not create custom repositories if the standard TypeORM repository solves the problem.
- Do not create Use Cases, Domain Services, Mappers, Presenters, Factories, or Aggregates in this phase.
- Do not apply full DDD.
- Do not apply full Clean Architecture.
- Do not create generic abstractions for cache, database, events, or auditing.
- Do not create a complex base entity unless it is extremely simple and removes obvious repetition.
- Do not create custom decorators unless necessary, except `CurrentUser` if it clearly helps.
- Do not create complex interceptors or exception filters now.
- Do not implement RabbitMQ, Kafka, SQS, MongoDB, DynamoDB, advanced OpenAPI, refresh token, RBAC, or auditing now.

## Authentication Rules

- All business routes must require JWT.
- Only `POST /auth/login` must be public.
- `created_by` must always use the authenticated user.
- Use technical names and messages in English in the codebase.

## Vehicles Cache Rules

- `GET /vehicles` must use Redis.
- `GET /vehicles/:id` must use Redis.
- `POST /vehicles` must invalidate `vehicles` cache.
- `PATCH /vehicles/:id` must invalidate `vehicles` cache.
- `DELETE /vehicles/:id` must invalidate `vehicles` cache.
- Redis is mandatory for vehicle reads; do not make it optional.

## Implementation Guidelines

- Use NestJS modular architecture.
- Prefer standard TypeORM repositories via `@InjectRepository(...)`.
- Avoid overengineering.
- Prefer clear services, DTOs, entities, guards, and migrations.
- Keep naming predictable and technical.
- Favor code that is easy to defend in an interview over generic abstractions.

## Working Agreement For Codex

- Before coding a step, explain the plan in at most 5 lines.
- While implementing, change the smallest number of files necessary.
- After each implementation step, explain briefly what changed.
- Always try to run tests when possible.
- When tests cannot be run, state that clearly.
- Keep the README updated with execution commands and setup instructions.
- If there is an architecture doubt, choose the simplest option that satisfies the requirement.
- If an improvement is nice to have but not necessary for the challenge, record it as a future suggestion instead of implementing it now.

## Required Deliverables

The project must contain:

- JWT authentication
- minimal `users` support for login and `created_by`
- CRUD for `models`
- CRUD for `vehicles`
- Redis cache on vehicle queries
- cache invalidation on vehicle writes
- TypeORM migrations
- seeds
- `seed_vehicles.json`
- Docker support
- automated tests
- README

## Challenge Rules

- Follow `docs/PRD.md` and `docs/Spec.md`.
- Prioritize the mandatory scope.
- Implement first:
  - `auth`
  - minimal `users`
  - `models`
  - `vehicles`
  - Redis cache for `vehicles`
  - migrations
  - seeds
  - minimum tests
  - Docker
  - README
- `brands` stays out of the first delivery.
- Only `POST /auth/login` must be public.
- All business routes must require JWT.
- `created_by` must come from the authenticated user.
- `GET /vehicles` and `GET /vehicles/:id` must use Redis.
- `POST`, `PATCH`, and `DELETE` on `vehicles` must invalidate cache.
- Use TypeORM with SQL Server.
- Do not replace TypeORM with Prisma.
- Do not replace SQL Server with PostgreSQL, MySQL, or SQLite.

## Expected Commands

These commands are expected to exist and be documented in the README:

### Install dependencies

```bash
npm install
```

### Run the application

```bash
npm run start:dev
```

### Build

```bash
npm run build
```

### Run tests

```bash
npm run test
```

### Run e2e tests

```bash
npm run test:e2e
```

### Run migrations

```bash
npm run migration:run
```

### Run seeds

```bash
npm run seed
```

### Start local environment

```bash
docker compose up -d
```

## Do Not Do Now

- frontend
- refresh tokens
- RBAC or advanced permissions
- `brands`
- RabbitMQ
- Kafka
- SQS
- MongoDB
- DynamoDB
- audit trail storage
- advanced observability
- generic architecture layers without clear need

## Final Direction

- Build the mandatory backend scope first.
- Keep `users` minimal.
- Protect every business route with JWT.
- Enforce Redis in `vehicles` reads.
- Invalidate vehicle cache on write operations.
- Stay aligned with `docs/PRD.md` and `docs/Spec.md`.
- Prefer standard NestJS and TypeORM patterns over custom architecture.
- Deliver the challenge with quality, but without overengineering.
