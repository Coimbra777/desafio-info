# AGENTS.md

## Project Context

This repository is a backend technical test for the Aivacol Fleet Management Platform.

Reference files:

- `docs/PRD.md`
- `docs/Spec.md`

If there is any ambiguity, follow this priority:

1. `docs/PRD.md`
2. `docs/Spec.md`
3. the simplest solution that satisfies the current requested step

## Expected Profile

Act as a backend developer mid-level 1.

Do not act as a senior engineer.
Do not act as an architect.

Prioritize:

- simple code
- few files
- few abstractions
- easy explanation
- make it work first
- improvements only later

Avoid:

- overengineering
- enterprise architecture
- anticipating future features
- sophisticated infrastructure
- too many layers
- too many scripts
- too many modules before they are needed
- UUID in main entities

## Mandatory Strategy

Implement one thing at a time.

Do not skip steps.
Do not implement two steps in the same response.

Preferred project order:

1. simple Docker environment
2. minimal `user`
3. simple `auth` / JWT
4. CRUD for `models`
5. CRUD for `vehicles`
6. relationship `vehicle -> model`
7. `created_by` using the authenticated user
8. simple Redis cache in `vehicles`
9. minimum tests
10. final README

## Docker Environment

Keep Docker simple with only:

- `api`
- `sqlserver`
- `redis`

The API must run inside Docker.

Rules:

- `DB_HOST=sqlserver`
- `REDIS_HOST=redis`
- do not create multiple environments now
- do not create a separate local flow now
- do not create advanced configuration
- do not create complex healthchecks
- do not create complex entrypoints
- do not create a multistage Dockerfile now
- do not create extra scripts without real need
- do not try to solve every setup problem automatically

The Docker setup must be easy to explain:

> “The API runs in the `api` container, the database runs in the `sqlserver` container, and Redis runs in the `redis` container. They communicate using the Docker Compose service names.”

## Database Rules

- SQL Server is mandatory.
- TypeORM is mandatory.
- `synchronize: false` must stay.
- use manual migrations
- use numeric incremental `id` in the main entities
- do not use UUID in this project
- do not use Prisma
- do not use PostgreSQL, MySQL, or SQLite

Avoid:

- sophisticated auto-create scripts
- multiple config files
- database abstractions
- factories
- custom repositories

If creating the database is necessary, use a simple isolated script without coupling complex logic to application startup.

## NestJS Rules

Use simple standard NestJS:

- Module
- Controller
- Service
- Entity
- DTO
- numeric `:id` params in controllers

Do not create now:

- use cases
- domain services
- mappers
- presenters
- factories
- base repository
- custom repositories
- full Clean Architecture
- full DDD
- event emitter
- CQRS
- complex interceptors
- complex filters
- unnecessary decorators

## Auth Rules

When the Auth step is requested:

- implement simple login with `email` and `password`
- keep `nickname` as a user field, but not as the login credential
- use simple JWT
- use bcrypt
- create `JwtAuthGuard`
- do not implement refresh token
- do not implement RBAC
- do not implement roles
- do not implement advanced permissions

## Redis Rules

Redis must only be used when the `vehicles` cache step is requested.

Do not anticipate Redis in modules that do not need it yet.

When cache is implemented:

- `GET /vehicles` uses cache
- `GET /vehicles/:id` uses cache
- `POST /vehicles` clears cache
- `PATCH /vehicles/:id` clears cache
- `DELETE /vehicles/:id` clears cache
- do not create a generic cache abstraction
- do not create complex cache versioning if simple invalidation solves it
- do not use sophisticated cache strategies before they are needed

## Test Rules

Tests must be minimal and objective:

- test main services
- test login
- test protected routes
- test basic CRUD
- test `vehicles` cache

Do not chase perfect coverage now.

## Hard Constraints

- do not implement `brands` now
- do not implement RabbitMQ, Kafka, SQS, MongoDB, DynamoDB, or auditing now
- do not implement refresh token
- do not implement RBAC
- do not implement full Clean Architecture
- do not implement full DDD
- do not create use cases, mappers, factories, presenters, or custom repositories
- use standard TypeORM repositories
- use SQL Server
- use Redis only when the cache step is reached
- do not replace TypeORM with Prisma
- do not replace SQL Server with another database

## Work Style

Before coding, explain the plan in at most 5 lines.

After coding, always inform:

- files created or changed
- commands executed
- `npm run build` result
- next recommended step

If an improvement seems interesting but is not necessary now, do not implement it. Write it only as a future suggestion.

Always choose the simplest solution that satisfies the current requirement.

## ID Rules

- Use numeric incremental `id` in the main entities.
- Do not use UUID in this project.
- Controllers must treat `:id` params as numbers.
- Endpoint examples must use numeric ids like `/users/1`, `/models/1`, `/vehicles/1`.
