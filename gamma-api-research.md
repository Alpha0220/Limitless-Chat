# Gamma API Research Findings

## Overview
Gamma's API allows programmatic creation of presentations, documents, social media posts, and websites using AI-generated content.

## Authentication
- API Key based authentication (OAuth coming soon)
- Header: `X-API-KEY: sk-gamma-xxxxxxxx`
- Available to Pro, Ultra, Teams, and Business plan subscribers

## API Endpoint
**POST** `https://public-api.gamma.app/v1.0/generations`

## Key Parameters for Presentation Generation

### Required Parameters:
1. **inputText** (string, required)
   - Content to generate presentation from
   - Can be brief (few words) or detailed (up to 100,000 tokens ~400,000 chars)
   - Can include image URLs inline
   - Example: "Best hikes in the United States"

2. **textMode** (string, required)
   - Options: `generate`, `condense`, `preserve`
   - `generate`: Expands brief text into full content
   - `condense`: Summarizes long text
   - `preserve`: Keeps exact text with minimal modifications

3. **format** (string, required)
   - Options: `presentation`, `document`, `social`, `webpage`
   - For our use case: `presentation`

4. **themeId** (string, required)
   - Defines visual theme (colors, fonts)
   - Can be retrieved via GET Themes endpoint
   - Example: "Oasis"

### Optional but Important Parameters:

5. **numCards** (integer, optional)
   - Number of slides to create
   - Pro users: 1-60 slides
   - Ultra users: 1-75 slides
   - Default: 10

6. **cardSplit** (string, optional)
   - Options: `auto` or `inputTextBreaks`
   - `auto`: Divides content based on numCards
   - `inputTextBreaks`: Splits based on `\n---\n` in input

7. **additionalInstructions** (string, optional)
   - Extra specifications for content, layouts, style
   - Example: "Make the titles catchy"

8. **textOptions** (object, optional)
   - **amount**: `brief`, `moderate`, `detailed`
   - **tone**: Custom tone (e.g., "professional, inspiring")
   - **audience**: Target audience (e.g., "business executives")
   - **language**: Language code (e.g., "en")

9. **imageOptions** (object, optional)
   - **source**: `aiGenerated`, `noImages`, or provide URLs
   - **model**: `imagen-4-pro` (for AI-generated images)
   - **style**: `photorealistic`, `illustration`, etc.

10. **cardOptions** (object, optional)
    - **dimensions**: `fluid`, `standard`, `wide`, `square`
    - **headerFooter**: Configure headers/footers

11. **exportAs** (string, optional)
    - Options: `pdf`, `pptx`
    - Automatically exports after generation

12. **folderIds** (array, optional)
    - Organize generated presentations into folders

## User-Friendly Input Fields for Non-Technical Users

Based on the API parameters, here are the input fields to create:

1. **Topic/Content** (textarea)
   - Label: "What do you want your presentation about?"
   - Placeholder: "Enter a topic, outline, or detailed content..."
   - Maps to: `inputText`

2. **Content Mode** (radio/select)
   - Label: "How should we handle your content?"
   - Options:
     - "Generate from topic" → `textMode: generate`
     - "Summarize my content" → `textMode: condense`
     - "Use my exact text" → `textMode: preserve`

3. **Number of Slides** (number input)
   - Label: "How many slides?"
   - Range: 1-60 (Pro) or 1-75 (Ultra)
   - Default: 10
   - Maps to: `numCards`

4. **Content Amount** (radio/select)
   - Label: "How detailed should the content be?"
   - Options: Brief, Moderate, Detailed
   - Maps to: `textOptions.amount`

5. **Tone** (text input)
   - Label: "What tone should the presentation have?"
   - Placeholder: "e.g., professional, casual, inspiring..."
   - Maps to: `textOptions.tone`

6. **Target Audience** (text input)
   - Label: "Who is your audience?"
   - Placeholder: "e.g., business executives, students..."
   - Maps to: `textOptions.audience`

7. **Visual Theme** (select dropdown)
   - Label: "Choose a visual theme"
   - Options: Fetch from GET Themes API
   - Maps to: `themeId`

8. **Image Style** (radio/select)
   - Label: "Image style"
   - Options:
     - "AI-generated photorealistic"
     - "AI-generated illustration"
     - "No images"
   - Maps to: `imageOptions.source` and `imageOptions.style`

9. **Additional Instructions** (textarea, optional)
   - Label: "Any special instructions? (optional)"
   - Placeholder: "e.g., Make titles catchy, use bullet points..."
   - Maps to: `additionalInstructions`

10. **Export Format** (radio)
    - Label: "Export as"
    - Options: PDF, PowerPoint (PPTX), View in Gamma
    - Maps to: `exportAs`

## Credit Cost
- Need to determine credit cost per presentation generation
- Suggest: 20-30 credits per presentation (higher than image generation due to complexity)

## Response Format
```json
{
  "id": "generation_id",
  "status": "pending" | "completed" | "failed",
  "url": "https://gamma.app/docs/...",
  "exportUrl": "https://..." // if exportAs specified
}
```

## Polling for Status
- Use GET endpoint to check generation status
- `GET https://public-api.gamma.app/v1.0/generations/{generation_id}`

## Implementation Plan
1. Store Gamma API key securely
2. Create backend helper function
3. Add tRPC procedure for presentation generation
4. Create user-friendly form with all input fields above
5. Implement polling for generation status
6. Display generated presentation link and export options
7. Add credit deduction (20-30 credits per generation)
