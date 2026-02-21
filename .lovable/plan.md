

# Replace "SYNAPS" Text with Uploaded Logo

## What

Replace the visible "SYNAPS" brand text in the UI with the uploaded logo image (the stylized SYNAPS wordmark with the molecular/triangle icon).

## Changes

### 1. Copy the uploaded logo to the project
- Save `user-uploads://Gemini_Generated_Image_iqqkjsiqqkjsiqqk.png` to `src/assets/synaps-wordmark.png`

### 2. Update `src/pages/Workspace.tsx` (line 707)
- Replace `<span className="text-2xl font-bold text-primary">SYNAPS</span>` with an `<img>` tag importing the new wordmark logo
- Size it to match the previous text height (~32px tall)

### 3. Update `src/pages/MobileSync.tsx` (line 102)
- Same replacement: swap the `SYNAPS` text span for the wordmark image

### 4. Update `src/components/SettingsDialog.tsx` (line 54)
- Update the description from "Configure SYNAPS preferences" to use "Configure preferences" or keep as-is since this is descriptive text, not branding (optional -- will keep the text here as it reads naturally in context)

## Technical Details

- Import the image as an ES6 module: `import synapsWordmark from "@/assets/synaps-wordmark.png"`
- Use `<img src={synapsWordmark} alt="SYNAPS" className="h-8 object-contain" />` to replace each text instance
- The `h-8` class keeps the logo at roughly the same visual size as the previous `text-2xl` text

