

# Replace SYNAPS Wordmark Logo

## What
Replace the current `src/assets/synaps-wordmark.png` with the newly uploaded logo image.

## Changes

### 1. Copy the new logo
- Overwrite `src/assets/synaps-wordmark.png` with `user-uploads://logoup.png`

No code changes needed -- the existing imports in `Workspace.tsx` and `MobileSync.tsx` already reference `@/assets/synaps-wordmark.png`, so swapping the file is all that's required.

