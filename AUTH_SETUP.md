# Authentication Setup Guide

This guide will help you set up authentication for Hours and Hours using Supabase.

## Prerequisites

- A Supabase project (create one at https://supabase.com)
- Environment variables configured (`.env.local`)

## Step 1: Configure Supabase Environment Variables

Make sure these are set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 2: Run Database Migration

Run the SQL migration to add user authentication to your database:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-auth-migration.sql`
4. Run the migration

This will:
- Add `user_id` columns to all tables
- Set up Row Level Security (RLS) policies
- Create indexes for performance

## Step 3: Configure Authentication Providers

### GitHub OAuth Setup

1. Go to your Supabase Dashboard → Authentication → Providers
2. Enable GitHub provider
3. Create a GitHub OAuth App:
   - Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   - Application name: `Hours and Hours`
   - Homepage URL: `http://localhost:3000` (or your production URL)
   - Authorization callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret to Supabase
5. Save the configuration

### Email (Magic Link) Setup

1. Go to your Supabase Dashboard → Authentication → Providers
2. Email provider should be enabled by default
3. Configure email templates (optional):
   - Go to Authentication → Email Templates
   - Customize the magic link email template

### Configure Redirect URLs

1. Go to Authentication → URL Configuration
2. Add your site URLs to "Site URL"
3. Add redirect URLs to "Redirect URLs":
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

## Step 4: Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Try signing in with:
   - GitHub OAuth (should redirect to GitHub and back)
   - Email magic link (should send an email with login link)

## Features

✅ **GitHub OAuth** - Quick social login
✅ **Magic Links** - Passwordless email authentication
✅ **Row Level Security** - User data is automatically isolated
✅ **Session Management** - Automatic session refresh
✅ **Protected Routes** - All pages require authentication
✅ **User Profile** - View email and sign out from header

## Architecture

### Authentication Flow

1. User visits the app → redirected to `/login` if not authenticated
2. User chooses login method (GitHub or Email)
3. After authentication, user is redirected to `/auth/callback`
4. Callback route exchanges code for session
5. User is redirected to home page

### Data Isolation

All data is automatically filtered by user:
- Projects query: `WHERE user_id = auth.uid()`
- Time slots query: `WHERE user_id = auth.uid()`
- User settings query: `WHERE user_id = auth.uid()`

This is enforced at the database level through RLS policies.

## Troubleshooting

### "Failed to load projects"
- Check that the database migration ran successfully
- Verify RLS policies are enabled
- Check that `user_id` columns exist on all tables

### GitHub OAuth not working
- Verify callback URL matches in GitHub OAuth app settings
- Check that GitHub provider is enabled in Supabase
- Ensure redirect URLs are configured in Supabase

### Magic link not sending
- Check Supabase email settings
- Verify SMTP configuration (production)
- Check spam folder

### Session not persisting
- Clear browser cache and cookies
- Check that cookies are enabled
- Verify Supabase URL and anon key are correct

## Security Notes

- Never commit `.env.local` to git
- Use environment variables for all sensitive data
- RLS policies are enforced at the database level
- User sessions are automatically refreshed
- All routes are protected by authentication checks

## Next Steps

After setting up authentication:
1. Test logging in with both providers
2. Create some projects and time entries
3. Verify data isolation (create another account and check data doesn't leak)
4. Configure production redirect URLs before deploying

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Check browser console for errors
3. Verify all environment variables are set
4. Review RLS policies in Supabase

Enjoy your secure, multi-user time tracking app! 🎉
