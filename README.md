# Life Insurance AI Dashboard

A Next.js application with Supabase authentication and AI-powered calling system integration.

## Features

- 🔐 **Authentication**: Email/password authentication via Supabase
- 📊 **Dashboard**: Real-time metrics for call tracking
- 🤖 **AI Integration**: Webhook integration with N8N for AI-powered calling
- 🔒 **Protected Routes**: Middleware-based route protection
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication & Database**: Supabase
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** → **API** and copy:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep this secret!)

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
N8N_WEBHOOK_START_DIAL=https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

### 4. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL script from `supabase/schema.sql`

This will create:
- `calls` table with proper structure
- Row Level Security (RLS) policies
- Indexes for performance

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
life-insurance/
├── app/
│   ├── api/
│   │   └── start-ai/       # API route for AI webhook
│   ├── dashboard/          # Protected dashboard page
│   ├── login/              # Authentication page
│   └── page.tsx            # Home page (redirects)
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── run-ai-button.tsx   # Run AI button component
│   └── sign-out-button.tsx # Sign out button component
├── lib/
│   └── supabase/           # Supabase client utilities
│       ├── client.ts       # Client-side Supabase client
│       ├── server.ts       # Server-side Supabase client
│       └── middleware.ts   # Middleware utilities
├── supabase/
│   └── schema.sql          # Database schema
└── middleware.ts           # Route protection middleware
```

## Database Schema

### `calls` Table

| Column      | Type        | Description                                      |
|-------------|-------------|--------------------------------------------------|
| id          | uuid        | Primary key                                      |
| user_id     | uuid        | Foreign key to auth.users                        |
| disposition | text        | Call status (answered, no_answer, busy, etc.)    |
| created_at  | timestamptz | Timestamp of call                                |

### Row Level Security (RLS)

- Users can only view, insert, update, and delete their own calls
- RLS policies ensure data isolation between users

## Features Overview

### Authentication (`/login`)

- Email/password sign up and sign in
- Form validation
- Error handling
- Auto-redirect to dashboard on successful login

### Dashboard (`/dashboard`)

Displays three key metrics:
- **Total Calls**: All calls made by the user
- **Answered Calls**: Calls with disposition = 'answered'
- **Not Answered**: Calls with disposition in ['no_answer', 'busy', 'voicemail']

### Run AI Feature

- Button to trigger AI calling system
- Sends POST request to `/api/start-ai`
- Forwards request to N8N webhook with user ID
- Displays success/error messages

### Protected Routes

Middleware automatically protects:
- `/dashboard` - requires authentication
- `/api/*` - all API routes except `/api/auth/*`

Unauthenticated users are redirected to `/login`.

## API Routes

### POST `/api/start-ai`

Triggers the AI calling system.

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI started successfully",
  "data": {}
}
```

## Security

- **Row Level Security (RLS)**: Database-level access control
- **Protected Routes**: Middleware-based authentication
- **User Verification**: API routes verify authenticated user
- **Environment Variables**: Sensitive keys stored securely

## Development

### Adding New Components

```bash
npx shadcn@latest add <component-name>
```

### Database Migrations

When making schema changes:
1. Update `supabase/schema.sql`
2. Run the SQL in Supabase SQL Editor
3. Test RLS policies thoroughly

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_START_DIAL`

## Troubleshooting

### "Unauthorized" Error

- Check that environment variables are set correctly
- Verify Supabase project is active
- Ensure RLS policies are enabled

### Database Connection Issues

- Verify Supabase URL and keys
- Check if database schema is set up
- Review Supabase logs for errors

### Webhook Not Triggering

- Verify `N8N_WEBHOOK_START_DIAL` environment variable
- Check N8N webhook is active and accessible
- Review API route logs

## License

MIT
# SterlingAI
# Deployment timestamp: Fri Oct 31 04:18:29 EDT 2025
