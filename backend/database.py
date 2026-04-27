from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from config import get_database_url, MYSQL_DB

DATABASE_URL = get_database_url(include_db=True)

# Helper to create database if it doesn't exist
def create_database_if_not_exists():
    """Attempts to create the database if it doesn't exist."""
    temp_url = get_database_url(include_db=False)
    temp_engine = create_engine(temp_url)
    try:
        with temp_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DB}"))
            print(f"Verified database '{MYSQL_DB}' exists or was created.")
    except Exception as e:
        print(f"Note: Could not automatically create database '{MYSQL_DB}': {e}")
    finally:
        temp_engine.dispose()

# Run database verification
create_database_if_not_exists()

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=120,  # Recycle every 2 minutes for remote DB
    pool_timeout=30,
    connect_args={
        "connect_timeout": 30,
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

