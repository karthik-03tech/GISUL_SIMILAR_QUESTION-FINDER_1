from sqlalchemy import text
from app.db.database import engine, Base
# Import models so SQLAlchemy metadata is aware of them
from app.db.models import User, Topic, Question, QuestionMatch, Bookmark


def create_all_tables() -> None:
    """Create all tables (no-op for existing ones) then apply column migrations."""
    Base.metadata.create_all(bind=engine)
    _apply_column_migrations()


# ── Column migrations ──────────────────────────────────────────────────────────
# SQLAlchemy's create_all never adds columns to existing tables.
# Each entry below is idempotent: it uses ADD COLUMN IF NOT EXISTS so it
# is safe to run every startup.

_MIGRATIONS = [
    # Phase 2 additions
    "ALTER TABLE topics    ADD COLUMN IF NOT EXISTS color        VARCHAR;",
    "ALTER TABLE questions ADD COLUMN IF NOT EXISTS confidence   DOUBLE PRECISION;",
    "ALTER TABLE question_matches ADD COLUMN IF NOT EXISTS explanation TEXT;",
    "ALTER TABLE users     ADD COLUMN IF NOT EXISTS display_name VARCHAR;",
]


def _apply_column_migrations() -> None:
    with engine.begin() as conn:
        for sql in _MIGRATIONS:
            try:
                conn.execute(text(sql))
            except Exception as exc:
                # Log but never crash — the column may already exist in some DBs
                print(f"  migration skipped ({sql.strip()[:60]}…): {exc}")
    print("✓ Tables created (Supabase)")
