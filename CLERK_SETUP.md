# Clerk Authentication Setup

This project has been configured with Clerk authentication and a Users table for managing user profiles.

## Environment Variables

Make sure you have the following environment variables set:

### Required

- `CLERK_SECRET_KEY` - Your Clerk secret key (server-side)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key (client-side)
- `DATABASE_URL` - Your database connection string

### Optional

- `CLERK_WEBHOOK_SECRET` - Webhook secret for automatic user sync (recommended)

## Environment Files

- `.env.local` - Development environment (include `CLERK_SECRET_KEY`)
- `.env.production` - Production environment (include `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
- `.env.local.production` - Production environment (include `CLERK_SECRET_KEY`)

## Database Schema

The Users table includes:

- `id` - UUID primary key
- `clerk_id` - Clerk user ID (unique)
- `email` - User email address
- `first_name` - User's first name
- `last_name` - User's last name
- `avatar_url` - User's avatar URL
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

## API Endpoints

### `/api/users`

- `GET` - Fetch current user profile
- `POST` - Create or update user profile
- `PUT` - Update user profile

### `/api/webhook/clerk`

- `POST` - Webhook endpoint for automatic user sync

## Webhook Setup

1. Go to your Clerk Dashboard
2. Navigate to Webhooks
3. Create a new webhook endpoint pointing to `/api/webhook/clerk`
4. Select the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the webhook secret and add it to `CLERK_WEBHOOK_SECRET`

## Components

- `ClerkProvider` - Wraps the app with authentication context
- `SignIn` - Sign-in form component
- `SignUp` - Sign-up form component
- `UserProfile` - User profile management component

## Hooks

- `useUserData` - Custom hook for managing user data

## Middleware

The middleware is configured to:

- Protect dashboard routes
- Allow public access to landing pages
- Handle i18n routing with Clerk authentication
- Integrate with Arcjet for bot protection

## Usage

1. Users can sign up/sign in using the existing Clerk components
2. User data is automatically synced via webhooks
3. Users can view and edit their profile in the dashboard
4. Protected routes require authentication

## Testing

Run the development server:

```bash
npm run dev
```

The authentication system will work with your Clerk development environment.
