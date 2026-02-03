# Study4You Backend - TOEIC Practice Platform

A complete Spring Boot backend for a TOEIC practice website - University Graduation Project.

## 📋 Project Overview

- **Domain**: TOEIC practice (Listening & Reading only)
- **Type**: Academic graduation project
- **Framework**: Spring Boot 3.2.0
- **Database**: PostgreSQL
- **Security**: JWT Authentication
- **API**: RESTful with `/api/v1` prefix

## 🛠️ Tech Stack

- **Language**: Java 17
- **Framework**: Spring Boot 3.2.0
- **Build Tool**: Maven
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA (Hibernate)
- **Security**: Spring Security + JWT
- **Validation**: Jakarta Validation

## 📦 Features

### Authentication & Authorization
- ✅ JWT-based authentication (Access + Refresh tokens)
- ✅ User registration and login
- ✅ Role-based access control (RBAC)
- ✅ Permission management with page-level access

### User Management
- ✅ Full CRUD for Users, Roles, and Permissions
- ✅ Many-to-many relationships
- ✅ Password encryption with BCrypt
- ✅ User status management

### TOEIC Domain
- ✅ Test management (Full Test, Mini Test, Practice)
- ✅ Part management (PART_1 to PART_7)
- ✅ Question and Option management
- ✅ Test attempt tracking
- ✅ Answer recording and scoring

## 🚀 Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+

### Database Setup

1. Install PostgreSQL
2. Create a database:
```sql
CREATE DATABASE study4you;
```

3. Update credentials in `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/study4you
    username: your_username
    password: your_password
```

### Running the Application

1. Clone the repository
```bash
cd backend
```

2. Build the project
```bash
mvn clean install
```

3. Run the application
```bash
mvn spring-boot:run
```

The server will start on `http://localhost:8080`

## 📚 API Documentation

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "userId": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "roles": ["USER"],
    "permissions": ["READ_TESTS"]
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### User Management Endpoints

#### Get All Users (Paginated)
```http
GET /users?page=0&size=10&sortBy=createdAt&sortDir=DESC
Authorization: Bearer {accessToken}
```

#### Get User by ID
```http
GET /users/{id}
Authorization: Bearer {accessToken}
```

#### Create User
```http
POST /users
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "fullName": "Jane Doe",
  "status": "ACTIVE",
  "roleIds": ["role-uuid-1", "role-uuid-2"]
}
```

#### Update User
```http
PUT /users/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "updated@example.com",
  "fullName": "Jane Updated",
  "status": "ACTIVE",
  "roleIds": ["role-uuid-1"]
}
```

#### Delete User
```http
DELETE /users/{id}
Authorization: Bearer {accessToken}
```

### Role Management Endpoints

#### Get All Roles
```http
GET /roles?page=0&size=10
Authorization: Bearer {accessToken}
```

#### Create Role
```http
POST /roles
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "ADMIN",
  "description": "Administrator role",
  "permissionIds": ["permission-uuid-1", "permission-uuid-2"]
}
```

### Permission Management Endpoints

#### Get All Permissions
```http
GET /permissions?page=0&size=10
Authorization: Bearer {accessToken}
```

#### Create Permission
```http
POST /permissions
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "MANAGE_TESTS",
  "pageAllow": ["/tests", "/tests/create", "/tests/edit"]
}
```

### TOEIC Test Endpoints

#### Get All Tests
```http
GET /toeic/tests?page=0&size=10&sortBy=createdAt&sortDir=DESC
Authorization: Bearer {accessToken}
```

#### Get Test by ID
```http
GET /toeic/tests/{id}
Authorization: Bearer {accessToken}
```

#### Create Test
```http
POST /toeic/tests
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "TOEIC Full Test 1",
  "testType": "FULL_TEST",
  "skill": "LISTENING",
  "level": "MEDIUM",
  "durationMinutes": 45,
  "active": true
}
```

#### Update Test
```http
PUT /toeic/tests/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "TOEIC Full Test 1 - Updated",
  "testType": "FULL_TEST",
  "skill": "LISTENING",
  "level": "HARD",
  "durationMinutes": 45,
  "active": true
}
```

#### Delete Test
```http
DELETE /toeic/tests/{id}
Authorization: Bearer {accessToken}
```

## 📊 Database Schema

### Core Tables
- `users` - User accounts
- `roles` - User roles
- `permissions` - Access permissions
- `user_roles` - User-Role junction table
- `role_permissions` - Role-Permission junction table

### TOEIC Tables
- `toeic_tests` - TOEIC tests
- `toeic_parts` - Test parts (1-7)
- `toeic_questions` - Questions
- `toeic_options` - Answer options
- `toeic_attempts` - User test attempts
- `toeic_answers` - User answers

## 🔐 Security

- All endpoints except `/auth/**` require JWT authentication
- Passwords are encrypted using BCrypt
- JWT tokens include user ID, roles, and permissions
- Access token expires in 1 hour
- Refresh token expires in 24 hours

## 🧪 Testing with Postman

1. Register a new user via `/api/v1/auth/register`
2. Login via `/api/v1/auth/login` to get JWT tokens
3. Use the `accessToken` in the Authorization header:
   ```
   Authorization: Bearer {your-access-token}
   ```
4. Test all CRUD operations on Users, Roles, Permissions, and TOEIC Tests

## 📁 Project Structure

```
backend/
├── src/main/java/com/study4you/
│   ├── Study4YouApplication.java
│   ├── auth/                    # Authentication module
│   │   ├── controller/
│   │   ├── dto/
│   │   └── service/
│   ├── common/                  # Shared components
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── enums/
│   │   └── exception/
│   ├── config/                  # Configuration
│   │   └── SecurityConfig.java
│   ├── security/                # Security components
│   │   ├── JwtUtil.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── CustomUserDetailsService.java
│   ├── user/                    # User module
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   └── service/
│   ├── role/                    # Role module
│   ├── permission/              # Permission module
│   └── toeic/                   # TOEIC domain
│       ├── test/
│       ├── part/
│       ├── question/
│       ├── option/
│       ├── attempt/
│       └── answer/
└── src/main/resources/
    └── application.yml
```

## 🎓 For Graduation Project

This backend is designed as a complete, production-like system suitable for a university graduation project:

- ✅ Clean architecture with clear separation of concerns
- ✅ RESTful API design
- ✅ Proper security implementation
- ✅ Database relationships and constraints
- ✅ Input validation
- ✅ Error handling
- ✅ Pagination support
- ✅ Easy to explain and demonstrate

## 📝 Notes

- The project uses Spring Boot 3.2.0 with Java 17
- All API responses follow a standard format with `success`, `message`, and `data` fields
- Pagination is supported on all list endpoints
- CORS is configured for React frontend (ports 3000 and 5173)
- The `pageAllow` field in permissions is stored as JSONB in PostgreSQL

## 🤝 Integration with Frontend

This backend is ready to integrate with a ReactJS frontend. The API follows RESTful conventions and returns JSON responses. CORS is pre-configured for common React development ports.

## 📧 Contact

For questions about this graduation project, please contact your project supervisor.

---

**Study4You** - TOEIC Practice Platform Backend  
*University Graduation Project 2024*
