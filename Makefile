.PHONY: run build stop migrate seed test lint format clean logs shell

run:
	docker-compose up -d

build:
	docker-compose build

stop:
	docker-compose down

migrate:
	docker-compose exec app alembic upgrade head

migrate-create:
	docker-compose exec app alembic revision --autogenerate -m "$(name)"

seed:
	docker-compose exec app python scripts/seed.py

create-admin:
	docker-compose exec app python scripts/create_admin.py

test:
	docker-compose exec app pytest app/tests/ -v --cov=app --cov-report=term-missing

test-unit:
	docker-compose exec app pytest app/tests/unit/ -v

test-integration:
	docker-compose exec app pytest app/tests/integration/ -v

lint:
	docker-compose exec app flake8 app/
	docker-compose exec app mypy app/

format:
	docker-compose exec app black app/
	docker-compose exec app isort app/

clean:
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -name "*.pyc" -delete

logs:
	docker-compose logs -f app

logs-celery:
	docker-compose logs -f celery_worker

shell:
	docker-compose exec app python

db-shell:
	docker-compose exec db psql -U hemo_user -d hemodialysis_db