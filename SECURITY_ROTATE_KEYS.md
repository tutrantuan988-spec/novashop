# Rotate Exposed Keys

You pasted live-looking secrets into chat. Treat them as exposed.

## Rotate now

Regenerate these in their provider dashboards:

- Clerk publishable key and secret key.
- Anthropic API key.
- Google AI API key.
- Groq API key.

After regenerating, update `.env.local` with the new values.

## Already rotated locally

These local project secrets were replaced:

- `ADMIN_API_TOKEN`
- `GUEST_TOKEN_SECRET`

## Do not share

Do not paste `.env.local` into chat, GitHub issues, public docs, screenshots, or deployment logs.

## Continue setup

The next required setup step is still Firebase:

```env
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_JSON=
```

After filling Firebase values:

```powershell
npm run check:env
npm run seed:firestore
```
