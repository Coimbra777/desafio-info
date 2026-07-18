# Roadmap SDD — Aivacol Fleet Management

Índice das features. Construção **por partes**, cada uma seguindo o fluxo
`spec.md → plan.md → tasks.md → implementação → verificação` definido na
[constituição](000-constitution.md).

## Decisões de projeto (travadas)

- **Frontend:** React 18 + Vite + TypeScript (SPA administrativa).
- **"50 mil clientes":** requisito **não-funcional de escala/carga** — sem entidade nova.
  Foco em paginação, índices, pool, cache e teste de carga.
- **SDD:** convenção Spec-Kit (constitution + specs por feature).

## Features

| #   | Feature                        | Objetivo                                                                 | Status      |
| --- | ------------------------------ | ------------------------------------------------------------------------ | ----------- |
| 001 | OpenAPI / Swagger              | Documentar 100% do contrato da API com `@nestjs/swagger`; UI em `/api/swagger`. | ✅ Concluída |
| 002 | Paginação & Escala (50k)       | Paginação em todas as listagens, índices, pool, cache list por página.   | ✅ Concluída |
| 003 | Seeds fake (todos os módulos)  | `@faker-js/faker`: users, brands, models, vehicles determinísticos.      | ✅ Concluída |
| 004 | Cobertura de testes            | Unit + e2e para todos os módulos, incluindo paginação e seeds.           | ⏳ A specar  |
| 005 | Frontend React + Vite          | Painel: login, CRUD de todos os recursos, listas paginadas, auditoria.   | ⏳ A specar  |
| 006 | Teste de carga (validação 50k) | k6/artillery provando a meta de 50k; relatório de latência/throughput.   | ⏳ A specar  |

Legenda: 📝 spec pronta · ⏳ a specar · 🚧 em implementação · ✅ concluída.

## Ordem de execução recomendada

1. **001 Swagger** — barato, cria o contrato que o frontend vai consumir.
2. **002 Paginação & Escala** — muda a forma das respostas de listagem (impacta front e testes),
   então vem antes deles.
3. **003 Seeds fake** — dados para exercitar paginação, testes e o front.
4. **004 Testes** — trava o comportamento antes de expor no front.
5. **005 Frontend** — consome contrato estável, paginado e testado.
6. **006 Carga** — validação final da meta de 50k.

> Cada feature só entra em implementação após a `spec.md`/`plan.md` correspondente ser
> revisada. Começamos por **001**.
