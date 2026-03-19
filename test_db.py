
from backend.config import get_database_url
from sqlalchemy import create_engine, text

def test_connection():
    url = get_database_url(include_db=True)
    print(f"Testing connection to: {url}")
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"Connection successful! Result: {result.fetchone()}")
            
            # Check if tables exist
            result = conn.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result]
            print(f"Tables in DB: {tables}")
            
            # Check if users exist
            if 'users' in tables:
                result = conn.execute(text("SELECT COUNT(*) FROM users"))
                count = result.fetchone()[0]
                print(f"Number of users in 'users' table: {count}")
                
            # Check if events exist
            if 'events' in tables:
                result = conn.execute(text("SELECT COUNT(*) FROM events"))
                count = result.fetchone()[0]
                print(f"Number of events in 'events' table: {count}")

            # Check if categories exist
            if 'categories' in tables:
                result = conn.execute(text("SELECT COUNT(*) FROM categories"))
                count = result.fetchone()[0]
                print(f"Number of categories in 'categories' table: {count}")
                
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_connection()
