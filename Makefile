.PHONY: up down reset logs ps database migrate seed seed-demo setup build test test-e2e test-all clean

up:
	docker compose up -d --build

down:
	docker compose down

reset:
	docker compose down -v

logs:
	docker compose logs -f api

ps:
	docker compose ps

database:
	docker compose exec api npm run db:create

migrate:
	docker compose exec api npm run migration:run

seed:
	docker compose exec api npm run seed

seed-demo:
	docker compose exec api npm run seed:demo

setup: up database migrate seed

clean:
	docker compose exec api rm -rf dist

build: clean
	docker compose exec api npm run build

test:
	docker compose exec api npm run test

test-e2e:
	docker compose exec api npm run test:e2e

test-all: test test-e2e
