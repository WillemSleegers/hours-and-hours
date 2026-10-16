# Hours and Hours

An intuitive time tracking app focused on simplicity and ease of use.

## Features

- **Daily View**: Tap slots to add 15-minute time blocks and assign them to projects
- **Notes on Slots**: Add notes to time slots to track what you worked on
- **Touch-Optimized**: Simple tap interface designed for mobile and touch screens
- **Flexible Day Hours**: Set custom start and end times for your workday
- **Smart Time Grid**: Automatically expands to show slots outside your working hours, and can reveal earlier/later hours on demand
- **Day Stats**: Hours per project for a single day, opened from the day total in the header
- **Statistics Page**: Aggregated hours per project with a saved date range filter
- **Export**: Download time data as CSV (summary or detailed) or JSON
- **Project Management**: Create, edit, archive, and delete projects with custom colors
- **Authentication**: Sign in with GitHub or magic email links
- **Light/Dark Mode**: Light, dark, or follow the system
- **Optimistic UI**: All changes happen instantly with async Supabase sync
- **Installable**: Can be added to the home screen as a PWA

## Tech Stack

- **Framework**: Next.js 16 with React 19 and React Compiler
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (GitHub OAuth + Magic Links)
- **Type Safety**: TypeScript
- **Date Handling**: date-fns
- **Package Manager**: pnpm

## Database Schema

The app uses three main tables:

### Projects

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `name`: Text (project name)
- `color`: Text (hex color code)
- `archived`: Boolean (whether project is archived)
- `created_at`, `updated_at`: Timestamps

### Time Slots

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `project_id`: UUID (foreign key to projects)
- `date`: Date (the day the hours were worked)
- `time_slot`: Decimal (fractional hour in 15-min increments, e.g., 9.0, 9.25, 9.5, 9.75)
- `note`: Text (optional note for the time slot)
- `created_at`, `updated_at`: Timestamps

**Note**: The app uses 15-minute slots as the atomic unit. Consecutive slots for the same project are visually grouped into entries in the UI, but stored as individual 15-minute slots in the database.

The app relies on two database rules: a unique constraint on (`user_id`, `date`, `time_slot`), which it uses to detect a slot that already exists, and deleting a project also deleting its time slots (`ON DELETE CASCADE`), which the delete confirmation promises.

### User Settings

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `day_start_hour`: Integer (0-23, when your day starts)
- `day_end_hour`: Integer (1-24, when your day ends)
- `stats_start_date`: Date (saved filter for statistics page)
- `stats_end_date`: Date (saved filter for statistics page)
- `created_at`, `updated_at`: Timestamps

A settings row with default working hours (09:00–17:00) is created on first sign-in.

## Design Philosophy

The interface is designed around a simple tap-based interaction model optimized for touch screens.

### Adding Slots

1. **Select a project** from the dropdown in the footer
2. **Tap empty time slots** to add 15-minute blocks for that project
3. **Tap a slot of another project** to reassign it to the selected project

**Why it works this way:**

- **Tap instead of drag** is more reliable on touch screens and prevents accidental selections
- **A tap only counts if the finger barely moved**, so scrolling through the day never adds slots
- **Tapping a slot of another project reassigns it**, which makes corrections a single tap. If that slot has a note, you're asked to confirm first, because reassigning removes the note
- **15-minute increments** provide precision while keeping the interface clean

### Working with a Slot

1. **Tap a slot of the selected project** (or any slot, when no project is selected) → opens the expandable section below it
2. **Type a note** directly in the section; it saves when you tap away or press Enter
3. **Use the buttons in the slot** to:
   - **Fill a gap (↑ / ↓)**: extend the entry up or down to the next slot of the same project, filling the empty slots in between. The buttons only appear when there is such a gap with nothing else in it
   - **Delete (trash)**: choose **Delete slot** for just this 15 minutes, or **Delete entry** for the whole run of consecutive slots of this project
4. **Tap the slot again** to collapse the section. Clearing the selected project also collapses it

**Why it works this way:**

- **Tapping your own slot opens it instead of removing it**, so quickly adding slots never deletes anything by accident. Deleting is always an explicit choice in the trash menu
- **Notes are edited inline** rather than in a dialog, so adding one takes no extra taps
- **Fill-gap buttons** extend an entry across a gap without tapping every slot in between
- **Delete slot vs. delete entry** reflects that slots are the stored unit while entries are what you see: removing one meeting shouldn't take eight taps
- **Actions are hidden until needed** to keep the timeline clean, and a short 150ms animation shows which slot is open

### Navigating

- **Day navigation**: The arrows and calendar in the footer switch days; the selected day is kept when you visit other pages and come back
- **Working hours**: The grid shows your working hours from Settings, automatically widened to include any slots outside them. "Show earlier/later hours" reveals one more hour at a time for the current day
- **Day stats**: Tap the hours total in the header to see that day's hours per project

## Usage

1. **Sign In**: Use GitHub OAuth or magic email link to authenticate

2. **Create Projects**: Go to Projects page to:
   - Create projects with custom names and colors
   - Archive projects you're no longer working on (they're hidden from the project selector)
   - Edit or delete existing projects

3. **Configure Settings**: Go to Settings to:
   - Set your preferred day start and end times
   - Choose a light, dark, or system theme

4. **Track Time**: See the Design Philosophy section above for detailed interaction patterns

5. **View Statistics**: Check the Statistics page to:
   - See total hours across all projects
   - Filter by date range (remembered between visits)
   - Include or hide archived projects
   - Export the filtered data as CSV or JSON

## Development

```bash
# Install dependencies (pnpm via Corepack or Homebrew)
pnpm install

# Run development server
pnpm dev

# Lint
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

Supabase credentials are read from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e.g. in `.env.local`).

`pnpm-workspace.yaml` skips package versions published less than 24 hours ago and lists which dependencies may run install scripts.

## Architecture

- **Optimistic Updates**: All mutations update the UI immediately and sync with Supabase in the background. On failure, only the changed items are rolled back and a toast explains what happened
- **Shared State**: React contexts (`lib/contexts/`) hold the signed-in user, projects, settings, and the selected day. Projects and settings are tied to the signed-in user, so they reload on sign-in and clear on sign-out
- **Hooks**: `useTimeSlots` loads and mutates one day's slots; responses that arrive after you've moved to another day are ignored. `useProjects`, `useUserSettings`, `useAuth`, and `useDateNavigation` read the contexts
- **Component Library**: Built on shadcn/ui for consistent, accessible components
- **Type Safety**: TypeScript throughout, with the database types defined in `lib/supabase.ts`

## Roadmap

Planned features are tracked in [TODO.md](TODO.md).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Set the environment variable `ENABLE_EXPERIMENTAL_COREPACK=1` so Vercel uses the pnpm version pinned in `package.json`.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT
