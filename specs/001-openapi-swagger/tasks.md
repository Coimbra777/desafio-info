# 001 — Tasks (Swagger)

Cada task referencia o requisito da [spec.md](spec.md) que satisfaz. Marcar ao concluir.

## Setup

- [x] **T1** — `npm i @nestjs/swagger`. _(RNF2)_
- [x] **T2** — Habilitar plugin do Swagger em `nest-cli.json`. _(RF6)_
- [x] **T3** — Adicionar `SWAGGER_ENABLED=true` em `.env.example` e `.env`. _(RNF3)_

## Bootstrap

- [x] **T4** — Setup do Swagger em `src/swagger.ts` (`DocumentBuilder` +
      `addBearerAuth("access-token")` + UI em `/api/swagger`), atrás da flag
      `SWAGGER_ENABLED`; reusado por `main.ts`. _(RF1, RF2, RF3, RNF3)_

## Anotação de controllers _(RF4, RF5)_

- [x] **T5** — `auth.controller` — tag `auth`, `POST /login`: 201 + 401.
- [x] **T6** — `users.controller` — tag `users`, bearer; 201/200/204 + 401/404/409.
- [x] **T7** — `brands.controller` — tag `brands`, bearer; inclui 409 (nome/integridade).
- [x] **T8** — `models.controller` — tag `models`, bearer; 404 (brand) + 409 (integridade).
- [x] **T9** — `vehicles.controller` — tag `vehicles`, bearer; 400 (modelId) + 409 (únicos).
- [x] **T10** — `audit.controller` — tag `audit`, bearer; 400 (id inválido) + 404.

## DTOs de entrada _(RF6)_

- [x] **T11** — `@ApiProperty`/`@ApiPropertyOptional` com exemplos e restrições:
      login, create-user, create-brand, create-model, create-vehicle.

## DTOs de resposta _(RF7)_

- [x] **T12** — `LoginResponseDto`, `UserResponseDto` (**sem** `passwordHash`),
      `AuditLogResponseDto`; entidades `Brand`/`Model`/`Vehicle` com `@ApiHideProperty`
      nas relações não expostas (`creator`, coleções inversas) e `passwordHash` oculto.
- [x] **T13** — DTOs de resposta referenciados nos `@ApiResponse({ type })`.

## Testes _(Critérios de aceite / Artigo IV)_

- [x] **T14** — e2e: `GET /api/swagger-json` → 200 e contém paths de cada recurso
      (+ teste extra: schema não vaza `passwordHash`).
- [x] **T15** — e2e: `SWAGGER_ENABLED=false` → `GET /api/swagger` responde 404.

## Fechamento

- [x] **T16** — `docs/DOCUMENTACAO.md` atualizado citando `/api/swagger` e `/api/swagger-json`.
- [x] **T17** — Verificação: `tsc --noEmit` limpo + `make test-all` (48 testes verdes).
- [x] **T18** — Status de 001 atualizado para ✅ no `specs/README.md`.
