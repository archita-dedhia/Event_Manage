import cloudinary
import cloudinary.uploader
from . import config
import os
from dotenv import load_dotenv

# Ensure environment variables are loaded
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

def configure_cloudinary():
    """
    Configure Cloudinary with values from config or environment.
    """
    cloudinary_url = config.CLOUDINARY_URL or os.getenv("CLOUDINARY_URL")
    
    if cloudinary_url:
        # If CLOUDINARY_URL is present, it's the preferred way
        cloudinary.config(cloudinary_url=cloudinary_url, secure=True)
        return

    cloud_name = config.CLOUDINARY_CLOUD_NAME or os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = config.CLOUDINARY_API_KEY or os.getenv("CLOUDINARY_API_KEY")
    api_secret = config.CLOUDINARY_API_SECRET or os.getenv("CLOUDINARY_API_SECRET")

    if not all([cloud_name, api_key, api_secret]):
        print(f"WARNING: Cloudinary configuration incomplete!")
        print(f"  cloud_name: {'Set' if cloud_name else 'MISSING'}")
        print(f"  api_key: {'Set' if api_key else 'MISSING'}")
        print(f"  api_secret: {'Set' if api_secret else 'MISSING'}")

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )

# Initial configuration
configure_cloudinary()

def upload_to_cloudinary(file_content, filename, resource_type="auto"):
    """
    Upload a file to Cloudinary and return the secure URL.
    """
    try:
        # Simplified folder logic
        folder = "campus_events/reports" if filename.lower().endswith('.pdf') else "campus_events/images"

        upload_result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type="auto", # Let Cloudinary decide
            use_filename=True,
            unique_filename=True,
            overwrite=True
        )
        return upload_result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        return None
