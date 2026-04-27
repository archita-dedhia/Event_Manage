from sqlalchemy import create_engine, text
from config import get_database_url

def fix_columns():
    engine = create_engine(get_database_url())
    with engine.connect() as conn:
        print("Altering columns to TEXT to prevent truncation...")
        try:
            # Fix events table
            conn.execute(text("ALTER TABLE events MODIFY image TEXT"))
            conn.execute(text("ALTER TABLE events MODIFY pdf_url TEXT"))
            conn.execute(text("ALTER TABLE events MODIFY rsvp_url TEXT"))
            conn.execute(text("ALTER TABLE events MODIFY website_url TEXT"))
            
            # Add missing columns if they don't exist
            try:
                conn.execute(text("ALTER TABLE events ADD COLUMN report_pdf_url TEXT"))
                print("Added report_pdf_url column")
            except Exception as e:
                if "Duplicate column name" in str(e):
                    print("report_pdf_url column already exists")
                else:
                    print(f"Note: {e}")
            
            try:
                conn.execute(text("UPDATE events SET attendees = 0 WHERE attendees IS NULL"))
                conn.commit()
                print("Fixed NULL attendees")
            except Exception as e:
                print(f"Note: {e}")
            
            # Fix event_images table
            conn.execute(text("ALTER TABLE event_images MODIFY url TEXT"))
            
            conn.commit()
            print("✅ Database columns updated successfully!")
        except Exception as e:
            print(f"❌ Error updating columns: {e}")

if __name__ == "__main__":
    fix_columns()
