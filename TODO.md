# Hours and Hours - Feature Roadmap

## High Priority Features (Make entry faster/easier)

- [ ] **Date Picker Navigation** - Click on the date to open a calendar picker to jump to any specific day

  - Much faster than clicking arrow buttons repeatedly
  - Useful for entering time for past days or planning ahead
  - Could use shadcn calendar component

- [ ] **Copy Previous Day** - Button to copy all time entries from the previous day (or any recent day)

  - "Copy from..." dropdown showing last 7 days
  - Perfect for people with consistent schedules

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

## Future Considerations

- [ ] **Multi-user Support** - User authentication and per-user data
- [ ] **Timer Mode** - Start/stop timer instead of manual entry (optional alternative mode)
- [ ] **Tags/Categories** - Tag entries for more granular filtering (e.g., "meeting", "coding", "planning")
- [ ] **Project Archiving** - Hide completed projects without deleting history

## Bugs

- [ ] The login screen shows an error about failing to load something
- [ ] The footer and header don't stay in their position while scrolling. The header disappears when scrolling down and re-appears scrolling up. The footer moves up a bit when scrolling down and moves all the way to the bottom when scrolling up. Importantly, this isn't a problem when first loading the app, but it becomes a problem after the note dialog window has been opened.
- [ ] The dialog window affects your position in the time grid. When you add a note to an early time slot (such as 9 AM), the dialog window moves the time grid up, likely as a result of the keyboard sliding in, but when you then close the window, you stay in the same position rather than being positioned on the slot you added a note to.
