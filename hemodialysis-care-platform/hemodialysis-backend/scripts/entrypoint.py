#!/usr/bin/env python3
"""
Container entrypoint for the FastAPI backend.

Runs Alembic migrations (creating the schema if missing) and then
executes the given command (uvicorn by default).
"""
import os
import subprocess
import sys

from app.config.settings import get_settings


def run_alembic() -> None:
    """Run `alembic upgrade head`, tolerating an already-migrated DB."""
    # alembic.ini lives at alembic/alembic.ini relative to the repo root
    cmd = ["alembic", "-c", "alembic/alembic.ini", "upgrade", "head"]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=180,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        )
        if result.returncode != 0:
            print("⚠️  Alembic migration failed (continuing anyway):")
            print(result.stderr or result.stdout)
        else:
            tail = (result.stdout or "").strip().splitlines()
            if tail:
                print("✅ Alembic:", tail[-1])
    except FileNotFoundError:
        print("⚠️  alembic executable not found; skipping migrations")
    except Exception as exc:  # pragma: no cover - defensive
        print(f"⚠️  Alembic error: {exc}")


def ensure_schema() -> None:
    """Fallback: create any missing tables directly from the ORM models.

    This is a safety net for environments where Alembic cannot run (e.g. a
    fresh DB whose ENUM types already exist, or a partial migration). It is
    idempotent and never drops data.
    """
    try:
        from app.config.database import engine
        import app.models  # noqa: F401 — register all models on Base.metadata

        from app.infrastructure.db.base import BaseModel

        BaseModel.metadata.create_all(bind=engine)
        print("✅ Schema check complete")
    except Exception as exc:  # pragma: no cover - defensive
        print(f"⚠️  create_all fallback failed: {exc}")


def main() -> None:
    get_settings()  # validate configuration early
    run_alembic()
    ensure_schema()

    cmd = sys.argv[1:] or ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    os.execvp(cmd[0], cmd)


if __name__ == "__main__":
    main()