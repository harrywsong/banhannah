# ============================================
# docs/API.md
# ============================================
# API Documentation

## Base URL
```
http://localhost:3002/api
```

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

#### Change Password
```http
PUT /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

### Courses

#### Get All Courses
```http
GET /courses
Query Parameters:
  - type: free|paid
  - level: 1|2|3
  - search: string
  - featured: true|false
```

#### Get Course by ID
```http
GET /courses/:id
```

#### Create Course (Admin)
```http
POST /courses
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Form Data:
  - title: string
  - description: string
  - type: free|paid
  - price: number (if paid)
  - discountPrice: number (optional)
  - level: 1|2|3
  - duration: string
  - accessDuration: number (days)
  - previewImage: file (optional)
  - lessons: JSON string
```

#### Update Course (Admin)
```http
PUT /courses/:id
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Same as create
```

#### Delete Course (Admin)
```http
DELETE /courses/:id
Authorization: Bearer <admin-token>
```

#### Purchase Course
```http
POST /courses/:id/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "신용카드"
}
```

#### Enroll in Free Course
```http
POST /courses/:id/enroll
Authorization: Bearer <token>
```

#### Get My Courses
```http
GET /courses/my/courses
Authorization: Bearer <token>
```

#### Update Progress
```http
PUT /courses/:id/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "completedLessons": [1, 2, 3]
}
```

### Files

#### Get All Files
```http
GET /files
Query Parameters:
  - format: string
  - level: 1|2|3
  - search: string
  - featured: true|false
```

#### Get File by ID
```http
GET /files/:id
```

#### Upload File (Admin)
```http
POST /files
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Form Data:
  - file: file (required)
  - preview: image file (optional)
  - title: string
  - description: string
  - format: PDF|ZIP|DOCX|etc
  - level: 1|2|3
```

#### Update File (Admin)
```http
PUT /files/:id
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Form Data:
  - title: string
  - description: string
  - format: string
  - level: 1|2|3
  - preview: image file (optional)
  - published: boolean
  - featured: boolean
```

#### Delete File (Admin)
```http
DELETE /files/:id
Authorization: Bearer <admin-token>
```

#### Download File
```http
GET /files/download/:filename
```

### Reviews

#### Get Reviews
```http
GET /reviews/:itemType/:itemId
```

#### Create Review
```http
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Great course!",
  "itemId": 1,
  "itemType": "course"
}
```

#### Update Review
```http
PUT /reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated review"
}
```

#### Delete Review
```http
DELETE /reviews/:id
Authorization: Bearer <token>
```

## Error Responses

All endpoints may return these error responses:

```json
{
  "error": "Error message"
}
```

Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error
