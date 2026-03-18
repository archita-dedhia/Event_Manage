import os

from dotenv import load_dotenv


load_dotenv()


MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "123456")
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_DB = os.getenv("MYSQL_DB", "saas_app")


def get_database_url(include_db: bool = True) -> str:
    """
    Build a SQLAlchemy MySQL URL.

    If include_db is False, omit the database name (used for initial CREATE DATABASE).
    """

    base = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}"
    if include_db:
        return f"{base}/{MYSQL_DB}"
    return base

