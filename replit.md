# Replit Configuration

## Overview

This is a full-stack video streaming application called "BintuNet" built with React, Express.js, and PostgreSQL. The application allows users to upload videos, configure streaming settings, and stream to multiple platforms simultaneously using FFmpeg. It features a modern UI built with shadcn/ui components and Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.
Design preferences: Clean white background with beautiful modern UI design.
Authentication: Universal access code "bintunet" for all plans and transactions.
Multi-streaming: Support for unlimited stream keys with dynamic add/remove functionality.
Video Upload: Fixed with proper MIME type handling for all video formats.
Stream Validation: Stream keys validated to accept only keys (not full URLs).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless database
- **Database ORM**: Drizzle ORM with PostgreSQL connector
- **File Handling**: Multer for video uploads (500MB limit)
- **Video Processing**: FFmpeg via child processes for streaming
- **Session Management**: Cookie-based sessions with database persistence

### Database Schema
- **Users**: Basic user authentication with username/password
- **Sessions**: Payment-based access sessions (5 hours, 12 hours, lifetime) with PostgreSQL persistence
- **Stream Sessions**: Active streaming configurations with support for multiple video files per session
- **Database Connection**: Neon serverless PostgreSQL with connection pooling

### Key Features
- Multi-step authentication flow (login → payment → dashboard)
- Video file upload with FFmpeg validation and 500MB limit
- Live streaming to multiple YouTube channels simultaneously
- Real-time stream status monitoring with 2-second polling
- Dynamic stream key management (add/remove unlimited keys)
- Stream key validation (keys only, not full URLs)
- Mobile-responsive design with mobile streaming mode
- PostgreSQL persistence for all data

## Key Components

### Authentication Flow
1. **Login Page**: Access code validation
2. **Payment Page**: Plan selection and transaction verification
3. **Dashboard**: Main streaming interface

### Streaming System
- Video upload with file type validation
- Stream key configuration for multiple platforms
- Loop video and mobile mode options
- Real-time process monitoring
- FFmpeg integration for video streaming

### UI Components
- Comprehensive component library from shadcn/ui
- Custom navigation with brand identity
- Responsive design optimized for mobile
- Toast notifications for user feedback

## Data Flow

1. **User Authentication**: Access code → Payment verification → Dashboard access
2. **Video Upload**: File selection → Server upload → FFmpeg processing
3. **Stream Configuration**: Platform setup → Stream key input → Process initiation
4. **Real-time Updates**: Status polling every 2-5 seconds for live feedback

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL serverless)
- **UI**: Radix UI components and Lucide React icons
- **Validation**: Zod for schema validation
- **File Processing**: Multer for uploads, FFmpeg for streaming

### Development Tools
- **Build**: Vite with React plugin
- **Type Checking**: TypeScript with strict configuration
- **Database Migration**: Drizzle Kit
- **Replit Integration**: Runtime error overlay and cartographer

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- Express server with TypeScript compilation via tsx
- Database schema managed through Drizzle migrations

### Production
- Frontend built to `dist/public` directory
- Backend bundled with esbuild to ES modules
- Static file serving integrated into Express app
- Environment-based configuration for database connections

### File Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── uploads/         # Video file storage
└── migrations/      # Database migrations
```

The application uses a monorepo structure with clear separation between client, server, and shared code. The build process creates a unified deployment artifact serving both the API and static frontend files.