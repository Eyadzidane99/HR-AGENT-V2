import type { Candidate } from "./candidates";

export type AgentAttachment = {
  name: string;
  mimeType: string;
  size?: number;
  pages?: number;
  /** Pre-extracted text from the file (PDF text layer). */
  text: string;
};

export type AgentRequest = {
  message: string;
  history?: { role: "user" | "agent"; content: string }[];
  candidates?: Candidate[];
  attachment?: AgentAttachment;
};

export type AgentResponse = {
  reply: string;
  intent: "add" | "search" | "list" | "help" | "unknown";
  candidate?: Candidate;
  matches?: Candidate[];
};

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_RE = /(\+?\d[\d\s().-]{6,}\d)/;
const YEARS_RE = /(\d{1,2})\s*(?:\+)?\s*(?:years?|yrs?)/i;

function pick(text: string, label: string): string | undefined {
  const re = new RegExp(`${label}\\s*[:\\-]\\s*(.+?)(?:\\n|$|\\.|,(?=\\s*\\w+\\s*[:\\-]))`, "i");
  const m = text.match(re);
  return m?.[1]?.trim() || undefined;
}

function pickSkills(text: string): string[] | undefined {
  const m = text.match(/skills?\s*[:\-]\s*([^\n.]+)/i);
  if (m) {
    return m[1]
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // Fallback: look for a "Skills" / "Technical Skills" section in CVs.
  const section = text.match(
    /(?:^|\n)\s*(?:technical\s+)?skills\s*\n+([\s\S]{0,400}?)(?:\n\s*\n|\n[A-Z][^\n]{0,40}\n)/i
  );
  if (section) {
    return section[1]
      .split(/[,;\n•·\-|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 40)
      .slice(0, 20);
  }
  return undefined;
}

function pickName(text: string): string | undefined {
  const labelled = pick(text, "name");
  if (labelled) return labelled;
  // CVs typically have the candidate's name on the very first non-empty line.
  const firstLines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 6);
  for (const line of firstLines) {
    if (/^[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,3}$/.test(line)) return line;
  }
  return undefined;
}

export function parseCandidate(text: string, sourceLabel?: string): Candidate {
  const email = text.match(EMAIL_RE)?.[0];
  const phone = text.match(PHONE_RE)?.[0]?.replace(/\s+/g, " ").trim();
  const yearsMatch = text.match(YEARS_RE);
  const yearsExperience = yearsMatch ? parseInt(yearsMatch[1], 10) : undefined;

  const candidate: Candidate = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: pickName(text),
    email,
    phone,
    role: pick(text, "role") || pick(text, "position") || pick(text, "title"),
    location: pick(text, "location") || pick(text, "city") || pick(text, "country"),
    skills: pickSkills(text),
    yearsExperience,
    notes: sourceLabel ? `Imported from ${sourceLabel}` : pick(text, "notes"),
    raw: text.trim(),
    createdAt: Date.now()
  };
  return candidate;
}

const ADD_HINTS = [
  /\badd\b/i,
  /\bnew candidate\b/i,
  /\bregister\b/i,
  /\bsave\b/i,
  /\bstore\b/i,
  /\bcreate\b/i,
  /\bimport\b/i,
  /\banalyse|analyze\b/i
];

const LIST_HINTS = [/\blist\b/i, /\ball candidates?\b/i, /\bshow all\b/i];

const SEARCH_HINTS = [
  /\bfind\b/i,
  /\bsearch\b/i,
  /\bwho\b/i,
  /\bshow me\b/i,
  /\babout\b/i,
  /\blook(?: up)?\b/i,
  /\?$/
];

const HELP_HINTS = [/\bhelp\b/i, /\bhow do i\b/i, /\bwhat can\b/i];

function looksLikeCandidateData(text: string): boolean {
  const hits = [
    EMAIL_RE.test(text),
    PHONE_RE.test(text),
    /name\s*[:\-]/i.test(text),
    /skills?\s*[:\-]/i.test(text),
    /role\s*[:\-]/i.test(text),
    YEARS_RE.test(text)
  ].filter(Boolean).length;
  return hits >= 2;
}

export function classifyIntent(text: string, hasAttachment: boolean): AgentResponse["intent"] {
  if (hasAttachment) return "add";
  if (HELP_HINTS.some((r) => r.test(text))) return "help";
  if (LIST_HINTS.some((r) => r.test(text))) return "list";
  if (ADD_HINTS.some((r) => r.test(text)) || looksLikeCandidateData(text)) return "add";
  if (SEARCH_HINTS.some((r) => r.test(text))) return "search";
  return "unknown";
}

function summarize(c: Candidate): string {
  const lines: string[] = [];
  if (c.name) lines.push(`**${c.name}**`);
  if (c.role) lines.push(`Role: ${c.role}`);
  if (c.email) lines.push(`Email: ${c.email}`);
  if (c.phone) lines.push(`Phone: ${c.phone}`);
  if (c.location) lines.push(`Location: ${c.location}`);
  if (typeof c.yearsExperience === "number") lines.push(`Experience: ${c.yearsExperience} years`);
  if (c.skills && c.skills.length) lines.push(`Skills: ${c.skills.join(", ")}`);
  if (c.notes) lines.push(`Notes: ${c.notes}`);
  return lines.join("\n");
}

export function runAgent(req: AgentRequest): AgentResponse {
  const message = req.message?.trim() || "";
  const attachment = req.attachment;
  const intent = classifyIntent(message, !!attachment);
  const store = req.candidates || [];

  if (intent === "help") {
    return {
      intent: "help",
      reply:
        "I'm your Vodafone HR assistant. I can:\n\n" +
        "• **Add a candidate** — paste their details, or attach a PDF CV.\n" +
        "• **Find candidates** — ask things like *find Sara* or *show me React engineers*.\n" +
        "• **List all** — say *list candidates*.\n\n" +
        "Try: `Add candidate. Name: Sara Ahmed. Email: sara@example.com. Skills: React, Node. Years: 5.`"
    };
  }

  if (intent === "list") {
    if (!store.length) {
      return { intent: "list", reply: "No candidates yet. Add one or attach a CV to get started." };
    }
    const reply =
      `Here are all ${store.length} candidate(s):\n\n` +
      store.map((c, i) => `${i + 1}. ${summarize(c)}`).join("\n\n");
    return { intent: "list", reply, matches: store };
  }

  if (intent === "add") {
    // Combine the user's note (if any) with the CV text so name/email at the
    // top of the CV win, but the user's hints still apply.
    const sourceText = attachment?.text
      ? (message ? `${message}\n\n` : "") + attachment.text
      : message;
    const candidate = parseCandidate(sourceText, attachment?.name);
    const summary = summarize(candidate);
    const lead = attachment
      ? `I've analysed **${attachment.name}**${
          attachment.pages ? ` (${attachment.pages} page${attachment.pages === 1 ? "" : "s"})` : ""
        } and stored this candidate:`
      : "Got it — I've stored this candidate:";
    const reply = summary
      ? `${lead}\n\n${summary}`
      : attachment
      ? `I read **${attachment.name}** but couldn't pull structured fields from the text layer. The raw text is saved on the record so you can search it.`
      : "I couldn't extract structured fields, but I've saved the raw note.";
    return { intent: "add", reply, candidate };
  }

  // search / unknown — try to match against the store
  const tokens = message.replace(/[?.,!]/g, " ").split(/\s+/).filter((t) => t.length > 1);
  const q = tokens.join(" ");
  if (!store.length) {
    return {
      intent: "search",
      reply: "I don't have any candidates stored yet. Add one or attach a CV and try again."
    };
  }
  const matches = q
    ? store.filter((c) => {
        const hay = [
          c.name,
          c.email,
          c.phone,
          c.role,
          c.location,
          c.notes,
          c.raw,
          ...(c.skills || [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return tokens.some((t) => hay.includes(t.toLowerCase()));
      })
    : [];

  if (!matches.length) {
    return {
      intent: "search",
      reply: `No candidate matched "${message}". Try a different name, skill, or piece of info.`
    };
  }
  const reply =
    `Found ${matches.length} match${matches.length === 1 ? "" : "es"}:\n\n` +
    matches.map((c, i) => `${i + 1}. ${summarize(c)}`).join("\n\n");
  return { intent: "search", reply, matches };
}
