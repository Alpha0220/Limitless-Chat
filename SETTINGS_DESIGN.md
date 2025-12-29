# Settings Page Design & Implementation Plan

## Overview
Settings page for Limitless Chat with API key management, user preferences, and account settings. Uses Apple-inspired light theme with dark mode support.

## Design Structure

### Page Layout
```
┌─────────────────────────────────────────────────────────┐
│ Settings                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  AI Configuration                                       │
│  ├─ OpenAI API Key      [••••••••••••••••] [Show]      │
│  ├─ Anthropic API Key   [••••••••••••••••] [Show]      │
│  └─ Default Model       [Dropdown: Gemini 2.0 Flash] │
│                                                         │
│  Limitless Integration                                  │
│  └─ Limitless API Key   [••••••••••••••••] [Show]      │
│                                                         │
│  Preferences                                            │
│  ├─ Theme              [Light] [Dark] [System]         │
│  └─ Auto-save Settings [Toggle]                        │
│                                                         │
│  Account                                                │
│  ├─ Email: user@example.com                            │
│  ├─ Member Since: Jan 1, 2024                          │
│  └─ [Logout Button]                                     │
│                                                         │
│  [Save Changes] [Cancel]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Color Scheme (Apple-inspired Light Theme)
- **Background**: White (#FFFFFF)
- **Sidebar**: Light Gray (#F5F5F7)
- **Accent**: Apple Blue (#007AFF)
- **Text Primary**: Dark Gray (#1D1D1D)
- **Text Secondary**: Medium Gray (#666666)
- **Border**: Light Border (#E5E5E7)
- **Input Background**: White (#FFFFFF) with subtle border
- **Success**: Green (#34C759)
- **Error**: Red (#FF3B30)

### Typography
- **Page Title**: System Font, 32px, Bold
- **Section Headers**: System Font, 18px, Semibold
- **Labels**: System Font, 14px, Medium
- **Input Text**: System Font, 16px, Regular
- **Helper Text**: System Font, 12px, Regular, Gray

### Components Used
- **Input Fields**: shadcn/ui Input with password toggle
- **Dropdowns**: shadcn/ui Select
- **Buttons**: shadcn/ui Button (Primary, Secondary, Danger)
- **Toggles**: shadcn/ui Switch
- **Notifications**: sonner Toast
- **Form Validation**: react-hook-form + zod

## Database Schema (Already Exists)

```sql
CREATE TABLE user_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  limitlessApiKey VARCHAR(255),
  openaiApiKey VARCHAR(255),
  anthropicApiKey VARCHAR(255),
  selectedModel VARCHAR(100),
  theme VARCHAR(20) DEFAULT 'light',
  autoSave BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## API Endpoints (tRPC Procedures)

### settings.getSettings
- **Type**: Query
- **Auth**: Protected (requires user session)
- **Returns**: User settings object
- **Error Handling**: Return empty/default settings if not found

### settings.updateSettings
- **Type**: Mutation
- **Auth**: Protected
- **Input**: Partial settings object
- **Returns**: Updated settings object
- **Validation**: 
  - API keys must be non-empty if provided
  - Model must be valid from available models list
  - Theme must be one of: 'light', 'dark', 'system'
- **Error Handling**: Validate input, handle DB errors gracefully

## Frontend Implementation

### Settings.tsx Structure
1. **Form Setup**: Use react-hook-form with zod validation
2. **Data Loading**: Use trpc.settings.getSettings.useQuery()
3. **Form Submission**: Use trpc.settings.updateSettings.useMutation()
4. **Password Toggle**: Show/hide password for API keys
5. **Success/Error Handling**: Toast notifications
6. **Responsive Design**: Mobile-friendly layout

### Validation Schema (Zod)
```typescript
const settingsSchema = z.object({
  openaiApiKey: z.string().optional().or(z.literal('')),
  anthropicApiKey: z.string().optional().or(z.literal('')),
  limitlessApiKey: z.string().optional().or(z.literal('')),
  selectedModel: z.string().min(1, 'Model is required'),
  theme: z.enum(['light', 'dark', 'system']),
  autoSave: z.boolean(),
});
```

## Integration Points

### Navigation
- Add "Settings" link to DashboardLayout sidebar
- Route: `/settings`
- Icon: Gear/Cog icon from lucide-react

### Data Flow
1. User navigates to Settings
2. Component loads current settings via trpc query
3. Form populates with existing values
4. User modifies settings
5. On save, mutation sends to backend
6. Backend validates and updates database
7. Frontend shows success/error toast
8. UI updates with new values

### Error Scenarios
- API key validation fails → Show error message
- Network error → Retry button
- Database error → Generic error message
- Unauthorized access → Redirect to login

## Security Considerations
- API keys stored encrypted in database (use environment-based encryption if available)
- Never log API keys to console
- Use password input type for sensitive fields
- Validate API keys on backend before saving
- Use HTTPS for all API calls
- Clear sensitive data from memory after use

## Testing Checklist
- [ ] Load settings page without errors
- [ ] Display current user settings
- [ ] Update API keys successfully
- [ ] Update model selection
- [ ] Update theme preference
- [ ] Show validation errors for invalid input
- [ ] Show success toast on save
- [ ] Show error toast on failure
- [ ] Responsive on mobile (375px+)
- [ ] Dark mode works correctly
- [ ] Logout functionality works
- [ ] Settings persist after page reload
