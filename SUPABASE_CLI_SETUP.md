# Supabase CLI Setup Guide

## Option 1: Using npx (Recommended - No Installation Required)

You can use the Supabase CLI without installing it globally by using `npx`:

```bash
# Initialize Supabase in your project
npx supabase init

# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Deploy Edge Functions
npx supabase functions deploy sheet-api

# Start local development (optional)
npx supabase start
```

## Option 2: Install via Homebrew (macOS)

If you prefer to have the CLI installed globally:

```bash
# Install Supabase CLI via Homebrew
brew install supabase/tap/supabase

# Verify installation
supabase --version

# Then use commands normally
supabase init
supabase link --project-ref your-project-ref
supabase functions deploy sheet-api
```

## Option 3: Install via npm (Local Project Dependency)

You can also install it as a dev dependency in your project:

```bash
# Install as dev dependency
npm install --save-dev supabase

# Then use via npx or npm scripts
npx supabase init

# Or add to package.json scripts:
# "supabase": "supabase"
# Then run: npm run supabase init
```

## Getting Your Project Reference

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **General**
3. Copy the **Reference ID** (it looks like: `abcdefghijklmnop`)

## Environment Variables for Edge Functions

When deploying Edge Functions, you need to set one custom secret in the Supabase Dashboard:

1. Go to **Edge Functions** → **Settings** → **Secrets**
2. Add the following secret:
   - **`DATABASE_URL`** - Your database connection string with Transaction Pooler (port 6543)

**Important Notes:**
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are **automatically provided** by the Supabase runtime - you don't need to set them
- Secrets starting with `SUPABASE_` are reserved and cannot be set manually
- Use `DATABASE_URL` (not `SUPABASE_DB_URL`) as the secret name

To get `DATABASE_URL`:
1. Go to **Settings** → **Database**
2. Copy the **Connection string** under "Connection pooling" (Transaction Pooler mode)
3. Format: `postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
4. Add this as a secret named `DATABASE_URL`

## Quick Start Commands

```bash
# 1. Initialize (if not done already)
npx supabase init

# 2. Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# 3. Deploy the Edge Function
npx supabase functions deploy sheet-api

# 4. View logs
npx supabase functions logs sheet-api
```

## Troubleshooting

### Permission Errors with npm install -g

If you get permission errors with `npm install -g`, use one of the alternatives above (npx, brew, or local install).

### CLI Not Found

If `supabase` command is not found:
- Use `npx supabase` instead
- Or install via Homebrew: `brew install supabase/tap/supabase`

### Function Deployment Fails

- Verify you're linked: `npx supabase projects list`
- Check environment variables are set in Supabase Dashboard
- View logs: `npx supabase functions logs sheet-api`

