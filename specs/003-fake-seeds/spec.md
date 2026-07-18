# 003 — Seeds fake (todos os módulos)

**Status:** ✅ Concluída · **Depende de:** nada (usa entidades atuais) · **Habilita:** 004, 005

## Problema

Hoje só existem dois seeds: o **inicial** (cria só o usuário `aivacol`) e o de
**performance** (dados sintéticos sequenciais — um único "Performance Brand"/"Performance
Model", placas `PERF-PLATE-N`). Nenhum produz dados **realistas e variados** para exercitar
o front (005), demonstrar a cadeia Brand→Model→Vehicle com diversidade, ou tornar a
paginação (002) visualmente significativa. Faltam também usuários e marcas fake plausíveis.

## Objetivo

Um seed de **demonstração** que popula todos os módulos (users, brands, models, vehicles)
com dados fake realistas via `@faker-js/faker`, de forma **determinística e idempotente**
(Artigo IV.4 da [constituição](../000-constitution.md)), configurável em quantidade.

## Escopo

Incluído:

- Seed `seed:demo` gerando: usuários, marcas, modelos (distribuídos entre marcas) e
  veículos (distribuídos entre modelos) com dados fake realistas.
- Determinismo por `faker.seed(SEED)` fixo → mesma saída a cada execução.
- Idempotência: rodar duas vezes não duplica nem viola unicidade.
- Quantidades configuráveis (args de CLI com defaults sensatos).
- Inserção em lotes (batch) para volume.
- Alvo `make seed-demo`.

Fora de escopo:

- Substituir o seed inicial (`aivacol`) — o demo **depende** dele para `createdBy`.
- Substituir o seed de performance (carga bruta continua existindo para a 006).
- Dados de auditoria fake no MongoDB (auditoria nasce de eventos reais; fora do escopo).

## Requisitos funcionais

- **RF1** — `npm run seed:demo` popula users, brands, models e vehicles com dados fake
  realistas (nomes de pessoas, marcas/modelos plausíveis, placas/chassi/renavam válidos
  em formato).
- **RF2** — Modelos são distribuídos entre as marcas; veículos são distribuídos entre os
  modelos (cadeia Brand→Model→Vehicle com diversidade real).
- **RF3** — Quantidades configuráveis por CLI:
  `seed:demo -- <users> <brands> <modelsPerBrand> <vehicles>` com defaults
  (`20 8 4 120`).
- **RF4** — `createdBy` de brands/models/vehicles = usuário `aivacol` (do seed inicial).
- **RF5** — Idempotente: uma 2ª execução não cria duplicatas nem quebra por unicidade
  (placa/chassi/renavam/email/nickname/nome de marca).
- **RF6** — Determinístico: com o mesmo `SEED`, os dados gerados são os mesmos entre
  execuções (em bancos limpos).
- **RF7** — Saída no stdout resumindo o que foi criado/reaproveitado por entidade.

## Requisitos não-funcionais

- **RNF1** — Inserção em lotes (reusar o padrão de batch do performance seed) para não
  estourar memória nem fazer N inserts unitários.
- **RNF2** — Não depende de a API estar no ar — roda via `data-source` (igual aos outros
  seeds), executável dentro do container (`docker compose exec api`).
- **RNF3** — `SEED` configurável por env (`DEMO_SEED`, default fixo) para reprodutibilidade.

## Regras de negócio a respeitar

- Unicidade: `users.email`, `users.nickname`, `brands.name`, `vehicles.licensePlate`,
  `vehicles.chassis`, `vehicles.renavam`. Os geradores garantem chaves únicas por índice.
- `vehicles.year` entre 1900 e ano+1.
- `models.brandId` sempre aponta para uma marca criada nesta seed (ou reaproveitada).
- Namespace de demo (prefixos/domínio próprios, ex.: emails `@demo.aivacol.dev`, nomes de
  marca com sufixo estável) para permitir contagem/idempotência sem colidir com dados reais
  nem com o namespace `perf-` do seed de performance.

## Critérios de aceite

- [ ] `make seed-demo` popula os 4 módulos; `GET /brands`, `/models`, `/vehicles` mostram
      dados variados e a cadeia coerente.
- [ ] Rodar `make seed-demo` 2× não aumenta as contagens além do alvo (idempotência).
- [ ] Placas/chassi/renavam/emails/nicknames são únicos (sem erro de constraint).
- [ ] Veículos distribuídos entre múltiplos modelos, modelos entre múltiplas marcas.
- [ ] Com o mesmo `DEMO_SEED`, dois bancos limpos produzem os mesmos registros.

## Cobertura de testes exigida (Artigo IV)

- Unit: geradores puros de registro (`buildUser`, `buildBrand`, `buildModel`,
  `buildVehicle`) — determinismo (mesmo seed/índice → mesma saída) e unicidade das chaves
  ao longo de um range de índices.
