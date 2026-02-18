

# Fix Optimizer (Skill 3) -- Zero-Loss Merging and UI Sync

## Problems Identified

1. **Section replacement destroys content**: `replaceSectionInSQAP()` drops all existing lines in the target section and replaces them with only the optimizer output. The full document structure is preserved, but the section body is lost.

2. **Files array not updated after fix**: `handleFix()` calls `updateCurrentProject({ sqap: updatedSqap })` without rebuilding the `files` array. Since the left panel reads from `project.files[].content` (the `SQAP.md` file object), the accordion goes blank after a fix because the file object still has stale/missing content.

3. **No reactive re-render on file changes**: The `sections` variable is computed inline but there is no mechanism to force re-render when the files array updates asynchronously.

---

## Changes

### 1. Update Optimizer System Prompt (Edge Function)

**File:** `supabase/functions/synaps-ai/index.ts`

Update `OPTIMIZER_PROMPT` to instruct the LLM to output the **entire SQAP document** with the fix merged in, not just the corrected section. The prompt will explicitly say:
- Treat the current SQAP as a base document
- Merge/append new technical requirements into the relevant section header
- Never delete or omit any existing sections
- Output the complete document in Markdown

This ensures the optimizer returns a full, intact SQAP with the fix intelligently merged.

### 2. Rewrite `handleFix()` in Workspace.tsx

**File:** `src/pages/Workspace.tsx`

- Remove the call to `replaceSectionInSQAP()` entirely since the optimizer now returns the complete document
- After receiving the full merged SQAP from the optimizer, immediately call `buildFiles(updatedSqap)` to regenerate the `SQAP.md` file object
- Update the project with both `sqap` and `files` in a single `updateCurrentProject()` call so the UI syncs immediately
- When re-running the audit after the fix, pass the updated SQAP and rebuild files again with audit results

### 3. Add `useEffect` for File-Driven Re-Render

**File:** `src/pages/Workspace.tsx`

- Add a `sqapContent` state variable driven by a `useEffect` that watches `currentProject.files`
- When the files array changes, extract the `SQAP.md` file content and set it to state
- The `sections` array will be computed from this state, guaranteeing a re-render whenever files update
- This replaces the current inline computation (lines 244-246)

### 4. Remove `replaceSectionInSQAP` Function

**File:** `src/pages/Workspace.tsx`

Delete the `replaceSectionInSQAP` helper function (lines 437-460) as it is no longer needed with the full-document optimizer approach.

---

## Technical Details

### Edge Function Prompt Change

The `OPTIMIZER_PROMPT` constant will change from:

> "Fix the following security or technical flaw... Output the corrected section content in Markdown format (without the ## heading) that can replace the flawed section."

To:

> "You are a Security Architect. You will receive a complete SQAP document and a specific flaw to fix. You MUST output the ENTIRE document with the fix merged into the relevant section. Never remove or omit any existing sections, headings, or content. Append or intelligently merge new technical requirements under the appropriate headers. Output the full corrected SQAP in Markdown format."

### handleFix Flow (After)

```text
1. Call optimizer with full SQAP + risk details
2. Receive complete merged SQAP back
3. Update project: sqap = mergedSqap, files = buildFiles(mergedSqap)
4. Left panel re-renders immediately via useEffect
5. Re-run audit on the merged SQAP
6. Update project again with audit results + rebuilt files
```

### useEffect Addition

```text
- Watch: currentProject?.files
- Extract: SQAP.md content from files array, fallback to currentProject.sqap
- Set: local state variable that drives sections computation
- Result: Accordion always reflects latest file content
```

