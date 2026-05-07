"use client";

export type Candidate = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  location?: string;
  skills?: string[];
  yearsExperience?: number;
  notes?: string;
  raw: string;
  createdAt: number;
};

const STORAGE_KEY = "hr-agent:candidates";

function read(): Candidate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Candidate[]) : [];
  } catch {
    return [];
  }
}

function write(list: Candidate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("hr-agent:candidates-updated"));
}

export function listCandidates(): Candidate[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function addCandidate(candidate: Candidate) {
  const list = read();
  list.push(candidate);
  write(list);
}

export function findCandidates(query: string): Candidate[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const list = read();
  const scored = list
    .map((c) => {
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
      const matches = q.split(/\s+/).filter((tok) => hay.includes(tok)).length;
      return { c, matches };
    })
    .filter((r) => r.matches > 0)
    .sort((a, b) => b.matches - a.matches);
  return scored.map((s) => s.c);
}

export function clearAll() {
  write([]);
}
