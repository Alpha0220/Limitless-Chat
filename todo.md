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
