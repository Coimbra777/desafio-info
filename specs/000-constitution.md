# Constituição do Projeto — Aivacol Fleet Management

> Princípios não-negociáveis que governam todas as features. Toda `spec.md` e `plan.md`
> deve estar em conformidade com esta constituição. Alterações aqui exigem justificativa
> explícita na feature que as motivou.

## Artigo I — Spec-Driven Development (SDD)

1. **Spec antes de código.** Nenhuma feature é implementada sem `spec.md` (o *quê* e o
   *porquê*) e `plan.md` (o *como*) aprovados.
2. **Fluxo por feature:** `spec.md` → `plan.md` → `tasks.md` → implementação → verificação.
3. **Rastreabilidade:** cada task referencia a seção da spec que satisfaz; cada PR/commit
   referencia a feature (`feat(001): ...`).
4. **Incremental ("por partes"):** cada feature é entregável e verificável isoladamente.
   Nada de big bang.

## Artigo II — Arquitetura

1. Backend: **NestJS 10 / Node 20**, modularizado por domínio (controller + service +
   entity + dto). Mantém o padrão atual.
2. Frontend: **React 18 + Vite + TypeScript**, SPA desacoplada consumindo a API REST.
3. Persistência: **SQL Server** (relacional, via TypeORM/migrations), **Redis** (cache),
   **RabbitMQ** (mensageria de auditoria), **MongoDB** (logs de auditoria).
4. **Schema só por migration.** `synchronize` permanece `false`. Toda mudança de schema
   (índices inclusive) entra como migration versionada.
5. Contrato da API é a fonte da verdade: documentado em **OpenAPI/Swagger** e refletido
   nos tipos consumidos pelo frontend.

## Artigo III — Escala e performance (meta: 50.000+ registros por recurso)

1. **Toda listagem é paginada.** Nenhum endpoint retorna coleção ilimitada. Paginação
   com `page`/`limit`, `limit` máximo travado, e metadados de total.
2. **Índices obrigatórios** para colunas de filtro, ordenação e junção que suportem
   volume (ex.: `created_at`, chaves estrangeiras, colunas únicas).
3. **Cache com invalidação explícita.** Cache é aceleração, nunca fonte da verdade;
   toda escrita invalida as chaves afetadas.
4. **Pool de conexões dimensionado** e `maxQueryExecutionTime` monitorado (log de queries
   lentas já ativo).
5. **Capacidade comprovada por teste de carga** (k6/artillery) antes de declarar a meta
   atingida — não por suposição.

## Artigo IV — Qualidade e testes

1. **Toda regra de negócio tem teste unitário** no service correspondente.
2. **Todo fluxo de endpoint crítico tem teste e2e** (auth, escrita, leitura paginada).
3. Testes rodam em container (`make test`, `make test-e2e`) e devem passar antes do merge.
4. **Seeds determinísticos e idempotentes:** rodar duas vezes não duplica nem quebra.
5. Cobertura mínima acordada por feature declarada na respectiva `spec.md`.

## Artigo V — Segurança e dados

1. Autenticação **JWT obrigatória** em todos os recursos, exceto `POST /auth/login`.
2. Senhas sempre em **bcrypt**; nunca retornadas nem logadas.
3. Mensagens de erro de autenticação **genéricas** (não revelam existência de conta).
4. Validação estrita de entrada (`whitelist` + `forbidNonWhitelisted`) em todo DTO.
5. Segredos vêm de `.env`; nada de credencial hardcoded em código.

## Artigo VI — Observabilidade

1. Erros técnicos (mensageria, cache, banco) vão para o `Logger` do NestJS.
2. Auditoria **de negócio** (ações em veículos) é persistida no MongoDB e consultável.
3. Falha de serviço auxiliar (Redis/RabbitMQ/Mongo indisponível) **degrada com aviso**,
   não derruba a operação de negócio principal.

---

_Versão 1.0 — base para as features 001+._
