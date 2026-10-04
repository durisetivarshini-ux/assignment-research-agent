"""
Database Migration and Schema Management for AI Assignment Research Agent.
Can be executed directly: python -m backend.migrations
"""

import sys
from backend.database import engine, Base
import backend.models  # Ensures all models are registered with Base.metadata


def run_migrations():
    """Apply schema migrations to ensure all tables exist."""
    print("[MIGRATION] Checking database schema and creating tables...")
    Base.metadata.create_all(bind=engine)
    print("[MIGRATION] Database schema synchronized successfully.")


if __name__ == "__main__":
    run_migrations()
