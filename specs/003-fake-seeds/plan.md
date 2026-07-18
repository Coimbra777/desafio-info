# 003 — Plano técnico (Seeds fake)

Referência: [spec.md](spec.md) · [constituição](../000-constitution.md)

## Abordagem

Separar **geradores puros** (funções que, dado um índice + instância do faker, retornam um
registro) da **orquestração** (conexão, batches, idempotência). Geradores puros são
determinísticos e testáveis sem banco; a orquestração reusa o padrão do
`performance.seed.ts`.

## Dependência

```
npm i -D @faker-js/faker
```

(devDependency: seeds não vão para o bundle de produção.)

## Novos arquivos

### `src/database/seeds/fake/factories.ts` (geradores puros)

- `createFaker(seed: number)` → instância `Faker` com `faker.seed(seed)` (locale pt-BR).
- `buildUserData(faker, index)` → `{ nickname, name, email, passwordHash? }`.
  - `name = faker.person.fullName()`; `email = demo-user-${index}@demo.aivacol.dev`
    (índice garante unicidade); `nickname = demo-user-${index}`.
- `buildBrandData(faker, index)` → `{ name }`.
  - `name = ${faker.vehicle.manufacturer()} ${index}` (sufixo estável → unicidade).
- `buildModelData(faker, brandId, index)` → `{ name, brandId }`.
  - `name = faker.vehicle.model()`.
- `buildVehicleData(faker, modelId, index)` → `{ licensePlate, chassis, renavam, year, modelId }`.
  - `licensePlate = DEMO${padStart(index)}` (formato próprio, único por índice).
  - `chassis = faker.vehicle.vin()` + sufixo do índice (garante unicidade).
  - `renavam = String(90000000000 + index)` (11 dígitos, único).
  - `year = faker.number.int({ min: 2005, max: anoAtual + 1 })`.
- Cor/modelo extra do faker podem enriquecer o `name`, mas o schema atual não tem coluna de
  cor → mantemos só os campos existentes.

> Senha: hash bcrypt cost 4 (igual ao performance seed — rápido para massa; dev only).

### `src/database/seeds/demo.seed.ts` (orquestração)

Fluxo:

1. `parseArgs` → `users`, `brands`, `modelsPerBrand`, `vehicles` (defaults `20 8 4 120`).
2. `dataSource.initialize()`.
3. Obter `aivacol` (`getCreatedByUserId`, reusa lógica do performance seed) → `createdBy`.
4. **Users:** contar existentes com nickname `demo-user-%`; criar só o delta até `users`,
   em batches. (idempotência por contagem — mesmo padrão do performance seed.)
5. **Brands:** para cada índice até `brands`, `findOrCreate` por `name` determinístico
   (idempotente); coletar ids.
6. **Models:** para cada brand, criar `modelsPerBrand` modelos; idempotência por
   `(name, brandId)` — como o nome do faker pode repetir, usar contagem de modelos por marca
   e criar só o delta.
7. **Vehicles:** distribuir `vehicles` em round-robin entre os modelos; idempotência por
   contagem de placas `DEMO%`; criar delta em batches.
8. Resumo no stdout (RF7).

Idempotência: seguir a estratégia de **contagem por namespace** do performance seed
(`existing >= target → 0 a criar`), que já é comprovadamente idempotente.

## package.json / Makefile / env

- Script: `"seed:demo": "ts-node -r tsconfig-paths/register src/database/seeds/demo.seed.ts"`.
- Makefile: alvo `seed-demo` → `docker compose exec api npm run seed:demo`.
- `.env.example`/`.env`: `DEMO_SEED=1337`.

## Testes

`src/database/seeds/fake/factories.spec.ts`:

- Determinismo: dois `createFaker(SEED)` + mesmo índice → registros idênticos.
- Unicidade: gerar 1..N e assertar que `email`, `nickname`, `licensePlate`, `chassis`,
  `renavam` não têm colisões no range.
- Formato: `year` dentro de [2005, anoAtual+1]; `renavam` com 11 dígitos.

## Riscos e mitigações

| Risco                                             | Mitigação                                             |
| ------------------------------------------------- | ----------------------------------------------------- |
| `faker.vehicle.vin()` colidir entre índices       | Sufixo do índice no chassis garante unicidade         |
| Nome de modelo do faker repetir na mesma marca    | Idempotência por **contagem** por marca, não por nome |
| `manufacturer()` repetir entre índices            | Sufixo ` ${index}` no nome da marca                   |
| Seed demo colidir com namespace `perf-`           | Namespace próprio (`demo-user-`, `DEMO`, domínio demo)|

## Verificação

1. `npm i -D @faker-js/faker`.
2. `make seed-demo` → conferir contagens e variedade via `GET /brands|/models|/vehicles`.
3. `make seed-demo` de novo → contagens não sobem (idempotência).
4. `make test` (unit dos geradores) verde.

## Definição de pronto

Critérios de aceite marcados + geradores testados + `make seed-demo` idempotente validado
no container + `.env.example`/README/DOCUMENTACAO atualizados + status 003 no `specs/README.md`.
