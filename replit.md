# Overview

This is a household task management application built with React and Express. The app helps families and households organize tasks, track time spent on chores, and manage weekly goals. 

## Two-Tier Authentication System
- **Admins**: Full authentication via Replit Auth - can create households, manage members, and approve time logs
- **Members**: Guest access with only name + invite code - can join households, log time, and complete tasks

Users can create or join households using invite codes, assign tasks to household members, log time spent on activities, and track progress toward weekly time targets.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth using OpenID Connect with Passport.js
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware with standardized error responses

## Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon serverless PostgreSQL
- **Schema**: Defined in shared schema file with Zod validation schemas
- **Migrations**: Drizzle Kit for database migrations

## Key Data Models
- **Users**: Profile information, household membership, and weekly time targets
- **Households**: Groups with invite codes for joining
- **Tasks**: Assignable items with estimated time and deadlines
- **Time Logs**: Records of time spent on activities with approval workflow

## Authentication & Authorization
- **Provider**: Replit Auth for admin authentication
- **Guest System**: Session-based authentication for members using invite codes only
- **Sessions**: Server-side sessions stored in PostgreSQL for both auth types
- **Authorization**: Role-based access (admin/member) within households
- **Security**: HTTP-only cookies with secure settings
- **Routes**: /guest for member onboarding, /api/login for admin authentication

## Development Features
- **Hot Reload**: Vite development server with HMR
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Code Sharing**: Shared schema and types between client and server
- **Development Tools**: Runtime error overlays and development banners

# External Dependencies

## Core Technologies
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: Authentication service integration
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management
- **Tailwind CSS**: Utility-first CSS framework

## Development Tools
- **Vite**: Frontend build tool and development server
- **Drizzle Kit**: Database migration tool
- **ESBuild**: Backend bundling for production
- **TypeScript**: Type checking across the entire stack

## UI Libraries
- **Shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library
- **React Hook Form**: Form handling and validation
- **Date-fns**: Date manipulation utilities