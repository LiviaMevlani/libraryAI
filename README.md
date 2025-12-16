# Library AI

A full-stack library management system with AI-powered natural language query capabilities, role-based access control, and intelligent book recommendations. Built with Flask, React, MySQL, and Docker.

##  Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [AI Component Design](#ai-component-design)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Future Improvements](#future-improvements)
- [Disclaimer](#disclaimer)

##  Project Overview

Library AI is a comprehensive library management application that enables users to manage their personal book collections with advanced features including natural language queries, AI-generated insights, and personalized recommendations. The system implements robust security measures, role-based access control, and a clean layered architecture for maintainability and scalability.

### Key Highlights

- **Natural Language Processing**: Ask questions in plain English about library data
- **AI-Powered Insights**: Get personalized reading habit summaries and analytics
- **Smart Recommendations**: Receive book suggestions based on reading history and genre preferences
- **Role-Based Access Control**: Separate interfaces and permissions for regular users and administrators
- **Security First**: Protection against SQL injection, XSS, and prompt injection attacks
- **Production Ready**: Docker containerization with MySQL, backend, frontend, and Adminer

## Features

### User Features
- **Authentication & Authorization**
  - User registration with strong password validation
  - Secure JWT-based authentication
  - Password hashing using Werkzeug

- **Personal Library Management**
  - Create, read, update, and delete books
  - Track book metadata: title, author, genre, price, pages, reading status
  - Filter books by genre and reading status (planned/reading/completed)
  - URL-based filtering with query parameters

- **AI Assistant**
  - Natural language queries: "Who owns the most books?", "Which is the most popular book?", "Show the five most expensive books"
  - Intent detection with rule-based keyword parsing
  - Formatted table and summary results

- **AI Recommendations**
  - Genre-based recommendations from reading history
  - Collaborative filtering (books from other users with similar preferences)
  - Fallback strategies for new users
  - AI-generated explanations for recommendations

- **Reading Insights**
  - Personalized reading habit summaries
  - Genre distribution analysis
  - Reading status tracking
  - Page count statistics (average, min, max, total)
  - Price analytics
  - Favorite genre identification

### Admin Features
- **User Management**
  - View all users
  - Create new users
  - Update user details (name, email, role)
  - Promote/demote users between "user" and "admin" roles
  - Delete users (with cascade deletion of associated books)

- **Global Book Management**
  - View all books across all users
  - Delete any book
  - System-wide analytics

##  Tech Stack

### Backend
- **Framework**: Flask 3.1.2
- **ORM**: SQLAlchemy 2.0.36
- **Database ORM**: Flask-SQLAlchemy 3.1.1
- **Database Migrations**: Flask-Migrate 4.1.0
- **Authentication**: Flask-JWT-Extended 4.7.1
- **CORS**: Flask-CORS 6.0.0
- **Database Driver**: PyMySQL 1.1.2
- **Cryptography**: cryptography 46.0.3
- **Password Security**: Werkzeug 3.1.4
- **Testing**: Pytest 9.0.2
- **Language**: Python 3.11+

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.10.1
- **HTTP Client**: Axios 1.13.2
- **State Management**: TanStack React Query 5.90.12
- **Language**: JavaScript (ES6+)

### Database
- **RDBMS**: MySQL 8.0

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Admin**: Adminer

## �� Architecture

```
┌─────────────────┐
│   React Frontend │  (Port 5173 - Host)
│   (Vite + React) │  (Production build served via preview)
└────────┬────────┘
         │ HTTP/REST API
         │ (JWT Authentication)
┌────────▼────────┐
│  Flask Backend  │  (Port 5001 - Host)
│   (REST API)    │
└────────┬────────┘
         │ SQLAlchemy ORM
┌────────▼────────┐
│   MySQL Database│  (Port 3307 Host → 3306 Container)
│   (library_db)  │
└─────────────────┘
```

**Port Mapping Notes**:
- **Frontend**: Host port 5173 → Container port 5173 (serves production build)
- **Backend**: Host port 5001 → Container port 5001
- **MySQL**: Host port 3307 → Container port 3306 (internal)
- **Adminer**: Host port 8080 → Container port 8080
```

### Backend Architecture (Layered)

The backend follows a clean layered architecture pattern:

```
Routes Layer (API Endpoints)
    ↓
Services Layer (Business Logic)
    ↓
Repositories Layer (Data Access)
    ↓
Models Layer (SQLAlchemy ORM)
    ↓
Database (MySQL)
```

#### Layer Responsibilities

1. **Routes Layer** (`backend/routes/`)
   - HTTP request handling
   - Request validation
   - JWT authentication middleware
   - Response formatting
   - Blueprints: `auth_routes`, `book_routes`, `admin_routes`, `ai_routes`

2. **Services Layer** (`backend/services/`)
   - Business logic implementation
   - Data validation
   - Error handling
   - Cross-cutting concerns
   - Services: `auth_service`, `book_service`, `admin_service`, `ai_service`

3. **Repositories Layer** (`backend/repositories/`)
   - Database abstraction
   - CRUD operations
   - Query building
   - Repositories: `user_repo`, `book_repo`

4. **Models Layer** (`backend/models.py`)
   - SQLAlchemy model definitions
   - Database relationships
   - Model methods and properties

### Frontend Architecture

- **Component-Based**: Feature-based organization (`features/`)
- **Context API**: Authentication state management (`AuthContext`)
- **React Query**: Server state management and caching
- **Protected Routes**: Route guards for authentication and authorization
- **API Layer**: Centralized HTTP client with JWT token injection

### AI Component Architecture

The AI component implements a secure, multi-stage pipeline:

```
User Input (Natural Language)
    ↓
Input Sanitization (XSS/SQL Injection Prevention)
    ↓
Intent Parsing (Rule-Based Keyword Matching)
    ↓
Intent Validation (Allow-List Check)
    ↓
Structured Query Execution (SQLAlchemy ORM)
    ↓
Result Formatting & Authorization Check
    ↓
JSON Response
```

##  AI Component Design

### Design Principles

1. **Security First**: Never execute raw SQL from user input
2. **Intent-Based**: Natural language → structured intent → allow-listed queries
3. **Authorization**: Admin sees all data; users see only their own
4. **Explainability**: Results include scope information and reasoning
5. **Robustness**: Comprehensive error handling and input validation

### Natural Language Query Processing

#### Supported Queries

- **Owner with Most Books**
  - Patterns: "Who owns the most books?", "biggest book collector", "user with most books"
  - Intent: `owner_with_most_books`
  - Returns: User details and book count

- **Most Popular Book**
  - Patterns: "Which is the most popular book?", "most read book", "favorite book"
  - Intent: `most_popular_book`
  - Returns: Book title, occurrence count, example details

- **Five Most Expensive Books**
  - Patterns: "Show the five most expensive books", "top 5 expensive", "costliest books"
  - Intent: `five_most_expensive_books`
  - Returns: List of books with price information

#### Security Measures

1. **Input Sanitization**
   - Removes dangerous characters (`<>"';\\`)
   - Length limits (max 500 characters)
   - Whitespace normalization

2. **Intent Validation**
   - Allow-list of permitted intents (`ALLOWED_INTENTS`)
   - Rejects unrecognized queries
   - No dynamic SQL generation

3. **SQL Injection Prevention**
   - All queries use SQLAlchemy ORM
   - Parameterized queries only
   - No string concatenation for SQL

4. **XSS Prevention**
   - Input sanitization removes HTML/script tags
   - Frontend escapes user-generated content

5. **Authorization**
   - Admin users: Global queries across all data
   - Regular users: Queries limited to own books
   - Scope information included in responses

### Recommendation Engine

- **Strategy 1**: User preference (genre-based from reading history)
- **Strategy 2**: Most popular genre (fallback for new users)
- **Strategy 3**: Collaborative filtering (books from other users)
- **Features**: Excludes user's own books, includes AI-generated explanations

### Insights Generation

- **Reading Summary**: Natural language summary of reading habits
- **Metrics**: Total books, average pages, total pages, average price
- **Distributions**: Genre distribution, reading status distribution
- **Trends**: Favorite genre, page range, comparison to overall library

### Evaluation Criteria

#### Functionality 
- Supports all three required query types
- Handles edge cases (no books, empty results)
- Provides fallback strategies for recommendations
- Generates comprehensive insights

#### Usability 
- Clear error messages
- Formatted table outputs
- Scope indicators (admin vs user view)
- Loading states and error handling

#### Security 
- Input sanitization
- Intent allow-listing
- SQL injection prevention
- XSS prevention
- Authorization checks
- Test coverage for malicious inputs

#### Explainability 
- Intent-based architecture (transparent)
- Scope information in responses
- Recommendation reasoning
- Insight summaries in natural language

#### Test Coverage 
- Unit tests for intent parsing
- Security tests for malicious inputs
- Authorization tests
- Integration tests for full query flow

## Database Schema

### User Model

```python
class User(db.Model):
    id: Integer (Primary Key)
    name: String(120) (Required)
    email: String(120) (Unique, Indexed, Required)
    password_hash: String(256) (Required)
    role: String(20) (Default: "user")
    created_at: DateTime (Default: UTC now)
    
    # Relationships
    books: One-to-Many relationship with Book (Cascade Delete)
```

### Book Model

```python
class Book(db.Model):
    id: Integer (Primary Key)
    title: String(255) (Required, Indexed)
    author: String(255)
    genre: String(100)
    price: Numeric(10, 2)
    pages: Integer
    reading_status: String(50)  # planned, reading, completed
    user_id: Integer (Foreign Key → users.id, Required)
    created_at: DateTime (Default: UTC now)
    
    # Relationships
    owner: Many-to-One relationship with User (backref)
```

### Relationships

- **User → Books**: One-to-Many (one user has many books)
- **Book → User**: Many-to-One (each book belongs to one user)
- **Cascade Delete**: When a user is deleted, all their books are automatically deleted

##  Getting Started

### Prerequisites

**This application can ONLY be run using Docker and Docker Compose.** Local development setup is not supported. Ensure you have:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (for cloning the repository)

To verify your installation:
```bash
docker --version
docker-compose --version
```

### Docker-Only Setup

**Important**: This application is designed to run exclusively in Docker containers. All services (frontend, backend, database) must be started using Docker Compose. Local development without Docker is not supported.

**Note**: The frontend is built for production and served using Vite's preview server. For development changes, rebuild the frontend container.

#### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd library-ai
```

#### Step 2: Start All Services

Start all services (MySQL, backend, frontend, and Adminer) using Docker Compose:

```bash
docker-compose up --build
```

This command will:
- Build Docker images for backend and frontend
- Start MySQL database container (internal port 3306, mapped to host port 3307)
- Start Flask backend container (port 5001)
- Build and start React frontend container (production build, port 5173)
- Start Adminer (database administration tool, port 8080)

**Note**: The first run may take a few minutes as Docker downloads base images and builds the application containers. The frontend container builds the React app for production during the Docker build process.

#### Step 3: Run Database Migrations

In a new terminal window, run database migrations to create the initial schema:

```bash
docker-compose exec backend flask db upgrade
```

This creates the `users` and `books` tables in the MySQL database.

#### Step 4: Create Admin User (Optional)

To create an admin user, you can either:

**Option A**: Register through the frontend and then promote the user via Adminer or API
**Option B**: Use the Flask shell to create an admin user directly:

```bash
docker-compose exec backend flask shell
```

Then in the Python shell:
```python
from models import User, db
from werkzeug.security import generate_password_hash

admin = User(
    name="Admin User",
    email="admin@example.com",
    password_hash=generate_password_hash("SecurePassword123!"),
    role="admin"
)
db.session.add(admin)
db.session.commit()
exit()
```

#### Step 5: Access the Application

Once all containers are running, access the application at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **API Health Check**: http://localhost:5001/api/health
- **Adminer (Database Admin)**: http://localhost:8080
  - Server: `mysql`
  - Username: `root`
  - Password: `password`
  - Database: `library_db`

### Database Persistence

The MySQL database data is persisted using Docker volumes. The `mysql_data` volume stores all database files, so your data will persist even if you stop and restart the containers.

**To view volumes:**
```bash
docker volume ls
```

**To backup the database:**
```bash
docker-compose exec mysql mysqldump -u root -ppassword library_db > backup.sql
```

**To restore the database:**
```bash
docker-compose exec -T mysql mysql -u root -ppassword library_db < backup.sql
```

### Stopping the Application

To stop all services:
```bash
docker-compose down
```

To stop and remove volumes (⚠️ **WARNING**: This deletes all database data):
```bash
docker-compose down -v
```

### Viewing Logs

View logs from all services:
```bash
docker-compose logs -f
```

View logs from a specific service:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Troubleshooting

**Port already in use:**
If you get port conflict errors, ensure ports 3307, 5001, 5173, and 8080 are not in use by other applications.

**Database connection errors:**
Ensure MySQL container is fully started before backend starts. Wait a few seconds after `docker-compose up` and check logs:
```bash
docker-compose logs mysql
```

**Frontend can't connect to backend:**
Verify both containers are running:
```bash
docker-compose ps
```

**Frontend changes not reflecting:**
The frontend is built for production. To see changes, rebuild the frontend container:
```bash
docker-compose up --build frontend
```

**Reset everything:**
To completely reset the application (⚠️ **WARNING**: Deletes all data):
```bash
docker-compose down -v
docker-compose up --build
docker-compose exec backend flask db upgrade
```

## Running Tests

### Backend Tests (Docker)

All tests must be run inside the Docker backend container:

**Run all tests:**
```bash
docker-compose exec backend pytest
```

**Run specific test file:**
```bash
docker-compose exec backend pytest tests/test_ai.py
docker-compose exec backend pytest tests/test_auth.py
docker-compose exec backend pytest tests/test_books.py
```

**Run with coverage:**
```bash
docker-compose exec backend pytest --cov=. --cov-report=html
```

**Run with verbose output:**
```bash
docker-compose exec backend pytest -v
```

### Test Structure

- `tests/test_auth.py`: Authentication and user registration tests
- `tests/test_books.py`: Book CRUD operations tests
- `tests/test_ai.py`: AI query, recommendations, and insights tests (including security tests)

### Test Coverage

- **Unit Tests**: Service layer logic, intent parsing, input sanitization
- **Integration Tests**: Full API endpoint flows
- **Security Tests**: SQL injection, XSS, prompt injection, malicious inputs
- **Authorization Tests**: Admin vs user access control

##  Environment Variables

### Backend Environment Variables

| Variable | Description | Default (Docker) |
|----------|-------------|------------------|
| `DATABASE_URL` | MySQL connection string | `mysql+pymysql://root:password@mysql:3306/library_db` |
| `SECRET_KEY` | Flask secret key for sessions | `dev-secret-key` |
| `JWT_SECRET_KEY` | Secret key for JWT token signing | `jwt-secret-key` |

**Note**: In Docker, the `DATABASE_URL` uses `mysql` as the hostname (Docker service name), not `localhost`. The MySQL container exposes port 3306 internally, which is mapped to port 3307 on the host machine.

### Frontend Environment Variables

| Variable | Description | Default (Docker) |
|----------|-------------|------------------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5001/api` |

### Docker Compose Environment

Environment variables are set in `docker-compose.yml`. For production, use a `.env` file or secrets management.

**Important**: The frontend Dockerfile builds the application for production and serves it using `npm run preview`. The frontend container does not run a development server.

## API Endpoints

### Health Check (`/api`)

- `GET /api/health` - Health check endpoint (returns `{"status": "ok"}`)

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires JWT)

### Books (`/api/books`)

- `GET /api/books/` - Get user's books (supports `?genre=` and `?status=` filters)
- `POST /api/books/` - Create new book (requires JWT)
- `PUT /api/books/<id>` - Update book (requires JWT)
- `DELETE /api/books/<id>` - Delete book (requires JWT)

### Admin (`/api/admin`)

- `GET /api/admin/users` - Get all users (requires admin JWT)
- `POST /api/admin/users` - Create new user (requires admin JWT)
- `PATCH /api/admin/users/<id>` - Update user (requires admin JWT)
- `DELETE /api/admin/users/<id>` - Delete user (requires admin JWT)
- `GET /api/admin/books` - Get all books (requires admin JWT)
- `DELETE /api/admin/books/<id>` - Delete any book (requires admin JWT)

### AI (`/api/ai`)

- `POST /api/ai/query` - Natural language query (requires JWT)
  - Body: `{ "question": "Who owns the most books?" }`
- `GET /api/ai/recommendations` - Get book recommendations (requires JWT)
- `GET /api/ai/insights` - Get reading insights (requires JWT)

## Future Improvements

### AI Enhancements
- [ ] Integration with LLM APIs (OpenAI, Ollama) for more natural query understanding
- [ ] Advanced collaborative filtering algorithms
- [ ] Sentiment analysis of reading preferences
- [ ] Book cover image recognition and metadata extraction

### Features
- [ ] Book search and advanced filtering
- [ ] Reading progress tracking with dates
- [ ] Book reviews and ratings
- [ ] Export library data (CSV, JSON)
- [ ] Book wishlist functionality
- [ ] Social features (share libraries, follow users)

### Technical
- [ ] API rate limiting
- [ ] Caching layer (Redis)
- [ ] WebSocket support for real-time updates
- [ ] GraphQL API option
- [ ] Microservices architecture migration
- [ ] Kubernetes deployment configuration
- [ ] CI/CD pipeline setup
- [ ] Performance monitoring and logging

### Security
- [ ] OAuth2 integration (Google, GitHub)
- [ ] Two-factor authentication (2FA)
- [ ] API key management for external integrations
- [ ] Enhanced audit logging

##  Disclaimer

This project is developed for educational and portfolio purposes. While it implements security best practices and follows industry standards, it should be thoroughly reviewed and tested before use in production environments. The AI component uses rule-based intent parsing and does not rely on external LLM APIs, making it suitable for demonstration and learning purposes.

**Academic/Portfolio Use**: This project demonstrates full-stack development skills, AI integration, security awareness, and software engineering best practices. It is suitable for inclusion in portfolios, academic submissions, and technical demonstrations.


## 👥 Contributors

Livia Mevlani 

##  Contact

GitHub: https://github.com/LiviaMevlani

