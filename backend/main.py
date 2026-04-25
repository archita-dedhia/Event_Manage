import os
import shutil
import io
import urllib.parse
import requests
from dotenv import load_dotenv

# Load environment variables at the very beginning
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

from datetime import datetime, timezone, timedelta
from fastapi import Depends, FastAPI, HTTPException, status, File, UploadFile, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

from database import get_db
import models
import schemas
import auth_utils
import cloudinary_utils
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = auth_utils.decode_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def get_ist_time():
    # UTC + 5:30
    ist_offset = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist_offset)


app = FastAPI(
    title="CampusEvents API",
    description="Backend API for Campus Events Management Platform",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Mount static files to serve images and PDFs
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    try:
        # Read file content
        content = await file.read()
        
        # Upload to Cloudinary
        cloudinary_url = cloudinary_utils.upload_to_cloudinary(content, file.filename)
        
        if not cloudinary_url:
            raise HTTPException(status_code=500, detail="Cloudinary upload failed. Please check your configuration.")
            
        return {"url": cloudinary_url, "filename": file.filename}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Could not upload file: {str(e)}")


@app.post("/api/users/register", response_model=schemas.LoginResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    print(f"Registering user: {payload.email}")
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Prevent anyone from self-registering as admin via the public endpoint
    if payload.user_type == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be created via signup",
        )
    
    hashed_password = auth_utils.get_password_hash(payload.password)
    user = models.User(
        email=payload.email,
        password=hashed_password,
        full_name=payload.full_name,
        moodle_id=payload.moodle_id,
        department=payload.department,
        user_type=payload.user_type
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate token immediately for registration to auto-login
    access_token = auth_utils.create_access_token(data={"sub": user.email})
    return {
        "success": True, 
        "user": user, 
        "message": "User registered successfully", 
        "access_token": access_token, 
        "token_type": "bearer"
    }


@app.post("/api/users/login", response_model=schemas.LoginResponse)
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found, create account first",
        )
    
    if not auth_utils.verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email, password, or role",
        )

    # Enforce role-based login: you can only log in as your actual role
    if user.user_type != payload.user_type:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to log in with this role",
        )
    
    access_token = auth_utils.create_access_token(data={"sub": user.email})
    return {
        "success": True, 
        "user": user, 
        "message": "Login successful", 
        "access_token": access_token, 
        "token_type": "bearer"
    }


@app.get("/api/users/me", response_model=schemas.UserDetail)
def get_current_user_info(user: models.User = Depends(get_current_user)):
    return user


@app.get("/api/users/{user_id}", response_model=schemas.UserDetail)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/api/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, payload: schemas.UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="You can only update your own profile")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Security: Verify current password before any updates
    if not auth_utils.verify_password(payload.current_password, user.password):
        raise HTTPException(status_code=401, detail="Current password verification failed")
    
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        # Check if email is already taken by another user
        existing = db.query(models.User).filter(models.User.email == payload.email, models.User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = payload.email
    if payload.moodle_id is not None:
        # Check if moodle_id is already taken
        existing_moodle = db.query(models.User).filter(models.User.moodle_id == payload.moodle_id, models.User.id != user_id).first()
        if existing_moodle:
            raise HTTPException(status_code=400, detail="Moodle ID already in use")
        user.moodle_id = payload.moodle_id
    if payload.department is not None:
        user.department = payload.department
    if payload.password is not None:
        user.password = auth_utils.get_password_hash(payload.password)
        
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/categories", response_model=schemas.CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: schemas.CategoryCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create categories")
    category = models.Category(name=payload.name, description=payload.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@app.get("/api/categories", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    try:
        categories = db.query(models.Category).all()
        return categories
    except Exception as e:
        print(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/categories/{category_id}", response_model=schemas.CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@app.post("/api/events", response_model=schemas.EventOut, status_code=status.HTTP_201_CREATED)
def create_event(payload: schemas.EventCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Check if user is admin
    if current_user.user_type != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can create events")
    
    # 2. Calendar Cross-Items Restriction
    # Prevent addition of items containing visual "cross" symbols (×, ✕, ✖, ❌)
    # We exclude 'x' and 'X' as they are common letters in many words
    cross_symbols = ['×', '✕', '✖', '❌']
    def contains_cross(text):
        if not text: return False
        return any(symbol in text for symbol in cross_symbols)
    
    if contains_cross(payload.title) or contains_cross(payload.description):
        raise HTTPException(
            status_code=400, 
            detail="Event title or description cannot contain cross symbols (X, x, ×, etc.)"
        )
    
    # 3. Check for conflicts (same date, overlapping time, same location)
    # Convert HH:MM to comparable integers (minutes from 00:00)
    def to_min(t_str):
        h, m = map(int, t_str.split(':'))
        return h * 60 + m

    new_start = to_min(payload.time)
    new_end = to_min(payload.end_time) if payload.end_time else new_start + 60 # Default 1h
    
    # Simple overlap check: (StartA < EndB) and (EndA > StartB)
    existing_events = db.query(models.Event).filter(
        models.Event.date == payload.date,
        models.Event.location == payload.location
    ).all()
    
    for e in existing_events:
        e_start = to_min(e.time)
        e_end = to_min(e.end_time) if e.end_time else e_start + 60
        if new_start < e_end and new_end > e_start:
            raise HTTPException(
                status_code=400, 
                detail=f"Conflict: '{e.title}' is scheduled from {e.time} to {e.end_time or 'N/A'} in {payload.location}"
            )

    category = db.query(models.Category).filter(models.Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    event = models.Event(
        title=payload.title,
        description=payload.description,
        date=payload.date,
        end_date=payload.end_date,
        time=payload.time,
        end_time=payload.end_time,
        duration=payload.duration,
        location=payload.location,
        category_id=payload.category_id,
        organizer_id=current_user.id,
        capacity=payload.capacity,
        image=payload.image,
        pdf_url=payload.pdf_url,
        website_url=payload.website_url,
        is_rsvp_based=payload.is_rsvp_based or False,
        rsvp_url=payload.rsvp_url
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Add images if provided
    if payload.images:
        for image_url in payload.images:
            db_image = models.EventImage(event_id=event.id, url=image_url)
            db.add(db_image)
        db.commit()
        db.refresh(event)

    return event


def get_image_data(url: str):
    """Download image or read from local storage"""
    if not url:
        return None
    
    # Check if it's a local file URL
    if "uploads/" in url:
        # Extract filename from URL
        filename = url.split("uploads/")[-1]
        filename = urllib.parse.unquote(filename)
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            return file_path
            
    # If it's a remote URL or local path doesn't exist
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return io.BytesIO(response.content)
    except Exception as e:
        print(f"Error fetching image {url}: {e}")
    
    return None


@app.get("/api/events/{event_id}/report")
def generate_event_report(request: Request, event_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Verify admin
    if current_user.user_type != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can download reports")

    # 2. Get event details
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # 3. Get registered participants
    participants = db.query(models.Participant).filter(models.Participant.event_id == event_id).all()
    
    # 4. Check for report data
    if not event.pdf_url:
        # If no PDF exists, we might want to still allow downloading a basic auto-generated report
        # but the user requested to show "pending" if not added.
        # However, this endpoint is for downloading the actual PDF.
        pass

    # 5. Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()
    elements = []

    # Custom Style for Geo-tag
    geotag_style = styles['Normal'].clone('GeoTag')
    geotag_style.fontSize = 8
    geotag_style.textColor = colors.white
    geotag_style.backColor = colors.black
    geotag_style.alignment = 1 # Center

    # Header: Title and Status
    elements.append(Paragraph(f"EVENT REPORT: {event.title.upper()}", styles['Title']))
    current_date_ist = get_ist_time().date()
    status_text = "COMPLETED" if event.date < str(current_date_ist) else "UPCOMING"
    status_color = colors.green if status_text == "COMPLETED" else colors.blue
    elements.append(Paragraph(f"<font color='{status_color}'><b>STATUS: {status_text}</b></font>", styles['Normal']))
    elements.append(Spacer(1, 12))

    # Add 1 Page Report summary if exists
    if event.description:
        elements.append(Paragraph("<b>EXECUTIVE SUMMARY (1 PAGE REPORT):</b>", styles['Heading3']))
        elements.append(Paragraph(event.description[:2000], styles['Normal'])) # Ensure it stays around 1 page
        elements.append(Spacer(1, 18))

    # Event Info Table (Two columns)
    info_data = [
        ["DATE:", f"{event.date}{' to ' + event.end_date if event.end_date else ''}"],
        ["TIME:", f"{event.time}{' - ' + event.end_time if event.end_time else ''} ({event.duration or 'N/A'})"],
        ["LOCATION:", event.location],
        ["CAPACITY:", f"{event.attendees} / {event.capacity} Registered"]
    ]
    
    info_table = Table(info_data, colWidths=[100, 350])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (0, -1), colors.whitesmoke),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 18))

    # Description Section
    elements.append(Paragraph("<b>EVENT DESCRIPTION:</b>", styles['Heading3']))
    elements.append(Paragraph(event.description, styles['Normal']))
    elements.append(Spacer(1, 18))

    # Images Section (Geo-tagged images)
    elements.append(Paragraph("<b>EVENT IMAGES (GEO-TAGGED):</b>", styles['Heading3']))
    
    # Collect all image URLs
    all_images = []
    if event.image:
        all_images.append(event.image)
    if event.images:
        for img in event.images:
            if img.url not in all_images:
                all_images.append(img.url)

    if all_images:
        image_elements = []
        for img_url in all_images[:4]: # Limit to 4 images for a one-page report
            img_data = get_image_data(img_url)
            if img_data:
                try:
                    # Create image element
                    pdf_img = Image(img_data, width=2.2*inch, height=1.5*inch)
                    
                    # Create Geo-tag label
                    geotag = Paragraph(f"📍 {event.location}", geotag_style)
                    
                    # Combine Image and Tag in a small table to act as one unit
                    img_block = Table([[pdf_img], [geotag]], colWidths=[2.2*inch])
                    img_block.setStyle(TableStyle([
                        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
                        ('TOPPADDING', (0,0), (-1,-1), 0),
                    ]))
                    image_elements.append(img_block)
                except Exception as e:
                    print(f"Could not add image {img_url} to PDF: {e}")

        if image_elements:
            # Layout images in a grid (2x2)
            grid_data = []
            row = []
            for i, img_block in enumerate(image_elements):
                row.append(img_block)
                if (i + 1) % 2 == 0:
                    grid_data.append(row)
                    row = []
            if row:
                grid_data.append(row + [None] * (2 - len(row)))
            
            image_grid = Table(grid_data, colWidths=[2.5*inch, 2.5*inch])
            image_grid.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
                ('TOPPADDING', (0,0), (-1,-1), 10),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ]))
            elements.append(image_grid)
    else:
        elements.append(Paragraph("<i>No images available for this event.</i>", styles['Normal']))
    
    elements.append(Spacer(1, 18))

    # Registered Students Table
    elements.append(Paragraph(f"<b>REGISTERED STUDENTS ({len(participants)}):</b>", styles['Heading3']))
    
    if participants:
        student_data = [["#", "Name", "Email", "Date Joined"]]
        # Limit participants to 10 for one-page report
        for i, p in enumerate(participants[:10], 1):
            student_data.append([
                str(i),
                p.user.full_name if p.user else "N/A",
                p.user.email if p.user else "N/A",
                p.registered_at.strftime("%Y-%m-%d")
            ])
        
        if len(participants) > 10:
            student_data.append(["...", f"and {len(participants)-10} more", "", ""])

        st = Table(student_data, colWidths=[30, 150, 180, 100])
        st.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#6d28d9")), # Purple
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        elements.append(st)
    else:
        elements.append(Paragraph("No students registered yet.", styles['Italic']))

    # Footer
    elements.append(Spacer(1, 24))
    elements.append(Paragraph(f"Generated on {get_ist_time().strftime('%Y-%m-%d %H:%M:%S')} (IST) | CampusEvents Management", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)
    
    filename = f"Report_{event.title.replace(' ', '_')}.pdf"
    return StreamingResponse(
        buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/events", response_model=list[schemas.EventOut])
def list_events(category_id: int = None, organizer_id: int = None, search: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Event)
    if category_id:
        query = query.filter(models.Event.category_id == category_id)
    if organizer_id:
        query = query.filter(models.Event.organizer_id == organizer_id)
    if search:
        query = query.filter((models.Event.title.ilike(f"%{search}%")) | (models.Event.description.ilike(f"%{search}%")))
    
    return query.all()


@app.get("/api/events/{event_id}", response_model=schemas.EventDetail)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.put("/api/events/{event_id}", response_model=schemas.EventOut)
def update_event(event_id: int, payload: schemas.EventUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id:
        # Check if the current user is an admin, they should be able to update any event if they are the "Global Admin"
        # or if we want to be strict, keep it as is. But usually, admins can manage everything.
        if current_user.user_type != 'admin':
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own events")
    
    # Check for conflicts on update
    def to_min(t_str):
        h, m = map(int, t_str.split(':'))
        return h * 60 + m

    new_date = payload.date or event.date
    new_time = payload.time or event.time
    new_end_time = payload.end_time if payload.end_time is not None else event.end_time
    new_location = payload.location or event.location

    new_start = to_min(new_time)
    new_end = to_min(new_end_time) if new_end_time else new_start + 60
    
    existing_events = db.query(models.Event).filter(
        models.Event.date == new_date,
        models.Event.location == new_location,
        models.Event.id != event_id
    ).all()
    
    for e in existing_events:
        e_start = to_min(e.time)
        e_end = to_min(e.end_time) if e.end_time else e_start + 60
        if new_start < e_end and new_end > e_start:
            raise HTTPException(
                status_code=400, 
                detail=f"Conflict: '{e.title}' is scheduled from {e.time} to {e.end_time or 'N/A'} in {new_location}"
            )

    if payload.title:
        event.title = payload.title
    if payload.description:
        event.description = payload.description
    if payload.date:
        event.date = payload.date
    if payload.end_date is not None:
        event.end_date = payload.end_date
    if payload.time:
        event.time = payload.time
    if payload.end_time is not None:
        event.end_time = payload.end_time
    if payload.duration is not None:
        event.duration = payload.duration
    if payload.location:
        event.location = payload.location
    if payload.category_id:
        event.category_id = payload.category_id
    if payload.capacity:
        event.capacity = payload.capacity
    if payload.image:
        event.image = payload.image
    if payload.pdf_url:
        event.pdf_url = payload.pdf_url
    if payload.website_url:
        event.website_url = payload.website_url
    if payload.is_rsvp_based is not None:
        event.is_rsvp_based = payload.is_rsvp_based
    if payload.rsvp_url is not None:
        event.rsvp_url = payload.rsvp_url
    
    if payload.images is not None:
        # Replace existing images
        db.query(models.EventImage).filter(models.EventImage.event_id == event_id).delete()
        for image_url in payload.images:
            db_image = models.EventImage(event_id=event.id, url=image_url)
            db.add(db_image)
    
    db.commit()
    db.refresh(event)
    return event


@app.delete("/api/events/{event_id}", response_model=schemas.MessageResponse)
def delete_event(event_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own events")
    
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully", "success": True}


@app.post("/api/participants", response_model=schemas.ParticipantOut, status_code=status.HTTP_201_CREATED)
def book_event(payload: schemas.ParticipantCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 0. Check if user is a student
    if current_user.user_type != 'student':
        raise HTTPException(status_code=403, detail="Only students can book events")
    
    event = db.query(models.Event).filter(models.Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.is_rsvp_based:
        raise HTTPException(status_code=400, detail="This event requires RSVP on an external site.")
    
    existing = db.query(models.Participant).filter((models.Participant.user_id == current_user.id) & (models.Participant.event_id == payload.event_id)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already registered for this event")
    
    if event.attendees >= event.capacity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event is full")
    
    participant = models.Participant(user_id=current_user.id, event_id=payload.event_id)
    db.add(participant)
    event.attendees += 1
    db.commit()
    db.refresh(participant)
    return participant


@app.get("/api/participants/user/{user_id}", response_model=list[schemas.ParticipantOut])
def get_user_events(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Participant).filter(models.Participant.user_id == user_id).all()


@app.get("/api/participants/event/{event_id}", response_model=list[schemas.ParticipantDetail])
def get_event_participants(event_id: int, db: Session = Depends(get_db)):
    return db.query(models.Participant).filter(models.Participant.event_id == event_id).all()


@app.delete("/api/participants/{participant_id}", response_model=schemas.MessageResponse)
def cancel_booking(participant_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Booking not found")
    if participant.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own bookings")
    
    event = db.query(models.Event).filter(models.Event.id == participant.event_id).first()
    if event:
        event.attendees = max(0, event.attendees - 1)
    
    db.delete(participant)
    db.commit()
    return {"message": "Booking cancelled successfully", "success": True}


@app.get("/api/admin/participants", response_model=list[schemas.ParticipantDetail])
def get_all_organizer_participants(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can access participants list")
    
    # Join Participant -> Event to filter by organizer_id
    return db.query(models.Participant).join(models.Event).filter(models.Event.organizer_id == current_user.id).all()


@app.get("/api/admin/analytics", response_model=schemas.AdminAnalytics)
def get_admin_analytics(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can access analytics")
    
    events = db.query(models.Event).filter(models.Event.organizer_id == current_user.id).all()
    total_events = len(events)
    total_attendees = sum(event.attendees for event in events)
    average_attendance = total_attendees / total_events if total_events > 0 else 0
    
    return {
        "total_events": total_events,
        "total_attendees": total_attendees,
        "average_attendance": average_attendance
    }


if __name__ == "__main__":
    import uvicorn
    import config
    uvicorn.run("main:app", host="0.0.0.0", port=config.PORT, reload=True)

