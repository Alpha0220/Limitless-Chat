# Limitless Chat

A modern, credit-based AI chat application built with React, TypeScript, Tailwind CSS, Express, and tRPC. Limitless Chat provides seamless access to multiple AI models with a sophisticated credit system for managing usage and costs.

## Overview

Limitless Chat is a full-stack web application that enables users to interact with various AI models through a unified chat interface. The application features a responsive sidebar navigation, real-time chat streaming, project management, and a comprehensive credit-based billing system.

**Key Features:**
- Multi-model AI chat support (Gemini, GPT, Claude, and more)
- Credit-based usage tracking and billing
- Project organization for chat management
- Real-time message streaming with markdown rendering
- User authentication via Manus OAuth
- Responsive design for mobile and desktop
- Image generation capabilities
- Template library for quick prompts
- Media creation tools

## Technology Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- tRPC for type-safe API calls
- Wouter for routing
- Lucide React for icons
- Sonner for toast notifications
- Shadcn/ui components

**Backend:**
- Express 4 server
- tRPC 11 for RPC procedures
- Drizzle ORM for database management
- MySQL/TiDB database
- JWT-based session management
- Manus OAuth integration

**Infrastructure:**
- Vite for frontend bundling
- pnpm for package management
- Git for version control

## Project Structure

```
limitless-chat/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Sidebar.tsx          # Main navigation sidebar
│   │   │   ├── ChatArea.tsx         # Chat interface and messaging
│   │   │   ├── ModelSwitcher.tsx    # AI model selection
│   │   │   ├── ProjectsSection.tsx  # Project management
│   │   │   └── ui/                  # Shadcn/ui components
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.tsx             # Main chat page
│   │   │   ├── Pricing.tsx          # Credit pricing page
│   │   │   ├── Templates.tsx        # Prompt templates
│   │   │   └── Media.tsx            # Image generation
│   │   ├── contexts/                # React contexts
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utility functions
│   │   ├── _core/                   # Core authentication hooks
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── public/                      # Static assets
│   └── index.html                   # HTML template
│
├── server/                          # Backend Express application
│   ├── routers/                     # tRPC procedure routers
│   │   ├── chat.ts                  # Chat operations
│   │   ├── credits.ts               # Credit management
│   │   ├── projects.ts              # Project management
│   │   ├── templates.ts             # Template management
│   │   └── imageGeneration.ts       # Image generation
│   ├── routes/                      # Express routes
│   │   └── stream-chat.ts           # Chat streaming endpoint
│   ├── _core/                       # Core server utilities
│   │   ├── context.ts               # tRPC context
│   │   ├── trpc.ts                  # tRPC setup
│   │   ├── env.ts                   # Environment variables
│   │   ├── llm.ts                   # LLM integration
│   │   ├── openrouter.ts            # OpenRouter API
│   │   ├── notification.ts          # Owner notifications
│   │   └── cookies.ts               # Session management
│   ├── db.ts                        # Database helpers
│   ├── routers.ts                   # Main tRPC router
│   └── index.ts                     # Server entry point
│
├── drizzle/                         # Database schema and migrations
│   ├── schema.ts                    # Table definitions
│   └── migrations/                  # Database migrations
│
├── storage/                         # S3 storage helpers
├── shared/                          # Shared constants and types
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
└── vite.config.ts                   # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 22.13.0+
- pnpm package manager
- MySQL/TiDB database
- Manus OAuth credentials

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment variables:**
   Create a `.env` file with the following variables:
   ```
   DATABASE_URL=mysql://user:password@localhost/limitless_chat
   JWT_SECRET=your-secret-key
   VITE_APP_ID=your-app-id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
   OPENROUTER_API_KEY=your-openrouter-key
   BUILT_IN_FORGE_API_KEY=your-forge-key
   BUILT_IN_FORGE_API_URL=https://api.manus.im
   VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
   VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
   VITE_APP_TITLE=Limitless Chat
   VITE_APP_LOGO=/logo.svg
   OWNER_NAME=Admin
   OWNER_OPEN_ID=owner-id
   ```

3. **Set up the database:**
   ```bash
   pnpm db:push
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## Development Workflow

### Building Features

**1. Database Schema Updates:**
- Edit `drizzle/schema.ts` to define new tables
- Run `pnpm db:push` to apply migrations
- Generated types are automatically available

**2. Backend API Development:**
- Add query helpers in `server/db.ts`
- Create tRPC procedures in `server/routers/*.ts`
- Use `protectedProcedure` for authenticated endpoints
- Use `publicProcedure` for public endpoints

**3. Frontend Integration:**
- Call tRPC procedures with `trpc.*.useQuery()` or `trpc.*.useMutation()`
- Use `useAuth()` hook for authentication state
- Handle loading/error states with React Query
- Implement optimistic updates for better UX

### Key Commands

```bash
# Development
pnpm dev              # Start dev server with hot reload

# Database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio for database management

# Building
pnpm build            # Build for production
pnpm preview          # Preview production build locally

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Check TypeScript types
```

## Credit System

### Credit Model

The application uses a credit-based system where each AI model has a fixed credit cost per message:

| Model | Credits per Message |
|-------|-------------------|
| Gemini 2.0 Flash | 2 |
| Gemini 2.0 | 3 |
| GPT-4 Turbo | 10 |
| GPT-4o | 8 |
| GPT-4o Mini | 5 |
| Claude 3.5 Sonnet | 20 |
| Claude 3 Opus | 20 |
| Claude 3 Haiku | 3 |
| Llama 3.1 405B | 15 |
| Mixtral 8x22B | 8 |
| Mistral Large | 10 |

### Pricing Tiers

Users can purchase credits at different rates:

| Plan | Price | Credits | Cost per Credit |
|------|-------|---------|-----------------|
| Starter | ฿10 | 200 | 5¢ |
| Popular | ฿25 | 600 | 4.2¢ |
| Pro | ฿50 | 1500 | 3.3¢ |

### Credit Flow

1. **User sends message** → Frontend checks if user has enough credits
2. **Message sent to backend** → Server verifies credit balance
3. **Model processes message** → Credits are deducted from user account
4. **Response streamed to client** → Sidebar credit balance updates
5. **User sees updated balance** → Real-time feedback on credit usage

## Authentication

Limitless Chat uses Manus OAuth for authentication:

1. **Login Flow:**
   - User clicks login button
   - Redirected to Manus OAuth portal
   - User authenticates with Manus account
   - Redirected back to app with session cookie

2. **Session Management:**
   - JWT-based sessions stored in cookies
   - `ctx.user` available in all tRPC procedures
   - `useAuth()` hook provides user state in frontend
   - Automatic logout on session expiration

3. **User Roles:**
   - `user` - Regular user (default)
   - `admin` - Administrator with full access
   - Role-based access control available via `adminProcedure`

## API Integration

### LLM Integration

The application integrates with OpenRouter API for AI model access:

```typescript
import { invokeLLM } from "./server/_core/llm";

const response = await invokeLLM({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, world!" },
  ],
});
```

### Image Generation

Generate images using the built-in image generation service:

```typescript
import { generateImage } from "./server/_core/imageGeneration";

const { url } = await generateImage({
  prompt: "A serene landscape with mountains",
});
```

### File Storage

Upload files to S3 storage:

```typescript
import { storagePut } from "./server/storage";

const { url } = await storagePut(
  `${userId}-files/${fileName}.png`,
  fileBuffer,
  "image/png"
);
```

## Styling & Design

### Theme System

The application uses a light theme by default with customizable colors via CSS variables:

```css
/* Light theme colors */
--background: 0 0% 100%;
--foreground: 0 0% 3.6%;
--primary: 0 84.2% 60.2%;
--secondary: 0 0% 96.1%;
--accent: 0 84.2% 60.2%;
```

### Component Library

Shadcn/ui components are used for consistent, accessible UI:

- `Button` - Interactive buttons with variants
- `Card` - Content containers
- `Dialog` - Modal dialogs
- `Input` - Text input fields
- `ScrollArea` - Scrollable containers
- `Separator` - Visual dividers
- `AlertDialog` - Confirmation dialogs

### Responsive Design

The application is mobile-first with breakpoints:
- `sm` - 640px
- `md` - 768px
- `lg` - 1024px
- `xl` - 1280px

## Troubleshooting

### Common Issues

**Sidebar Content Overflowing:**
- Ensure all containers have `overflow-hidden` class
- Check that padding is applied correctly with `px-3` or `px-0`
- Verify max-width constraints are applied: `md:max-w-[255px]`

**Credits Not Updating:**
- Check that `utils.credits.getBalance.invalidate()` is called after mutations
- Verify database queries use `.execute()` method
- Check debug logs: `[DEBUG] getBalance - user[0]?.credits: X`

**Authentication Issues:**
- Verify OAuth credentials are correctly set in environment variables
- Check that session cookie is being set properly
- Ensure `OAUTH_SERVER_URL` matches your OAuth provider

**Database Connection Errors:**
- Verify `DATABASE_URL` is correct
- Ensure database server is running
- Check that user has proper permissions
- Run `pnpm db:push` to apply pending migrations

## Performance Optimization

### Frontend Optimization

- **Code Splitting:** Routes are automatically code-split by Vite
- **Image Optimization:** Use appropriately sized images (min 1920×1080 for backgrounds)
- **Lazy Loading:** Components load on demand
- **Caching:** React Query handles automatic caching and invalidation

### Backend Optimization

- **Database Indexing:** Indexes on frequently queried columns
- **Connection Pooling:** Efficient database connection management
- **Streaming:** Large responses are streamed to reduce latency
- **Caching:** Query results cached with React Query

## Deployment

### Production Build

```bash
pnpm build
pnpm preview
```

### Environment Setup

Set production environment variables:
```bash
export NODE_ENV=production
export DATABASE_URL=mysql://prod-user:prod-pass@prod-host/db
export JWT_SECRET=production-secret-key
# ... other production variables
```

### Monitoring

- Check server logs for errors
- Monitor database performance
- Track credit usage and revenue
- Monitor API rate limits with OpenRouter

## Contributing

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive commit messages

### Testing

- Test new features locally before committing
- Verify credit calculations are accurate
- Test on multiple screen sizes
- Test authentication flow

## Support & Documentation

For additional help:
- Check the [Manus Documentation](https://help.manus.im)
- Review tRPC documentation at [trpc.io](https://trpc.io)
- See Tailwind CSS docs at [tailwindcss.com](https://tailwindcss.com)
- Explore Drizzle ORM at [orm.drizzle.team](https://orm.drizzle.team)

## License

This project is proprietary software. All rights reserved.

## Changelog

### Version 1.0.0 (Current)

**Features:**
- Multi-model AI chat interface
- Credit-based billing system
- Project organization
- Image generation
- Template library
- Real-time message streaming
- Responsive design
- User authentication

**Bug Fixes:**
- Fixed sidebar content overflow on md+ screens
- Fixed toast description text styling
- Fixed Drizzle query syntax with .execute()
- Fixed credit balance synchronization

**Improvements:**
- Enhanced sidebar layout with proper width constraints
- Improved text truncation throughout UI
- Better error handling with descriptive toasts
- Debug logging for troubleshooting
