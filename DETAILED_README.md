# CampusEvents - Event Management Platform
## Comprehensive Project Documentation

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Frontend Components](#frontend-components)
5. [Backend Structure](#backend-structure)
6. [Database Models](#database-models)
7. [API Endpoints](#api-endpoints)
8. [Setup Instructions](#setup-instructions)
9. [Project Structure](#project-structure)
10. [Key Features](#key-features)

---

## 🎯 Project Overview

**CampusEvents** is a full-stack, modern SaaS event management platform designed for campus/institutional environments. It provides a comprehensive solution for organizing, managing, and attending campus events with role-based access control, file management, and real-time event tracking.

### Target Users:
- **Students**: Browse, register for, and manage event participation
- **Admin/Organizers**: Create, edit, and manage campus events with advanced features
- **Guests**: Browse upcoming events publicly without authentication

### Core Functionality:
- Event creation and management with time-conflict detection
- User authentication with JWT-based authorization
- Event registration and participant tracking
- File management (images and PDFs)
- Responsive Dark SaaS UI design
- Real-time event status updates
- Role-based dashboard views

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│  - Vite Build Tool                                   │
│  - Tailwind CSS Styling                              │
│  - Radix UI Components                               │
│  - React Router Navigation                           │
│  - Context API for State Management                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP/REST API
                   │ (CORS Enabled)
                   │
┌──────────────────▼──────────────────────────────────┐
│              Backend (FastAPI)                       │
│  - RESTful API Endpoints                             │
│  - JWT Authentication                                │
│  - File Upload/Management                            │
│  - PDF Report Generation                             │
│  - CORS Middleware                                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ SQL Queries (SQLAlchemy ORM)
                   │
┌──────────────────▼──────────────────────────────────┐
│            MySQL Database (v8)                       │
│  - Users Table                                       │
│  - Events Table                                      │
│  - Categories Table                                  │
│  - Participants Table                                │
│  - EventImages Table                                 │
└──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         File System (Static Assets)                  │
│  - Uploaded Images                                   │
│  - Event PDFs                                        │
│  - Generated Reports                                 │
└─────────────────────────────────────────────────────┘
```

### Data Flow:

1. **User Interaction** → Frontend (React)
2. **API Request** → Backend (FastAPI) via HTTP/REST
3. **Business Logic** → Authentication, Validation, Processing
4. **Database Operations** → SQLAlchemy ORM → MySQL
5. **Response** → JSON data back to Frontend
6. **File Management** → Static files served from `/uploads` directory

---

## 🛠️ Technology Stack

### **Frontend Stack**

#### Core Framework & Build Tools:
- **React 18+**: Modern JavaScript library for building user interfaces
- **Vite**: Lightning-fast build tool and development server
  - Faster cold start
  - Instant module hot replacement (HMR)
  - Optimized production builds
- **Node.js & npm**: JavaScript runtime and package manager

#### UI Framework & Components:
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Unstyled, accessible component primitives (v1.x)
  - Accordion, Alert Dialog, Avatar, Badge, Breadcrumb
  - Button, Calendar, Card, Carousel
  - Checkbox, Collapsible, Context Menu, Dialog, Drawer
  - Dropdown Menu, Form Controls, Hover Card, Input OTP
  - Label, Menubar, Navigation Menu, Pagination, Popover
  - Progress, Radio Group, Select, Slider, Switch
  - Tabs, Tooltip, and more
- **Lucide React**: Beautiful, consistent SVG icon library (0.487.0)
- **Material-UI (MUI)**: Material Design components (v7.3.5)
  - Icons: @mui/icons-material (7.3.5)
  - Core: @mui/material (7.3.5)

#### State Management & Routing:
- **React Router**: Client-side routing for multi-page navigation
- **React Context API**: Built-in state management for authentication
- **AuthContext**: Custom context for user authentication state

#### Utilities & Libraries:
- **date-fns (3.6.0)**: Modern date utility library
- **clsx (2.1.1)**: Utility for constructing className strings
- **class-variance-authority (0.7.1)**: CSS-in-JS variant library
- **cmdk (1.1.1)**: Command menu component
- **embla-carousel-react (8.6.0)**: Carousel component
- **input-otp (1.4.2)**: OTP input component
- **motion (12.23.24)**: Animation library
- **next-themes (0.4.6)**: Theme management
- **@emotion/react & @emotion/styled**: CSS-in-JS library
- **sonner**: Toast notification library

#### Development:
- **@vitejs/plugin-react**: React plugin for Vite
- **@tailwindcss/vite**: Tailwind CSS integration with Vite
- **PostCSS**: CSS transformation tool

---

### **Backend Stack**

#### Framework & Server:
- **FastAPI**: Modern, fast web framework for building APIs
  - Automatic OpenAPI/Swagger documentation
  - Type hints with Pydantic
  - Built-in validation and serialization
- **Uvicorn**: ASGI web server for running FastAPI applications
  - Production-ready performance
  - Supports hot-reload in development

#### Database & ORM:
- **SQLAlchemy (2.x)**: Powerful Python ORM
  - Database-agnostic queries
  - Relationship management
  - Query construction and optimization
- **PyMySQL**: Pure Python MySQL driver
  - No external dependencies
  - Compatible with SQLAlchemy

#### Database:
- **MySQL 8**: Relational database management system
  - ACID compliance
  - Full-text search capabilities
  - JSON data type support

#### Authentication & Security:
- **python-jose[cryptography]**: JWT token creation and verification
  - Token encoding/decoding
  - Cryptographic operations
- **passlib[bcrypt]**: Password hashing library
  - bcrypt algorithm for secure password storage
  - Password verification

#### File Management:
- **python-multipart**: Parsing of form data and file uploads
- **Pillow**: Python Imaging Library for image processing
- **reportlab**: PDF generation library
  - Create PDFs programmatically
  - Tables, images, text styling

#### Environment & Utilities:
- **python-dotenv**: Environment variable management
  - Load `.env` files
  - Configuration management
- **requests**: HTTP library for making API calls
- **Pydantic**: Data validation and settings management

---

## 🎨 Frontend Components

### **Page Components** (`src/app/pages/`)

#### 1. **LandingPage.jsx**
- Hero section with platform introduction
- Feature showcase for different user types
- Call-to-action buttons for login/signup
- Responsive design for all screen sizes

#### 2. **LoginPage.jsx**
- Email/password input fields with validation
- "Remember me" functionality
- Link to signup page
- Error message display
- JWT token handling on login success

#### 3. **SignUpPage.jsx**
- Registration form with fields:
  - Email (unique validation)
  - Password (with strength indicator)
  - Full Name
  - Department/Organization
  - User type selection (Student/Admin)
- Form validation and error handling
- Moodle ID optional field

#### 4. **StudentDashboard.jsx**
- My Events section (registered events)
- Upcoming Events section (available to register)
- Event filtering and search
- Quick registration
- Profile access

#### 5. **AdminDashboard.jsx**
- Create Event button
- Manage Events section with CRUD operations
- Participant tracking and list view
- Time-conflict validation
- Event statistics

#### 6. **PastEventsPage.jsx**
- Historical events display
- Event archive browsing
- Attendance tracking
- Event details and images

#### 7. **AllParticipantsPage.jsx**
- Participant list for admin
- Search and filter participants
- Export participant data
- Participant statistics

#### 8. **ProfilePage.jsx**
- User information display
- Edit profile functionality
- Change password
- Account preferences
- Logout option

#### 9. **ErrorPage.jsx**
- 404 Not Found error display
- Error message formatting
- Navigation back to home

### **Feature Components** (`src/app/components/`)

#### 1. **GoogleCalendar.jsx**
- Google Calendar integration
- Event synchronization
- Calendar view of events
- Multi-calendar support

#### 2. **Figma Components** (`components/figma/`)

   **FullScreenSlideshow.jsx**:
   - Full-screen image carousel
   - Event photo gallery
   - Navigation controls
   - Responsive image scaling

   **ImageWithFallback.jsx**:
   - Image loading with fallback
   - Placeholder display
   - Error handling for broken images
   - Lazy loading support

### **UI Components Library** (`src/app/components/ui/`)

A comprehensive collection of reusable, accessible Radix UI-based components:

- **accordion.jsx** - Collapsible content sections
- **alert-dialog.jsx** - Alert confirmation dialogs
- **alert.jsx** - Alert notifications
- **aspect-ratio.jsx** - Maintains aspect ratio containers
- **avatar.jsx** - User profile pictures with initials fallback
- **badge.jsx** - Status and category badges
- **breadcrumb.jsx** - Navigation breadcrumbs
- **button.jsx** - Styled button component
- **calendar.jsx** - Date picker calendar
- **card.jsx** - Container card component
- **carousel.jsx** - Image/content carousel with Embla
- **chart.jsx** - Data visualization components
- **checkbox.jsx** - Checkbox input
- **collapsible.jsx** - Expand/collapse content
- **context-menu.jsx** - Right-click context menus
- **dialog.jsx** - Modal dialogs
- **drawer.jsx** - Side drawer/modal
- **dropdown-menu.jsx** - Dropdown selection menus
- **form.jsx** - Form components and validation
- **hover-card.jsx** - Hover tooltip cards
- **input-otp.jsx** - One-time password input
- **input.jsx** - Text input field
- **label.jsx** - Form labels
- **menubar.jsx** - Application menu bar
- **navigation-menu.jsx** - Navigation menu structure
- **pagination.jsx** - Page navigation
- **popover.jsx** - Popover tooltips
- **progress.jsx** - Progress bars
- **radio-group.jsx** - Radio button groups
- **resizable.jsx** - Resizable panes
- **scroll-area.jsx** - Custom scrollable areas
- **select.jsx** - Select dropdown
- **separator.jsx** - Visual separator line
- **sheet.jsx** - Bottom sheet modal
- **sidebar.jsx** - Application sidebar
- **skeleton.jsx** - Loading skeleton placeholders
- **slider.jsx** - Range slider input
- **sonner.jsx** - Toast notifications
- **switch.jsx** - Toggle switch
- **table.jsx** - Data table component
- **tabs.jsx** - Tab navigation
- **textarea.jsx** - Multi-line text input
- **toggle-group.jsx** - Toggle button groups
- **toggle.jsx** - Single toggle button
- **tooltip.jsx** - Tooltip overlays
- **use-mobile.js** - Custom hook for mobile detection
- **utils.js** - Utility functions (cn for className merging)

### **Context & State Management** (`src/app/context/`)

**AuthContext.jsx**:
- User authentication state management
- Login/logout functionality
- Token storage and retrieval
- Current user information
- Protected route wrapper

### **Data & Configuration** (`src/app/data/`)

**eventImages.js**:
- Event image constants
- Image URL mappings
- Fallback image paths

**mockData.js**:
- Mock event data for development
- Sample participant data
- Test data for UI development

### **Routing Configuration** (`src/app/routes.jsx`)
- Route definitions for all pages
- Protected routes (requires authentication)
- Public routes (no authentication required)
- Route parameters and dynamic routing

### **Main App Component** (`src/app/App.jsx`)
- Root application component
- Context provider setup
- Router configuration
- Global layout wrapper

### **Styling** (`src/styles/`)

**index.css**:
- Global CSS styles
- Base element styling
- CSS variables

**fonts.css**:
- Font imports and definitions
- Typography system

**tailwind.css**:
- Tailwind CSS directives
- Custom color schemes
- Dark mode configuration

**theme.css**:
- Dark SaaS theme colors
- Color palette definitions
- Theme variables

---

## 🗄️ Backend Structure

### **Main Entry Point** (`backend/main.py`)
- FastAPI application initialization
- CORS middleware configuration
- Static file mounting for uploads
- Route registration
- Authentication middleware setup
- Health check endpoint

### **Models** (`backend/models.py`)

#### **User Model**:
```python
- id: Primary Key
- email: Unique email address
- password: Hashed password (bcrypt)
- full_name: User's full name
- moodle_id: Optional Moodle integration ID
- department: User's department
- user_type: 'student' or 'admin'
- created_at: Timestamp (IST timezone)
- updated_at: Timestamp (IST timezone)
- Relationships: events_created, participations
```

#### **Category Model**:
```python
- id: Primary Key
- name: Unique category name
- description: Category description
- created_at: Timestamp
- Relationships: events (one-to-many)
```

#### **Event Model**:
```python
- id: Primary Key
- title: Event title
- description: Event description
- date: Start date (YYYY-MM-DD)
- end_date: Optional end date
- time: Start time (HH:MM)
- end_time: Optional end time
- duration: Event duration (e.g., "2 hours")
- location: Event location
- category_id: Foreign key to Category
- organizer_id: Foreign key to User (admin)
- capacity: Maximum participant count
- attendees: Current attendee count
- image: Event image identifier/URL
- pdf_url: Event PDF document URL
- website_url: Optional event website link
- is_rsvp_based: RSVP flag
- rsvp_url: Optional external RSVP URL
- created_at: Timestamp
- updated_at: Timestamp
- Relationships: category, organizer, participants, images
- Property: category_name (computed)
```

#### **Participant Model**:
```python
- id: Primary Key
- user_id: Foreign key to User
- event_id: Foreign key to Event
- registered_at: Registration timestamp
- status: 'registered', 'attended', 'cancelled'
- Relationships: user, event
```

#### **EventImage Model**:
```python
- id: Primary Key
- event_id: Foreign key to Event
- image_url: Image URL/path
- alt_text: Alternative text for accessibility
- created_at: Timestamp
- Relationships: event
```

### **Schemas** (`backend/schemas.py`)
Pydantic models for request/response validation:
- UserSchema: User data validation
- EventSchema: Event data validation
- CategorySchema: Category validation
- ParticipantSchema: Participant data validation
- EventCreateSchema: Event creation request
- LoginSchema: Login credentials

### **Database** (`backend/database.py`)
- SQLAlchemy engine configuration
- Database session management
- Connection pooling
- Session dependency injection for routes

### **Authentication Utilities** (`backend/auth_utils.py`)
- JWT token creation
- JWT token verification
- Password hashing (bcrypt)
- Password verification
- Token payload extraction

### **Configuration** (`backend/config.py`)
- Environment variable loading
- Database connection settings
- API configuration
- CORS settings
- JWT configuration

### **Database Initialization** (`backend/init_db.py`)
- Create all database tables
- Initialize default categories
- Database migration script

---

## 📊 Database Models

### **Database Schema Diagram**

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (PK)         │
│ email           │ ← UNIQUE
│ password        │
│ full_name       │
│ moodle_id       │
│ department      │
│ user_type       │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │
    ┌────┴────────────┐
    │                 │
    ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ EVENTS       │   │ PARTICIPANTS │
├──────────────┤   ├──────────────┤
│ id (PK)      │   │ id (PK)      │
│ title        │   │ user_id (FK) │
│ description  │   │ event_id(FK) │
│ date         │   │ registered_at│
│ end_date     │   │ status       │
│ time         │   └──────────────┘
│ end_time     │
│ duration     │
│ location     │
│ capacity     │
│ attendees    │
│ image        │
│ pdf_url      │
│ website_url  │
│ is_rsvp_based│
│ rsvp_url     │
│ organizer_id │ ← FK to USERS
│ category_id  │ ← FK to CATEGORIES
│ created_at   │
│ updated_at   │
└──────────────┘

┌─────────────────┐
│  CATEGORIES     │
├─────────────────┤
│ id (PK)         │
│ name            │ ← UNIQUE
│ description     │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│  EVENT_IMAGES   │
├─────────────────┤
│ id (PK)         │
│ event_id (FK)   │
│ image_url       │
│ alt_text        │
│ created_at      │
└─────────────────┘
```

### **Relationships**:
- **User → Events (1:M)**: One user (admin) creates many events
- **User → Participants (1:M)**: One user participates in many events
- **Event → Category (M:1)**: Many events belong to one category
- **Event → Participants (1:M)**: One event has many participants
- **Event → EventImages (1:M)**: One event has many images
- **Participant → User (M:1)**: Many participations link to one user
- **Participant → Event (M:1)**: Many participations link to one event

---

## 📡 API Endpoints

### **Authentication Endpoints**

```
POST   /api/users/signup          - Register new user
POST   /api/users/login           - Login and get JWT token
POST   /api/users/logout          - Logout user
POST   /api/users/refresh-token   - Refresh JWT token
GET    /api/users/profile         - Get current user profile
PUT    /api/users/profile         - Update user profile
POST   /api/users/change-password - Change password
```

### **Event Endpoints**

```
GET    /api/events                - Get all events (paginated)
GET    /api/events/{id}           - Get event details
POST   /api/events                - Create new event (admin only)
PUT    /api/events/{id}           - Update event (admin only)
DELETE /api/events/{id}           - Delete event (admin only)
GET    /api/events/{id}/participants - Get event participants
GET    /api/events/past           - Get past events
GET    /api/events/upcoming       - Get upcoming events
GET    /api/events/search         - Search events
```

### **Participant Endpoints**

```
POST   /api/participants/{event_id}  - Register for event
DELETE /api/participants/{event_id}  - Cancel registration
GET    /api/participants/{event_id}  - Get participants list
PUT    /api/participants/{id}        - Update participant status
```

### **Category Endpoints**

```
GET    /api/categories            - Get all categories
GET    /api/categories/{id}       - Get category details
POST   /api/categories            - Create category (admin only)
PUT    /api/categories/{id}       - Update category (admin only)
DELETE /api/categories/{id}       - Delete category (admin only)
```

### **File Management Endpoints**

```
POST   /api/upload                - Upload file (image/PDF)
GET    /uploads/{filename}        - Download/view uploaded file
DELETE /api/files/{id}            - Delete uploaded file
```

### **Report Endpoints**

```
GET    /api/reports/event/{id}    - Generate event report PDF
GET    /api/reports/participants  - Generate participants report
```

### **Health & Status Endpoints**

```
GET    /health                    - Health check
GET    /api/status                - API status
GET    /docs                      - Swagger documentation
GET    /redoc                     - ReDoc documentation
```

---

## 🚀 Setup Instructions

### **Prerequisites**

**System Requirements**:
- Windows 10/11, macOS, or Linux
- 4GB RAM minimum
- 500MB disk space

**Software Required**:
- **Node.js 16+** (https://nodejs.org/)
- **Python 3.10+** (https://www.python.org/)
- **MySQL Server 8** (https://dev.mysql.com/downloads/)
- **Git** (https://git-scm.com/)

### **Backend Setup**

1. **Navigate to project root**:
   ```bash
   cd "c:\Users\Archita\OneDrive\Pictures\Design Dark SaaS Landing Page"
   ```

2. **Create Python virtual environment**:
   ```bash
   python -m venv .venv
   ```

3. **Activate virtual environment**:
   ```bash
   # Windows:
   .\.venv\Scripts\activate
   
   # macOS/Linux:
   source .venv/bin/activate
   ```

4. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

5. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

6. **Configure environment variables**:
   Create `.env` file in `backend/` folder:
   ```env
   MYSQL_USER=root
   MYSQL_PASSWORD=123456
   MYSQL_HOST=127.0.0.1
   MYSQL_PORT=3306
   MYSQL_DB=saas_app
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

7. **Ensure MySQL is running**:
   ```bash
   # Windows (if MySQL is installed as service):
   net start MySQL80
   ```

8. **Initialize database**:
   ```bash
   python init_db.py
   ```

9. **Start FastAPI server**:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

   Server will be available at: `http://127.0.0.1:8000`
   - Swagger Docs: `http://127.0.0.1:8000/docs`
   - ReDoc Docs: `http://127.0.0.1:8000/redoc`

### **Frontend Setup**

1. **Open new terminal and navigate to frontend**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

   Frontend will be available at: `http://localhost:5173`

4. **Build for production**:
   ```bash
   npm run build
   ```

   Built files will be in `frontend/dist/`

### **Database Setup**

1. **Create MySQL database** (if not auto-created):
   ```sql
   CREATE DATABASE saas_app;
   CREATE USER 'root'@'localhost' IDENTIFIED BY '123456';
   GRANT ALL PRIVILEGES ON saas_app.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Run database initialization**:
   ```bash
   cd backend
   python init_db.py
   ```

3. **Verify database**:
   ```bash
   mysql -u root -p123456
   USE saas_app;
   SHOW TABLES;
   ```

---

## 📁 Project Structure

```
Design Dark SaaS Landing Page/
├── README.md                          # Main project README
├── DETAILED_README.md                 # This comprehensive documentation
├── test_db.py                         # Database testing script
│
├── backend/                           # FastAPI Backend
│   ├── __init__.py
│   ├── main.py                        # FastAPI app & routes
│   ├── models.py                      # SQLAlchemy ORM models
│   ├── schemas.py                     # Pydantic schemas
│   ├── database.py                    # Database configuration
│   ├── auth_utils.py                  # JWT & password utilities
│   ├── config.py                      # Configuration settings
│   ├── init_db.py                     # Database initialization
│   ├── requirements.txt               # Python dependencies
│   ├── README-backend.md              # Backend documentation
│   │
│   ├── backend/                       # Nested backend directory
│   │   └── uploads/                   # User uploaded files
│   │
│   └── uploads/                       # File storage directory
│       ├── event_images/              # Event images
│       └── event_pdfs/                # Event PDF documents
│
├── frontend/                          # React Frontend
│   ├── package.json                   # Node dependencies
│   ├── vite.config.js                 # Vite configuration
│   ├── postcss.config.mjs             # PostCSS configuration
│   ├── tailwind.config.js             # Tailwind configuration (if exists)
│   ├── index.html                     # HTML entry point
│   ├── build_log.txt                  # Build output log
│   ├── build_output.txt               # Build results
│   ├── ATTRIBUTIONS.md                # Component attributions
│   │
│   ├── src/
│   │   ├── main.jsx                   # React app entry point
│   │   │
│   │   ├── app/
│   │   │   ├── App.jsx                # Root component
│   │   │   ├── routes.jsx             # Route definitions
│   │   │   │
│   │   │   ├── pages/                 # Page components
│   │   │   │   ├── LandingPage.jsx
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── SignUpPage.jsx
│   │   │   │   ├── StudentDashboard.jsx
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── ProfilePage.jsx
│   │   │   │   ├── PastEventsPage.jsx
│   │   │   │   ├── AllParticipantsPage.jsx
│   │   │   │   └── ErrorPage.jsx
│   │   │   │
│   │   │   ├── components/            # Reusable components
│   │   │   │   ├── GoogleCalendar.jsx
│   │   │   │   │
│   │   │   │   ├── figma/             # Figma-exported components
│   │   │   │   │   ├── FullScreenSlideshow.jsx
│   │   │   │   │   └── ImageWithFallback.jsx
│   │   │   │   │
│   │   │   │   └── ui/                # Radix UI components
│   │   │   │       ├── accordion.jsx
│   │   │   │       ├── button.jsx
│   │   │   │       ├── card.jsx
│   │   │   │       ├── dialog.jsx
│   │   │   │       ├── form.jsx
│   │   │   │       ├── input.jsx
│   │   │   │       ├── select.jsx
│   │   │   │       └── [50+ UI components]
│   │   │   │
│   │   │   ├── context/               # State management
│   │   │   │   └── AuthContext.jsx
│   │   │   │
│   │   │   └── data/                  # Mock data & constants
│   │   │       ├── mockData.js
│   │   │       └── eventImages.js
│   │   │
│   │   └── styles/                    # Global styling
│   │       ├── index.css
│   │       ├── fonts.css
│   │       ├── tailwind.css
│   │       └── theme.css
│   │
│   └── dist/                          # Built frontend (generated)
│
└── uploads/                           # Root upload directory
    ├── event_images/                  # Event image storage
    └── event_pdfs/                    # Event PDF storage
```

---

## ✨ Key Features

### **User Features**

#### Guest Access:
- Browse all upcoming events
- View event details (description, date, location)
- View event images and PDFs
- Search and filter events by category, date, location
- No registration required

#### Student Features:
- User registration and login
- Personal profile management
- Event registration/booking
- View registered events in dashboard
- Cancel event registration
- View event history
- Download event materials
- Search events by various filters
- RSVP functionality

#### Admin Features:
- Admin dashboard with analytics
- Create new events with:
  - Title, description, date/time
  - Location and capacity management
  - Category selection
  - Image and PDF uploads
  - Time-conflict detection
  - RSVP link support
- Edit event details
- Delete events
- View participant list with search/filter
- Participant status tracking
- Generate participant reports
- Export data

### **Technical Features**

#### Security:
- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention (SQLAlchemy ORM)
- Role-based access control (RBAC)
- Protected API endpoints

#### File Management:
- Image upload and storage
- PDF upload and streaming
- File download capability
- MIME type validation
- File size limits

#### Database:
- Relational database design
- Data integrity with foreign keys
- Timezone-aware timestamps (IST)
- Database migrations support
- Connection pooling

#### API:
- RESTful API design
- Automatic API documentation (Swagger)
- Consistent error handling
- Request validation (Pydantic)
- Response serialization
- CORS enabled

#### Frontend:
- Responsive design (Mobile, Tablet, Desktop)
- Dark SaaS theme
- Accessible components (Radix UI)
- Real-time form validation
- Loading states and error handling
- Image lazy loading
- Progressive enhancement

#### Performance:
- Vite fast builds
- Code splitting
- Tree shaking
- Database query optimization
- API response caching opportunities
- Static file compression

---

## 🔧 Development Workflow

### **Local Development**

1. **Start MySQL**:
   ```bash
   net start MySQL80
   ```

2. **Terminal 1 - Backend**:
   ```bash
   cd backend
   .\.venv\Scripts\activate
   uvicorn main:app --reload
   ```

3. **Terminal 2 - Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access Applications**:
   - Frontend: http://localhost:5173
   - Backend API: http://127.0.0.1:8000
   - API Docs: http://127.0.0.1:8000/docs

### **API Testing**

Use Swagger UI at: `http://127.0.0.1:8000/docs`
- Interactive API testing
- Request/response examples
- Parameter validation

### **Database Testing**

```python
# Run test_db.py for database verification
python test_db.py
```

---

## 📦 Dependencies Summary

### **Frontend Dependencies**: 40+ packages
- React & Vite ecosystem
- Radix UI components (50+ components)
- Tailwind CSS utilities
- Material Design icons
- Utility libraries (date-fns, clsx, etc.)

### **Backend Dependencies**: 11 packages
- FastAPI & Uvicorn
- SQLAlchemy & PyMySQL
- Authentication (passlib, python-jose)
- File handling (pillow, reportlab)
- Utilities (python-dotenv, requests)

---

## 🐛 Troubleshooting

### **Backend Issues**

**MySQL connection error**:
- Verify MySQL is running: `net start MySQL80`
- Check credentials in `.env`
- Ensure database exists: `python init_db.py`

**Port already in use**:
```bash
# Use different port:
uvicorn main:app --reload --port 8001
```

### **Frontend Issues**

**Node modules not installed**:
```bash
npm install
```

**Port 5173 in use**:
```bash
npm run dev -- --port 5174
```

### **Database Issues**

**Tables not created**:
```bash
cd backend
python init_db.py
```

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Guide](https://docs.sqlalchemy.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Vite Guide](https://vitejs.dev/)

---

## 📝 License

MIT License - See LICENSE file for details

---

**Last Updated**: April 2026  
**Project Version**: 1.0.0  
**Status**: Production Ready
