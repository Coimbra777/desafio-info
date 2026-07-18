# 002 — Paginação & Escala (50k)

**Status:** ✅ Concluída · **Depende de:** 001 · **Habilita:** 003, 004, 005, 006

## Problema

Todas as listagens hoje retornam a coleção inteira (`repository.find(...)` sem limite;
audit com `limit(50)` fixo). Com a meta de **50.000+ registros por recurso** (Artigo III da
[constituição](../000-constitution.md)), isso significa respostas de dezenas de MB, uso de
memória proporcional ao volume, latência alta e cache inutilizável. Viola diretamente o
Artigo III.1 ("toda listagem é paginada").

## Objetivo

Tornar todas as listagens paginadas, com contrato uniforme, e preparar a infraestrutura
(índices, pool de conexões, cache por página) para sustentar 50k+ registros por recurso
com latência baixa e previsível.

## Escopo

Incluído:

- Paginação por `page`/`limit` em **todas** as listagens: users, brands, models, vehicles, audit.
- Contrato de resposta paginada uniforme (`data` + `meta`), documentado no Swagger.
- `limit` com teto travado para impedir varredura total.
- Índices de banco (migration) para ordenação e junções sob volume.
- Pool de conexões do SQL Server dimensionado e configurável por env.
- Cache Redis de `vehicles` adaptado para paginação, com invalidação O(1) por versão.

Fora de escopo:

- Filtros/busca por campo (ex.: `?name=`), ordenação customizada por query — ficam para
  feature futura; esta entrega fixa ordenação por `createdAt ASC` (comportamento atual).
- Cursor-based pagination (mantemos offset/`page`, suficiente e simples para o escopo).
- Paginação no frontend (feature 005).

## Requisitos funcionais

- **RF1** — Toda listagem aceita `?page` (inteiro ≥ 1, default 1) e `?limit`
  (inteiro ≥ 1, default 20, **máx 100**).
- **RF2** — `limit` acima do teto é rejeitado com **400** (não é silenciosamente cortado),
  deixando o cliente ciente do limite.
- **RF3** — Resposta paginada uniforme:
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
- **RF4** — `page` além do total retorna `data: []` com `meta` coerente (não erro).
- **RF5** — `GET /vehicles` serve cada página pelo cache Redis; qualquer escrita
  (create/update/delete) invalida **todas** as páginas de listagem.
- **RF6** — `GET /audit` (MongoDB) também é paginado no mesmo contrato, substituindo o
  `limit(50)` fixo.
- **RF7** — Swagger documenta o contrato paginado (query params + envelope `data`/`meta`)
  para cada listagem.

## Requisitos não-funcionais

- **RNF1** — Índices em `created_at` (ordenação) de users/brands/models/vehicles e nas FKs
  usadas em contagem/junção (`brand_id`, `model_id`) — via migration versionada
  (Artigo II.4).
- **RNF2** — Pool de conexões do SQL Server configurável (`DB_POOL_MAX`, `DB_POOL_MIN`),
  com default adequado a carga (max ≥ 20).
- **RNF3** — Invalidação de cache de vehicles em **O(1)** (sem `KEYS`/`SCAN` em produção):
  usar contador de versão incrementado a cada escrita.
- **RNF4** — Detalhe (`GET /:id`) e escrita continuam com o comportamento e regras atuais
  (esta feature altera apenas listagens e infraestrutura).

## Regras de negócio

- `limit` default 20, teto 100. `page` default 1. Ambos inteiros positivos.
- Contagem (`total`) reflete o total real de registros do recurso, independente da página.
- Ordenação estável por `createdAt ASC` (empate resolvido por `id ASC` para determinismo
  sob volume — evita itens "pulando" entre páginas).
- Cache de vehicles: chave por `(versão, page, limit)`; escrita incrementa a versão.

## Impacto (breaking change)

O **shape das listagens muda** de array puro para envelope `{ data, meta }`. Consumidores
afetados:

- Testes e2e existentes (`GET /models`, `/vehicles`, `/audit` esperam array) → atualizar.
- Testes unitários de service que assertam retorno de `findAll` → atualizar.
- Frontend (005) já consumirá o novo contrato desde o início.

Detalhe (`GET /:id`) e escrita **não** mudam de shape.

## Critérios de aceite

- [ ] `GET /vehicles?page=2&limit=10` retorna no máximo 10 itens e `meta` coerente.
- [ ] `GET /vehicles?limit=1000` retorna **400** (acima do teto).
- [ ] `GET /vehicles?page=99999` retorna `data: []` e `meta.total` correto.
- [ ] As 5 listagens (users, brands, models, vehicles, audit) usam o mesmo envelope.
- [ ] Escrita em vehicles invalida o cache de listagem de todas as páginas (2ª leitura
      reflete a mudança).
- [ ] Migration cria os índices e roda limpa (`make migrate`).
- [ ] Swagger mostra `page`/`limit` e o envelope `data`/`meta` nas listagens.

## Cobertura de testes exigida (Artigo IV)

- Unit: helper de paginação (cálculo de `meta`, clamp de `page`, offset).
- Unit: `VehiclesService.findAll` paginado com cache por página + invalidação por versão.
- e2e: `GET /vehicles?page=&limit=` com envelope; `limit` acima do teto → 400;
  `GET /audit` paginado.
