# Supabase Implementation Summary

## ✅ Part 1: Database & Storage Setup (COMPLETE)

### Files Created:
- `supabase/migrations/001_initial_schema.sql`

### What It Does:
1. **Creates `sheets` table** with:
   - `id` (UUID, primary key)
   - `owner_id` (UUID, references auth.users)
   - `data` (JSONB) - stores Character/NPC data
   - `created_at` and `updated_at` timestamps

2. **Enables Row Level Security (RLS)**:
   - **Public Read**: Anyone can view any sheet
   - **Authenticated Write**: Only authenticated users can create sheets
   - **Owner Write**: Only the owner can update/delete their sheets

3. **Creates Storage Bucket**:
   - `avatars` bucket (public)
   - Policies for authenticated uploads
   - Public read access

### Next Steps:
1. Copy the SQL from `supabase/migrations/001_initial_schema.sql`
2. Run it in Supabase Dashboard → SQL Editor
3. Verify the table and bucket were created

---

## ✅ Part 2: Edge Function Setup (COMPLETE)

### Files Created:
- `supabase/functions/sheet-api/deno.json` - Deno configuration
- `supabase/functions/sheet-api/db/schema.ts` - Drizzle schema
- `supabase/functions/sheet-api/db/index.ts` - Database connection
- `supabase/functions/sheet-api/index.ts` - Main handler

### API Endpoints:

#### GET `/:id`
- Fetches a sheet by ID
- **Public access** (no auth required)
- Returns 404 if not found

#### POST `/`
- Creates a new sheet
- **Requires authentication** (Bearer token)
- Body: `{ "data": { ...characterData } }`
- Returns the created sheet with generated ID

#### PUT `/:id`
- Updates an existing sheet
- **Requires authentication**
- **Verifies ownership** (user must be the owner)
- Body: `{ "data": { ...updatedCharacterData } }`
- Returns the updated sheet

#### DELETE `/:id`
- Deletes a sheet
- **Requires authentication**
- **Verifies ownership** (user must be the owner)
- Returns `{ "success": true }`

### Environment Variables Required:
- **`DATABASE_URL`** - Database connection string with Transaction Pooler (port 6543)
  - Set this as a secret in Supabase Dashboard → Edge Functions → Settings → Secrets
  - Format: `postgres://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres?pgbouncer=true`

**Note:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` are automatically provided by the Supabase runtime - no need to set them manually.

### Next Steps:
1. Install Supabase CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref your-project-ref`
3. Set environment variables in Supabase Dashboard
4. Deploy: `supabase functions deploy sheet-api`

---

## 📋 Part 3: Frontend Integration (TODO)

### Files to Create/Update:

1. **`src/lib/supabase.ts`** - Supabase client initialization
2. **`src/services/sheetService.ts`** - Replace localStorage with API calls
3. **Auth UI** - Add login/signup buttons
4. **Image Upload** - Update to use Supabase Storage

### Implementation Notes:

- The Edge Function uses Drizzle ORM for type safety
- All data is stored as JSONB in the `data` column
- The frontend will call the Edge Function via `supabase.functions.invoke()`
- Image uploads go to Supabase Storage, URLs are stored in the sheet data

---

## 🔐 Security Features

1. **Row Level Security (RLS)**:
   - Public can read any sheet
   - Only owners can modify their sheets

2. **Edge Function Security**:
   - Verifies JWT tokens on all write operations
   - Checks ownership before update/delete
   - Uses Supabase's built-in auth verification

3. **Storage Security**:
   - Users can only upload to their own folder (`{userId}/`)
   - Public read access for avatars
   - Authenticated users can manage their own files

---

## 🚀 Deployment Checklist

- [ ] Run SQL migration in Supabase Dashboard
- [ ] Verify `sheets` table and `avatars` bucket exist
- [ ] Install Supabase CLI
- [ ] Link project with `supabase link`
- [ ] Set environment variables in Supabase Dashboard
- [ ] Deploy Edge Function: `supabase functions deploy sheet-api`
- [ ] Test Edge Function endpoints
- [ ] Implement frontend integration (Part 3)

