.PHONY: up database migrate seed setup logs down reset build clean

up:
	docker compose up -d --build

database:
	docker compose exec api npm run db:create

migrate:
	docker compose exec api npm run migration:run

seed:
	docker compose exec api npm run seed

setup: up database migrate seed

logs:
	docker compose logs -f api

down:
	docker compose down

reset:
	docker compose down -v

clean:
	docker compose exec api rm -rf dist

build: clean
	docker compose exec api npm run build
