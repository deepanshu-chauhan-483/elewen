# Google OAuth — values for Google Cloud Console

Use the **same OAuth 2.0 Client ID** (Web application) for local dev and production. Add **both** redirect URIs below.

## Credentials (from `strapi/.env`)

| Setting | Value |
|--------|--------|
| **Client ID** | `3545133974-mo07e026nuf2s7burllkfha5uguhp1sg.apps.googleusercontent.com` |
| **Client secret** | *(in `strapi/.env` — do not commit or share in chat)* |

## Authorized redirect URIs (required — fix `redirect_uri_mismatch`)

Add **both** of these in Google Cloud Console → Credentials → your Web client → **Authorized redirect URIs**:

```text
http://localhost:1337/api/connect/google/callback
https://strapi.elewen.co.in/api/connect/google/callback
```

### Wrong (do not use)

| Wrong URI | Why |
|-----------|-----|
| `https://elewen.co.in/api/auth/google/callback` | Website domain + API path — Google never calls this for Strapi OAuth |
| `http://localhost:1337/api/connect/google` | Missing `/callback` |
| `https://elewen.co.in/...` | Frontend host — OAuth callback must hit **Strapi** |

## Authorized JavaScript origins (optional, recommended)

```text
http://localhost:5173
http://localhost:1337
https://elewen.co.in
https://strapi.elewen.co.in
```

## Environment variables

### Local (`strapi/.env`)

```env
PUBLIC_URL=http://localhost:1337
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=3545133974-mo07e026nuf2s7burllkfha5uguhp1sg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<same as Cloud Console>
GOOGLE_REDIRECT_URI=http://localhost:1337/api/connect/google/callback
```

### Production (server `.env` / Docker)

```env
PUBLIC_URL=https://strapi.elewen.co.in
FRONTEND_URL=https://elewen.co.in
GOOGLE_REDIRECT_URI=https://strapi.elewen.co.in/api/connect/google/callback
```

After changing Console or `.env`, wait 1–5 minutes, then:

```bash
cd strapi && npm run sync:google && npm run develop
```

Verify redirect Strapi sends (Strapi must be running):

```bash
npm run show:google-redirect
```

## OAuth consent screen

If the app is in **Testing**, add each tester Gmail under **Test users** (e.g. `panchalpreet26@gmail.com`).

## Flow (reference)

1. User on https://elewen.co.in/login → **Continue with Google**
2. Browser → `https://strapi.elewen.co.in/api/connect/google`
3. Google account picker
4. Google → `https://strapi.elewen.co.in/api/connect/google/callback`
5. Strapi → `https://elewen.co.in/auth/callback?access_token=...`
