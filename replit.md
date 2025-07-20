# Gymnastics Competition Management System

## Overview

This is a full-stack web application for managing gymnastics competitions, built with a modern TypeScript stack featuring React frontend, Express backend, and PostgreSQL database with Drizzle ORM. The system supports multiple user roles (observers, judges, clubs, administrators) with role-based access control and comprehensive scoring functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Latest Enhancements** (2025-01-20): Implemented all requested additional features and fixes
- **Admin Panel Enhancement**: Added approved users section with ability to revoke user approvals and manage existing accounts
- **Searchable Club Dropdown**: Updated gymnast registration with searchable club selection that includes all approved clubs
- **Session Date Display**: Added calendar dates and proper status-based functionality to session listings
- **Score Display Standardization**: All scores consistently show in "X.X" format across all pages
- **Navigation Fixes**: Resolved logout 404 issue by adding proper auth route handling
- **Status-Based Access**: Sessions now properly determine status from dates and allow appropriate access
- **Critical Bug Fixes Implemented** (2025-01-20): Fixed 10 major issues including approval workflows, apparatus corrections, and score formatting
- **Apparatus Corrected**: Limited to only 4 women's gymnastics events: Floor, Vault, Bars, and Beam
- **Enhanced Registration Validation**: Added required field validation for gymnast club affiliation and role-specific fields
- **Improved Approval Workflows**: Gymnast accounts now properly route to clubs for approval, admin accounts handle judges/clubs
- **Account Rejection System**: Added ability to reject and remove pending accounts with proper feedback
- **Enhanced Admin Panel**: Added search functionality to find users by name, username, or email
- **Date Logic Fixed**: Events automatically update status based on start/end dates (upcoming, live, completed)
- **Independent Authentication**: Traditional username/password system with admin account (username: "admin", password: "admin123")

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for client-side development
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with structured error handling

### Key Components

#### Authentication System
- **Provider**: Replit Auth with OpenID Connect discovery
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization**: Role-based access control (observer, judge, club, admin)
- **User Management**: Registration workflow with approval process for judges

#### Database Schema
- **Users**: Profile management with role-based permissions
- **Events**: Competition event management with status tracking
- **Sessions**: Individual competition sessions within events
- **Gymnasts**: Participant registration and management
- **Apparatus**: Gymnastics equipment/events (vault, bars, beam, floor)
- **Scores**: Scoring system with difficulty, execution, and deduction tracking

#### UI Component System
- **Design System**: shadcn/ui with "new-york" style variant
- **Theme**: Neutral color palette with CSS custom properties
- **Components**: Comprehensive set including forms, dialogs, tables, navigation
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **Registration Flow**: New users register with role selection, judges require approval
3. **Event Management**: Clubs/admins create events and sessions
4. **Scoring Flow**: Judges enter scores for gymnasts on specific apparatus
5. **Data Persistence**: All operations use Drizzle ORM with type-safe queries

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@radix-ui/***: Headless UI component primitives
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing library

### Development Tools
- **Vite**: Build tool with React plugin and runtime error overlay
- **TypeScript**: Type checking and development experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Server-side bundling for production

### Authentication & Sessions
- **openid-client**: OpenID Connect client for Replit Auth
- **passport**: Authentication middleware
- **connect-pg-simple**: PostgreSQL session store
- **express-session**: Session management middleware

## Deployment Strategy

### Development Environment
- **Server**: Development server runs with tsx for TypeScript execution
- **Client**: Vite dev server with HMR and error overlay
- **Database**: Connected to provisioned PostgreSQL via DATABASE_URL
- **Build Process**: Concurrent client and server development

### Production Build
- **Client Build**: Vite builds React app to `dist/public`
- **Server Build**: ESBuild bundles server code to `dist/index.js`
- **Database Migrations**: Drizzle Kit manages schema migrations
- **Environment**: Production mode with optimized builds

### Configuration Requirements
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (required)
- **REPL_ID**: Replit environment identifier
- **ISSUER_URL**: OpenID Connect issuer URL (defaults to Replit)
- **REPLIT_DOMAINS**: Allowed domains for authentication

The application follows a monorepo structure with shared TypeScript definitions, enabling type safety across the full stack while maintaining clear separation of concerns between client, server, and shared code.