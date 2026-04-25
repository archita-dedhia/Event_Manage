import os
import requests
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

from .database import SessionLocal
from . import models, cloudinary_utils

# Mapping from eventImages.js
UNSPLASH_MAPPING = {
    "tech-conference": "https://images.unsplash.com/photo-1761223976272-0d6d4bc38636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwY29uZmVyZW5jZSUyMG1vZGVybiUyMGF1ZGllbmNlfGVufDF8fHx8MTc3MTE0MzY1Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    "cultural-festival": "https://images.unsplash.com/photo-1761124739933-009df5603fbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWx0dXJhbCUyMGZlc3RpdmFsJTIwY2VsZWJyYXRpb258ZW58MXx8fHwxNzcxMTM1NjczfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "startup-pitch": "https://images.unsplash.com/photo-1590103514924-009a76183beb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwYnVzaW5lc3MlMjBwcmVzZW50YXRpb258ZW58MXx8fHwxNzcxMTQzNjUyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "ai-workshop": "https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NzEwNDk1MTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "music-concert": "https://images.unsplash.com/photo-1604364260242-1156640c0dfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZlJTIwbXVzaWMlMjBjb25jZXJ0JTIwY3Jvd2R8ZW58MXx8fHwxNzcxMDcyNzA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "career-fair": "https://images.unsplash.com/photo-1675716921224-e087a0cca69a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG5ldHdvcmtpbmclMjBldmVudHxlbnwxfHx8fDE3NzExMDU1MDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
}

def upload_unsplash_to_cloudinary():
    """
    Fetch images from Unsplash, upload to Cloudinary, and update database.
    """
    db = SessionLocal()
    
    try:
        events = db.query(models.Event).all()
        for event in events:
            if event.image in UNSPLASH_MAPPING:
                image_key = event.image
                unsplash_url = UNSPLASH_MAPPING[image_key]
                
                print(f"Migrating image for event '{event.title}' ({image_key})...")
                
                try:
                    # Download from Unsplash
                    response = requests.get(unsplash_url)
                    if response.status_code == 200:
                        # Upload to Cloudinary
                        filename = f"{image_key}.jpg"
                        cloudinary_url = cloudinary_utils.upload_to_cloudinary(response.content, filename)
                        
                        if cloudinary_url:
                            event.image = cloudinary_url
                            print(f"  -> Successfully uploaded to Cloudinary: {cloudinary_url}")
                        else:
                            print(f"  -> Failed to upload to Cloudinary for {image_key}")
                    else:
                        print(f"  -> Failed to download from Unsplash: {response.status_code}")
                except Exception as upload_error:
                    print(f"  -> Error during upload process for {image_key}: {upload_error}")
            else:
                print(f"Skipping event '{event.title}' with image '{event.image}' (not in Unsplash mapping)")

        db.commit()
        print("\nMigration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"\nMigration failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    upload_unsplash_to_cloudinary()
