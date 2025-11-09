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
- [ ] User authentication and session management
- [ ] Create new chat functionality
- [ ] Save and load chat history
- [ ] Search functionality for chats and notes
- [ ] Folder management (create, rename, delete)
- [ ] Chat organization (move to folder, delete)
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
- [ ] Integrate Stripe for credit purchases
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
