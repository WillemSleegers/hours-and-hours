# Hours and Hours

An intuitive time tracking app focused on simplicity and ease of use.

## Features

- **Daily View**: Drag to select time blocks and assign them to projects
- **Configurable Time Tracking**: Choose between 15-minute, 30-minute, or 1-hour increments
- **Flexible Day Hours**: Set custom start and end times for your workday
- **Project Overview**: View aggregated hours across all your projects
- **Project Management**: Create, edit, and delete projects with custom colors
- **Light/Dark Mode**: Toggle between light and dark themes
- **Optimistic UI**: All changes happen instantly with async Supabase sync
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL)
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
   - Run the SQL schema from `lib/schema.sql` in your Supabase SQL editor
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
- `name`: Text (project name)
- `color`: Text (hex color code)
- `created_at`, `updated_at`: Timestamps

### Time Entries
- `id`: UUID (primary key)
- `project_id`: UUID (foreign key to projects)
- `date`: Date (the day the hours were worked)
- `start_time`: Decimal (fractional hour, e.g., 9.5 for 9:30 AM)
- `end_time`: Decimal (fractional hour, e.g., 17.25 for 5:15 PM)
- `created_at`, `updated_at`: Timestamps

### User Settings
- `id`: UUID (primary key)
- `day_start_hour`: Integer (0-23, when your day starts)
- `day_end_hour`: Integer (1-24, when your day ends)
- `time_increment`: Integer (15, 30, or 60 minutes)
- `created_at`, `updated_at`: Timestamps

## Usage

1. **Configure Settings**: Go to Settings to:
   - Set your preferred day start and end times
   - Choose time increment (15 min, 30 min, or 1 hour)
   - Create projects with names and colors

2. **Track Time**: On the daily view, click and drag to select time blocks, then choose a project

3. **Navigate Days**: Use the arrow buttons or "Today" button to switch between days

4. **View Analytics**: Check the Projects page to see your total hours per project

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
- Time entry editing and deletion
- Project archiving
- Keyboard shortcuts
- Recurring time blocks
- Notes/descriptions for time entries

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT
