# Aivacol

API backend da plataforma de gestão de frotas da Aivacol.

O objetivo do projeto é entregar uma base simples, fácil de rodar e fácil de explicar, cobrindo autenticação, CRUD principal de frota, cache com Redis, mensageria com RabbitMQ e auditoria persistida em MongoDB.

## Stack utilizada

- Node.js 20
- NestJS
- TypeORM
- SQL Server
- Redis
- RabbitMQ
- MongoDB
- Docker Compose
- Jest + Supertest

## Funcionalidades implementadas

Escopo principal:

- autenticação com JWT usando `email` e `password`
- CRUD de `users`
- CRUD de `brands`
- CRUD de `models`
- CRUD de `vehicles`
- relacionamento `Brand -> Model -> Vehicle`
- preenchimento de `created_by` com o usuário autenticado

Bônus implementados:

- módulo de `users`
- módulo de `brands`
- cache Redis em `vehicles`
- publicação de eventos no RabbitMQ
- auditoria com consumo no RabbitMQ e persistência no MongoDB
- ambiente completo com Docker Compose

## Como rodar do zero

1. Clone o projeto:

```bash
git clone https://github.com/Coimbra777/desafio-info.git
```

2. Acesse o diretório:

```bash
cd desafio-info
```

3. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

4. Suba o ambiente completo:

```bash
make setup
```

Esse comando faz:

1. sobe os containers
2. cria o banco `desafio_info` se necessário
3. roda as migrations
4. roda o seed inicial

## Endereços locais

- API: `http://localhost:3000`
- RabbitMQ Management: `http://localhost:15672`
- SQL Server: `localhost:1433`
- Redis: `localhost:6379`
- MongoDB: `localhost:27017`

## Comandos úteis do Makefile

```bash
make up
make down
make reset
make logs
make ps
make database
make migrate
make seed
make setup
make build
make test
make test-e2e
make test-all
make clean
```

Resumo dos comandos:

- `make up`: sobe os containers com rebuild
- `make down`: para os containers
- `make reset`: para os containers e remove volumes
- `make logs`: mostra logs do container `api`
- `make ps`: mostra o status dos serviços
- `make database`: cria o banco da aplicação
- `make migrate`: roda as migrations
- `make seed`: roda o seed inicial
- `make setup`: executa `up`, `database`, `migrate` e `seed`
- `make clean`: remove `dist` dentro do container `api`
- `make build`: executa `clean` e depois `npm run build` dentro do container
- `make test`: roda testes unitários dentro do container
- `make test-e2e`: roda testes e2e dentro do container
- `make test-all`: roda testes unitários e e2e em sequência

## Variáveis principais do .env

Banco SQL Server:

- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `DB_ENCRYPT`
- `DB_TRUST_SERVER_CERTIFICATE`

JWT:

- `JWT_SECRET`
- `JWT_EXPIRES_IN`

Redis:

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_DB`
- `VEHICLES_CACHE_TTL`

RabbitMQ:

- `RABBITMQ_URL`
- `RABBITMQ_AUDIT_QUEUE`

MongoDB:

- `MONGODB_URI`

Seed:

- `SEED_AIVACOL_EMAIL`
- `SEED_AIVACOL_PASSWORD`

## Como testar o login

O projeto cria um usuário inicial via seed.

Exemplo:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"aivacol@example.com","password":"ChangeMe123!"}'
```

Resposta esperada:

```json
{
  "accessToken": "TOKEN_JWT",
  "tokenType": "Bearer"
}
```

Use esse token nas rotas protegidas com:

```bash
-H "Authorization: Bearer TOKEN_JWT"
```

## Seed de performance

O seed de performance reutiliza o `data-source` atual, usa o usuário `aivacol` como `createdBy`, cria ou reaproveita a brand `Performance Brand`, cria ou reaproveita o model `Performance Model` e insere usuários e veículos em batches.

Rode primeiro o seed inicial para garantir que o usuário `aivacol` exista:

```bash
make seed
```

Depois rode o seed de performance informando:

1. quantidade de usuários fake
2. quantidade de veículos

Exemplo:

```bash
docker compose exec api npm run seed:performance -- 10000 50000
```

Os registros usam prefixos fixos para evitar duplicidade simples:

- usuários: `perf-user-`
- emails: `perf-email-`
- placas: `PERF-PLATE-`

## Fluxo Brand -> Model -> Vehicle

Fluxo recomendado para testar a regra principal:

1. criar uma `brand`
2. criar um `model` informando `brandId`
3. criar um `vehicle` informando `modelId`

Criar brand:

```bash
curl -X POST http://localhost:3000/brands \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Toyota"}'
```

Criar model:

```bash
curl -X POST http://localhost:3000/models \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Corolla","brandId":1}'
```

Criar vehicle:

```bash
curl -X POST http://localhost:3000/vehicles \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H 'Content-Type: application/json' \
  -d '{
    "licensePlate":"ABC1234",
    "chassis":"9BWZZZ377VT004251",
    "renavam":"12345678901",
    "year":2024,
    "modelId":1
  }'
```

## Cache Redis em vehicles

O cache Redis foi implementado somente para `vehicles`.

- `GET /vehicles` usa a chave `vehicles:list`
- `GET /vehicles/:id` usa a chave `vehicles:detail:{id}`
- o TTL vem de `VEHICLES_CACHE_TTL`
- `POST /vehicles` invalida cache da listagem
- `PATCH /vehicles/:id` invalida cache da listagem e do detalhe
- `DELETE /vehicles/:id` invalida cache da listagem e do detalhe

## Auditoria com RabbitMQ + MongoDB

A auditoria foi implementada de forma assíncrona para os eventos principais de `vehicles`:

- `vehicle.created`
- `vehicle.updated`
- `vehicle.deleted`

Fluxo:

`VehiclesService -> AuditPublisherService -> RabbitMQ -> AuditConsumer -> AuditService -> MongoDB`

Quando um evento é processado com sucesso, ele é salvo no MongoDB na collection `audit_logs` e pode ser consultado pelos endpoints protegidos:

- `GET /audit`
- `GET /audit/:id`

Esses endpoints exibem os logs de auditoria de negócio, ou seja, ações realizadas em `vehicles`.

Erros técnicos relacionados à mensageria ou à persistência da auditoria, como falha ao publicar no RabbitMQ, falha no consumer ou erro ao salvar no MongoDB, são registrados nos logs da aplicação via `Logger` do NestJS.

Para acompanhar os logs técnicos da aplicação:

```bash
make logs
```

As rotas de auditoria também exigem JWT.

## Testes

Para rodar os testes via Docker Compose:

```bash
make test
make test-e2e
make test-all
```

Cobertura atual resumida:

- `AuthService`
- `ModelsService`
- `BrandsService`
- `VehiclesService`, incluindo cache
- `AuditService`
- `AuditController`
- login e rotas protegidas em e2e
- escrita autenticada de `models` e `vehicles`
- leitura autenticada de `audit`

## Arquivo de exemplo de veículos

O repositório possui um arquivo de exemplo com dados de veículos:

- `seed_vehicles_aivacol.json`

Ele pode ser usado como referência para carga manual ou testes rápidos de dados.

## Observações finais

- a API roda no container `api`
- o SQL Server roda no container `sqlserver`
- o Redis roda no container `redis`
- o RabbitMQ roda no container `rabbitmq`
- o MongoDB roda no container `mongodb`
- a comunicação entre os serviços usa os nomes do Docker Compose
- em /docs deixei collections postman e insonminia para teste.
