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
    resource_type can be "image", "video", or "raw" (for PDFs/docs).
    Using "auto" lets Cloudinary decide.
    """
    try:
        # Determine if it's a PDF to set the correct folder/type if needed
        folder = "campus_events"
        if filename.lower().endswith('.pdf'):
            resource_type = "raw"
            folder = "campus_events/reports"
        else:
            resource_type = "image"
            folder = "campus_events/images"

        upload_result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type=resource_type,
            use_filename=True,
            unique_filename=True,
            overwrite=True
        )
        return upload_result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        return None
