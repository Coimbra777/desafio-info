# 002 — Tasks (Paginação & Escala)

Cada task referencia o requisito da [spec.md](spec.md). Marcar ao concluir.

## Common (paginação compartilhada)

- [x] **T1** — `common/pagination/pagination-query.dto.ts` (`page`/`limit`, defaults,
      `@Max(100)`, getters `skip`/`take`, `@ApiPropertyOptional`). _(RF1, RF2)_
- [x] **T2** — `common/pagination/paginated.dto.ts` (`PaginationMetaDto`, `PaginatedDto<T>`). _(RF3)_
- [x] **T3** — `common/pagination/paginate.ts` (`buildMeta`, `paginate`). _(RF3, RF4)_
- [x] **T4** — `common/pagination/api-paginated-response.decorator.ts`
      (`ApiPaginatedResponse`). _(RF7)_

## Infraestrutura de escala

- [x] **T5** — Migration `AddPaginationIndexes` (created_at de todas + `vehicles.model_id`),
      `up`/`down`. Aplicada com sucesso via `make migrate`. _(RNF1)_
- [x] **T6** — Pool mssql em `app.module.ts` (`DB_POOL_MAX`/`DB_POOL_MIN`) +
      `.env.example`/`.env`. _(RNF2)_

## Listagens SQL (findAndCount)

- [x] **T7** — `users`: service `findAll(page, limit)` + controller `@Query` +
      `ApiPaginatedResponse`. _(RF1, RF3, RF7)_
- [x] **T8** — `brands`: idem. _(RF1, RF3, RF7)_
- [x] **T9** — `models`: idem (mantendo `relations: { brand }`). _(RF1, RF3, RF7)_
- [x] **T10** — `vehicles`: idem (mantendo `relations: { model }`) + integração com cache. _(RF1, RF3, RF5, RF7)_

## Cache de vehicles versionado

- [x] **T11** — Reescrito `vehicles-cache.service.ts`: chave `v{version}:p{page}:l{limit}`,
      `invalidateList()` via `INCR`. Validado em runtime (v3→v4 na escrita). _(RF5, RNF3)_

## Audit (Mongo)

- [x] **T12** — `audit.service.findAll(page, limit)` com `countDocuments` + `skip/limit`;
      controller `@Query` + `ApiPaginatedResponse`. _(RF6, RF3)_

## Testes

- [x] **T13** — Unit `paginate.spec.ts` (meta, página vazia, offset, página além do total). _(RF3, RF4)_
- [x] **T14** — Atualizado `vehicles.service.spec.ts` (paginado + cache por página). _(RF5)_
- [x] **T15** — Atualizado `auth.e2e-spec.ts` p/ envelope `{ data, meta }` nas listagens.
- [x] **T16** — e2e novo: `?page/?limit` repassados ao service, `limit>100` → 400. _(RF1, RF2, RF4)_

## Fechamento

- [x] **T17** — Verificação: `tsc --noEmit` + 56 testes verdes + **smoke test real em 50k**
      (paginação, teto 400, page além do fim, invalidação de cache O(1)).
- [x] **T18** — Atualizado `docs/DOCUMENTACAO.md` (contrato paginado + cache versionado) e
      status 002 no `specs/README.md`.

## Bug encontrado ao rodar a app (não pego pelos testes ts-jest)

O plugin do Swagger (`nest start`/`build`) auto-anota `PaginatedDto.data` com o genérico
`T`, causando erro de dependência circular no boot. ts-jest não roda o plugin, então os
testes passavam mas a app **não subia**. Corrigido com `@ApiHideProperty()` em `data`
(o `ApiPaginatedResponse` já injeta `data` como array do modelo via `allOf`).
