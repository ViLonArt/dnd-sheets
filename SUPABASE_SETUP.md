# Supabase Setup Guide

This guide will help you set up Supabase for your D&D Sheets application.

## Part 1: Database & Storage Setup

### Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** to execute the migration

This will create:
- The `sheets` table with proper indexes
- Row Level Security (RLS) policies for public read and authenticated write
- The `avatars` storage bucket with appropriate policies
- Automatic `updated_at` timestamp trigger

### Step 2: Verify Setup

1. Go to **Table Editor** → Check that `sheets` table exists
2. Go to **Storage** → Check that `avatars` bucket exists and is public
3. Go to **Authentication** → Verify RLS is enabled on `sheets` table

## Part 2: Edge Function Setup

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Link Your Project

```bash
supabase link --project-ref your-project-ref
```

### Step 3: Set Environment Variables

The Edge Function needs one custom secret (set in Supabase Dashboard → Edge Functions → Settings → Secrets):

- **`DATABASE_URL`**: Your database connection string with Transaction Pooler (port 6543)

**Note:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` are automatically provided by the Supabase runtime, so you don't need to set them manually.

To get `DATABASE_URL`:
1. Go to **Settings** → **Database**
2. Copy the **Connection string** under "Connection pooling" (Transaction Pooler)
3. Format: `postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
4. Add this as a secret named `DATABASE_URL` (not `SUPABASE_DB_URL` - that prefix is reserved)

### Step 4: Deploy the Edge Function

```bash
supabase functions deploy sheet-api
```

### Step 5: Test the Function

You can test the function using curl:

```bash
# Get a sheet (public access)
curl https://your-project.supabase.co/functions/v1/sheet-api/{sheet-id}

# Create a sheet (requires auth token)
curl -X POST https://your-project.supabase.co/functions/v1/sheet-api \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": {"name": "Test Character", "level": 1}}'
```

## Part 3: Frontend Integration

### Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 2: Create Supabase Client

Create `src/lib/supabase.ts` (see Part 3 in the main implementation)

### Step 3: Update Your App

- Add authentication UI
- Replace localStorage with Supabase calls
- Update image upload to use Supabase Storage

## Troubleshooting

### Edge Function Errors

- Check that all environment variables are set correctly
- Verify the database connection string includes `?pgbouncer=true`
- Check Edge Function logs in Supabase Dashboard

### RLS Policy Issues

- Verify RLS is enabled: `ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;`
- Check that policies are created correctly
- Test with different user roles (anon vs authenticated)

### Storage Upload Issues

- Verify the `avatars` bucket exists and is public
- Check that storage policies allow authenticated uploads
- Verify the file path format: `{userId}/{randomId}.png`

