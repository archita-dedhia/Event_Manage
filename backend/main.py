import os
import shutil
from fastapi import Depends, FastAPI, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .database import get_db
from . import models, schemas


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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
async def upload_file(file: UploadFile = File(...)):
    try:
        # Create a unique filename to avoid collisions
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the URL to access the file
        return {"url": f"http://localhost:8000/uploads/{file.filename}", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not upload file: {str(e)}")


@app.post("/api/users/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Prevent anyone from self-registering as admin via the public endpoint
    if payload.user_type == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be created via signup",
        )
    
    user = models.User(
        email=payload.email,
        password=payload.password, # Store plain text as requested
        full_name=payload.full_name,
        user_type=payload.user_type
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/users/login", response_model=schemas.LoginResponse)
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email, password, or role",
        )
    
    if user.password != payload.password: # Plain text comparison
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
    
    return {"success": True, "user": user, "message": "Login successful"}


@app.get("/api/users/{user_id}", response_model=schemas.UserDetail)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/api/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        # Check if email is already taken by another user
        existing = db.query(models.User).filter(models.User.email == payload.email, models.User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = payload.email
    if payload.password is not None:
        user.password = payload.password # Store as plain text as requested earlier
        
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/categories", response_model=schemas.CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: schemas.CategoryCreate, db: Session = Depends(get_db)):
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
def create_event(payload: schemas.EventCreate, organizer_id: int, db: Session = Depends(get_db)):
    organizer = db.query(models.User).filter(models.User.id == organizer_id).first()
    if not organizer or organizer.user_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create events")
    
    # Check for time conflict: no 2 events at the same time/date
    conflict = db.query(models.Event).filter(
        models.Event.date == payload.date,
        models.Event.time == payload.time
    ).first()
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Conflict: Event '{conflict.title}' is already scheduled at {payload.date} {payload.time}"
        )
    
    category = db.query(models.Category).filter(models.Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    event = models.Event(
        title=payload.title,
        description=payload.description,
        date=payload.date,
        time=payload.time,
        location=payload.location,
        category_id=payload.category_id,
        organizer_id=organizer_id,
        capacity=payload.capacity,
        image=payload.image,
        pdf_url=payload.pdf_url
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


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
def update_event(event_id: int, payload: schemas.EventUpdate, organizer_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != organizer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own events")
    
    # Check for time conflict on update
    new_date = payload.date or event.date
    new_time = payload.time or event.time
    conflict = db.query(models.Event).filter(
        models.Event.date == new_date,
        models.Event.time == new_time,
        models.Event.id != event_id
    ).first()
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Conflict: Event '{conflict.title}' is already scheduled at {new_date} {new_time}"
        )
    
    if payload.title:
        event.title = payload.title
    if payload.description:
        event.description = payload.description
    if payload.date:
        event.date = payload.date
    if payload.time:
        event.time = payload.time
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
    
    db.commit()
    db.refresh(event)
    return event


@app.delete("/api/events/{event_id}", response_model=schemas.MessageResponse)
def delete_event(event_id: int, organizer_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != organizer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own events")
    
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully", "success": True}


@app.post("/api/participants", response_model=schemas.ParticipantOut, status_code=status.HTTP_201_CREATED)
def book_event(payload: schemas.ParticipantCreate, user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    event = db.query(models.Event).filter(models.Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    existing = db.query(models.Participant).filter((models.Participant.user_id == user_id) & (models.Participant.event_id == payload.event_id)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already registered for this event")
    
    if event.attendees >= event.capacity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event is full")
    
    participant = models.Participant(user_id=user_id, event_id=payload.event_id)
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
def cancel_booking(participant_id: int, user_id: int, db: Session = Depends(get_db)):
    participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Booking not found")
    if participant.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own bookings")
    
    event = db.query(models.Event).filter(models.Event.id == participant.event_id).first()
    if event:
        event.attendees = max(0, event.attendees - 1)
    
    db.delete(participant)
    db.commit()
    return {"message": "Booking cancelled successfully", "success": True}


@app.get("/api/admin/participants/{organizer_id}", response_model=list[schemas.ParticipantDetail])
def get_all_organizer_participants(organizer_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == organizer_id).first()
    if not user or user.user_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can access participants list")
    
    # Join Participant -> Event to filter by organizer_id
    return db.query(models.Participant).join(models.Event).filter(models.Event.organizer_id == organizer_id).all()

