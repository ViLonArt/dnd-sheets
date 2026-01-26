# Quick Start Guide

## ✅ Step 1: Frontend Setup (COMPLETE)

The frontend integration is ready! Here's what's been set up:

### Files Created:
- ✅ `src/lib/supabase.ts` - Supabase client
- ✅ `src/services/sheetService.ts` - API service layer
- ✅ `.env.example` - Environment variable template

### Next Steps:

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your Supabase credentials:**
   - Get them from Supabase Dashboard → Settings → API
   - Update `.env` with your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

3. **Test the connection:**
   ```bash
   npm run dev
   ```
   Check the browser console - you should see no Supabase connection errors.

---

## 📋 Step 2: Database Setup

1. **Run the SQL migration:**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run

2. **Verify:**
   - Check Table Editor → `sheets` table exists
   - Check Storage → `avatars` bucket exists

---

## 🚀 Step 3: Deploy Edge Function

### Option A: Using npx (Recommended)

```bash
# 1. Initialize Supabase (if not done)
npx supabase init

# 2. Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# 3. Set environment variables in Supabase Dashboard:
#    - Go to Edge Functions → Settings → Secrets
#    - Add: DATABASE_URL (with Transaction Pooler connection string)
#    - Note: SUPABASE_URL and SUPABASE_ANON_KEY are auto-provided

# 4. Deploy
npx supabase functions deploy sheet-api
```

### Option B: Using Homebrew (macOS)

```bash
# Install CLI
brew install supabase/tap/supabase

# Then use normally
supabase init
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy sheet-api
```

See `SUPABASE_CLI_SETUP.md` for detailed instructions.

---

## 🧪 Step 4: Test the Integration

### Test 1: Create a Sheet (Requires Auth)

```typescript
import { createSheet } from '@/services/sheetService'
import { createEmptyCharacter } from '@/types/character'

// First, make sure user is logged in
const character = createEmptyCharacter()
character.name = "Test Character"

const sheet = await createSheet(character, 'character')
console.log('Created sheet:', sheet.id)
```

### Test 2: Get a Sheet (Public)

```typescript
import { getSheet } from '@/services/sheetService'

const sheet = await getSheet('sheet-id-here')
console.log('Sheet data:', sheet.data)
```

### Test 3: Upload Avatar

```typescript
import { uploadAvatar } from '@/services/sheetService'

// After cropping image in ImageCropper
const blob = await getCroppedImgAsBlob(...)
const filename = `${Date.now()}.png`
const url = await uploadAvatar(blob, filename)
console.log('Avatar URL:', url)
```

---

## 📚 Documentation

- `FRONTEND_SETUP.md` - Detailed frontend setup guide
- `SUPABASE_CLI_SETUP.md` - CLI installation and usage
- `SUPABASE_SETUP.md` - Complete Supabase setup guide
- `SUPABASE_IMPLEMENTATION_SUMMARY.md` - Architecture overview

---

## 🔧 Troubleshooting

### "Supabase URL and/or Anon Key are missing"
- Check `.env` file exists and has correct variables
- Restart dev server after creating `.env`
- Variables must start with `VITE_` for Vite

### "Failed to create sheet: Unauthorized"
- User must be logged in
- Check Edge Function is deployed
- Verify environment variables in Supabase Dashboard

### Edge Function deployment fails
- Check you're linked: `npx supabase projects list`
- Verify environment variables are set
- Check logs: `npx supabase functions logs sheet-api`

