# Google Sign-In & email confirmation

## Email confirmation on sign-up

1. `strapi/.env`: `STRAPI_EMAIL_CONFIRMATION=true` (default; set `false` only to debug without email).
2. SMTP must work — test with `cd strapi && npm run test:smtp`.
3. **Gmail / Google Workspace** (`@elewen.co.in`, etc.):
   - Sign in as **the same address** as `SMTP_USER` (e.g. `moksha@elewen.co.in`), not a personal `@gmail.com`.
   - Turn on **2-Step Verification** for that account.
   - Create an [App Password](https://myaccount.google.com/apppasswords) (16 characters). Put it in **`strapi/.env`** (the test reads this file, not root `.env`):
     `SMTP_PASS=your16charapppassword`
     Spaces are OK in quotes; the app strips them automatically.
   - If `npm run test:smtp` shows **`535 BadCredentials`**, reformatting the same password (e.g. `oytm mixp cppy dxre` → `oytmmixpcppydxre`) will **not** help. Revoke old app passwords in Google, create a **brand-new** one, paste it once into `strapi/.env`, run the test again.
   - **Google Workspace admin:** In [Admin console](https://admin.google.com) → **Security** → **Authentication** → **2-step verification**, ensure users can use app passwords. Some orgs block them.

### Resend fallback (if Gmail keeps returning 535)

In `strapi/.env`:

```env
SMTP_PROVIDER=resend
RESEND_API_KEY=re_your_key_from_resend.com
SMTP_FROM=onboarding@resend.dev
STRAPI_EMAIL_CONFIRMATION=true
```

Then: `cd strapi && npm run test:smtp` and restart Strapi. For production, verify domain `elewen.co.in` in Resend and set `SMTP_FROM` to e.g. `noreply@elewen.co.in`.
3. After sign-up, user sees “Check your email” — no auto login.
4. Email link goes to Strapi: `http://localhost:1337/api/auth/email-confirmation?confirmation=...`
5. After click, user is redirected to: `http://localhost:5173/login?confirmed=true`

Sync DB after env change: `cd strapi && npm run sync:email`

## Forgot password / reset password

1. `/forgot-password` → enter email → Strapi sends reset email (same SMTP as sign-up).
2. Email body uses your template; link format: `{FRONTEND_URL}/reset-password?code={token}`.
3. User opens link → `/reset-password` → sets new password → can log in.

After changing `FRONTEND_URL` or email copy:

```bash
cd strapi && npm run sync:email-templates
```

Restart Strapi. Test with a **local** account email on `/forgot-password`.

---

# Google Sign-In setup (fix `redirect_uri_mismatch`)

## Error 400: `redirect_uri_mismatch`

Google is telling you the **Authorized redirect URI** in Cloud Console does **not exactly match** what Strapi sends.

**Add only the callback URL (with `/callback` at the end):**

```text
http://localhost:1337/api/connect/google/callback
```

**Do not add** `http://localhost:1337/api/connect/google` (no `/callback`) — that causes this error.

While Strapi is running, print the exact URI Strapi sends:

```bash
cd strapi && npm run show:google-redirect
```

Copy that line into **Google Cloud Console** → **APIs & Services** → **Credentials** → your **Web application** OAuth client → **Authorized redirect URIs** → **Save**. Wait 1–5 minutes, then try again.

Also confirm the OAuth client **Client ID** matches `GOOGLE_CLIENT_ID` in `strapi/.env` (same project in Cloud Console).

**Client handoff doc:** see `GOOGLE_CLOUD_CONSOLE.md` (correct vs wrong redirect URIs for Elewen).

---

## 1. Redirect URI (required in Google Cloud Console)

For **local development**, add this **exact** URI:

```text
http://localhost:1337/api/connect/google/callback
```

**Not** `https://`, **not** port `3000` or `5173`, **not** `/api/auth/google/callback`, **not** `127.0.0.1` if Strapi uses `localhost`.

### Steps

1. Open [Google Cloud Console](https://console.cloud.google.com/) → your project.
2. **APIs & Services** → **Credentials** → your **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized redirect URIs**, click **Add URI** and paste:
   `http://localhost:1337/api/connect/google/callback`
4. Save. Changes can take **1–5 minutes**.

### Production

Also add:

```text
https://strapi.elewen.co.in/api/connect/google/callback
```

## 2. Sync Strapi database

From `strapi/` folder (Postgres running):

```bash
npm run sync:google
```

Restart Strapi:

```bash
npm run develop
```

Check the log line:

```text
Google OAuth callback (add in Google Cloud Console): http://localhost:1337/api/connect/google/callback
```

## 3. Environment (`strapi/.env`)

```env
PUBLIC_URL=http://localhost:1337
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=http://localhost:1337/api/connect/google/callback
```

If the website runs on another port (e.g. `5174`), set `FRONTEND_URL` to that port.

## 4. Verify database (if Google UI does not open)

```bash
cd strapi
npm run check:google
npm run sync:google   # if check fails
npm run develop       # restart after sync
```

Clicking **Continue with Google** should briefly hit `http://localhost:1337/api/connect/google`, then **immediately** redirect to `accounts.google.com`. If you stay on the Strapi URL with no Google screen, Google is disabled in the DB or credentials are missing.

## 5. Test

1. Open **http://localhost:5173/login** (or your `FRONTEND_URL`).
2. Click **Continue with Google** → Strapi `1337` → Google account picker → Strapi callback → **`/auth/callback`** on the frontend.
3. Do **not** use port `5173` in Google Cloud redirect URIs — only `http://localhost:1337/api/connect/google/callback`.

## 6. Enable Google in Strapi admin (if needed)

**Settings** → **Users & Permissions Plugin** → **Providers** → **Google** → Enable, same Client ID/Secret as `.env`.
