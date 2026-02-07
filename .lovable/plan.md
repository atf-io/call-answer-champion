

# Plan: Remove Google OAuth Redirect Issue

## Problem Identified

The error appears because:
1. You clicked "Connect Google" which redirected to Google's OAuth page
2. The OAuth failed with a 403 error because the credentials aren't configured yet
3. Now the browser is stuck on Google's error page, and every preview refresh tries to reload that invalid URL

## Solution

I'll add a safety check to prevent the OAuth redirect when credentials aren't properly configured, so clicking "Connect Google" will show a helpful message instead of redirecting to a broken Google page.

## Changes Required

### 1. Update `useGoogleBusinessAuth.ts`
- Check if `GOOGLE_CLIENT_ID` is missing or still has the placeholder value `"YOUR_GOOGLE_CLIENT_ID"`
- Show a toast notification explaining that Google OAuth needs to be configured
- Prevent the redirect to Google

### 2. Immediate Fix for Your Current Session
After I make this change, you'll need to:
- Click "Try again" or "Dismiss" on the Lovable preview error
- Navigate back to `/dashboard/reviews`

---

## Technical Details

**File to modify:** `src/hooks/useGoogleBusinessAuth.ts`

```typescript
// Add validation for placeholder value
const connectGoogle = useCallback(() => {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
    toast({
      variant: 'destructive',
      title: 'Configuration Required',
      description: 'Google OAuth credentials have not been configured yet.',
    });
    return;
  }
  // ... rest of the code
}, [getAuthUrl, toast]);
```

This prevents the broken redirect and gives you a clear message instead.

