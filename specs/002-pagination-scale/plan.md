# 002 — Plano técnico (Paginação & Escala)

Referência: [spec.md](spec.md) · [constituição](../000-constitution.md)

## Abordagem

Offset-based pagination (`page`/`limit` → `skip`/`take`), com um módulo `common/`
compartilhado que padroniza o query DTO, o envelope de resposta e o cálculo de metadados.
SQL Server e MongoDB usam o mesmo contrato de saída.

## Novos arquivos — `src/common/pagination/`

- **`pagination-query.dto.ts`** — `PaginationQueryDto` com `page` e `limit`:
  - `@Type(() => Number) @IsInt() @Min(1) @IsOptional()` + defaults (page=1, limit=20).
  - `limit`: `@Max(100)` → excedente vira **400** pelo ValidationPipe global (RF2).
  - `@ApiPropertyOptional` com exemplos.
  - Getters `skip` (= (page-1)*limit) e `take` (= limit).
- **`paginated.dto.ts`** — `PaginationMetaDto` (page, limit, total, totalPages,
  hasNextPage, hasPreviousPage) e `PaginatedDto<T>` (`data: T[]`, `meta`).
- **`paginate.ts`** — `buildMeta(total, page, limit)` e `paginate(data, total, page, limit)`
  puros e testáveis.
- **`api-paginated-response.decorator.ts`** — `ApiPaginatedResponse(Model)`: compõe
  `@ApiExtraModels` + `getSchemaPath` para o Swagger exibir o envelope genérico (RF7).

## Mudanças por módulo (listagens)

Para cada controller de listagem: aceitar `@Query() query: PaginationQueryDto`, repassar
`page`/`limit` ao service, anotar com `ApiPaginatedResponse`.

Para cada `service.findAll`:

- **SQL (users, brands, models, vehicles):** usar `repository.findAndCount({ skip, take,
  order: { createdAt: "ASC", id: "ASC" }, relations })` → retorna `[rows, total]` →
  `paginate(rows, total, page, limit)`.
- **audit (Mongo):** `collection.countDocuments()` + `find().sort({ createdAt: -1 }).skip().limit()`.

## Cache de vehicles (RF5, RNF3)

Reescrever [vehicles-cache.service.ts](../../src/modules/vehicles/vehicles-cache.service.ts):

- Chave de versão: `vehicles:list:version` (contador inteiro; ausente = 0).
- Chave de página: `vehicles:list:v{version}:p{page}:l{limit}`.
- `getList(page, limit)` / `setList(page, limit, paginatedResult)` operam na versão atual.
- `invalidateList()` = `INCR vehicles:list:version` → O(1), invalida todas as páginas de uma
  vez; versões antigas expiram por TTL. Sem `KEYS`/`SCAN`.
- Detalhe (`vehicles:detail:{id}`) permanece igual.
- O objeto cacheado passa a ser o `PaginatedDto<Vehicle>` da página.

## Índices (RNF1) — nova migration

`src/database/migrations/<timestamp>-AddPaginationIndexes.ts`:

- `IX_users_created_at` (users.created_at)
- `IX_brands_created_at` (brands.created_at)
- `IX_models_created_at` (models.created_at), `IX_models_brand_id` (models.brand_id)
- `IX_vehicles_created_at` (vehicles.created_at), `IX_vehicles_model_id` (vehicles.model_id)
- `up` cria, `down` remove. Colunas únicas já possuem índice implícito.

> Ordenação por `(created_at, id)`: o índice em `created_at` cobre o `ORDER BY`; o `id` é a
> PK (clustered) e desempata sem custo relevante.

## Pool de conexões (RNF2)

Em [app.module.ts](../../src/app.module.ts), adicionar ao TypeORM mssql:

```ts
pool: {
  max: Number(configService.get("DB_POOL_MAX") ?? 20),
  min: Number(configService.get("DB_POOL_MIN") ?? 2),
},
```

Adicionar `DB_POOL_MAX=20` / `DB_POOL_MIN=2` ao `.env.example` e `.env`.

## Testes a atualizar (breaking change)

- `test/auth.e2e-spec.ts`: `GET /models`, `/vehicles`, `/audit` passam a esperar
  `{ data, meta }`. Os mocks de `findAll` devem devolver `PaginatedDto`.
- `vehicles.service.spec.ts`: `findAll` agora recebe `(page, limit)` e devolve envelope;
  ajustar asserts de cache (chave versionada).
- Novos: `paginate.spec.ts` (unit do helper) e casos e2e de paginação/teto.

## Riscos e mitigações

| Risco                                              | Mitigação                                          |
| -------------------------------------------------- | -------------------------------------------------- |
| Offset alto (`page` enorme) fica lento             | Índice em `created_at`; teto de `limit`; aceitável para o escopo. Cursor fica p/ evolução. |
| Quebrar consumidores por mudança de shape          | Documentado como breaking; testes e front alinhados na mesma feature |
| Cache servir página de versão antiga               | Chave inclui a versão; `INCR` na escrita garante corte |
| `findAndCount` custar 2 queries                    | Aceitável; `COUNT` usa índice. Monitorar via `maxQueryExecutionTime` |

## Verificação

1. `make migrate` aplica os índices sem erro.
2. `make seed:performance -- 60000 60000` (feature 003 ajuda; por ora seed manual/menor).
3. `GET /vehicles?page=2&limit=10` → 10 itens + meta; `?limit=1000` → 400.
4. Criar veículo e reconsultar página 1 → reflete a mudança (cache invalidado).
5. `make test-all` verde.

## Definição de pronto

Critérios de aceite da spec marcados + migration aplicada + pool configurado + Swagger
refletindo o envelope + `make test-all` verde + `.env.example` atualizado + docs atualizadas.
