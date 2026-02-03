# Quick Start Guide - Study4You Backend

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Java 17+
- PostgreSQL installed and running
- Maven 3.6+

### Step 1: Create Database (Using Docker - Recommended)
Run the following command to start PostgreSQL:
```bash
docker-compose up -d
```
This will automatically create the database and user with the correct credentials.

### Step 2: Configure Database (Manual)
If you are not using Docker, edit `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/study4you
    username: study4you_user
    password: "1012004"
```
And manually create the database `study4you` in your PostgreSQL instance.

### Step 3: Run the Application
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

✅ Server starts on `http://localhost:8080`

### Step 4: Test with Postman

#### 1. Register a User
```http
POST http://localhost:8080/api/v1/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123",
  "fullName": "Test User"
}
```

#### 2. Login
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123"
}
```

**Copy the `accessToken` from the response!**

#### 3. Create a TOEIC Test
```http
POST http://localhost:8080/api/v1/toeic/tests
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json

{
  "title": "My First TOEIC Test",
  "testType": "PRACTICE",
  "skill": "LISTENING",
  "level": "EASY",
  "durationMinutes": 30,
  "active": true
}
```

#### 4. Get All Tests
```http
GET http://localhost:8080/api/v1/toeic/tests
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

## 🎯 What's Next?

- Read [README.md](README.md) for complete documentation
- Check [API_EXAMPLES.md](API_EXAMPLES.md) for more examples
- Review [walkthrough.md](../../../.gemini/antigravity/brain/9d510b56-0a63-488d-baaf-756366267476/walkthrough.md) for implementation details

## 📚 Available Endpoints

All endpoints use prefix: `/api/v1`

### Public (No Auth Required)
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

### Protected (Requires JWT Token)
- `/users` - User management
- `/roles` - Role management
- `/permissions` - Permission management
- `/toeic/tests` - TOEIC test management
- `/toeic/parts` - Test parts
- `/toeic/questions` - Questions
- `/toeic/options` - Answer options
- `/toeic/attempts` - Test attempts
- `/toeic/answers` - User answers

## 🔧 Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running
- Check username/password in `application.yml`
- Verify database `study4you` exists

### Port Already in Use
Change port in `application.yml`:
```yaml
server:
  port: 8081  # Change from 8080
```

### JWT Token Expired
- Access tokens expire in 1 hour
- Use the refresh token endpoint to get a new access token
- Or login again

## 📞 Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review error messages in the console
- Verify your request format matches the examples

---

**Ready to build your TOEIC platform!** 🎓
