# Limitless Chat - Project TODO

## Database Schema
- [x] Create folders table for organizing chats
- [x] Create chats table with folder relationship
- [x] Create messages table for chat history
- [x] Create user_settings table for API keys and preferences
- [x] Create models table for AI model configurations

## Dark Theme UI
- [x] Implement dark theme color scheme (dark gray/black background)
- [x] Create responsive sidebar with collapsible navigation
- [x] Build sidebar sections: New Chat, Search, Notes, Workspace, Folders, Chats
- [x] Style chat history items with proper grouping (Previous 30 days, September, etc.)
- [x] Add folder icons and expandable folder UI

## Model Switcher
- [x] Create model dropdown component in header
- [x] Add model selection functionality (ChatGPT, Claude, Perplexity, Gemini, Gamma)
- [ ] Store selected model in state and database
- [x] Display current model in header

## Chat Interface
- [x] Build main chat area with centered layout
- [x] Create message input component with file upload and voice input icons
- [x] Implement suggested prompts section
- [x] Add message display with proper formatting
- [x] Support markdown rendering in messages

## Limitless API Integration
- [ ] Create API key management in settings
- [ ] Implement Limitless API client for fetching lifelogs
- [ ] Add date selection for daily summaries
- [ ] Integrate context from Limitless data into chat

## AI Model Integration
- [ ] Integrate OpenAI API for ChatGPT models
- [ ] Integrate Anthropic API for Claude models
- [ ] Add support for multiple AI providers
- [ ] Implement streaming responses

## Features
- [x] User authentication and session management
- [x] Create new chat functionality
- [x] Save and load chat history
- [x] Search functionality for chats and notes
- [x] Folder management (create, rename, delete)
- [x] Chat organization (move to folder, delete)
- [ ] Settings page for API keys

## Polish & Testing
- [ ] Test all features end-to-end
- [ ] Ensure responsive design works on mobile
- [ ] Add loading states and error handling
- [ ] Optimize performance

## Credit System & Payments
- [x] Add credits column to users table
- [x] Create credit_transactions table for tracking usage
- [x] Create pricing_tiers table for different credit packages
- [x] Implement credit deduction per message based on model
- [x] Add credit balance display in UI
- [x] Create pricing page showing credit packages
- [x] Integrate Stripe for credit purchases (card + PromptPay QR for Thailand)
- [ ] Add credit usage analytics dashboard
- [ ] Implement low credit warnings
- [ ] Add credit refill notifications

## Model Cost Configuration
- [x] Define credit costs per model (GPT-4: 10, Claude: 8, Perplexity: 3, Gemini: 2)
- [ ] Add model cost multipliers for different message lengths
- [ ] Implement cost estimation before sending message
- [ ] Add usage statistics per model

## Pay-As-You-Go System
- [x] Add payment method storage (Stripe customer ID)
- [x] Implement automatic billing when credits run low
- [ ] Create billing history page
- [x] Add monthly spending cap ($100 default)
- [ ] Send email receipts for charges
- [x] Display current month's usage and costs
- [x] Add option to switch between pre-paid and pay-as-you-go
- [ ] Implement grace period for failed payments

## OpenRouter Integration
- [x] Request OpenRouter API key from user
- [x] Add OpenRouter API key to secrets
- [x] Create OpenRouter client helper in backend
- [x] Implement chat endpoint with OpenRouter
- [ ] Add streaming support for real-time responses
- [x] Connect frontend chat interface to backend
- [x] Test all models (GPT-4, Claude, Perplexity, Gemini)
- [x] Add error handling for API failures
- [x] Implement token counting for accurate credit deduction

## Bug Fixes
- [x] Remove "0" displaying below user messages in chat
- [ ] Optimize database queries for faster loading
- [ ] Add loading skeletons for better UX

## Projects/Workspaces Feature
- [x] Create projects table in database
- [x] Add project creation UI in sidebar
- [ ] Implement working "Create Project" button with dialog
- [ ] Add ability to assign chats to projects when creating
- [ ] Add ability to move existing chats to projects
- [x] Implement project-based chat filtering (show only project chats)
- [ ] Add project rename functionality
- [ ] Add project delete functionality
- [ ] Add chat context menu (right-click) for moving to project
- [ ] Show project name in chat list items
- [ ] Add project color/icon customization

## Prompt Templates
- [x] Create prompt_templates table in database
- [x] Build template creation UI
- [x] Add template library/gallery view
- [x] Implement template variables (e.g., {{topic}}, {{style}})
- [ ] Add template search and filtering
- [x] Allow users to save custom templates
- [ ] Add pre-built template examples
- [ ] Implement template quick-insert in chat

## Performance Optimization - Streaming
- [x] Create streaming chat endpoint in backend
- [x] Implement Server-Sent Events (SSE) for real-time streaming
- [x] Update OpenRouter integration to support streaming
- [x] Add streaming response handler in frontend
- [x] Implement real-time token-by-token display in chat UI
- [x] Add proper error handling for streaming interruptions
- [x] Test streaming with all AI models (GPT-4, Claude, Gemini)
- [ ] Optimize database queries with indexes
- [ ] Add caching for frequently accessed data
- [ ] Implement lazy loading for chat history

## Media Creation Section
- [ ] Add "Media Creation" navigation item in sidebar
- [ ] Create MediaCreation page component
- [ ] Add image generation model selector (Flux, Stable Diffusion, DALL-E)
- [ ] Build image prompt input UI
- [ ] Integrate with image generation APIs
- [ ] Display generated images in gallery view
- [ ] Add image download functionality
- [ ] Add image history/gallery
- [ ] Implement image editing capabilities
- [ ] Add video generation support (future)
- [ ] Track credits used for media generation

## Bug Fixes - Performance Issue (RESOLVED)
- [x] Fix streaming endpoint not returning responses
- [x] Fix orderBy import in stream-chat.ts (was missing 'asc' import)
- [x] Add better error logging for debugging
- [x] Test chat functionality after fixes - WORKING PERFECTLY!

## Default Model Change
- [x] Change default model from GPT-4 to Gemini in ModelSwitcher component
- [x] Update default model in ChatArea component
- [x] Fix backend credit calculation for Gemini model
- [x] Test chat functionality with Gemini as default

## Mobile Responsiveness
- [x] Add hamburger menu button for mobile screens
- [x] Make sidebar collapsible/hideable on mobile
- [x] Optimize sidebar width for mobile (full-width overlay or slide-in)
- [x] Adjust font sizes for mobile readability
- [x] Make model switcher dropdown mobile-friendly
- [x] Optimize chat bubbles for narrow screens
- [x] Add touch-friendly button sizes (min 44x44px)
- [x] Test on iPhone SE (375px), iPhone 12/13 (390px), iPhone 14 Pro Max (430px)
- [x] Fix horizontal scrolling issues on mobile
- [x] Optimize suggested prompts layout for mobile
- [x] Make credit balance and buttons stack vertically on mobile
- [x] Add proper viewport meta tag
- [x] Test landscape orientation on mobile devices

## Apple-Inspired UI Redesign
- [x] Change theme from dark to light (white/light gray backgrounds)
- [x] Implement Apple blue accent color (#007AFF) for buttons and active states
- [x] Update sidebar to light gray (#F5F5F7) with white background for main area
- [x] Add subtle shadows and borders (Apple style) instead of harsh lines
- [x] Improve text contrast - dark text on light backgrounds
- [x] Update typography to system fonts (San Francisco style)
- [x] Refine chat bubbles with better contrast and readability
- [x] Update button styles to match Apple design language
- [x] Add subtle hover and active states
- [x] Ensure proper visual hierarchy throughout the app

## Theme Consistency & Testing
- [x] Review all pages for Apple-inspired light theme consistency
- [x] Update MediaCreation page with light theme styling
- [x] Update Pricing page with light theme styling
- [x] Update Templates page with light theme styling
- [x] Update NotFound page with light theme styling
- [x] Test Home page functionality (chat, model switching, sidebar)
- [x] Test MediaCreation page functionality (UI display - backend not implemented)
- [x] Test Pricing page functionality (credit packages display)
- [x] Test Templates page functionality (UI display - empty state)
- [ ] Test Projects functionality (create, delete, filter chats)
- [x] Ensure all pages align with brand identity

## UI Fixes & Dark Mode
- [x] Fix cut-off "Limitless Chat" title at top of sidebar
- [x] Add dark mode toggle button in header
- [x] Enable theme switching functionality in ThemeProvider
- [x] Test dark mode across all pages

## FAL AI Image Generation Integration
- [x] Store FAL AI API key securely as environment variable
- [x] Create backend image generation helper function
- [x] Add tRPC procedure for image generation
- [x] Connect Media Creation page to backend endpoint
- [x] Implement credit deduction for image generation (5 credits per image)
- [x] Test image generation functionality - WORKING PERFECTLY!
- [x] Add error handling and loading states

## Gamma API Presentation Generation
- [ ] Research Gamma API documentation and capabilities
- [ ] Store Gamma API key securely as environment variable
- [ ] Create backend helper function for Gamma API integration
- [ ] Add tRPC procedure for presentation generation
- [ ] Create "Presentations" page with user-friendly UI
- [ ] Add customization inputs (topic, style, number of slides, tone, etc.)
- [ ] Add "Presentations" menu item to sidebar navigation
- [ ] Implement credit deduction for presentation generation
- [ ] Test presentation generation functionality
- [ ] Add error handling and loading states

## Bug Fixes
- [ ] Fix FAL AI image generation 500 error
- [ ] Debug server logs to identify root cause
- [ ] Test image generation after fix

## FAL AI Unauthorized Error Fix
- [x] Check FAL_AI_API_KEY environment variable is properly set
- [x] Verify FAL AI client configuration in backend
- [x] Test API key directly with FAL AI API
- [x] Check if API key format is correct (KEY_ID:KEY_SECRET)
- [x] Review server logs for detailed error messages
- [x] Fix authentication issue and test image generation - RESOLVED!

## Add Latest AI Models
- [x] Research latest OpenRouter model IDs for GPT-5, Anthropic, and Perplexity
- [x] Add GPT-5 and GPT-5 Pro models to model switcher
- [x] Add latest Anthropic models (Claude Opus 4.1, Sonnet 4.5, Sonnet 4, Haiku 4.5, 3.7 Sonnet)
- [x] Add Perplexity Sonar and Sonar Pro models
- [x] Update credit costs for new models
- [ ] Test all new models work correctly

## GitHub Repository Push
- [x] Replace S3 remote with GitHub remote (https://github.com/trinupab-sys/limitlesschat)
- [x] Commit all current changes
- [ ] Push code to GitHub repository - User will push manually with token
- [ ] Verify code is visible on GitHub

## Stripe Payment Integration
- [x] Create env.example.txt with Stripe environment variables
- [x] Install Stripe package (stripe v19.3.1)
- [x] Create Stripe backend helper with checkout and webhook handling
- [x] Add Stripe environment variables to ENV object
- [x] Create Stripe router with tRPC procedures
- [x] Update Pricing page with payment method selection (Card + PromptPay QR)
- [x] Add Stripe checkout session creation
- [x] Support Thailand currency (THB) and PromptPay QR payment
- [ ] Test Stripe checkout flow end-to-end
- [ ] Configure Stripe webhook for payment success
- [ ] Add Stripe test keys to environment

## Bug Fixes - Critical Issues
- [x] Chat history not displaying - messages not being saved/loaded (verified working)
- [x] Insufficient credits message still showing after database credit update (frontend cache invalidation working)
- [x] Toast message text color too light (need text-gray-600 or darker) - improved with darker text
- [x] Verify chat message persistence in database (confirmed saving in stream-chat endpoint)

## Error Message Improvements
- [x] Fix "Failed to start streaming" error message to be more specific
- [x] Add specific error for insufficient credits (already implemented in backend)
- [x] Add specific error for authentication failures
- [x] Add specific error for session expiration
- [x] Display proper toast messages for each error type
- [x] Add redirect link to Pricing page in insufficient credits error
- [x] Fix toast description text color to be darker (now using text-gray-700 dark:text-gray-200)

## Critical Issues - Credit System
- [x] Fix sidebar credit balance not syncing with database (invalidate query on error)
- [x] Fix insufficient credit detection - added frontend credit check before streaming
- [x] Improve toast message details text color (use text-gray-600 dark:text-gray-300)
- [x] Verify credit calculation is correct per model (updated MODEL_CREDITS in backend)
- [x] Ensure pricing per token per model is calculated correctly (matches pricing page)

## Drizzle Query Fixes
- [x] Fix all Drizzle queries to use .execute() method
- [x] Add [DEBUG] logging for user data queries
- [x] Fix array result handling in all routers (use [0] indexing)
- [x] Fix credits.ts queries with proper .execute()
- [x] Fix stream-chat.ts queries with proper .execute()
- [x] Fix db.ts helper functions with .execute()
- [x] Fix chat.ts delete operations with .execute()
- [x] Fix projects.ts insert with proper result handling
- [x] Fix templates.ts insert with proper result handling
- [x] Fix imageGeneration.ts queries with .execute()

## Debug Balance Issues
- [x] Check user credits in database (confirmed: user has 0 credits)
- [x] Debug why balance.credits is always 0 (query works correctly, user initialized with 0)
- [x] Add enhanced logging to getBalance query (detailed logging added)
- [x] Show user's name in sidebar (displays name or email)
- [x] Add signout AlertDialog button to sidebar (with confirmation dialog)

## Toast Styling Fixes
- [x] Fix insufficient credit toast description text styling (use descriptionClassName instead of CSS selector)

## Sidebar Layout Fixes
- [x] Fix text overflow in sidebar (truncate long text)
- [x] Prevent horizontal scrolling in sidebar (added overflow-hidden)
- [x] Separate scroll between sidebar and main chat section (ScrollArea for nav, fixed footer)
- [x] Ensure user name and chat titles are properly truncated (added truncate class and title attr)

## ProjectsSection Overflow Fix
- [x] Fix PROJECTS section horizontal overflow (added overflow-hidden and truncate)
- [x] Fix RECENT CHATS section horizontal overflow (already has truncate in Sidebar)
- [x] Ensure create project button is clickable (added flex-shrink-0)
- [x] Ensure delete chat button is clickable (added flex-shrink-0 and e.stopPropagation())

## Visual Layout Adjustments
- [x] Adjusted sidebar width from 358px to 255px for better balance
- [x] Adjusted ProjectsSection width to 230px to match sidebar layout
- [x] Adjusted navigation container heights for proper spacing

## Sidebar Overflow Fix (md++ screens)
- [x] Add overflow-hidden to ProjectsSection container
- [x] Add overflow-hidden to Recent Chats container

- [x] Add max-width constraint to sidebar (255px on md++ screens)

- [x] Fix ProjectsSection internal layout to fit sidebar width (removed px-2, added w-full)
- [x] Fix Recent Chats section internal layout to fit sidebar width (changed px-3 to px-0 on container, added px-3 to buttons)

## New Features - Feature Branch (feature/core-functionality)
- [x] User authentication and session management
- [x] Create new chat functionality
- [x] Save and load chat history
- [x] Search functionality for chats and notes
- [x] Folder management (create, rename, delete)
- [x] Chat organization (move to folder, delete)
- [ ] Settings page for API keys

## Chat Organization & Deletion Features
- [x] Update backend queries to filter chats by project/folder
- [x] Add delete procedures for folders and projects with move-or-delete logic
- [x] Update Sidebar to display chats in correct project/folder locations
- [x] Filter "Recent Chats" to only show chats without project/folder
- [x] Add delete confirmation dialogs for folders and projects
- [x] Test chat organization and deletion workflow

## Bug Fixes
- [x] Fix "New Chat" button not clearing old messages when switching from historical chat
  - Added useEffect to clear localMessages, input, and streamingContent when chatId becomes null
  - Updated showSuggestedPrompts logic to display suggested prompts for new chats
- [x] Fix chat messages not displaying in ChatArea
  - Added missing message rendering code to display user and assistant messages
  - Fixed race condition where query invalidation was clearing messages before DB save
  - Messages now persist correctly after sending
- [x] Fix user messages not being saved to database
  - Added error handling and logging to stream-chat endpoint
  - Verified user messages are now properly persisted

## Bug Fixes - Sidebar Hooks Violation
- [x] Fix "Rendered more hooks than during previous render" error in Sidebar
- [x] Refactor to fetch all chats once instead of per-project/folder
- [x] Organize chats client-side to avoid conditional hook calls

## Bug Fixes - Nested Button Error
- [x] Fix "<button> cannot contain a nested <button>" error in Sidebar
- [x] Refactor project/folder items to use div instead of nested buttons
- [x] Refactor accordion trigger buttons to use div for create actions
- [x] Ensure all delete/create buttons are accessible without nesting

## Feature Requests - Chat Organization
- [x] Add rename mutations for projects, folders, and chats
- [x] Add move chat mutation to move chats between locations (already existed)
- [x] Create context menu component for projects with rename/delete
- [x] Create context menu component for folders with rename/delete
- [x] Update chat context menu with rename/move/delete options
- [x] Integrate all context menus into Sidebar

## Bug Fixes - Missing Procedures
- [x] Fix "No procedure found on path projects.rename" error (restarted dev server)
- [x] Fix "No procedure found on path folders.rename" error (restarted dev server)
- [x] Verify all rename mutations are properly exported in main router
