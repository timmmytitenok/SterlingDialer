# Quick Setup Guide

Follow these steps to get your Life Insurance AI Dashboard up and running.

## Step 1: Install Dependencies (Already Done)

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Step 2: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: life-insurance (or any name you prefer)
   - Database Password: (create a strong password)
   - Region: Choose closest to your users
4. Wait for project to be provisioned (~2 minutes)

## Step 3: Get Supabase Credentials

1. In your Supabase project, click **Settings** (gear icon)
2. Go to **API** section
3. Copy the following values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`
   
4. Go to **Settings** → **API** → **Service Role** (⚠️ Keep this secret!)
   - **service_role key**: Another long string starting with `eyJ...`

## Step 4: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy this template
cp .env.example .env.local
```

Edit `.env.local` and replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
N8N_WEBHOOK_START_DIAL=https://timmmytitenok.app.n8n.cloud/webhook/8af703b8-dbcd-496a-b6f4-a439ee8db137
```

## Step 5: Set Up Database

1. In Supabase dashboard, click **SQL Editor** (on the left sidebar)
2. Click **New Query**
3. Open the file `supabase/schema.sql` in this project
4. Copy all the SQL content
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

This creates:
- ✅ `calls` table
- ✅ Row Level Security policies
- ✅ Indexes for performance

## Step 6: Verify Database Setup

1. In Supabase, go to **Table Editor**
2. You should see a `calls` table with columns:
   - `id` (uuid)
   - `user_id` (uuid)
   - `disposition` (text)
   - `created_at` (timestamptz)

## Step 7: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 8: Test the Application

### Create an Account

1. You'll be redirected to `/login`
2. Click "Don't have an account? Sign up"
3. Enter email and password
4. Click "Sign Up"
5. **Important**: Check your email for confirmation link
6. Click the confirmation link
7. Return to app and log in

### Test the Dashboard

1. After logging in, you'll see the dashboard
2. Initially, all metrics will show 0
3. Click "Run AI" to test the webhook integration
4. You should see "AI started successfully! ✓"

### Add Test Data (Optional)

To see metrics in action, add some test calls:

1. In Supabase, go to **Table Editor** → `calls`
2. Click **Insert row**
3. Fill in:
   - `user_id`: Your user ID (from auth.users table)
   - `disposition`: Choose from: answered, no_answer, busy, voicemail, other
4. Click **Save**
5. Refresh the dashboard to see updated metrics

## Troubleshooting

### "Invalid API key" or Connection Errors

- ✅ Check that all environment variables are set correctly in `.env.local`
- ✅ Restart the dev server after changing `.env.local`
- ✅ Verify you copied the correct keys from Supabase

### "Check your email to confirm your account!"

- ✅ This is normal! Supabase requires email confirmation
- ✅ Check your spam folder if you don't see the email
- ✅ You can disable email confirmation in Supabase Settings → Authentication → Email Auth (for development only)

### Database Errors

- ✅ Make sure you ran the entire `schema.sql` file
- ✅ Check Supabase logs: **Logs** → **Postgres Logs**
- ✅ Verify RLS is enabled: Table Editor → calls → Policies

### Middleware/Redirect Issues

- ✅ Clear your browser cookies for localhost:3000
- ✅ Try logging out and back in
- ✅ Open in incognito/private window

### "Webhook not found" or N8N Errors

- ✅ Verify the `N8N_WEBHOOK_START_DIAL` URL is correct
- ✅ Test the webhook directly with curl or Postman
- ✅ Check N8N webhook is active and not paused

## Next Steps

### For Development

1. Add more test data to see realistic metrics
2. Customize the dashboard layout
3. Add more call dispositions if needed
4. Implement call history table

### For Production

1. Set up custom domain
2. Configure email templates in Supabase
3. Add database backups
4. Set up monitoring and logging
5. Configure production webhook URLs
6. Review and tighten RLS policies

## Need Help?

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **shadcn/ui**: [https://ui.shadcn.com](https://ui.shadcn.com)

## Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Add new shadcn/ui component
npx shadcn@latest add <component-name>
```

---

🎉 **You're all set!** Your Life Insurance AI Dashboard is ready to use.

