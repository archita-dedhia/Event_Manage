# Python FastAPI Backend (MySQL)

This backend powers the Dark SaaS Landing Page.

Tech stack:
- Python (FastAPI)
- SQLAlchemy + PyMySQL
- MySQL 8

## 1. Requirements

- Python 3.10+ installed
- MySQL Server 8 running locally
- MySQL root password: `123456`

## 2. Setup steps

From your project root:

```bash
cd "C:\Users\Archita\OneDrive\Pictures\Design Dark SaaS Landing Page"
python -m venv .venv
.\.venv\Scripts\activate

cd backend
pip install -r requirements.txt
```

## 3. Configure MySQL connection

The backend uses `.env` in the `backend` folder:

```env
MYSQL_USER=root
MYSQL_PASSWORD=123456
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DB=saas_app
```

Make sure your MySQL service is running and that the root password is `123456`.

## 4. Create database and tables

From the `backend` folder:

```bash
python init_db.py
```

This will:
- Create the `saas_app` database if it does not exist
- Create tables:
  - `contact_messages`
  - `newsletter_subscribers`

## 5. Run the backend server

From the project root (so that `backend` is a package):

```bash
cd "C:\Users\Archita\OneDrive\Pictures\Design Dark SaaS Landing Page"
.\.venv\Scripts\activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

## 6. API endpoints

### Health

- **GET** `/health`
- Response: `{ "status": "ok" }`

### Contact form

- **POST** `/contact`
- Request JSON:

```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "company": "Optional Company",
  "message": "Hello, this is my message."
}
```

### Newsletter subscribe

- **POST** `/newsletter/subscribe`
- Request JSON:

```json
{ "email": "you@example.com" }
```

