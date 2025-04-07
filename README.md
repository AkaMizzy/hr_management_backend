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