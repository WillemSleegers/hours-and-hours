# Notes Flow UX Discussion

## Current Problem (Identified by User)

The current workflow for adding notes to entries is cumbersome:

1. Select a project
2. Add time slots
3. **Deselect the project** (required!)
4. Tap on an entry
5. Add note

**Issue**: "It's quite the hassle when I would like to add notes for different entries"

## Current Implementation

- When **no project is selected**: Clicking an entry opens the note dialog
- When **project is selected**: Clicking an entry toggles slots (add/remove)
- This means you can't add notes while a project is selected
- Must deselect project → click entry → add note → select project again (if continuing)

## Proposed Solution

### Add a dedicated note icon button on every entry

**Visual Design:**
- Small note icon on the right side of each entry (next to project name)
- Icon states:
  - Outlined/empty when entry has no note
  - Filled/solid when entry has a note

**Interaction:**
- Clicking the **note icon** → Always opens note dialog (regardless of project selection)
- Clicking the **entry body** → Current behavior (toggle slots when project selected)

**Benefits:**
- ✅ Notes are always one click away
- ✅ No need to deselect/reselect project
- ✅ Clear visual indicator of which entries have notes
- ✅ Doesn't interfere with slot toggling workflow
- ✅ Can add notes to multiple entries without changing project selection

### Implementation Details

```typescript
// In time-grid.tsx entry rendering:
{entry && isEntryStart && (
  <>
    <div className="flex items-center gap-1.5">
      <span>{getProjectName(entry.project_id)}</span>
      {/* Current: Shows StickyNote icon only when note exists */}
      {/* Proposed: Always show note button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          handleNoteEdit(entry)
        }}
      >
        {entry.note ? (
          <StickyNote className="h-4 w-4" /> // Filled
        ) : (
          <StickyNoteOutline className="h-4 w-4 opacity-50" /> // Outlined
        )}
      </Button>
    </div>
  </>
)}
```

## Alternative Approaches (Considered)

### Option A: Always show delete button on entries
- Pro: Always accessible
- Con: Takes up space, clutters UI

### Option B: Add delete button inside note dialog
- Pro: Clean main UI
- Con: Requires opening dialog to delete

### Option C: Two different gestures (click vs long-press)
- Pro: No UI clutter
- Con: Not discoverable, different on mobile/desktop

### Option D: Two-step interaction (first click = select, second = edit)
- Pro: Keeps current pattern
- Con: Requires two clicks to edit note

## Status

**User is still thinking about this.** Discussion paused to work on other features (daily stats page, layout improvements).

## Next Steps When Resumed

1. Decide on approach
2. Update time-grid.tsx to add note icon buttons
3. Test the new workflow
4. Consider if we still need the current "click entry to open note" when no project selected
