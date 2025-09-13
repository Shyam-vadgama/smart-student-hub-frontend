# Overview

Smart Student Hub is a full-stack web application prototype designed for a competition demo. The system serves as a streamlined portal for students to showcase their achievements, for faculty to manage and verify them, and for the Head of Department (HOD) to get analytics and manage the ecosystem. The application follows a modern MERN-like architecture with a React frontend, Express.js backend, and PostgreSQL database, designed to handle user authentication, achievement management, dynamic forms, and analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend uses React with TypeScript, built with Vite for development and bundling. The architecture follows a component-based design with:
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing with role-based protected routes
- **Authentication**: Context-based authentication with JWT tokens stored in cookies

## Backend Architecture  
The backend is built with Express.js and TypeScript, featuring:
- **API Design**: RESTful endpoints organized by resource (users, achievements, forms, analytics)
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Storage**: Pluggable storage interface currently implemented with in-memory storage for compatibility, designed to work with PostgreSQL via Drizzle ORM
- **File Handling**: Multer middleware for file uploads with support for certificates and images
- **QR Code Generation**: Automatic QR code generation for achievement verification

## Data Storage
The system uses a dual approach for data persistence:
- **Primary Database**: PostgreSQL configured through Drizzle ORM with schemas defined in TypeScript
- **Fallback Storage**: In-memory storage implementation for development/compatibility
- **File Storage**: Local filesystem for uploaded certificates and generated QR codes

The database schema includes:
- Users (with roles: student, faculty, hod)
- Profiles (student-specific information)
- Achievements (with approval workflow and comments)
- Dynamic Forms (configurable forms for data collection)

## Authentication and Authorization
- **Authentication Method**: JWT tokens with 7-day expiration
- **Role-Based Access Control**: Three user roles (student, faculty, hod) with different permissions
- **Route Protection**: Frontend and backend route guards based on user roles
- **Session Management**: HTTP-only cookies for token storage

## Key Features by Role
- **Students**: Create and manage achievements, view approval status, interact with achievements
- **Faculty**: Review and approve/reject student achievements, create dynamic forms
- **HOD**: Full analytics dashboard, user management, system overview

# External Dependencies

## Core Framework Dependencies
- **Frontend**: React 18, Vite, TypeScript
- **Backend**: Express.js, Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM (@neondatabase/serverless)

## UI and Styling
- **Component Library**: Radix UI primitives
- **Styling**: Tailwind CSS with PostCSS
- **Icons**: Lucide React icons

## Data Management
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Hookform Resolvers
- **Database ORM**: Drizzle Kit for migrations and schema management

## Authentication and Security
- **JWT**: jsonwebtoken for token generation/verification
- **Password Hashing**: bcryptjs
- **File Upload**: Multer with file type validation

## Utility Libraries
- **QR Code Generation**: qrcode package
- **Styling Utilities**: clsx, class-variance-authority
- **Date Handling**: Built-in Date objects
- **Routing**: Wouter for lightweight client-side routing

## Development Tools
- **Build Tool**: Vite with React plugin
- **Type Checking**: TypeScript with strict configuration
- **Replit Integration**: Vite plugins for development banner and error overlay
- **Development Server**: Concurrent client and server execution