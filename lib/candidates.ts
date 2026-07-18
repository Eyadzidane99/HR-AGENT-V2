"use client";

export type InterviewStatus = "done" | "scheduled" | "notScheduled";
export type FinalDecision = "Passed" | "Failed";

export type StoredCv = {
  name: string;
  mimeType: string;
  size: number;
  pages?: number;
  dataUrl: string;
  uploadedAt: number;
};

export type TechnicalAnswer = {
  criterionId: string;
  criteria: string;
  skills: string;
  rating?: number;
  comment: string;
};

export type Candidate = {
  id: string;
  candidateName: string;
  interviewDate: string;
  titleInterviewedFor: string;
  interviewerName: string;
  interviewerFeedback: string;
  interviewStatus: InterviewStatus;
  cv?: StoredCv;
  technicalAssessment: TechnicalAnswer[];
  totalScore?: number;
  finalScore?: number;
  finalDecision?: FinalDecision;
  isDraft?: boolean;
  createdAt: number;
  updatedAt: number;
  legacy?: boolean;
};

type LegacyCandidate = {
  id?: string;
  name?: string;
  role?: string;
  notes?: string;
  createdAt?: number;
};

const STORAGE_KEY = "hr-agent:candidates:v2";
const LEGACY_KEY = "hr-agent:candidates";
const MIGRATED_KEY = "hr-agent:candidates:migrated-v2";

function notify() {
  window.dispatchEvent(new CustomEvent("hr-agent:candidates-updated"));
}

function migrateLegacy(): Candidate[] {
  if (typeof window === "undefined" || window.localStorage.getItem(MIGRATED_KEY)) return [];
  let migrated: Candidate[] = [];
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    const old = raw ? (JSON.parse(raw) as LegacyCandidate[]) : [];
    migrated = old.map((candidate, index) => {
      const now = candidate.createdAt || Date.now() + index;
      return {
        id: candidate.id || crypto.randomUUID(),
        candidateName: candidate.name || "Unnamed legacy candidate",
        interviewDate: "",
        titleInterviewedFor: candidate.role || "",
        interviewerName: "",
        interviewerFeedback: candidate.notes || "",
        interviewStatus: "notScheduled" as const,
        technicalAssessment: [],
        createdAt: now,
        updatedAt: now,
        legacy: true
      };
    });
    // Write the records before the marker. If storage is full, a later read can
    // retry the migration instead of permanently hiding the legacy records.
    if (migrated.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    window.localStorage.setItem(MIGRATED_KEY, "1");
  } catch {
    // Keep the app usable if legacy data is malformed or storage is unavailable.
  }
  return migrated;
}

function readAll(): Candidate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Candidate[];
    return migrateLegacy();
  } catch {
    return [];
  }
}

function writeAll(candidates: Candidate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
  notify();
}

export function listCandidates(options?: { includeDrafts?: boolean }): Candidate[] {
  return readAll()
    .filter((candidate) => options?.includeDrafts || !candidate.isDraft)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getCandidate(id?: string): Candidate | undefined {
  if (!id) return undefined;
  return readAll().find((candidate) => candidate.id === id);
}

export function upsertCandidate(candidate: Candidate) {
  const candidates = readAll();
  const index = candidates.findIndex((item) => item.id === candidate.id);
  if (index === -1) candidates.push(candidate);
  else candidates[index] = candidate;
  writeAll(candidates);
}

export function removeCandidate(id: string) {
  writeAll(readAll().filter((candidate) => candidate.id !== id));
}

export function findCandidates(query: string): Candidate[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];
  return listCandidates().filter((candidate) =>
    candidate.candidateName.toLocaleLowerCase().includes(q)
  );
}

export function clearAll() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_KEY);
  window.localStorage.removeItem(MIGRATED_KEY);
  window.localStorage.removeItem("hr-agent:chat-session:v2");
  notify();
}
