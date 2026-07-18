# Vodafone Candidate Process Filtration

Dark-mode, Vodafone Egypt–branded guided Candidate Assessment chat. The conversation is a deterministic local simulation: no AI service or backend database is required. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, framer-motion, and a Spline 3D scene on the login screen.

---

## Features

- Login gate (single hardcoded user — `Eyad_Zidane` / `Test123456`) with HttpOnly signed cookie.
- Dark UI with Vodafone red (`#E60000`) accents, animated gradient orbs, Spotlight effect, 3D Spline scene.
- Funcky animations everywhere — message stagger, typing indicator, glowing send button, drifting grid.
- Guided Add, Search, and Update flows with quick replies and typed-input equivalents.
- Required **PDF CV upload** for new candidates, stored locally with the assessment record (5 MB maximum).
- Nineteen QA technical criteria with 1–5 ratings, optional comments, and automatic pass/fail scoring.
- Persistent client-side records and resumable chat state in localStorage.
- Sidebar of recent candidates, click to pre-fill a search.

---

## Quick start

```bash
npm install
npm run dev
# → http://localhost:3000
```

You'll be redirected to `/login`. Sign in with:

```
Username: Eyad_Zidane
Password: Test123456
```

You'll land on `/chat`.

### Try it

Choose Add, Search, or Update from the opening menu and follow the prompts. Fixed choices can be entered with the displayed number or selected using a quick-reply button. Type `menu` or `cancel` to leave a flow.

> **PDF support:** Text-layer PDFs only (most modern CVs). Full PDF data is saved in localStorage, so available capacity depends on the browser. Scanned image-only PDFs need OCR.

---

## Production build

```bash
npm run build
npm start
```

---

## Deploy to Vercel (one click)

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Framework auto-detects as Next.js. No environment variables required for the stub.
4. Click **Deploy**. Done — you'll get a live URL in ~60s.

Set a long random `AUTH_SECRET` in production so authentication cookies do not use the development fallback.

---

## File map

```
app/
  layout.tsx              # root layout, dark theme
  globals.css             # Tailwind + tokens + scrollbar
  page.tsx                # / → redirect to /chat or /login
  login/page.tsx          # login screen (Spline + Spotlight + LoginForm)
  chat/layout.tsx         # auth-guarded
  chat/page.tsx           # mounts <ChatShell />
  api/auth/route.ts       # POST login / logout, sets cookie
components/
  ui/{splite,spotlight,card,button,input,label}.tsx
  vodafone-logo.tsx       # inline SVG logo
  animated-background.tsx # drifting red orbs
  login-form.tsx          # client form, calls /api/auth
  chat-shell.tsx          # main chat layout
  chat-message.tsx        # bubble + typing indicator
  chat-composer.tsx       # auto-growing textarea + send
lib/
  assessment-workflow.ts  # scripted state machine and questionnaire
  candidates.ts           # versioned localStorage records and migration
  auth.ts                 # constant-time credentials and signed cookie
  pdf.ts                  # client-side PDF validation and text extraction
```

---

## Security notes

This app is gated by a **single hardcoded credential pair** as required. The cookie is HttpOnly and HMAC-signed, but the credentials themselves live in source. Suitable for a demo / internal tool, **not** a public product. When wiring real auth, replace `lib/auth.ts` with a real provider (Azure AD / Entra, NextAuth, etc.).

Set `AUTH_SECRET` in production so the cookie signature isn't using the dev fallback.

---

## License

Private / internal demo.
