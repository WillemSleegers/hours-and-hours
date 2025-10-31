# Hours and Hours

An intuitive time tracking app focused on simplicity and ease of use.

## Features

- **Daily View**: Tap slots to add 15-minute time blocks and assign them to projects
- **Notes on Slots**: Add notes to time slots to track what you worked on
- **Touch-Optimized**: Simple tap interface designed for mobile and touch screens
- **Flexible Day Hours**: Set custom start and end times for your workday
- **Statistics Page**: View aggregated hours across all projects with date range filtering
- **Project Management**: Create, edit, archive, and delete projects with custom colors
- **Authentication**: Sign in with GitHub or magic email links
- **Light/Dark Mode**: Toggle between light and dark themes
- **Optimistic UI**: All changes happen instantly with async Supabase sync
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Smart Time Grid**: Automatically expands to show earlier/later hours when needed

## Tech Stack

- **Framework**: Next.js 16 with React 19 and React Compiler
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (GitHub OAuth + Magic Links)
- **Type Safety**: TypeScript
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd hours-and-hours
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migrations from `supabase/migrations/` in order in your Supabase SQL editor
   - Set up Row Level Security (RLS) policies to ensure users can only access their own data
   - Copy your project URL and anon key

4. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

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

### User Settings
- `id`: UUID (primary key, matches auth.users.id)
- `day_start_hour`: Integer (0-23, when your day starts)
- `day_end_hour`: Integer (1-24, when your day ends)
- `stats_start_date`: Date (saved filter for statistics page)
- `stats_end_date`: Date (saved filter for statistics page)
- `created_at`, `updated_at`: Timestamps

## Design Philosophy

The interface is designed around a simple tap-based interaction model optimized for touch screens:

### Adding Slots

1. **Select a project** from the dropdown in the footer
2. **Tap empty time slots** to add 15-minute blocks for that project
3. **Tap again on the same slot** to remove it (toggle behavior)

**Why it works this way:**
- **Toggle behavior** makes it fast and easy to add/remove slots without needing separate delete actions
- **Tap instead of drag** is more reliable on touch screens and prevents accidental selections
- **15-minute increments** provide precision while keeping the interface clean

### Adding Notes to Slots

1. **Tap a slot that already exists** → Opens the expandable section below
2. **Tap "Add note"** button → Opens note dialog
3. **Type your note** and save
4. **Tap the slot again** to collapse the section when done

**Why it works this way:**
- **Requires two taps** (first to add slot, second to open actions) prevents the expandable section from opening every time you're quickly adding multiple slots
- **Expandable section** keeps the interface clean and uncluttered when you're just adding slots
- **Large buttons** in the expanded area are easy to tap on touch screens

### Editing or Deleting Slots

1. **Tap the slot** to open the expandable section
2. **Tap "Edit note"** to modify the note, or **"Delete"** to remove the slot
3. The section collapses automatically after deletion

**Why it works this way:**
- **Actions are hidden until needed** to maintain a clean visual timeline
- **Smooth 200ms animation** provides visual feedback without feeling jarring
- **Separate expansion area** with distinct background color clearly shows which slot you're editing

## Usage

1. **Sign In**: Use GitHub OAuth or magic email link to authenticate

2. **Create Projects**: Go to Projects page to:
   - Create projects with custom names and colors
   - Archive projects you're no longer working on
   - Edit or delete existing projects

3. **Configure Settings**: Go to Settings to:
   - Set your preferred day start and end times
   - Toggle between light and dark themes

4. **Track Time**: See the Design Philosophy section above for detailed interaction patterns

5. **Navigate Days**: Use the arrow buttons or calendar picker to switch between days

6. **View Statistics**: Check the Statistics page to:
   - See total hours across all projects
   - Filter by date range
   - View per-project breakdowns

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Architecture

- **Optimistic Updates**: All mutations update the UI immediately and sync with Supabase in the background
- **Custom Hooks**: `useProjects`, `useTimeEntries`, and `useUserSettings` handle data fetching and mutations
- **Component Library**: Built on shadcn/ui for consistent, accessible components
- **Type Safety**: Full TypeScript coverage with Supabase-generated types
- **Flexible Time Tracking**: Supports fractional hours (stored as decimals) for 15 and 30-minute increments

## Future Enhancements

- Week/month views
- Export data to CSV/PDF
- Keyboard shortcuts
- Recurring time blocks
- Time entry templates
- Mobile app (React Native)
- Browser extension for quick time tracking

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT
