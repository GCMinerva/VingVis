# API Routes Documentation

All authentication and data operations are now handled through RESTful API endpoints.

## Authentication Endpoints

### POST `/api/auth/signup`
Create a new user account with profile.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "ftcTeamName": "Team Awesome" (optional),
  "ftcTeamId": "12345" (optional)
}
```

**Response:**
```json
{
  "user": { ... },
  "session": { ... }
}
```

### POST `/api/auth/signin`
Sign in an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { ... },
  "session": { ... }
}
```

### POST `/api/auth/signout`
Sign out the current user.

**Response:**
```json
{
  "success": true
}
```

### POST `/api/auth/reset-password`
Send password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET `/api/auth/session`
Get current user session.

**Response:**
```json
{
  "session": { ... },
  "user": { ... }
}
```

## Project Endpoints

All project endpoints require authentication via `Authorization: Bearer <token>` header.

### GET `/api/projects`
Get all projects for the current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "project_hash": "abc123",
      "name": "My Robot Project",
      "template_type": "omni-wheel",
      "motor_config": { "fl": "frontLeft", ... },
      "workflow_data": { "nodes": [], "edges": [] },
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/projects`
Create a new project (max 3 per user).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "My Robot Project",
  "templateType": "omni-wheel",
  "motorConfig": {
    "fl": "frontLeft",
    "fr": "frontRight",
    "bl": "backLeft",
    "br": "backRight"
  },
  "projectHash": "abc123def456"
}
```

**Response:**
```json
{
  "project": { ... }
}
```

### GET `/api/projects/[projecthash]`
Get a specific project by hash.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "project": { ... }
}
```

### PUT `/api/projects/[projecthash]`
Update project workflow data.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "workflowData": {
    "nodes": [...],
    "edges": [...]
  }
}
```

**Response:**
```json
{
  "project": { ... }
}
```

### DELETE `/api/projects/[projecthash]`
Delete a project.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true
}
```

## User Endpoints

### GET `/api/user/profile`
Get the current user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "ftc_team_name": "Team Awesome",
    "ftc_team_id": "12345",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid auth)
- `500` - Internal Server Error

## Usage in Frontend

The authentication context (`lib/auth-context.tsx`) already uses these API routes:

```typescript
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const { user, signIn, signUp, signOut } = useAuth()

  // Sign up
  await signUp(email, password, username, ftcTeamName, ftcTeamId)

  // Sign in
  await signIn(email, password)

  // Sign out
  await signOut()
}
```

For project operations, you can either:
1. Use the API routes directly with fetch
2. Use Supabase client (recommended, as it has Row Level Security enabled)

## Notes

- All authentication routes use Supabase Auth under the hood
- Project routes include authorization checks to ensure users can only access their own data
- Row Level Security (RLS) policies are enabled in the database for additional security
- The 3-project limit is enforced server-side in the POST `/api/projects` endpoint
