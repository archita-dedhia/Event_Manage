"""
One-time helper to create the MySQL database and tables.

Usage (from the root directory, in an activated Python env with requirements installed):

    python -m backend.init_db

This will:
1. Connect to MySQL *without* a database
2. Create the `saas_app` database if it does not exist
3. Create all tables defined in models.py
4. Add sample categories
5. Add sample users (admin and student)
"""

from sqlalchemy import create_engine, text


from .config import MYSQL_DB, get_database_url
from .database import Base
from .models import User, Category, Event, Participant





def create_database_if_not_exists():
    url_without_db = get_database_url(include_db=False)
    engine = create_engine(url_without_db)

    with engine.connect() as conn:
        conn.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}` "
                "DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
        conn.commit()


def create_tables():
    url = get_database_url(include_db=True)
    engine = create_engine(url)
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Tables dropped.")
    Base.metadata.create_all(bind=engine)


def add_sample_categories(db_url):
    """Add sample event categories"""
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=create_engine(db_url))
    db = SessionLocal()
    
    try:
        # Check if categories already exist
        from .models import Category
        existing = db.query(Category).first()
        if existing:
            print("Categories already exist, skipping...")
            return
        
        categories = [
            Category(name="Technology", description="Tech talks, hackathons, coding workshops"),
            Category(name="Cultural", description="Arts, music, dance, cultural events"),
            Category(name="Business", description="Entrepreneurship, career talks, networking"),
            Category(name="Workshop", description="Skill-building workshops and seminars"),
            Category(name="Entertainment", description="Concerts, movies, comedy shows"),
            Category(name="Career", description="Job fairs, recruitment drives"),
            Category(name="Sports", description="Sports competitions and fitness events"),
        ]
        
        for category in categories:
            db.add(category)
        
        db.commit()
        print("✅ Sample categories added successfully!")
    except Exception as e:
        print(f"❌ Error adding categories: {e}")
    finally:
        db.close()


def add_sample_users(db_url):
    """Add sample admin and student users"""
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=create_engine(db_url))
    db = SessionLocal()
    
    try:
        # Check if users already exist

        existing = db.query(User).first()
        if existing:
            print("Users already exist, skipping...")
            return
        
        # Create sample users
        users = [
            User(
                email="admin@campus.edu",
                password="password123",
                full_name="Admin User",
                user_type="admin"
            ),
            User(
                email="student@campus.edu",
                password="password123",
                full_name="John Student",
                user_type="student"
            ),
            User(
                email="student2@campus.edu",
                password="password123",
                full_name="Jane Doe",
                user_type="student"
            ),
        ]
        
        for user in users:
            db.add(user)
        
        db.commit()
        print("✅ Sample users added successfully!")
        print("\n📝 Demo Credentials:")
        print("   Admin:   admin@campus.edu / password123")
        print("   Student: student@campus.edu / password123")
        print("   Student: student2@campus.edu / password123")
    except Exception as e:
        print(f"❌ Error adding users: {e}")
    finally:
        db.close()


def add_sample_events(db_url):
    """Add sample events to the database"""
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=create_engine(db_url))
    db = SessionLocal()
    
    try:
        from .models import Event, Category
        existing = db.query(Event).first()
        if existing:
            print("Events already exist, skipping...")
            return
        
        # Get categories to link them
        categories = {c.name: c.id for c in db.query(Category).all()}
        
        # Get an admin user to be the organizer
        from .models import User
        admin = db.query(User).filter(User.user_type == "admin").first()
        if not admin:
            print("❌ No admin user found to be organizer. Skipping events.")
            return
        
        organizer_id = admin.id
        
        events = [
            Event(
                title="AI and Future of Work",
                description="Join us for an insightful session on how AI is shaping the future of various industries.",
                date="2026-03-18",
                time="14:00",
                location="Auditorium A",
                category_id=categories.get("Technology"),
                organizer_id=organizer_id,
                capacity=200,
                attendees=156,
                image="tech-conference",
            ),
            Event(
                title="Spring Music Festival",
                description="Celebrate the arrival of spring with a day of live music performances.",
                date="2026-03-20",
                end_date="2026-03-22",
                time="11:00",
                location="Campus Green",
                category_id=categories.get("Entertainment"),
                organizer_id=organizer_id,
                capacity=1000,
                attendees=450,
                image="music-concert",
            ),
            Event(
                title="Startup Pitch Competition",
                description="Witness the next generation of entrepreneurs as they pitch their innovative ideas.",
                date="2026-04-20",
                time="16:30",
                location="Business School Room 102",
                category_id=categories.get("Business"),
                organizer_id=organizer_id,
                capacity=100,
                attendees=88,
                image="startup-pitch",
            ),
            Event(
                title="Photography Workshop",
                description="Learn the fundamentals of photography from professional photographers.",
                date="2026-04-25",
                time="10:00",
                location="Art Studio",
                category_id=categories.get("Workshop"),
                organizer_id=organizer_id,
                capacity=30,
                attendees=25,
                image="ai-workshop",
            ),
            Event(
                title="Career Fair 2026",
                description="Connect with top employers and explore internship and job opportunities.",
                date="2026-05-05",
                time="09:00",
                location="Main Gymnasium",
                category_id=categories.get("Career"),
                organizer_id=organizer_id,
                capacity=500,
                attendees=320,
                image="career-fair",
            ),
            Event(
                title="Global Food Festival",
                description="Experience flavors from around the world at our annual food festival.",
                date="2026-05-15",
                time="12:00",
                location="Student Union Plaza",
                category_id=categories.get("Cultural"),
                organizer_id=organizer_id,
                capacity=800,
                attendees=600,
                image="cultural-festival",
            )
        ]
        
        for event in events:
            db.add(event)
            
        db.commit()
        print("✅ Sample events added successfully!")
    except Exception as e:
        print(f"❌ Error adding events: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Starting database initialization...\n")
    
    print("1️⃣  Creating database...")
    create_database_if_not_exists()
    print("✅ Database created/verified\n")
    
    print("2️⃣  Creating tables...")
    create_tables()
    print("✅ All tables created successfully!\n")
    
    print("3️⃣  Adding sample categories...")
    db_url = get_database_url(include_db=True)
    add_sample_categories(db_url)
    
    print("\n4️⃣  Adding sample users...")
    add_sample_users(db_url)
    
    print("\n5️⃣  Adding sample events...")
    add_sample_events(db_url)
    
    print("\n" + "="*50)
    print("✅ Database setup complete!")
    print("="*50)

