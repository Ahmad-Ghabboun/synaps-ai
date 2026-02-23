
# Workspace Improvements

## Overview
Two changes: (1) Use the light-mode logo in dark mode too, and (2) make the prompt textarea auto-grow with content instead of having a fixed height with internal scrolling.

## Changes

### 1. Use light-mode logo in dark mode (`src/pages/Workspace.tsx`)
- Line 709: Change `src={darkMode ? synapsWordmarkDark : synapsWordmark}` to just `src={synapsWordmark}`
- The `synapsWordmarkDark` import can be removed (line 3)

### 2. Auto-growing prompt textarea (`src/pages/Workspace.tsx`)
- Remove `max-h-[120px]` from the textarea className (line 883) so it doesn't cap height and create internal scrolling
- Remove `overflow: hidden` behavior -- the textarea should not scroll internally
- Add an `autoResize` effect: on every `inputText` change, reset the textarea height to `auto`, then set it to `scrollHeight`. This makes it grow naturally with content.
- Add `overflow-hidden` to the textarea className to prevent the internal scrollbar
- Keep a reasonable soft max (e.g., `max-h-[300px]`) so it doesn't consume the entire screen, or remove max entirely and let the flex layout handle it

### Technical Details

**Textarea auto-resize logic** (add a `useEffect`):
```
useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }
}, [inputText]);
```

**Textarea className change** (line 883):
- From: `min-h-[40px] max-h-[120px] py-1`
- To: `min-h-[40px] overflow-hidden py-1`

This removes the scroll constraint and lets the auto-resize effect control height dynamically.
