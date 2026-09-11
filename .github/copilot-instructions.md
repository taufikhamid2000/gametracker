<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Next.js Template Project

This is a minimal Next.js 13+ template project with TypeScript, Tailwind CSS, and Supabase integration. It provides basic authentication and routing functionality that can be extended for various applications.

## Project Structure

- `src/app`: Next.js App Router pages and layouts
  - `auth`: Authentication flows (sign in, sign up)
  - `dashboard`: User dashboard
- `src/components`: Reusable UI components
  - `ui`: Core UI components
  - `layout`: Layout components (navigation, etc.)
- `src/lib`: Utility functions and library integrations
  - `supabase`: Supabase client configuration
  - `utils`: Utility functions
- `src/types`: TypeScript type definitions
- `src/__tests__`: Test files

## Key Features

- **Authentication**

  - User registration and login
  - Protected routes
  - Session management

- **UI Framework**
  - Responsive layout
  - Component-based architecture
  - Dark/light mode support

## Technology Stack

- **Frontend**
  - Next.js 13+ with App Router
  - TypeScript
  - Tailwind CSS
- **Forms and Validation**
  - React Hook Form
  - Zod validation
- **Backend**
  - Supabase for authentication
  - Supabase PostgreSQL database

## Development Guidelines

1. Follow TypeScript best practices with proper typing
2. Use Next.js App Router patterns appropriately
3. Keep components modular and reusable
4. Follow naming conventions:
   - Components: PascalCase (Button.tsx)
   - Utilities: camelCase (formatDate.ts)
   - Types: PascalCase (UserProfile.ts)
5. Write tests for critical functionality
6. Use environment variables for configuration
