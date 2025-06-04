# HR Management System - Backend API

Simple backend API for HR Management System, providing basic authentication functionality.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the project root with the following variables:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=hr_management
   ```

3. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Authentication

- **Register User**
  - `POST /api/register`
  - Body: `{ name, email, password, confirmPassword }`

- **Login User**
  - `POST /api/login`
  - Body: `{ email, password }`

- **Forget Password (Email Verification)**
  - `POST /api/forget-password`
  - Body: `{ email }`

- **Reset Password**
  - `POST /api/reset-password`
  - Body: `{ email, newPassword, confirmNewPassword }`

## Circles Feature

The Circles feature allows users to create and join interest groups within the company.

### Database Schema
- `circle` - Stores information about each circle
- `circle_contact` - Maps contacts (users) to circles they belong to

### API Endpoints

#### Circles
- **GET /api/circles** - Get all available circles
  - Query params: `exclude_joined=true` (optional) to exclude circles the user has already joined
- **POST /api/circles** - Create a new circle
  - Required fields: `intitule` (title), `description`
- **GET /api/circles/:id** - Get details of a specific circle
- **PUT /api/circles/:id** - Update circle details (creator only)
- **DELETE /api/circles/:id** - Delete a circle (creator only)

#### Circle Membership
- **GET /api/circles/:id/members** - Get all members of a circle
- **POST /api/circles/:id/join** - Join a circle
- **DELETE /api/circles/:id/leave** - Leave a circle

### Running Migrations
To set up the database tables for the Circles feature, run:
```
node scripts/run_circle_migration.js 