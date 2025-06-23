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

### Leave Requests (Congé)

The Leave Request feature allows employees to request time off, which must be approved by their manager and HR.

#### API Endpoints

- **Create Leave Request**
  - `POST /api/conges`
  - Body: `{ date_debut, date_fin, nombre_jours, id_employe }`

- **Get Employee Leave Requests**
  - `GET /api/conges/employee/:employeId`

- **Get Manager Leave Requests**
  - `GET /api/conges/manager/:managerId`

- **Get HR Leave Requests**
  - `GET /api/conges/hr`

- **Get Specific Leave Request**
  - `GET /api/conges/:id`

- **Manager Validation**
  - `POST /api/conges/:id/validate/manager`
  - Body: `{ is_approved, manager_id, annulable, justifier (if rejected) }`

- **HR Validation**
  - `POST /api/conges/:id/validate/hr`
  - Body: `{ is_approved, justifier (if rejected) }`

- **Cancel Leave Request**
  - `POST /api/conges/:id/cancel`
  - Body: `{ employee_id }`

#### Database Tables
- `demande_conge` - Stores leave request information
- `conge_validations` - Records validation decisions for each leave request

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