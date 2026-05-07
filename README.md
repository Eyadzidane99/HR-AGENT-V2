# Vodafone Candidate Process Filtration

Dark-mode, Vodafone Egypt–branded chat GUI for a Candidate Process Filtration agent that captures and retrieves candidate information. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, framer-motion, and a Spline 3D scene on the login screen.

The Azure AI Agent Service integration is intentionally **deferred** — the server already exposes a clean `/api/chat` boundary and ships with a local rule-based agent stub. Swap it for Azure when ready (one fetch call, see below).

---

## Features

- Login gate (single hardcoded user — `Eyad_Zidane` / `Test123456`) with HttpOnly signed cookie.
- Dark UI with Vodafone red (`#E60000`) accents, animated gradient orbs, Spotlight effect, 3D Spline scene.
- Funcky animations everywhere — message stagger, typing indicator, glowing send button, drifting grid.
- Candidate intake from natural-language messages (heuristic field extraction: name, email, phone, role, skills, years, location).
- **PDF CV upload** — attach a CV via the paperclip button; text is extracted client-side with `pdfjs-dist` and forwarded to the agent for analysis.
- Retrieval by any field — name, email, phone digits, skill, role, etc.
- Persistent client-side store (localStorage) — survives reloads, syncs the sidebar live.
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

Add a candidate:
```
Add candidate. Name: Sara Ahmed. Email: sara@vodafone.com. Phone: 0100-555-0123. Role: Frontend Engineer. Skills: React, Node, TypeScript. Years: 5. Location: Cairo.
```

Or click the paperclip and attach a PDF CV — the agent will parse and store it.

Search:
```
find sara
who knows React?
0100
```

List everything:
```
list candidates
```

> **PDF support:** Text-layer PDFs only (most modern CVs). Scanned image-only PDFs need OCR — Azure's Document Intelligence is a good follow-up if you need that.

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

When you wire Azure (next section), add `AZURE_AI_ENDPOINT`, `AZURE_AI_KEY`, `AZURE_AI_AGENT_ID`, and a long random `AUTH_SECRET` to the project's Environment Variables in Vercel.

---

## Wiring the Azure AI Agent Service

Open [`app/api/chat/route.ts`](app/api/chat/route.ts). Replace the `runAgent(...)` call with your Azure call. A complete example is in the file's TODO block — copy/paste and fill the env vars in `.env.local`:

```
AUTH_SECRET=<long random string>
AZURE_AI_ENDPOINT=https://<your-resource>.services.ai.azure.com
AZURE_AI_KEY=<your key>
AZURE_AI_AGENT_ID=<your agent id>
```

The contract the UI expects:

```ts
POST /api/chat
body: {
  message: string,
  history: {role, content}[],
  candidates: Candidate[],
  attachment?: {                // present when a PDF CV was attached
    name: string,
    mimeType: string,           // "application/pdf"
    size?: number,
    pages?: number,
    text: string                // already-extracted text from the PDF
  }
}
res:  { reply: string, candidate?: Candidate, matches?: Candidate[] }
```

If the response includes a `candidate`, the chat shell stores it in localStorage so the sidebar updates immediately.

### Azure with file upload (alternative)

If you want Azure to receive the actual PDF binary (e.g. to use Azure AI Search / File Search tooling) instead of the pre-extracted text, switch the API route from JSON to `multipart/form-data`:

1. In `components/chat-shell.tsx`, build a `FormData` with `file` + the JSON message body, and post to `/api/chat`.
2. In `app/api/chat/route.ts`, read it via `await req.formData()`.
3. Forward the file to Azure's file upload endpoint, then call the agent run with the returned `file_id`.

For most demo purposes the inline-text path (already wired) is faster and cheaper.

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
  api/chat/route.ts       # POST chat → agent (stub today, Azure tomorrow)
components/
  ui/{splite,spotlight,card,button,input,label}.tsx
  vodafone-logo.tsx       # inline SVG logo
  animated-background.tsx # drifting red orbs
  login-form.tsx          # client form, calls /api/auth
  chat-shell.tsx          # main chat layout
  chat-message.tsx        # bubble + typing indicator
  chat-composer.tsx       # auto-growing textarea + send
lib/
  utils.ts                # cn()
  auth.ts                 # constant-time creds, HMAC-signed cookie token
  candidates.ts           # localStorage CRUD
  agent.ts                # parseCandidate + runAgent (rule-based stub)
  pdf.ts                  # client-side PDF text extraction (pdfjs-dist)
```

---

## Security notes

This app is gated by a **single hardcoded credential pair** as required. The cookie is HttpOnly and HMAC-signed, but the credentials themselves live in source. Suitable for a demo / internal tool, **not** a public product. When wiring real auth, replace `lib/auth.ts` with a real provider (Azure AD / Entra, NextAuth, etc.).

Set `AUTH_SECRET` in production so the cookie signature isn't using the dev fallback.

---

## License

Private / internal demo.
