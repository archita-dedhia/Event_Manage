import os
import urllib.parse
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

from .database import SessionLocal, get_db
from . import models, cloudinary_utils

def migrate_local_to_cloudinary():
    """
    Find all local image/pdf paths in the database and upload them to Cloudinary.
    """
    db = SessionLocal()
    UPLOAD_DIR = "uploads"
    
    try:
        # 1. Migrate Event main images and PDFs
        events = db.query(models.Event).all()
        for event in events:
            # Check main image
            if event.image and "uploads/" in event.image:
                filename = urllib.parse.unquote(event.image.split("uploads/")[-1])
                file_path = os.path.join(UPLOAD_DIR, filename)
                
                if os.path.exists(file_path):
                    print(f"Migrating main image for event {event.id}: {filename}")
                    with open(file_path, "rb") as f:
                        new_url = cloudinary_utils.upload_to_cloudinary(f.read(), filename)
                        if new_url:
                            event.image = new_url
                            print(f"  -> Successfully migrated to {new_url}")

            # Check PDF URL
            if event.pdf_url and "uploads/" in event.pdf_url:
                filename = urllib.parse.unquote(event.pdf_url.split("uploads/")[-1])
                file_path = os.path.join(UPLOAD_DIR, filename)
                
                if os.path.exists(file_path):
                    print(f"Migrating PDF for event {event.id}: {filename}")
                    with open(file_path, "rb") as f:
                        new_url = cloudinary_utils.upload_to_cloudinary(f.read(), filename)
                        if new_url:
                            event.pdf_url = new_url
                            print(f"  -> Successfully migrated to {new_url}")

        # 2. Migrate EventImage gallery
        event_images = db.query(models.EventImage).all()
        for img in event_images:
            if img.url and "uploads/" in img.url:
                filename = urllib.parse.unquote(img.url.split("uploads/")[-1])
                file_path = os.path.join(UPLOAD_DIR, filename)
                
                if os.path.exists(file_path):
                    print(f"Migrating gallery image {img.id}: {filename}")
                    with open(file_path, "rb") as f:
                        new_url = cloudinary_utils.upload_to_cloudinary(f.read(), filename)
                        if new_url:
                            img.url = new_url
                            print(f"  -> Successfully migrated to {new_url}")

        db.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_local_to_cloudinary()
