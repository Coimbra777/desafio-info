# 003 — Tasks (Seeds fake)

Cada task referencia o requisito da [spec.md](spec.md). Marcar ao concluir.

## Setup

- [x] **T1** — `npm i -D @faker-js/faker`. Fixado em **v8.4.1** (build dual CJS/ESM;
      a v10 é ESM-only e quebra ts-node/ts-jest do projeto). _(RF1)_
- [x] **T2** — `.env.example`/`.env`: `DEMO_SEED=1337`. _(RNF3)_

## Geradores puros

- [x] **T3** — `src/database/seeds/fake/factories.ts`: `createFaker`, `buildUserData`,
      `buildBrandData`, `buildModelData`, `buildVehicleData` (determinísticos, chaves únicas
      por índice, locale pt-BR). _(RF1, RF6, regras de unicidade)_

## Orquestração

- [x] **T4** — `src/database/seeds/demo.seed.ts`: parse de args (defaults `20 8 4 120`),
      `aivacol` como `createdBy`, geração em batches, distribuição round-robin, resumo. _(RF2, RF3, RF4, RF7, RNF1, RNF2)_
- [x] **T5** — Idempotência por contagem de namespace (users `demo-user-%`, brands por nome
      determinístico, models por contagem/marca, vehicles `DEMO%`). _(RF5)_

## Wiring

- [x] **T6** — `package.json`: script `seed:demo`. _(RF1)_
- [x] **T7** — `Makefile`: alvo `seed-demo` (+ `.PHONY`). _(RF1)_

## Testes

- [x] **T8** — `factories.spec.ts`: determinismo, unicidade de chaves no range, formato de
      `year`/`renavam` (6 casos). _(RF6, regras)_

## Verificação e fechamento

- [x] **T9** — `make seed-demo` no container: 1ª run criou 20/8/32/120; **2ª run 0/0**
      (idempotência); variedade confirmada via API (Dodge, Land Rover, CTS…). _(RF2, RF5)_
- [x] **T10** — 44 testes unit verdes + `tsc --noEmit` limpo.
- [x] **T11** — `docs/DOCUMENTACAO.md` atualizado (seed de demo + env vars); status 003 ✅
      no `specs/README.md`. _(README.md principal não alterado — edição recusada pelo usuário.)_
