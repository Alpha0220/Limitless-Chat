# Limitless Chat - Infrastructure Documentation

## System Architecture Overview

Limitless Chat is built on a modern, scalable architecture with clear separation between frontend, backend, and external services. The system is designed for reliability, performance, and easy maintenance.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React 19 + TypeScript + Tailwind CSS 4                 │   │
│  │  - Vite bundler for fast builds                         │   │
│  │  - Wouter for client-side routing                       │   │
│  │  - React Query for data fetching                        │   │
│  │  - Shadcn/ui component library                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (tRPC)
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express 4 + tRPC 11                                    │   │
│  │  - Type-safe RPC procedures                             │   │
│  │  - JWT session management                               │   │
│  │  - Manus OAuth integration                              │   │
│  │  - REST endpoints for streaming                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Database Helpers & Services                            │   │
│  │  - Credit management system                             │   │
│  │  - Chat operations                                      │   │
│  │  - Project management                                   │   │
│  │  - User authentication                                  │   │
│  │  - Image generation                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA & EXTERNAL SERVICES                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  MySQL/TiDB Database                                    │   │
│  │  - User accounts                                        │   │
│  │  - Chat history                                         │   │
│  │  - Projects and templates                               │   │
│  │  - Credit transactions                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  External APIs                                          │   │
│  │  - OpenRouter (LLM models)                              │   │
│  │  - Manus OAuth (Authentication)                         │   │
│  │  - Manus Forge API (Image generation, storage)          │   │
│  │  - Stripe (Payment processing)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Cloud Storage                                          │   │
│  │  - S3 (File storage)                                    │   │
│  │  - Git repository (S3-based)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Architecture

**Technology Stack:**
- **React 19** - UI framework with latest features
- **TypeScript** - Type safety across the application
- **Tailwind CSS 4** - Utility-first CSS framework
- **Vite** - Next-generation build tool
- **tRPC Client** - Type-safe API client
- **React Query** - Data fetching and caching
- **Wouter** - Lightweight routing library

**Key Components:**

```
App.tsx (Root)
├── ThemeProvider (Light/Dark theme)
├── TooltipProvider
├── Router
│   ├── Home.tsx (Main chat interface)
│   │   ├── Sidebar (Navigation & projects)
│   │   ├── ChatArea (Message display & input)
│   │   └── ModelSwitcher (AI model selection)
│   ├── Pricing.tsx (Credit purchase)
│   ├── Templates.tsx (Prompt templates)
│   ├── Media.tsx (Image generation)
│   └── NotFound.tsx (404 page)
└── Toaster (Toast notifications)
```

**Data Flow:**
1. User interacts with UI component
2. Component calls tRPC procedure via `trpc.*.useQuery()` or `trpc.*.useMutation()`
3. React Query handles caching and invalidation
4. Response updates component state
5. UI re-renders with new data

### Backend Architecture

**Technology Stack:**
- **Express 4** - HTTP server framework
- **tRPC 11** - Type-safe RPC framework
- **Drizzle ORM** - Type-safe database access
- **MySQL/TiDB** - Relational database
- **JWT** - Session authentication

**Request Flow:**

```
HTTP Request
    ↓
Express Middleware
    ├── CORS handling
    ├── Body parsing
    └── Session validation
    ↓
tRPC Router
    ├── Procedure routing
    ├── Context building (user, db, etc.)
    └── Input validation
    ↓
Business Logic
    ├── Database queries
    ├── External API calls
    └── Credit calculations
    ↓
Response
    ├── Serialization (SuperJSON)
    └── HTTP Response
```

**Router Structure:**

```
appRouter
├── auth
│   ├── me (Get current user)
│   └── logout (Clear session)
├── chat
│   ├── list (Get user chats)
│   ├── create (Create new chat)
│   ├── delete (Delete chat)
│   └── update (Update chat title)
├── credits
│   ├── getBalance (Get user credits)
│   ├── deductCredits (Deduct credits for message)
│   ├── getMonthlyUsage (Get usage stats)
│   └── switchBillingType (Change billing plan)
├── projects
│   ├── list (Get user projects)
│   ├── create (Create project)
│   ├── delete (Delete project)
│   └── update (Update project)
├── templates
│   ├── list (Get templates)
│   └── create (Create template)
├── imageGeneration
│   ├── generate (Generate image)
│   └── list (Get user images)
└── system
    └── notifyOwner (Send notification to owner)
```

### Database Schema

**Core Tables:**

```sql
-- Users table
users
├── id (Primary Key)
├── openId (OAuth identifier)
├── name (User name)
├── email (Email address)
├── loginMethod (OAuth provider)
├── role (user | admin)
├── credits (Current balance)
├── billingType (prepaid | pay-as-you-go)
├── createdAt (Registration date)
├── updatedAt (Last update)
└── lastSignedIn (Last login)

-- Chats table
chats
├── id (Primary Key)
├── userId (Foreign Key → users)
├── projectId (Foreign Key → projects, nullable)
├── title (Chat title)
├── model (Selected AI model)
├── createdAt (Creation date)
└── updatedAt (Last update)

-- Chat messages table
chatMessages
├── id (Primary Key)
├── chatId (Foreign Key → chats)
├── role (user | assistant)
├── content (Message text)
├── model (AI model used)
├── creditsUsed (Credits deducted)
├── createdAt (Message timestamp)
└── updatedAt (Last update)

-- Projects table
projects
├── id (Primary Key)
├── userId (Foreign Key → users)
├── name (Project name)
├── description (Project description)
├── createdAt (Creation date)
└── updatedAt (Last update)

-- Credit transactions table
creditTransactions
├── id (Primary Key)
├── userId (Foreign Key → users)
├── amount (Credits added/deducted)
├── type (purchase | usage | refund)
├── description (Transaction description)
├── createdAt (Transaction date)
└── metadata (Additional data)

-- Templates table
templates
├── id (Primary Key)
├── userId (Foreign Key → users, nullable)
├── name (Template name)
├── category (Template category)
├── content (Template text)
├── isPublic (Public | Private)
├── createdAt (Creation date)
└── updatedAt (Last update)

-- Generated images table
generatedImages
├── id (Primary Key)
├── userId (Foreign Key → users)
├── prompt (Generation prompt)
├── imageUrl (S3 URL)
├── model (Image model used)
├── creditsUsed (Credits deducted)
├── createdAt (Generation date)
└── updatedAt (Last update)
```

## External Services Integration

### 1. OpenRouter API (LLM Models)

**Purpose:** Access to multiple AI language models

**Integration Points:**
- `server/_core/openrouter.ts` - API wrapper
- `server/routes/stream-chat.ts` - Streaming endpoint
- `server/routers/credits.ts` - Credit deduction

**Models Supported:**
- Google Gemini (2.0 Flash, 2.0)
- OpenAI GPT (4 Turbo, 4o, 4o Mini)
- Anthropic Claude (3.5 Sonnet, 3 Opus, 3 Haiku)
- Meta Llama (3.1 405B)
- Mistral (8x22B, Large)

**Credit Costs:**
- Gemini 2.0 Flash: 2 credits
- GPT-4 Turbo: 10 credits
- Claude 3.5 Sonnet: 20 credits
- Llama 3.1 405B: 15 credits

### 2. Manus OAuth (Authentication)

**Purpose:** User authentication and account management

**Flow:**
1. User clicks login button
2. Redirected to `VITE_OAUTH_PORTAL_URL`
3. User authenticates with Manus account
4. Redirected to `/api/oauth/callback`
5. Session cookie created
6. User logged in

**Environment Variables:**
- `VITE_APP_ID` - OAuth application ID
- `OAUTH_SERVER_URL` - OAuth backend URL
- `VITE_OAUTH_PORTAL_URL` - OAuth portal URL
- `JWT_SECRET` - Session signing key

### 3. Manus Forge API (Image Generation & Storage)

**Purpose:** Image generation and file storage

**Services:**
- **Image Generation** - Generate images from text prompts
- **File Storage** - Upload and retrieve files from S3

**Integration Points:**
- `server/_core/imageGeneration.ts` - Image generation
- `server/storage.ts` - S3 storage helpers

**Environment Variables:**
- `BUILT_IN_FORGE_API_URL` - API base URL
- `BUILT_IN_FORGE_API_KEY` - Server-side API key
- `VITE_FRONTEND_FORGE_API_URL` - Frontend API URL
- `VITE_FRONTEND_FORGE_API_KEY` - Frontend API key

### 4. Stripe (Payment Processing)

**Purpose:** Credit purchase and billing

**Integration Points:**
- `server/routers/stripe.ts` - Stripe operations
- `server/_core/stripe.ts` - Stripe helper functions
- Webhook handling for payment confirmations

**Environment Variables:**
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

**Payment Flow:**
1. User selects credit package on pricing page
2. Creates Stripe checkout session
3. User completes payment
4. Stripe webhook confirms payment
5. Credits added to user account

### 5. S3 Storage (File Management)

**Purpose:** Store user-generated content and project files

**Integration Points:**
- `server/storage.ts` - S3 helper functions
- Image storage for generated images
- Chat export files

**Storage Structure:**
```
s3://bucket/
├── {userId}-images/
│   └── {imageId}-{hash}.png
├── {userId}-files/
│   └── {fileName}-{hash}.ext
└── {userId}-exports/
    └── {chatId}-export-{date}.json
```

## Deployment Architecture

### Development Environment

**Local Development:**
- Vite dev server on `http://localhost:5173`
- Express server on `http://localhost:3000`
- Hot module replacement (HMR) enabled
- Source maps for debugging

**Commands:**
```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build
```

### Production Environment

**Build Process:**
1. TypeScript compilation
2. Vite bundling (code splitting, minification)
3. Asset optimization
4. Output to `dist/` directory

**Deployment:**
- Docker container (recommended)
- Environment variables configured
- Database migrations applied
- SSL/TLS enabled

**Performance Optimizations:**
- Code splitting by route
- Lazy loading of components
- Asset caching with content hashing
- Gzip compression
- CDN for static assets

## Monitoring & Observability

### Logging

**Debug Logging:**
- `[DEBUG]` prefix for debug messages
- Logged to server console
- Examples:
  - `[DEBUG] getBalance - user[0]?.credits: X`
  - `[DEBUG] stream-chat - User: X, Model: Y`

**Error Logging:**
- Error messages with stack traces
- Logged to console and error logs
- Includes context information

### Metrics

**Application Metrics:**
- API response times
- Database query performance
- Credit deduction accuracy
- Model usage statistics
- Error rates

**Business Metrics:**
- Total credits purchased
- Credits consumed by model
- User retention
- Average session duration
- Revenue by payment tier

## Security Architecture

### Authentication & Authorization

**Session Management:**
- JWT-based sessions in cookies
- Secure, HttpOnly cookies
- CSRF protection
- Session expiration

**Authorization:**
- Role-based access control (RBAC)
- `user` role - Standard user
- `admin` role - Full access
- Procedure-level authorization checks

### Data Protection

**Encryption:**
- TLS/SSL for all communications
- Database encryption at rest
- Sensitive data encrypted in transit

**Input Validation:**
- tRPC schema validation
- SQL injection prevention via ORM
- XSS protection via React
- CORS configuration

### API Security

**Rate Limiting:**
- Per-user rate limits
- Per-IP rate limits
- Endpoint-specific limits

**API Keys:**
- Environment variable storage
- Rotation policies
- Audit logging

## Scalability Considerations

### Horizontal Scaling

**Stateless Design:**
- No session state on server
- Sessions stored in cookies
- Database as single source of truth

**Load Balancing:**
- Multiple server instances
- Sticky sessions (if needed)
- Health checks

### Database Scaling

**Optimization:**
- Indexes on frequently queried columns
- Connection pooling
- Query optimization
- Caching layer (Redis optional)

**Replication:**
- Read replicas for scaling reads
- Write operations to primary
- Failover handling

### Caching Strategy

**Frontend Caching:**
- React Query for API response caching
- Browser cache for static assets
- Service Worker for offline support

**Backend Caching:**
- Database query caching
- API response caching
- User session caching

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Daily automated backups
- Point-in-time recovery
- Off-site backup storage

**Code & Configuration:**
- Git repository backups
- Environment variable backups
- Secrets management

### Recovery Procedures

**Database Failure:**
1. Failover to replica
2. Restore from backup
3. Verify data integrity
4. Resume operations

**Application Failure:**
1. Restart service
2. Check logs for errors
3. Rollback if necessary
4. Monitor recovery

## Cost Optimization

### Infrastructure Costs

**Database:**
- Shared MySQL/TiDB instance
- Automatic scaling
- Backup storage

**API Costs:**
- OpenRouter - Pay per token
- Manus Forge - Included service
- Stripe - 2.9% + $0.30 per transaction

**Storage:**
- S3 storage - Pay per GB
- Data transfer costs
- Request costs

### Optimization Strategies

1. **Model Selection** - Use cheaper models when appropriate
2. **Caching** - Reduce API calls
3. **Batch Operations** - Combine requests
4. **Resource Cleanup** - Delete old data
5. **Rate Limiting** - Prevent abuse

## Development Workflow

### Local Development

1. Clone repository
2. Install dependencies: `pnpm install`
3. Configure `.env` file
4. Run migrations: `pnpm db:push`
5. Start dev server: `pnpm dev`

### Testing

1. Unit tests for utilities
2. Integration tests for API
3. E2E tests for user flows
4. Manual testing on multiple devices

### Deployment

1. Create feature branch
2. Make changes and commit
3. Push to repository
4. Create pull request
5. Code review
6. Merge to main
7. Automated deployment

## Future Infrastructure Improvements

1. **Microservices** - Separate services for chat, credits, images
2. **Message Queue** - Async job processing (RabbitMQ, Redis)
3. **Real-time Updates** - WebSocket for live notifications
4. **Analytics** - Comprehensive usage tracking
5. **CDN** - Global content delivery
6. **Multi-region** - Geographic redundancy
7. **Kubernetes** - Container orchestration
8. **Service Mesh** - Advanced traffic management
