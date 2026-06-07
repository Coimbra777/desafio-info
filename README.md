# Desafio Info

Backend technical test for the Aivacol Fleet Management Platform.

## Requirements

- Docker
- Docker Compose
- Make

## Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Main local addresses:

- API: `http://localhost:3000`
- SQL Server: `localhost:1433`
- Redis: `localhost:6379`

## Project Setup

Run the full local setup:

```bash
make setup
```

This command will:

1. start the containers
2. create the `desafio_info` database if needed
3. run migrations
4. run the seed

## Make Commands

```bash
make up
make database
make migrate
make seed
make setup
make logs
make down
make reset
make clean
make build
```

What each command does:

- `make up`: starts the containers with Docker Compose
- `make database`: creates the application database if it does not exist
- `make migrate`: runs TypeORM migrations
- `make seed`: runs the initial seed
- `make setup`: runs the full flow (`up`, `database`, `migrate`, `seed`)
- `make logs`: shows API logs
- `make down`: stops the containers
- `make reset`: stops the containers and removes volumes
- `make clean`: removes `dist` inside the API container
- `make build`: runs `make clean` and then `npm run build` inside the API container

## Tests

Run unit tests:

```bash
npm run test
```

Run e2e tests:

```bash
npm run test:e2e
```

Current automated coverage:

- `AuthService` unit tests
- `ModelsService` unit tests
- `VehiclesService` unit tests, including cache behavior
- login and protected routes in e2e
- authenticated creation of `models` and `vehicles` in e2e

## Redis Cache

Redis cache is used only in `vehicles`.

- `GET /vehicles` uses the `vehicles:list` key
- `GET /vehicles/:id` uses the `vehicles:detail:{id}` key
- cache expiration comes from `VEHICLES_CACHE_TTL`

If you hit the known local permission problem with `dist`, use the container flow:

```bash
make clean
make build
```

## Login Test

Use the seeded user to test authentication:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"aivacol@example.com","password":"ChangeMe123!"}'
```

Expected response:

```json
{
  "accessToken": "TOKEN_JWT",
  "tokenType": "Bearer"
}
```

## CRUD Examples

Use numeric ids in the protected CRUD routes.

Examples:

- `GET /users/1`
- `GET /models/1`
- `GET /vehicles/1`

Create a model:

```bash
curl -X POST http://localhost:3000/models \
  -H "Authorization: Bearer TOKEN_JWT" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Corolla"}'
```

`created_by` is filled automatically from the authenticated user.

Create a vehicle linked to a model:

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

## DBeaver Validation

Use these connection settings:

- Host: `localhost`
- Port: `1433`
- Database: `desafio_info`
- User: `sa`
- Password: `YourStrong!Passw0rd`

After connecting, you can validate the seed with:

```sql
SELECT * FROM users;
```

You should see the `aivacol` user.
