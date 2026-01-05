# Personalization Settings - Implementation Checklist

## Phase 1: Database & Data Model ✅
- [x] Extend userSettings table with personalization fields
- [x] Create personalization_memories table
- [x] Run database migration (`pnpm db:push`)

## Phase 2: Backend - Data Access Layer ✅
- [x] Add database helpers in `server/db.ts`:
  - [x] `getPersonalizationSettings(userId)`
  - [x] `updatePersonalizationSettings(userId, settings)`
  - [x] `resetPersonalizationToDefaults(userId)`
  - [x] `getSavedMemories(userId)`
  - [x] `addMemory(userId, memoryType, content, source)`
  - [x] `clearMemories(userId)`
  - [x] `getSearchPersonalizationStatus(userId)`

## Phase 3: Backend - tRPC Router 🔄 IN PROGRESS
- [ ] Create `server/routers/personalization.ts`:
  - [ ] `getSettings` procedure - Fetch user's personalization settings
  - [ ] `updateSettings` procedure - Update personalization preferences
  - [ ] `resetToDefaults` procedure - Reset all settings to defaults
  - [ ] `getMemories` procedure - Fetch saved memories
  - [ ] `clearMemories` procedure - Clear all saved memories
  - [ ] `getSearchPersonalizationStatus` procedure - Get computed search status
- [ ] Register personalization router in `server/routers.ts`
- [ ] Add input validation schemas (zod)

## Phase 4: Backend - AI Response Integration
- [ ] Update OpenRouter integration (`server/_core/openrouter.ts`):
  - [ ] Create `buildPersonalizedSystemPrompt(userId, baseSystemPrompt)` function
  - [ ] Fetch user's personalization settings
  - [ ] Construct system prompt with style/tone preferences
  - [ ] Include nickname, occupation, interests, values
- [ ] Update chat streaming endpoint:
  - [ ] Fetch personalization settings before API call
  - [ ] Check `allowReferenceHistory` - include/exclude previous messages
  - [ ] Check `allowSavedMemory` - include/exclude saved memories
  - [ ] Build personalized system prompt
  - [ ] Pass to OpenRouter with personalized instructions
- [ ] Implement memory management:
  - [ ] Extract important user preferences from responses
  - [ ] Store memories if `allowSavedMemory` is true
  - [ ] Clear memories if toggled off

## Phase 5: Frontend - Personalization Page
- [ ] Create `client/src/pages/Personalization.tsx`:
  - [ ] Section 1: Style & Tone
    - [ ] Dropdown for `baseTone` (formal, friendly, concise, detailed)
    - [ ] Multi-select for `additionalPreferences`
  - [ ] Section 2: User Identity
    - [ ] Text input for `nickname`
    - [ ] Text input for `occupation`
    - [ ] Text area for `interests`
    - [ ] Text area for `values`
    - [ ] Text area for `communicationPreferences`
  - [ ] Section 3: Memory & History Settings
    - [ ] Toggle for `allowSavedMemory`
    - [ ] Toggle for `allowReferenceHistory`
    - [ ] "Clear Saved Memories" button
  - [ ] Section 4: Search Personalization Status
    - [ ] Read-only display of search status
  - [ ] Section 5: Actions
    - [ ] Save button with dirty state tracking
    - [ ] Cancel button
    - [ ] Reset to Defaults button with confirmation
- [ ] Add form validation (react-hook-form + zod)
- [ ] Add route to `client/src/App.tsx` - `/personalization`
- [ ] Update `client/src/components/Sidebar.tsx` - Ensure link is active

## Phase 6: Frontend - Integration with Chat
- [ ] Update `client/src/pages/Home.tsx`:
  - [ ] Fetch personalization settings on mount
  - [ ] Display nickname in chat interface
  - [ ] Show visual indicator if personalization is active
- [ ] Update chat components:
  - [ ] Display personalization status in header
  - [ ] Show active tone/preferences
  - [ ] Quick link to Personalization page

## Phase 7: UI/UX Polish
- [ ] Add visual indicators:
  - [ ] Icon next to nickname when set
  - [ ] Badge showing active tone preference
  - [ ] Color-coded toggles
- [ ] Add helpful descriptions:
  - [ ] Explain each setting with examples
  - [ ] Show how settings affect AI responses
  - [ ] Provide preset templates (Professional, Casual, Educational)
- [ ] Add loading states:
  - [ ] Spinner while fetching settings
  - [ ] Disable form during save
  - [ ] Success toast after save
- [ ] Responsive design:
  - [ ] Mobile-friendly layout
  - [ ] Touch-friendly inputs

## Phase 8: Security & Privacy
- [ ] Implement access control:
  - [ ] Use `protectedProcedure` for all routes
  - [ ] Verify `ctx.user.id` matches settings owner
- [ ] Data validation:
  - [ ] Validate all inputs on backend
  - [ ] Sanitize text inputs
  - [ ] Prevent injection attacks
- [ ] Audit logging (optional):
  - [ ] Log personalization changes
  - [ ] Log memory operations

## Phase 9: Testing
- [ ] Backend tests:
  - [ ] Test tRPC procedures
  - [ ] Test memory storage/retrieval
  - [ ] Test default values
  - [ ] Test access control
- [ ] Frontend tests:
  - [ ] Test form submission
  - [ ] Test settings persistence
  - [ ] Test toggles
  - [ ] Test reset to defaults
- [ ] Integration tests:
  - [ ] Test AI response includes personalization
  - [ ] Test tone changes affect responses
  - [ ] Test memory storage/clearing
  - [ ] Test history references
- [ ] E2E tests:
  - [ ] User sets personalization → AI responds with correct tone
  - [ ] User disables memory → No memories stored
  - [ ] User disables history → No past conversations referenced

## Phase 10: Documentation & Deployment
- [ ] Update main `todo.md` - Add Personalization feature items
- [ ] Add code comments - Document new functions
- [ ] Create user documentation - Explain each setting
- [ ] Create checkpoint - Save working state
- [ ] Create PR - Merge fix/card-setting → dev → main

---

## Summary

**Total Phases:** 10
**Completed:** 2 (Database, Data Access Layer)
**In Progress:** 1 (tRPC Router)
**Remaining:** 7

**Key Features:**
- Customizable AI response tone and style
- User identity preferences (nickname, occupation, interests)
- Memory and chat history management
- Dynamic system prompt generation
- Search personalization based on settings

**Default Values:**
- `baseTone`: friendly
- `allowSavedMemory`: true
- `allowReferenceHistory`: true


## DEBUGGING - Personalization Feature Not Working

### Issue 1: Personalization page not fetching saved settings
- [ ] Frontend form shows empty values instead of saved settings
- [ ] tRPC query `getSettings` not returning data
- [ ] useEffect not loading settings into form state

### Issue 2: AI not using personalization settings
- [ ] Nickname not appearing in AI responses
- [ ] Tone preference not affecting response style
- [ ] System prompt not being built with user preferences

### Issue 3: Settings not being saved to database
- [ ] updateSettings mutation not persisting data
- [ ] Database record not being created/updated

### Issue 4: stream-chat.ts not fetching personalization
- [ ] getPersonalizationSettings not called before API
- [ ] buildPersonalizedSystemPrompt not being used
- [ ] System prompt not being sent to OpenRouter
