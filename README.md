# 🧠 NeuroVision: Alzheimer's Detection System

A modern web-based application for early detection and monitoring of Alzheimer's disease using deep learning and medical imaging analysis.

![NeuroVision](major-project-frontend/src/assets/brain-2.png)

## 🚀 Latest Updates (July 25, 2025)

**Improved Brain MRI validation**: Reject non-MRI uploads early in the pipeline
**Robust parsing of AI responses**: Fixes JSON parsing edge cases from Python script
**Instant feedback**: Display classification results immediately without delaying for DB writes
**Admin script update**: Uses secure `ADMIN_CREATION_SECRET` (set in `.env`) and prompts for secret
**Connection fixes**: App now points to `AlzheimersDB` by default, removing old debug utilities
**Clean logging**: Removed deprecated Mongoose flags and debug scripts from the repo
**Backend optimizations**: Appointment sorting/filtering moved server-side; next appointment logic refined
**Enhanced UX**: Clearer error messages across signup, login, and prediction flows

### Previous Updates
- **Duplicate Emails Allowed**: Multiple users can now register with the same email address (accounts are uniquely identified by userId).
- **Simplified Doctor Signup**: Doctor registration now only requires name, email, and password—no specialty or manual verification needed.
- **OTP Email Verification for All**: All users (doctor, patient, admin) must verify their email via OTP before accessing their dashboard.
- **Role-based Redirects**: After OTP verification, users are redirected to the correct dashboard based on backend-verified role.
- **Resend OTP Feature**: Users can request a new OTP if needed during verification.
- **All Business Logic in Backend**: Role, verification, and redirect logic are now handled server-side for security and consistency.
- **Admin Management Scripts**: Tools for admin user creation, password reset, and admin reset included.
- **Patient Serial Numbers**: Each patient receives a unique serial number (format: PAT-YYYYMMDD-XXXX).
- **Docker Containerization**: Complete Docker setup for easy deployment.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#-tech-stack)
- [Features](#-key-features)
- [Architecture](#-architecture)
- [Installation & Setup](#-manual-installation)
- [Docker Deployment](#-docker-deployment)
- [API Documentation](#-api-documentation)
- [Authentication](#-authentication)
- [Patient Serial Number System](#-patient-serial-number-system)
- [Admin Management](#-user-management)
- [Documentation](#-documentation)
- [License](#-license)

## Project Overview

This comprehensive full-stack application implements an AI-powered Alzheimer's detection system that enables healthcare professionals and patients to:
- Upload and analyze brain MRI scans
- Get real-time AI-powered analysis
- Track patient progress over time
- Manage medical histories securely
- View results across classification categories:
  - AD: Alzheimer's Disease
  - CN: Cognitively Normal
  - MCI: Mild Cognitive Impairment

## 🚀 Tech Stack

### Frontend
- **React 18** with Vite - Modern, fast build tool and development server
- **React Router** - Client-side routing and navigation
- **Lucide React** - Beautiful, consistent icons
- **Custom Components** - Including Aurora for UI effects
- **Modern CSS3** - Flexible and responsive styling
- **JWT Authentication** - Secure user sessions

### Backend
- **Node.js & Express.js** - Fast, unopinionated web framework
- **MongoDB & Mongoose** - Flexible, scalable database
- **JWT & bcrypt** - Secure authentication and password hashing
- **PyTorch & Python** - Powerful AI model integration
- **CORS & Helmet** - Enhanced API security

## 🛠️ Key Features

### User Management
- **Multi-role Authentication**: Support for patients, doctors, and administrators
- **Patient Registration**: Includes generation of unique patient serial numbers (PAT-YYYYMMDD-XXXX format)
- **Enhanced Password Recovery**: Secure self-service password reset
- **Multiple Users per Email**: Support for caregivers managing multiple patient accounts
- **OTP Email Verification for All**: All users must verify their email via OTP before accessing their dashboard
- **Role-based Redirects**: After OTP verification, users are redirected to the correct dashboard based on backend-verified role
- **Resend OTP Feature**: Users can request a new OTP if needed during verification

### For Doctors
- Secure dashboard for patient management
- MRI scan upload and analysis
- Patient history tracking
- Diagnostic report generation
- Real-time AI analysis results
- **Simplified Signup**: Only name, email, and password required; no specialty or manual verification

### For Patients
- Personal health dashboard with serial number display
- Medical history access
- Scan result visualization
- Secure doctor communication
- Progress tracking

### For Administrators
- User management system with patient serial number support
- System monitoring tools
- Analytics dashboard
- Security audit logs
- Admin management scripts for user creation and password reset

## 🐳 Docker Deployment

### Prerequisites
- Docker and Docker Compose installed

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/neurovision.git
cd neurovision
```

2. Create a `.env` file with required variables:
```
MONGO_USERNAME=neurovision_user
MONGO_PASSWORD=secure_password
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

3. Start the containers:
```bash
docker-compose up -d
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Container Configuration

The project uses three main containers:
1. **MongoDB**: Database server
2. **Backend**: Node.js/Express API server
3. **Frontend**: React application with Nginx

The containers are orchestrated using Docker Compose as defined in `docker-compose.yml`:

```yaml
services:
  mongo:
    image: mongo:6
    container_name: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    restart: unless-stopped

  backend:
    build: ./major-project-backend
    container_name: neurovision_backend
    ports:
      - "5000:5000"
    depends_on:
      - mongo
    environment:
      - NODE_ENV=${NODE_ENV}
      - MONGODB_URI=mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:27017/neurovision?authSource=admin
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped

  frontend:
    build: ./major-project-frontend
    container_name: neurovision_frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

For more details, see [Docker Documentation](documentation/docker-documentation.md).

## 🚀 Manual Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Python (v3.8 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/neurovision.git
```

2. Frontend Setup:
```bash
cd major-project-frontend
npm install
```

3. Backend Setup:
```bash
cd ../major-project-backend
npm install
```

4. Python Dependencies:
```bash
cd python
pip install -r requirements.txt
```

5. Environment Setup:
Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/neurovision
JWT_SECRET=your-secret-key
PORT=5000
```

### Running the Application

1. Start MongoDB:
```bash
mongod
```

2. Start Backend Server:
```bash
cd major-project-backend
npm run dev
```

3. Start Frontend Development Server:
```bash
cd major-project-frontend
npm run dev
```

## 📊 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
- **URL**: `/auth/signup`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Creates a new user account with role-specific data

#### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Authenticates a user and returns a JWT token

#### Password Reset
- **URL**: `/password-reset/request`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Initiates password reset workflow via email

### User Endpoints

#### Get Current User
- **URL**: `/users/me`
- **Method**: `GET`
- **Auth Required**: Yes
- **Description**: Returns the current user's profile data

#### Update User Profile
- **URL**: `/users/me`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Description**: Updates user profile information

### MRI Scan Endpoints

#### Upload Scan
- **URL**: `/predict/upload`
- **Method**: `POST`
- **Auth Required**: Yes
- **Description**: Uploads and processes a brain MRI scan

For the complete API documentation, see the [detailed API docs](documentation/api-documentation.md).

## 👥 User Management

### Creating an Admin User

```bash
cd major-project-backend
node createAdmin.js --email admin@example.com --password securepassword --name "Admin User"
```

Follow the prompts to create a new admin user.

### Resetting Admin Password

```bash
cd major-project-backend
node resetAdmin.js --email admin@example.com --newPassword newSecurePassword
```

Follow the prompts to reset an admin's password.

### Authentication

The system implements a comprehensive authentication system supporting multiple user roles:

#### User Registration
1. User provides required information based on their role
2. System validates input and creates appropriate user record
3. For patients, a unique serial number is automatically generated
4. JWT token is issued upon successful registration

#### Password Reset Flow
1. User requests password reset via "Forgot Password?" button
2. System generates secure token and sends reset link via email
3. User sets new password through reset form
4. System verifies token validity and updates password securely

#### Multiple Users per Email
- System supports multiple accounts sharing one email address
- Each account maintains distinct credentials and access rights
- Particularly useful for caregivers managing multiple patient accounts
- **All user lookups and verification now use userId for security**

#### OTP Email Verification
- All users (doctor, patient, admin) must verify their email via OTP before accessing their dashboard
- After OTP verification, backend returns the user’s true role for correct dashboard redirect
- "Resend OTP" feature available on verification page
- All business logic (role, verification, redirect) is handled in the backend for security and consistency

## 📚 Documentation

Comprehensive documentation is available in the [documentation](documentation/) directory:

- [Project Documentation](documentation/project-documentation.md) - Complete overview of project architecture and features
- [API Documentation](documentation/api-documentation.md) - Detailed guide to all API endpoints
- [Authentication Documentation](documentation/authentication-documentation.md) - User registration and authentication flows
- [Docker Documentation](documentation/docker-documentation.md) - Container setup and configuration
- [Patient Serial Documentation](documentation/patient-serial-documentation.md) - Details on the patient serial number implementation
- [Implementation Summary](documentation/implementation-summary.md) - Summary of recent changes and implementations

## 🏗 Architecture

The project follows a modern client-server architecture:

1. **Frontend**: React-based single page application
2. **Backend**: Node.js/Express.js REST API
3. **Database**: MongoDB for data persistence
4. **Analysis Engine**: Python-based deep learning model for MRI analysis
5. **Container Support**: Docker-based deployment for all components

## 🔒 Security Features

- JWT-based authentication and authorization
- Secure password hashing with bcrypt
- MongoDB session management
- Role-based access control (RBAC)
- CORS protection
- Request rate limiting
- Secure file upload handling
- XSS protection

## 📋 Patient Serial Number System

### Format and Generation
- Each patient receives a unique serial number in the format: `PAT-YYYYMMDD-XXXX`
  - `PAT-` - Fixed prefix identifying a patient record
  - `YYYYMMDD` - Registration date in YYYYMMDD format
  - `XXXX` - Random alphanumeric suffix (4 characters)
- Example: `PAT-20250515-A4F2`

### Technical Implementation
```javascript
function generatePatientSerial() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PAT-${date}-${rand}`;
}
```

### Display
- Serial numbers are displayed in the patient profile card
- Visible in the admin dashboard patient list
- Included in all patient-related reports and exports

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices

## 🚀 Getting Started

### Using Convenience Scripts

For quick startup, use the provided convenience script:

```bash
start-project.cmd
```

This script will:
1. Start MongoDB server if needed
2. Install any missing dependencies
3. Start the backend server
4. Start the frontend development server
5. Open the application in your default browser

### Clean-up

To clean up test files and temporary data:

```bash
cleanup.cmd
```

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Contact

For any queries regarding this project, please contact:
- Name: Sourabh Parui
- Email: paruisourabh4622@gmail.com
- GitHub: [saurav4622](https://github.com/saurav4622)

---

© 2025 NeuroVision Team. All rights reserved.
