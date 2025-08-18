# NeuroVision Documentation

This directory contains comprehensive documentation for the NeuroVision project.

## Documentation Files

1. **[Project Documentation](project-documentation.md)**
   - Complete overview of the project architecture, features, and implementation

2. **[API Documentation](api-documentation.md)**
   - Detailed guide to all API endpoints, parameters, and responses
   - Authentication requirements and error codes

3. **[Authentication Documentation](authentication-documentation.md)**
   - User registration and authentication flows
   - Password reset procedures
   - Patient serial number system
   - Multiple users per email functionality

4. **[Docker Documentation](docker-documentation.md)**
   - Container setup and configuration
   - Deployment instructions
   - Environment variables and networking

5. **[Patient Serial Documentation](patient-serial-documentation.md)**
   - Details on the patient serial number implementation
   - Format and generation process
   - Display in user interfaces

6. **[Implementation Summary](implementation-summary.md)**
   - Summary of all recent changes and implementations
   - Technical details of feature implementations
   - Benefits of new features

7. **[Security Guide](security-readme.md)**
   - End-to-end security measures implemented in the project
   - Rationale, operations tips, and recommended next steps

## Recent Updates

The documentation includes information about recent system improvements:

1. **Patient Serial Number System**
   - Format: `PAT-YYYYMMDD-XXXX`
   - Unique identifiers for each patient
   - Implementation in user registration flow

2. **Non-Unique Email Support**
   - Multiple patient accounts can share the same email address
   - Each distinguished by unique serial numbers
   - Search and management via admin interface

3. **Password Reset Flow**
   - Updated secure password reset process
   - Session-independent password recovery

4. **Docker Container Setup**
   - Containerization of entire application
   - Multi-container orchestration with Docker Compose

## Accessing Documentation

The documentation files are in Markdown format and can be viewed in any Markdown reader or directly on GitHub.
