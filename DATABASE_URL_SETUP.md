# DATABASE_URL Setup Guide

## ✅ Code Updates Complete

The code has been updated to use `DATABASE_URL` instead of `SUPABASE_DB_URL`.

### Changes Made:

1. **`supabase/functions/sheet-api/db/index.ts`**:
   - Now checks for `DATABASE_URL` first
   - Falls back to `SUPABASE_DB_URL` for backwards compatibility
   - Updated error message to guide users to set `DATABASE_URL`

2. **`supabase/functions/sheet-api/index.ts`**:
   - Added validation for auto-provided `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Added helpful error logging

3. **Documentation Updated**:
   - All setup guides now reference `DATABASE_URL`
   - Clarified that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are auto-provided

## 🔧 Setting Up DATABASE_URL Secret

### Step 1: Get Your Transaction Pooler Connection String

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Find the **Connection pooling** section
4. Select **Transaction** mode (port 6543)
5. Copy the connection string

The format will look like:
```
postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step 2: Add as Secret in Supabase Dashboard

1. Go to **Edge Functions** → **Settings** → **Secrets**
2. Click **Add new secret**
3. **Name:** `DATABASE_URL` (exactly this - case sensitive)
4. **Value:** Paste your Transaction Pooler connection string
5. Click **Save**

### Step 3: Verify

After deploying your Edge Function, check the logs to ensure it connects successfully:

```bash
npx supabase functions logs sheet-api
```

You should see no connection errors.

## 📝 Important Notes

- ✅ **Use `DATABASE_URL`** - This is the custom secret name you control
- ❌ **Don't use `SUPABASE_DB_URL`** - Secrets starting with `SUPABASE_` are reserved
- ✅ **`SUPABASE_URL` and `SUPABASE_ANON_KEY`** - Automatically provided by runtime (no need to set)
- ✅ **Transaction Pooler** - Use port 6543 for connection pooling (required for Edge Functions)

## 🔄 Fallback Behavior

The code will:
1. First try `DATABASE_URL` (your custom secret)
2. Fall back to `SUPABASE_DB_URL` if `DATABASE_URL` is not set (for backwards compatibility)
3. Throw an error if neither is set

This ensures the function works whether you're using the new `DATABASE_URL` or the old `SUPABASE_DB_URL` (if you had it set before).

## 🧪 Testing

After setting the secret and deploying, test the connection:

```bash
# Deploy the function
npx supabase functions deploy sheet-api

# Check logs for connection errors
npx supabase functions logs sheet-api --tail
```

If you see connection errors, verify:
- The `DATABASE_URL` secret is set correctly
- The connection string includes `?pgbouncer=true`
- The connection string uses port 6543 (Transaction Pooler)

