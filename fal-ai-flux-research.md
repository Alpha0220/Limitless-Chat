# FAL AI Flux Schnell API Research

Source: https://fal.ai/models/fal-ai/flux/schnell/api

## Key Findings

### Correct Input Parameters

The Flux Schnell model accepts the following input parameters:

```typescript
{
  prompt: string (required),
  num_inference_steps: integer (default: 4),
  image_size: ImageSize | { width: number, height: number } (default: "landscape_4_3"),
  seed: integer (optional),
  guidance_scale: float (optional),
  num_images: integer (default: 1),
  enable_safety_checker: boolean (default: true),
  output_format: "jpeg" | "png" (optional),
  acceleration: string (optional)
}
```

### Valid Image Size Values

Enum values for `image_size`:
- `square_hd`
- `square`
- `portrait_4_3`
- `portrait_16_9`
- `landscape_4_3`
- `landscape_16_9`

**Note:** For custom sizes, pass an object: `{ width: 1280, height: 720 }`

### Example Usage

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/flux/schnell", {
  input: {
    prompt: "Your prompt here",
    num_inference_steps: 4,
    image_size: "landscape_4_3"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
```

### Output Format

The result contains:
```javascript
{
  data: {
    images: [
      {
        url: string,
        width: number,
        height: number,
        content_type: string
      }
    ]
  },
  requestId: string
}
```

## Issue Identified

Our current implementation uses:
- `num_inference_steps` ✅ (correct)
- `image_size` ✅ (correct)
- `num_images` ✅ (correct)

The "Unprocessable Entity" error might be due to:
1. Invalid `image_size` value format
2. Missing required fields
3. API version mismatch

## Fix Required

Update the image size mapping to match the exact enum values expected by the API.
