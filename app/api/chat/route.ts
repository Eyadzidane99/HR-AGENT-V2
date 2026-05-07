import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE, verifyToken } from "@/lib/auth";
import { runAgent, type AgentAttachment } from "@/lib/agent";
import type { Candidate } from "@/lib/candidates";

export const runtime = "nodejs";

// Allow larger JSON bodies — extracted PDF text can be sizeable.
export const maxDuration = 30;

type Body = {
  message: string;
  history?: { role: "user" | "agent"; content: string }[];
  candidates?: Candidate[];
  attachment?: AgentAttachment;
};

const MAX_ATTACHMENT_CHARS = 200_000; // ~200 KB of text; protects the agent prompt size

export async function POST(req: Request) {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const message = (body.message || "").trim();
  const attachment = body.attachment;

  if (!message && !attachment?.text) {
    return NextResponse.json({ error: "Missing message or attachment" }, { status: 400 });
  }

  // Trim oversized PDFs to keep the agent prompt manageable.
  if (attachment?.text && attachment.text.length > MAX_ATTACHMENT_CHARS) {
    attachment.text = attachment.text.slice(0, MAX_ATTACHMENT_CHARS) + "\n…[truncated]";
  }

  // ─────────────────────────────────────────────────────────────────────
  // TODO: Azure AI Agent Service swap point.
  //
  // Two integration shapes — pick one based on how your Azure agent expects
  // CV files:
  //
  // (a) Send the extracted text inline (simpler, recommended unless the
  //     agent uses Azure's File Search / vector tooling):
  //
  //   const r = await fetch(`${process.env.AZURE_AI_ENDPOINT}/agents/${process.env.AZURE_AI_AGENT_ID}/messages`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "api-key": process.env.AZURE_AI_KEY!
  //     },
  //     body: JSON.stringify({
  //       message,
  //       history: body.history,
  //       context: { candidates: body.candidates },
  //       attachment: attachment
  //         ? {
  //             name: attachment.name,
  //             mimeType: attachment.mimeType,
  //             text: attachment.text
  //           }
  //         : undefined
  //     })
  //   });
  //
  // (b) Upload the file to Azure first, then reference the file_id in the
  //     agent run (use this if your agent has File Search / RAG enabled).
  //     For (b) you'd accept the file in this route as multipart/form-data
  //     instead of JSON — see the README "Azure with file upload" section.
  // ─────────────────────────────────────────────────────────────────────

  const result = runAgent({
    message,
    history: body.history,
    candidates: body.candidates || [],
    attachment
  });

  return NextResponse.json({
    reply: result.reply,
    intent: result.intent,
    candidate: result.candidate,
    matches: result.matches
  });
}
