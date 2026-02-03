# Study4You Backend - API Examples

## Example Request/Response for Each Module

### 1. Authentication

#### Register
**Request:**
```json
POST /api/v1/auth/register

{
  "email": "student@university.edu",
  "password": "SecurePass123",
  "fullName": "John Student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjM0NTY3OC05MGFiLWNkZWYtMTIzNC01Njc4OTBhYmNkZWYiLCJyb2xlcyI6W10sInBlcm1pc3Npb25zIjpbXSwic3ViIjoic3R1ZGVudEB1bml2ZXJzaXR5LmVkdSIsImlhdCI6MTcwNzAwMDAwMCwiZXhwIjoxNzA3MDAzNjAwfQ.signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdHVkZW50QHVuaXZlcnNpdHkuZWR1IiwiaWF0IjoxNzA3MDAwMDAwLCJleHAiOjE3MDcwODY0MDB9.signature",
    "tokenType": "Bearer",
    "userId": "12345678-90ab-cdef-1234-567890abcdef",
    "email": "student@university.edu",
    "fullName": "John Student",
    "roles": [],
    "permissions": []
  }
}
```

### 2. User Management

#### Create User with Roles
**Request:**
```json
POST /api/v1/users
Authorization: Bearer {accessToken}

{
  "email": "teacher@university.edu",
  "password": "TeacherPass123",
  "fullName": "Jane Teacher",
  "status": "ACTIVE",
  "roleIds": ["role-uuid-here"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user-uuid-here",
    "email": "teacher@university.edu",
    "fullName": "Jane Teacher",
    "status": "ACTIVE",
    "roles": [
      {
        "id": "role-uuid-here",
        "name": "TEACHER",
        "description": "Teacher role with test management permissions",
        "permissions": [
          {
            "id": "permission-uuid-here",
            "name": "MANAGE_TESTS",
            "pageAllow": ["/tests", "/tests/create", "/tests/edit"],
            "createdAt": "2024-02-03T10:00:00",
            "updatedAt": "2024-02-03T10:00:00"
          }
        ],
        "createdAt": "2024-02-03T10:00:00",
        "updatedAt": "2024-02-03T10:00:00"
      }
    ],
    "createdAt": "2024-02-03T10:00:00",
    "updatedAt": "2024-02-03T10:00:00"
  }
}
```

### 3. Role Management

#### Create Role with Permissions
**Request:**
```json
POST /api/v1/roles
Authorization: Bearer {accessToken}

{
  "name": "STUDENT",
  "description": "Student role with limited access",
  "permissionIds": ["permission-uuid-1", "permission-uuid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "id": "role-uuid-here",
    "name": "STUDENT",
    "description": "Student role with limited access",
    "permissions": [
      {
        "id": "permission-uuid-1",
        "name": "VIEW_TESTS",
        "pageAllow": ["/tests", "/tests/view"],
        "createdAt": "2024-02-03T10:00:00",
        "updatedAt": "2024-02-03T10:00:00"
      },
      {
        "id": "permission-uuid-2",
        "name": "TAKE_TESTS",
        "pageAllow": ["/tests/take", "/tests/submit"],
        "createdAt": "2024-02-03T10:00:00",
        "updatedAt": "2024-02-03T10:00:00"
      }
    ],
    "createdAt": "2024-02-03T10:00:00",
    "updatedAt": "2024-02-03T10:00:00"
  }
}
```

### 4. Permission Management

#### Create Permission
**Request:**
```json
POST /api/v1/permissions
Authorization: Bearer {accessToken}

{
  "name": "MANAGE_USERS",
  "pageAllow": ["/users", "/users/create", "/users/edit", "/users/delete"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission created successfully",
  "data": {
    "id": "permission-uuid-here",
    "name": "MANAGE_USERS",
    "pageAllow": ["/users", "/users/create", "/users/edit", "/users/delete"],
    "createdAt": "2024-02-03T10:00:00",
    "updatedAt": "2024-02-03T10:00:00"
  }
}
```

### 5. TOEIC Test Management

#### Create TOEIC Test
**Request:**
```json
POST /api/v1/toeic/tests
Authorization: Bearer {accessToken}

{
  "title": "TOEIC Listening Practice Test 1",
  "testType": "PRACTICE",
  "skill": "LISTENING",
  "level": "EASY",
  "durationMinutes": 30,
  "active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test created successfully",
  "data": {
    "id": "test-uuid-here",
    "title": "TOEIC Listening Practice Test 1",
    "testType": "PRACTICE",
    "skill": "LISTENING",
    "level": "EASY",
    "durationMinutes": 30,
    "active": true,
    "createdAt": "2024-02-03T10:00:00",
    "updatedAt": "2024-02-03T10:00:00"
  }
}
```

#### Get All Tests (Paginated)
**Request:**
```
GET /api/v1/toeic/tests?page=0&size=10&sortBy=createdAt&sortDir=DESC
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": "test-uuid-1",
        "title": "TOEIC Full Test 1",
        "testType": "FULL_TEST",
        "skill": "LISTENING",
        "level": "MEDIUM",
        "durationMinutes": 45,
        "active": true,
        "createdAt": "2024-02-03T10:00:00",
        "updatedAt": "2024-02-03T10:00:00"
      },
      {
        "id": "test-uuid-2",
        "title": "TOEIC Reading Mini Test",
        "testType": "MINI_TEST",
        "skill": "READING",
        "level": "EASY",
        "durationMinutes": 20,
        "active": true,
        "createdAt": "2024-02-03T09:00:00",
        "updatedAt": "2024-02-03T09:00:00"
      }
    ],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 2,
    "totalPages": 1,
    "last": true
  }
}
```

### 6. Error Responses

#### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "email": "Email should be valid",
    "password": "Password must be at least 6 characters"
  }
}
```

#### Resource Not Found
```json
{
  "success": false,
  "message": "User not found with id: '12345678-90ab-cdef-1234-567890abcdef'",
  "data": null
}
```

#### Authentication Error
```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null
}
```

#### Bad Request
```json
{
  "success": false,
  "message": "Email already exists",
  "data": null
}
```

## Testing Workflow

1. **Register a user** → Get JWT tokens
2. **Create permissions** → Define page access
3. **Create roles** → Assign permissions to roles
4. **Assign roles to users** → Grant access
5. **Create TOEIC tests** → Add test content
6. **Take tests** → Record attempts and answers

## Postman Collection

You can import these examples into Postman for easy testing. Make sure to:
1. Set the base URL as an environment variable: `{{baseUrl}} = http://localhost:8080/api/v1`
2. Store the access token after login: `{{accessToken}}`
3. Use `Bearer {{accessToken}}` in the Authorization header for protected endpoints
