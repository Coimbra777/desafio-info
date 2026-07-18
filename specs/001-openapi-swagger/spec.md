# 001 — OpenAPI / Swagger

**Status:** ✅ Concluída · **Depende de:** nada · **Habilita:** 005 (frontend consome contrato)

## Problema

A API não expõe contrato formal. Hoje o único material de referência são as collections do
Postman/Insomnia em `docs/`, mantidas à mão e propensas a divergir do código. Isso trava o
frontend (005), dificulta testes de integração e onboarding, e viola o Artigo II.5 da
constituição ("o contrato da API é a fonte da verdade").

## Objetivo

Gerar documentação **OpenAPI 3** automaticamente a partir do código (decorators), servida
por uma UI interativa, cobrindo 100% dos endpoints, DTOs, respostas e o esquema de
autenticação JWT.

## Escopo

Incluído:

- `@nestjs/swagger` configurado no bootstrap, UI Swagger servida em rota dedicada.
- Todos os controllers e endpoints anotados (tags por recurso, sumários, respostas).
- Todos os DTOs de entrada anotados (`@ApiProperty`) com exemplos e restrições.
- **Bearer JWT** declarado, permitindo "Authorize" na UI e testar rotas protegidas.
- DTOs/entidades de **resposta** documentados (inclusive o `toResponse` de users, sem hash).
- Documento OpenAPI exportável em JSON (para gerar o client tipado do frontend em 005).

Fora de escopo:

- Versionamento de API (`/v1`).
- Geração automática do SDK do frontend (feita na 005).
- Mudança de comportamento de qualquer endpoint (esta feature é **puramente documental**).

## Requisitos funcionais

- **RF1** — UI Swagger acessível em `GET /api/swagger` (HTML interativo para testar endpoints).
- **RF2** — JSON OpenAPI acessível em `GET /api/swagger-json`.
- **RF3** — Botão **Authorize** aceita um Bearer token e o envia nas rotas protegidas.
- **RF4** — Cada recurso (auth, users, brands, models, vehicles, audit) aparece como uma
  **tag** separada, agrupando seus endpoints.
- **RF5** — Cada endpoint documenta: sumário, corpo (quando houver), parâmetros de rota e
  as respostas relevantes (200/201/204, 400, 401, 404, 409 conforme o caso).
- **RF6** — Cada campo de DTO de entrada exibe tipo, se é obrigatório, restrições
  (min/max, formato) e um exemplo realista.
- **RF7** — Respostas de sucesso exibem o shape retornado (ex.: `Vehicle` com `model`,
  `LoginResponse` com `accessToken`/`tokenType`).

## Requisitos não-funcionais

- **RNF1** — Zero mudança de comportamento nos endpoints; contrato reflete o código atual.
- **RNF2** — A doc é gerada do código (decorators), não mantida em arquivo à parte.
- **RNF3** — Em produção a exposição de `/docs` deve ser controlável por env
  (`SWAGGER_ENABLED`), default `true` em dev.

## Regras de negócio a refletir na doc

A documentação deve tornar visíveis as regras já existentes (ver
[docs/DOCUMENTACAO.md](../../docs/DOCUMENTACAO.md)):

- Unicidade: `email`/`nickname` (users), `name` (brands), `licensePlate`/`chassis`/
  `renavam` (vehicles) → resposta **409**.
- Integridade: excluir brand com models / model com vehicles → **409**.
- `vehicles.year` entre 1900 e ano+1; `modelId` inexistente → **400**.
- Login com credenciais inválidas → **401** genérico.
- Todas as rotas exigem Bearer, exceto `POST /auth/login`.

## Critérios de aceite

- [ ] `GET /api/swagger` abre a UI com as 6 tags e todos os endpoints listados.
- [ ] "Authorize" com um token real permite executar `GET /vehicles` pela UI.
- [ ] `GET /api/swagger-json` retorna OpenAPI 3 válido (validável em editor.swagger.io).
- [ ] Cada DTO de entrada mostra exemplos e restrições coerentes com os validators.
- [ ] Respostas 4xx documentadas nos endpoints onde as regras acima se aplicam.
- [ ] `SWAGGER_ENABLED=false` remove as rotas `/api/swagger` e `/api/swagger-json`.

## Cobertura de testes exigida (Artigo IV)

- e2e: `GET /api/swagger-json` responde 200 e contém os `paths` de cada recurso.
- e2e: com `SWAGGER_ENABLED=false`, `GET /api/swagger` responde 404.
