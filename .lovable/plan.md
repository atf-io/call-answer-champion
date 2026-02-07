

# Plan: Add Google OAuth Credentials

The Google Business Profile integration is fully implemented and ready to go. We just need to add your OAuth credentials to enable the "Connect Google" button.

## What You'll Need to Provide

You have **3 credentials** from your Google Cloud Console:

1. **Google Client ID** - This will be used in two places:
   - As a public environment variable for the frontend (to redirect users to Google)
   - As a backend secret (for the token exchange)

2. **Google Client Secret** - This is stored securely as a backend secret

## What I'll Do

### Step 1: Add the Backend Secrets
I'll prompt you to securely enter:
- `GOOGLE_OAUTH_CLIENT_ID` - Your Google Client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - Your Google Client Secret

### Step 2: Add the Frontend Environment Variable
I'll add the Client ID to the `.env` file as `VITE_GOOGLE_OAUTH_CLIENT_ID` so the frontend can initiate the OAuth flow.

### Step 3: Configure Redirect URI in Google Cloud Console
You'll need to add this redirect URI to your Google Cloud Console's OAuth credentials:

```
https://id-preview--f07db186-d212-4c87-b3ec-ef4d9e85bcd2.lovable.app/auth/google/callback
```

If you've published your app, also add:
```
https://call-answer-champion.lovable.app/auth/google/callback
```

## How It Works

Once configured, clicking "Connect Google" will:
1. Redirect you to Google's consent screen
2. After approval, Google redirects back with an authorization code
3. The backend exchanges this code for access/refresh tokens
4. Tokens are stored securely for syncing reviews

---

### Technical Details

**Files to be modified:**
- `.env` - Add `VITE_GOOGLE_OAUTH_CLIENT_ID`

**Backend secrets to be added:**
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

**No code changes required** - the implementation is already complete!

