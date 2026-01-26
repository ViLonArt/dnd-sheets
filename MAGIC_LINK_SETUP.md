# Magic Link Authentication Setup

## ✅ Implementation Complete

The authentication has been simplified to use **Magic Links (Email OTP)** only. No Google OAuth setup required!

### What's Been Updated:

1. **`src/components/auth/AuthButton.tsx`**:
   - Removed Google OAuth option
   - Simplified to show email input and "Send Magic Link" button
   - Shows "Check your email for the login link!" after sending
   - Shows "Sign Out ({email})" when logged in

2. **`src/contexts/AuthContext.tsx`**:
   - Removed `signIn` method (Google OAuth)
   - Kept `signInWithEmail` with proper `emailRedirectTo` configuration
   - Simplified interface

## 🔧 Supabase Configuration Required

### Step 1: Enable Email Provider

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Providers**
3. Click on **Email**
4. Ensure **"Enable Email Provider"** is checked (usually enabled by default)
5. **"Confirm email"** can be disabled for Magic Links (they auto-confirm on click)
6. Click **Save**

### Step 2: Configure Site URL (Important!)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your app's URL:
   - For local development: `http://localhost:5173` (or your Vite port)
   - For production: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `http://localhost:5173/**` (for local dev)
   - `https://your-domain.com/**` (for production)
   - This allows Magic Links to redirect back to your app

### Step 3: Email Templates (Optional)

You can customize the Magic Link email template:
1. Go to **Authentication** → **Email Templates**
2. Click on **Magic Link**
3. Customize the email subject and body if desired
4. The default template includes the magic link button

## 🧪 Testing

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Test the flow:**
   - Enter your email address
   - Click "Send Magic Link"
   - Check your email inbox
   - Click the magic link in the email
   - You should be redirected back to your app and logged in

3. **Verify authentication:**
   - You should see "Sign Out ({your-email})" button
   - The `useAuth()` hook should return your user object

## 📝 How It Works

1. **User enters email** → Clicks "Send Magic Link"
2. **Supabase sends email** with a magic link
3. **User clicks link** in email
4. **Supabase redirects** to `window.location.origin` (your app)
5. **Auth callback page** (`/auth/callback`) handles the redirect
6. **User is authenticated** and redirected to home page

## 🔒 Security Notes

- Magic Links expire after a set time (configurable in Supabase)
- Each link can only be used once
- Links are tied to the email address and session
- The `emailRedirectTo` ensures users return to your app after clicking

## 🐛 Troubleshooting

### "Email not sent" error
- Check that Email Provider is enabled in Supabase Dashboard
- Verify your email address is valid
- Check Supabase logs for email delivery issues

### Redirect not working
- Verify Site URL is set correctly in Supabase Dashboard
- Check that Redirect URLs include your app's domain
- Ensure `emailRedirectTo` matches your app's origin

### "Invalid token" error
- Magic links expire after a certain time
- Each link can only be used once
- Try requesting a new magic link

