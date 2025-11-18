# Core Features Implementation Plan

## Overview

This document outlines the implementation strategy for the following features:

1. Create new chat functionality
2. Save and load chat history
3. Search functionality for chats and notes
4. Folder management (create, rename, delete)
5. Chat organization (move to folder, delete)
6. Settings page for API keys

## Current Status

### ✅ Already Implemented

- **User Authentication** - Manus OAuth integration complete
- **Database Schema** - All tables created (users, chats, messages, folders, projects, etc.)
- **Chat Interface** - React component with message display and input
- **Message Streaming** - Real-time response streaming from AI models
- **Credit System** - Credit deduction, balance tracking, and transactions
- **Model Switcher** - Support for 11+ AI models
- **Image Generation** - FAL AI integration for image creation
- **Stripe Payments** - Credit purchase functionality

### 🔄 Partially Implemented

- **Chat Router** - Basic CRUD operations exist but need enhancement
- **Projects Router** - Project creation exists but needs folder operations
- **Templates Router** - Template management exists

### ❌ Not Yet Implemented

- Search functionality (chats, messages, templates)
- Folder management UI (create, rename, delete)
- Chat organization UI (move to folder, delete)
- Settings page for API key management
- Chat history loading on app startup
- Auto-save chat functionality

## Implementation Strategy

### Phase 1: Backend Enhancements (Server-side)

#### 1.1 Enhance Chat Router (`server/routers/chat.ts`)

**Add these procedures:**

```typescript
// Get all chats for current user
chats.list: protectedProcedure.query(async ({ ctx }) => {
  // Return all chats with message count
})

// Get single chat with all messages
chats.getById: protectedProcedure
  .input(z.object({ chatId: z.number() }))
  .query(async ({ ctx, input }) => {
    // Return chat with messages
  })

// Create new chat
chats.create: protectedProcedure
  .input(z.object({ 
    title: z.string(),
    model: z.string(),
    folderId: z.number().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    // Create chat and return it
  })

// Update chat title
chats.updateTitle: protectedProcedure
  .input(z.object({ 
    chatId: z.number(),
    title: z.string()
  }))
  .mutation(async ({ ctx, input }) => {
    // Update chat title
  })

// Delete chat
chats.delete: protectedProcedure
  .input(z.object({ chatId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // Delete chat and all messages
  })

// Move chat to folder
chats.moveToFolder: protectedProcedure
  .input(z.object({ 
    chatId: z.number(),
    folderId: z.number().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    // Move chat to folder
  })

// Search chats by title or content
chats.search: protectedProcedure
  .input(z.object({ 
    query: z.string(),
    limit: z.number().optional()
  }))
  .query(async ({ ctx, input }) => {
    // Search chats and messages
  })
```

#### 1.2 Create Folders Router (`server/routers/folders.ts`)

**New file with procedures:**

```typescript
// Get all folders for current user
folders.list: protectedProcedure.query(async ({ ctx }) => {
  // Return all folders with chat count
})

// Create new folder
folders.create: protectedProcedure
  .input(z.object({ name: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Create folder
  })

// Update folder name
folders.updateName: protectedProcedure
  .input(z.object({ 
    folderId: z.number(),
    name: z.string()
  }))
  .mutation(async ({ ctx, input }) => {
    // Update folder name
  })

// Delete folder
folders.delete: protectedProcedure
  .input(z.object({ folderId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // Delete folder and move chats to root
  })
```

#### 1.3 Enhance User Settings Router

**Add procedures for API key management:**

```typescript
// Get user settings
settings.get: protectedProcedure.query(async ({ ctx }) => {
  // Return user settings (without sensitive data)
})

// Update API keys
settings.updateApiKeys: protectedProcedure
  .input(z.object({
    limitlessApiKey: z.string().optional(),
    openaiApiKey: z.string().optional(),
    anthropicApiKey: z.string().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    // Update API keys securely
  })

// Update selected model
settings.updateSelectedModel: protectedProcedure
  .input(z.object({ model: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Update default model
  })
```

### Phase 2: Frontend Components

#### 2.1 Create Settings Page (`client/src/pages/Settings.tsx`)

**Features:**
- Display current user info
- API key management section
- Default model selection
- Billing settings
- Account preferences

#### 2.2 Create Search Component (`client/src/components/SearchBar.tsx`)

**Features:**
- Search input with debouncing
- Real-time search results
- Filter by chat/template/note
- Keyboard shortcuts (Cmd+K / Ctrl+K)

#### 2.3 Enhance Sidebar with Folder Management

**Add to Sidebar:**
- Folder list with expand/collapse
- Create folder button
- Folder context menu (rename, delete)
- Drag-and-drop chat to folder

#### 2.4 Create Folder Management Dialog

**Components:**
- Create folder dialog
- Rename folder dialog
- Delete folder confirmation
- Move chat to folder dialog

#### 2.5 Enhance Chat Area

**Add:**
- Chat title editing
- Delete chat button
- Move to folder button
- Chat info sidebar

### Phase 3: Database Helpers

#### 3.1 Create `server/db/chat.ts`

```typescript
export async function getUserChats(userId: number) {
  // Get all chats for user with message count
}

export async function getChatWithMessages(chatId: number, userId: number) {
  // Get single chat with all messages
}

export async function createChat(userId: number, data: InsertChat) {
  // Create new chat
}

export async function updateChatTitle(chatId: number, userId: number, title: string) {
  // Update chat title
}

export async function deleteChat(chatId: number, userId: number) {
  // Delete chat and messages
}

export async function searchChats(userId: number, query: string) {
  // Search chats by title and message content
}

export async function moveChatToFolder(chatId: number, userId: number, folderId?: number) {
  // Move chat to folder
}
```

#### 3.2 Create `server/db/folder.ts`

```typescript
export async function getUserFolders(userId: number) {
  // Get all folders for user
}

export async function createFolder(userId: number, name: string) {
  // Create new folder
}

export async function updateFolderName(folderId: number, userId: number, name: string) {
  // Update folder name
}

export async function deleteFolder(folderId: number, userId: number) {
  // Delete folder
}

export async function getFolderChats(folderId: number, userId: number) {
  // Get all chats in folder
}
```

### Phase 4: Integration & Testing

#### 4.1 Connect Frontend to Backend

- Wire up all tRPC procedures to React components
- Implement loading states and error handling
- Add optimistic updates for better UX

#### 4.2 Test All Features

- Create new chat
- Load chat history
- Search chats
- Create/rename/delete folders
- Move chats between folders
- Update API keys in settings
- Test on mobile and desktop

## Implementation Order

1. **Backend Database Helpers** (Phase 3)
   - Create chat.ts and folder.ts helpers
   - Test database queries

2. **Backend Routers** (Phase 1)
   - Enhance chat router
   - Create folders router
   - Create settings router

3. **Frontend Components** (Phase 2)
   - Create Settings page
   - Create Search component
   - Enhance Sidebar with folders
   - Add folder management dialogs

4. **Integration** (Phase 4)
   - Connect components to tRPC procedures
   - Add error handling
   - Test end-to-end

## Estimated Timeline

- **Phase 1 (Backend):** 2-3 hours
- **Phase 2 (Frontend):** 3-4 hours
- **Phase 3 (Helpers):** 1-2 hours
- **Phase 4 (Testing):** 1-2 hours

**Total:** 7-11 hours of development

## Success Criteria

- ✅ Users can create new chats
- ✅ Chat history is saved and loaded
- ✅ Users can search chats and messages
- ✅ Users can create, rename, delete folders
- ✅ Users can move chats between folders
- ✅ Settings page displays and allows API key updates
- ✅ All features work on mobile and desktop
- ✅ No console errors or warnings
- ✅ All tRPC procedures return correct data

## Notes

- All database operations must validate user ownership
- API keys should be encrypted in database
- Search should be case-insensitive
- Folder operations should cascade properly
- Consider adding soft deletes for data recovery
- Implement proper error messages for user feedback

## Next Steps

1. Review this plan with the team
2. Start with Phase 3 (Database Helpers)
3. Move to Phase 1 (Backend Routers)
4. Implement Phase 2 (Frontend)
5. Complete Phase 4 (Testing)
6. Create pull request to merge into main
