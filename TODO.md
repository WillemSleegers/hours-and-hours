# Hours and Hours - Feature Roadmap

## Recently Completed

- [x] **Slot-Based Architecture** - Migrated from range-based entries to individual 15-min slots

  - Simpler data model and editing
  - No complex merge/split logic needed
  - Direct slot manipulation via clicking/dragging

- [x] **Mobile-First UI** - Floating island design optimized for thumb zones

  - Header: Total hours and date navigation
  - Footer: Date controls, time increment selector, project dropdown
  - All primary actions in easy-to-reach footer area

- [x] **Time Increment Setting** - Configurable selection granularity (15m/30m/1h)

  - Always displays 15-min slots for precision
  - Increment controls selection/hover snapping only
  - Accessible from footer for quick adjustment

- [x] **Date Filtering Bug** - Time entries appearing on all days instead of being filtered by specific date. Fixed by correcting the `order` column from `start_hour` to `start_time`.

## High Priority Features (Make entry faster/easier)

- [ ] **Date Picker Navigation** - Click on the date to open a calendar picker to jump to any specific day

  - Much faster than clicking arrow buttons repeatedly
  - Useful for entering time for past days or planning ahead
  - Could use shadcn calendar component

- [x] **Edit/Delete Time Entries** - ✅ Implemented as slot-based toggling

  - Select project from dropdown in footer
  - Click individual 15-min slots to toggle them on/off
  - Drag across multiple slots to fill quickly
  - Simple paint-style interaction - no modes or buttons needed

- [ ] **Copy Previous Day** - Button to copy all time entries from the previous day (or any recent day)

  - "Copy from..." dropdown showing last 7 days
  - Perfect for people with consistent schedules

- [ ] **Keyboard Shortcuts** - Quick keys for common actions:

  - Arrow keys (Left/Right) to navigate days
  - Number keys (1-9) to quickly select frequently-used projects
  - Escape to deselect active project
  - T key to jump to Today

- [x] **Quick Entry Mode** - ✅ Implemented as default behavior

  - Select project from dropdown (stays active)
  - Active project shown with color indicator in footer
  - Click/drag slots to instantly assign to active project
  - No toggle needed - this is the primary interaction model

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

- [ ] **Duplicate Detection Warning** - Alert when selecting a time that overlaps with existing entry (Note: Currently slots can only belong to one project via UNIQUE constraint)

  - Show visual indicator when trying to assign slot already taken by another project
  - Option to replace existing slot assignment

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

- [x] **Mobile Optimizations** - ✅ Mobile-first design implemented
  - Large touch targets for 15-min slots
  - Floating island UI elements
  - Footer-based controls in thumb zone
  - Project dropdown optimized for mobile

## Bugs

- [ ] **Hover effect without project selection** - Remove the hover effect on the grid when no project is selected. Currently the mouse turns into a pointer (hand) when no project is selected.
- [ ] **Fix 'Failed to delete entry' messages** - Adding slots returns a 'Failed to delete entry' message. Adding sequential slots doesn't work and actually deletes previously selected slots.

## Future Considerations

- [ ] **Multi-user Support** - User authentication and per-user data
- [ ] **Recurring Time Blocks** - Set up patterns that repeat weekly
- [ ] **Goals/Targets** - Set hour goals per project or per week
- [ ] **Calendar Integration** - Import events from Google Calendar/Outlook
- [ ] **Timer Mode** - Start/stop timer instead of manual entry (optional alternative mode)
- [ ] **Tags/Categories** - Tag entries for more granular filtering (e.g., "meeting", "coding", "planning")
- [ ] **Project Archiving** - Hide completed projects without deleting history
- [ ] **Billable Rate Tracking** - Track hourly rates per project for invoicing
