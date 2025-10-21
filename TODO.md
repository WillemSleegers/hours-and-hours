# Hours and Hours - Feature Roadmap

## Bugs to Fix

- [x] **Date Filtering Bug** - Time entries appearing on all days instead of being filtered by specific date. Fixed by correcting the `order` column from `start_hour` to `start_time`.

## High Priority Features (Make entry faster/easier)

- [ ] **Date Picker Navigation** - Click on the date to open a calendar picker to jump to any specific day
  - Much faster than clicking arrow buttons repeatedly
  - Useful for entering time for past days or planning ahead
  - Could use shadcn calendar component

- [ ] **Edit/Delete Time Entries** - Enable clicking on an entry to edit or delete it. Essential for fixing mistakes.
  - Click on entry to open edit dialog
  - Show start/end time and project
  - Allow changing project, adjusting times, or deleting

- [ ] **Copy Previous Day** - Button to copy all time entries from the previous day (or any recent day)
  - "Copy from..." dropdown showing last 7 days
  - Perfect for people with consistent schedules

- [ ] **Keyboard Shortcuts** - Quick keys for common actions:
  - Arrow keys (Left/Right) to navigate days
  - Number keys (1-9) to quickly select frequently-used projects
  - Enter to confirm selection
  - Escape to cancel selection
  - T key to jump to Today

- [ ] **Quick Entry Mode** - Select project first (stays "active"), then click time blocks to fill rapidly
  - Toggle mode with button or keyboard shortcut
  - Shows which project is currently selected
  - Click blocks to instantly assign to active project

- [ ] **Templates/Presets** - Save common day patterns and apply with one click
  - "Save as template" button when viewing a day
  - Name templates (e.g., "Typical Monday", "Client Work Day")
  - "Load template" dropdown to apply saved patterns

## Medium Priority (Quality of life)

- [ ] **Time Entry Notes** - Optional description field for context
  - Add notes/description to individual entries
  - Shows in tooltip on hover
  - Useful for tracking what specifically you worked on

- [ ] **Week View** - See all 7 days at once
  - Horizontal layout showing Mon-Sun
  - Easier batch entry and pattern recognition
  - Quick navigation between weeks

- [ ] **Duplicate Detection Warning** - Alert when selecting a time that overlaps with existing entry
  - Show warning dialog before creating overlapping entry
  - Option to replace or adjust existing entry

- [ ] **Recent Projects Quick Access** - Show 3-5 most recently used projects at top of selector
  - Separate "Recent" section in project selector
  - Makes frequent projects faster to access

- [ ] **Date Range Stats** - Filter project overview by date range
  - This week / This month / Custom range picker
  - Shows hours per project for selected period
  - Useful for invoicing and time analysis

## Lower Priority (Nice to have)

- [ ] **Undo/Redo** - Quick undo for accidental entries
  - Ctrl+Z / Cmd+Z to undo last action
  - Ctrl+Shift+Z / Cmd+Shift+Z to redo
  - Show toast with "Undo" button after actions

- [ ] **Project Color Themes** - Pre-defined color palettes to choose from
  - Color picker with suggested palettes
  - Colorblind-friendly options

- [ ] **Export to CSV/PDF** - Generate reports for invoicing or record-keeping
  - Export time entries for date range
  - Group by project or by day
  - Include project totals and grand total

- [ ] **Break Time Tracking** - Special "break" project type
  - Mark certain projects as "non-billable"
  - Exclude from total hours calculation
  - Different visual style (e.g., striped pattern)

- [ ] **Mobile Optimizations** - Better touch gestures for mobile entry
  - Improved touch targets for small screens
  - Swipe gestures for navigation
  - Mobile-specific project selector (bottom sheet style)

## Future Considerations

- [ ] **Multi-user Support** - User authentication and per-user data
- [ ] **Recurring Time Blocks** - Set up patterns that repeat weekly
- [ ] **Goals/Targets** - Set hour goals per project or per week
- [ ] **Calendar Integration** - Import events from Google Calendar/Outlook
- [ ] **Timer Mode** - Start/stop timer instead of manual entry (optional alternative mode)
- [ ] **Tags/Categories** - Tag entries for more granular filtering (e.g., "meeting", "coding", "planning")
- [ ] **Project Archiving** - Hide completed projects without deleting history
- [ ] **Billable Rate Tracking** - Track hourly rates per project for invoicing
