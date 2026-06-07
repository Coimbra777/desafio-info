# Desafio Info

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

## Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"aivacol@example.com","password":"ChangeMe123!"}'
```
