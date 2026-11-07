"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, animate as animateValue, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { CheckCircle2, Loader2, LogOut, Pencil, Plus, Trash2, Users } from "lucide-react";

import { ChatComposer } from "@/components/chat-composer";
import { ChatMessage, TypingIndicator } from "@/components/chat-message";
import { VodafoneLogo } from "@/components/vodafone-logo";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import {
  QUESTIONNAIRE,
  confirmCandidateReview,
  WorkflowSession,
  ReviewField,
  createSession,
  exitFlow,
  handleText,
  loadSession,
  navigateAssessment,
  reenterPreviousStep,
  requestExit,
  resumeDraftSession,
  saveSession,
  startReviewEdit,
  userMessage
} from "@/lib/assessment-workflow";
import { Candidate, clearAll, getCandidate, listCandidates } from "@/lib/candidates";

const ADD_PROGRESS: Partial<Record<WorkflowSession["step"], number>> = {
  add_name: 1,
  add_phone: 2,
  add_phone_duplicate: 2,
  add_date: 3,
  add_title: 4,
  add_interviewer: 4,
  add_review: 5
};

const REVIEW_FIELDS: Array<{ key: ReviewField; label: string }> = [
  { key: "candidateName", label: "Candidate name" },
  { key: "phoneNumber", label: "Phone number" },
  { key: "titleInterviewedFor", label: "Interviewed role" },
  { key: "interviewerName", label: "Interviewer" },
  { key: "interviewDate", label: "Interview date" }
];

const RATING_LABELS = ["Poor", "Needs improvement", "Good", "Very good", "Excellent"];

function isAssessmentPromptMessage(content: string) {
  return content.startsWith("Question ") || content.startsWith("Add a comment for ") || content.startsWith("Please use this rating scale:");
}

function formatReviewValue(field: ReviewField, candidate: Candidate) {
  const value = candidate[field];
  if (!value) return "Not set";
  if (field === "interviewDate" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return value;
}

function CandidateReviewCard({
  candidate,
  disabled,
  onEdit,
  onConfirm
}: {
  candidate: Candidate;
  disabled: boolean;
  onEdit: (field: ReviewField) => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-vodafone-red/20 bg-white p-4 shadow-[0_12px_30px_-20px_rgba(230,0,0,0.55)] sm:p-5"
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900">Review candidate details</h2>
        <p className="mt-1 text-xs text-zinc-500">Check the information before saving and starting the technical assessment.</p>
      </div>
      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
        {REVIEW_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</div>
              <div className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-900">{formatReviewValue(key, candidate)}</div>
            </div>
            <Button
              type="button"
              onClick={() => onEdit(key)}
              disabled={disabled}
              variant="ghost"
              size="sm"
              className="shrink-0 text-vodafone-accent hover:text-vodafone-accent"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />Edit
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className="mt-4 w-full"
      >
        {disabled ? <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
        {disabled ? "Saving candidate…" : "Confirm and save candidate"}
      </Button>
    </motion.div>
  );
}

function CandidateSavedNotice({ candidateName }: { candidateName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
      role="status"
    >
      <motion.span
        initial={{ scale: 0, rotate: -35 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 18 }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
      >
        <CheckCircle2 className="h-5 w-5" />
      </motion.span>
      <span><strong>{candidateName || "Candidate"}</strong> saved successfully. Technical assessment started.</span>
    </motion.div>
  );
}

function AnimatedScore({ score }: { score: number }) {
  const reducedMotion = useReducedMotion();
  const scoreValue = useMotionValue(reducedMotion ? score : 0);
  const displayScore = useTransform(scoreValue, (value) => `${value.toFixed(2)}%`);

  useEffect(() => {
    if (reducedMotion) {
      scoreValue.set(score);
      return;
    }
    const controls = animateValue(scoreValue, score, { duration: 1.1, ease: "easeOut" });
    return () => controls.stop();
  }, [reducedMotion, score, scoreValue]);

  return <motion.span className="text-2xl font-bold text-vodafone-accent">{displayScore}</motion.span>;
}

function AssessmentScoreNotice({ candidate }: { candidate: Candidate }) {
  if (typeof candidate.finalScore !== "number") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-4 rounded-2xl border border-vodafone-red/20 bg-white px-4 py-3 shadow-sm"
      role="status"
    >
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Assessment complete</div>
        <div className="mt-1 text-sm text-zinc-800">{candidate.finalDecision || "Result calculated"}</div>
      </div>
      <AnimatedScore score={candidate.finalScore} />
    </motion.div>
  );
}

function AssessmentRatingCard({
  session,
  candidate,
  disabled,
  onRate
}: {
  session: WorkflowSession;
  candidate?: Candidate;
  disabled: boolean;
  onRate: (rating: string) => void;
}) {
  const index = session.questionIndex || 0;
  const currentAnswer = candidate?.technicalAssessment[index];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-vodafone-red/20 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Technical assessment</div>
          <h2 className="mt-1 text-base font-semibold text-zinc-900">Question {index + 1} of {QUESTIONNAIRE.length}</h2>
        </div>
      </div>
      <div className="rounded-xl bg-zinc-50 px-3 py-3">
        <p className="text-sm font-medium leading-relaxed text-zinc-900">
          How would you rate the candidate on <strong>{QUESTIONNAIRE[index][0]}</strong>?
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">
          Consider: {QUESTIONNAIRE[index][1]}.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {RATING_LABELS.map((label, ratingIndex) => {
          const rating = ratingIndex + 1;
          const selected = currentAnswer?.rating === rating;
          return (
            <motion.button
              key={label}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onRate(String(rating))}
              disabled={disabled}
              className={`min-h-16 rounded-xl border px-3 py-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                selected
                  ? "border-vodafone-red bg-vodafone-red text-white shadow-md"
                  : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-vodafone-red/60 hover:bg-vodafone-red/5"
              }`}
            >
              <span className="block text-lg font-bold">{rating}</span>
              <span className="mt-0.5 block text-[11px] font-medium leading-tight">{label}</span>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">No typing is needed for the rating.</p>
    </motion.div>
  );
}

function AssessmentCommentCard({
  session,
  disabled,
  onSkip
}: {
  session: WorkflowSession;
  disabled: boolean;
  onSkip: () => void;
}) {
  const index = session.questionIndex || 0;
  const rating = session.pendingRating;
  const ratingLabel = typeof rating === "number" ? RATING_LABELS[rating - 1] : "Not rated";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-vodafone-red/20 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Technical assessment · Add comment</div>
      <h2 className="mt-1 text-base font-semibold text-zinc-900">Question {index + 1} of {QUESTIONNAIRE.length}</h2>
      <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-3">
        <p className="text-sm font-medium leading-relaxed text-zinc-900">
          How would you rate the candidate on <strong>{QUESTIONNAIRE[index][0]}</strong>?
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">Consider: {QUESTIONNAIRE[index][1]}.</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-vodafone-red/5 px-3 py-2.5">
        <span className="text-sm text-zinc-600">Selected rating</span>
        <span className="font-semibold text-vodafone-accent">{rating}/5 · {ratingLabel}</span>
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-800">Type your comment in the message box below, or click Skip comment.</p>
      <Button type="button" onClick={onSkip} disabled={disabled} variant="outline" size="sm" className="mt-3">
        Skip comment
      </Button>
    </motion.div>
  );
}

function ExitConfirmation({
  hasDraft,
  onChoice,
  onContinue
}: {
  hasDraft: boolean;
  onChoice: (choice: "save" | "discard" | "close") => void;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-sm" role="presentation">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-confirmation-title"
        className="w-full max-w-md rounded-2xl border border-vodafone-red/20 bg-white p-5 shadow-2xl"
      >
        <h2 id="exit-confirmation-title" className="text-base font-semibold text-zinc-900">Exit current candidate flow?</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          You are opting out of the current flow. Choose how you want to handle the information entered so far.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {hasDraft ? (
            <Button type="button" onClick={() => onChoice("save")} className="w-full justify-center">
              Save as draft and exit
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => onChoice(hasDraft ? "discard" : "close")}
            variant="outline"
            className="w-full justify-center text-vodafone-accent hover:text-vodafone-accent"
          >
            {hasDraft ? "Discard and exit" : "Exit flow"}
          </Button>
          <Button type="button" onClick={onContinue} variant="ghost" className="w-full justify-center">
            Continue editing
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function candidateStatus(candidate: Candidate) {
  if (candidate.finalDecision) return candidate.finalDecision;
  if (candidate.interviewStatus === "done") return "Completed";
  if (candidate.interviewStatus === "scheduled") return "Scheduled";
  return "Not scheduled";
}

function formatUpdatedAt(timestamp: number) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(timestamp);
}

function CandidateSearchResults({
  candidates,
  disabled,
  onSelect
}: {
  candidates: Candidate[];
  disabled: boolean;
  onSelect: (candidateId: string) => void;
}) {
  const phoneCounts = new Map<string, number>();
  candidates.forEach((candidate) => {
    if (candidate.phoneNumber) phoneCounts.set(candidate.phoneNumber, (phoneCounts.get(candidate.phoneNumber) || 0) + 1);
  });
  const duplicatePhones = [...phoneCounts.entries()].filter(([, count]) => count > 1).map(([phone]) => phone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {duplicatePhones.length ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
          <span className="font-semibold">Duplicate phone numbers found:</span> {duplicatePhones.join(", ")}. Use the role and last updated date to select the correct profile.
        </div>
      ) : null}
      {candidates.map((candidate) => (
        <div key={candidate.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-zinc-900">{candidate.candidateName}</h3>
              <div className="mt-2 grid gap-1 text-xs text-zinc-600 sm:grid-cols-2 sm:gap-x-6">
                <span><strong className="font-medium text-zinc-800">Phone:</strong> {candidate.phoneNumber || "Not set"}</span>
                <span><strong className="font-medium text-zinc-800">Role:</strong> {candidate.titleInterviewedFor || "Not set"}</span>
                <span><strong className="font-medium text-zinc-800">Status:</strong> {candidateStatus(candidate)}</span>
                <span><strong className="font-medium text-zinc-800">Last updated:</strong> {formatUpdatedAt(candidate.updatedAt)}</span>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => onSelect(candidate.id)}
              disabled={disabled}
              size="sm"
              className="shrink-0"
            >
              Select candidate
            </Button>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function WorkflowProgress({ session }: { session: WorkflowSession }) {
  const addStep = ADD_PROGRESS[session.step];
  const isAssessment = session.step === "assessment_rating" || session.step === "assessment_comment";
  if (!addStep && !isAssessment) return null;

  const current = isAssessment ? (session.questionIndex || 0) + 1 : addStep!;
  const total = isAssessment ? QUESTIONNAIRE.length : 5;
  const label = isAssessment ? "Technical assessment" : "Candidate entry";
  const percentage = (current / total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="relative z-10 border-b border-vodafone-red/10 bg-white/80 px-4 py-2.5 backdrop-blur sm:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-medium text-zinc-600">
          <span>{label}</span>
          <span>{isAssessment ? `Question ${current} of ${total}` : `Step ${current} of ${total}`}</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-vodafone-red/10"
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={current}
        >
          <motion.div
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-vodafone-red to-vodafone-accent"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function ChatShell() {
  const router = useRouter();
  const [session, setSession] = useState<WorkflowSession>(() => createSession());
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);
  const [savedCandidate, setSavedCandidate] = useState<Candidate | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSession(loadSession());
    setCandidates(listCandidates({ includeDrafts: true }));
    setHydrated(true);
    const handler = () => setCandidates(listCandidates({ includeDrafts: true }));
    window.addEventListener("hr-agent:candidates-updated", handler);
    return () => window.removeEventListener("hr-agent:candidates-updated", handler);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      saveSession(session);
    } catch {
      // Candidate data is persisted independently from the chat session.
    }
  }, [hydrated, session]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [session.messages, thinking]);

  useEffect(() => {
    if (!savedCandidate) return;
    const timeout = window.setTimeout(() => setSavedCandidate(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [savedCandidate]);

  function submit(value?: string) {
    const text = (value ?? input).trim();
    if (!text || thinking) return;

    const checkpoint = {
      version: session.version,
      step: session.step,
      messages: session.messages,
      candidateId: session.candidateId,
      questionIndex: session.questionIndex,
      pendingRating: session.pendingRating,
      assessmentReturn: session.assessmentReturn,
      singleCriterion: session.singleCriterion,
      updateField: session.updateField,
      previousStep: session.previousStep,
      duplicateCandidateId: session.duplicateCandidateId
    };
    const base = {
      ...session,
      messages: [...session.messages, userMessage(text)],
      history: [...(session.history || []), checkpoint]
    };
    setSession(base);
    setInput("");
    setThinking(true);

    window.setTimeout(() => {
      try {
        const next = handleText(base, text);
        setSession(next);
      } catch (error) {
        setSession({
          ...base,
          messages: [
            ...base.messages,
            { id: crypto.randomUUID(), role: "agent", content: "I couldn't save that response. Existing records are safe; please try again.", createdAt: Date.now() }
          ]
        });
      } finally {
        setThinking(false);
      }
    }, 450);
  }

  function handleAction(value: string) {
    if (value === "review:confirm") {
      const candidate = getCandidate(session.candidateId);
      if (candidate) setSavedCandidate(candidate);
      setInput("");
      setThinking(true);
      window.setTimeout(() => {
        setSession(confirmCandidateReview(session));
        setThinking(false);
      }, 350);
      return;
    }
    if (value.startsWith("review:edit:")) {
      const field = value.slice("review:edit:".length) as ReviewField;
      if (REVIEW_FIELDS.some((item) => item.key === field)) {
        setSession(startReviewEdit(session, field));
        setInput("");
        setThinking(false);
      }
      return;
    }
    if (value === "exit:save" || value === "exit:discard" || value === "exit:continue") {
      const labels = {
        "exit:save": "Save as draft and exit",
        "exit:discard": "Discard and exit",
        "exit:continue": "Continue editing"
      } as const;
      submit(labels[value]);
      return;
    }
    if (value === "duplicate:open") {
      submit("Open existing profile");
      return;
    }
    if (value === "assessment:previous") {
      setSession(navigateAssessment(session, "previous"));
      setInput("");
      setThinking(false);
      return;
    }
    if (value === "assessment:next") {
      submit(input.trim() || "skip");
      return;
    }
    if (value === "workflow:exit") {
      setSession(requestExit(session));
      setInput("");
      setThinking(false);
      return;
    }
    if (value === "workflow:back") {
      setSession(reenterPreviousStep(session));
      setInput("");
      setThinking(false);
      return;
    }
    submit(value);
  }

  function handleExitChoice(choice: "save" | "discard" | "close") {
    setExitConfirmationOpen(false);
    setSession(exitFlow(session, choice));
    setInput("");
    setThinking(false);
  }

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" })
    });
    router.push("/login");
    router.refresh();
  }

  function newChat() {
    if (session.candidateId && session.step !== "main") {
      submit("menu");
      return;
    }
    setSession(createSession());
    setInput("");
    setThinking(false);
  }

  function startSearch(name: string) {
    const fresh = createSession();
    const selected = handleText(fresh, "2");
    setSession(handleText({ ...selected, messages: [...selected.messages, userMessage(name)] }, name));
  }

  function openCandidate(candidate: Candidate) {
    if (candidate.isDraft) {
      setSession(resumeDraftSession(candidate.id));
      setInput("");
      setThinking(false);
      return;
    }
    startSearch(candidate.candidateName);
  }

  const enterEase = [0.22, 1, 0.36, 1] as const;
  const lastMessageId = session.messages.at(-1)?.id;
  const reviewCandidate = session.step === "add_review" ? getCandidate(session.candidateId) : undefined;
  const assessmentCandidate = session.step === "assessment_rating" || session.step === "assessment_comment"
    ? getCandidate(session.candidateId)
    : undefined;
  const isCandidateSelection = session.step === "search_select" || session.step === "update_select";
  const searchResults = isCandidateSelection
    ? (session.messages.at(-1)?.actions || [])
        .map((action) => getCandidate(action.value))
        .filter((candidate): candidate is Candidate => Boolean(candidate))
    : [];
  const drafts = candidates.filter((candidate) => candidate.isDraft);
  const completedCandidates = candidates.filter((candidate) => !candidate.isDraft);

  const lastMessage = session.messages.at(-1);
  const assessmentResultShown = lastMessage?.role === "agent" && /(?:score of|at) \*\*\d+(?:\.\d+)?%\*\*/.test(lastMessage.content);
  const completedCandidate = assessmentResultShown ? getCandidate(session.candidateId) : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[100dvh] w-full bg-white text-zinc-900">
      <motion.aside
        initial={{ x: "-110%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.65, ease: enterEase, delay: 0.05 }}
        className="hidden md:flex w-72 shrink-0 flex-col border-r border-vodafone-red/15 bg-white/90 backdrop-blur-xl"
      >
        <div className="p-5 border-b border-vodafone-red/10"><VodafoneLogo withWordmark /></div>
        <div className="p-4">
          <Button onClick={newChat} className="w-full" variant="outline"><Plus className="mr-2 h-4 w-4" />New chat</Button>
        </div>
        <div className="px-5 pt-2 pb-1 text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> Candidates
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {drafts.length > 0 ? (
            <>
              <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-vodafone-accent">Drafts</div>
              {drafts.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => openCandidate(candidate)}
                  className="group w-full rounded-lg border border-vodafone-red/20 bg-vodafone-red/5 px-3 py-2.5 text-left transition hover:border-vodafone-red/40 hover:bg-vodafone-red/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium text-zinc-900">{candidate.candidateName || "Unnamed candidate"}</div>
                    <span className="shrink-0 rounded-full bg-vodafone-red/10 px-2 py-0.5 text-[10px] font-medium text-vodafone-accent">Draft</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 truncate">
                    {[candidate.phoneNumber, candidate.titleInterviewedFor].filter(Boolean).join(" • ") || "Incomplete candidate details"}
                  </div>
                </button>
              ))}
            </>
          ) : null}
          <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Completed candidates</div>
          {completedCandidates.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-zinc-500">No completed candidates yet.</p>
          ) : completedCandidates.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => openCandidate(candidate)}
              className="group w-full text-left rounded-lg px-3 py-2.5 hover:bg-vodafone-red/10 border border-transparent hover:border-vodafone-red/30 transition"
            >
              <div className="text-sm font-medium text-zinc-900 truncate">{candidate.candidateName}</div>
              <div className="text-xs text-zinc-500 truncate">
                {[candidate.phoneNumber, candidate.titleInterviewedFor, candidate.finalDecision].filter(Boolean).join(" • ")}
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-vodafone-red/10 space-y-1">
          {candidates.length > 0 ? (
            <Button
              onClick={() => { if (confirm("Clear all stored candidates and chat history?")) { clearAll(); setSession(createSession()); } }}
              variant="ghost" size="sm" className="w-full justify-start text-zinc-400 hover:text-vodafone-accent"
            ><Trash2 className="mr-2 h-4 w-4" />Clear all</Button>
          ) : null}
          <Button onClick={handleLogout} variant="ghost" size="sm" className="w-full justify-start text-zinc-500 hover:text-zinc-900">
            <LogOut className="mr-2 h-4 w-4" />Sign out
          </Button>
        </div>
      </motion.aside>

      <motion.main initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ duration: 0.65, ease: enterEase }} className="relative flex-1 flex flex-col overflow-hidden">
        <Spotlight className="-top-40 left-10 md:left-1/3" fill="#E60000" />
        <header className="relative z-10 flex items-center justify-between border-b border-vodafone-red/15 bg-white/90 backdrop-blur px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="md:hidden"><VodafoneLogo size={32} /></div>
            <div><h1 className="text-sm font-semibold tracking-wide">Candidate Assessment Agent</h1><p className="text-[11px] text-zinc-500">Guided local assessment • Vodafone Egypt</p></div>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="md:hidden text-zinc-400" aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
        </header>

        <WorkflowProgress session={session} />

        {session.step !== "main" ? (
          <div className="relative z-10 flex flex-wrap items-center gap-2 border-b border-vodafone-red/10 bg-white/80 px-4 py-2.5 backdrop-blur sm:px-8">
            <span className="mr-1 text-xs text-zinc-500">Flow controls:</span>
            {session.step === "assessment_rating" || session.step === "assessment_comment" ? (
              <>
                <Button
                  onClick={() => handleAction("assessment:previous")}
                  disabled={thinking || (session.questionIndex || 0) === 0}
                  variant="outline"
                  size="sm"
                >
                  Previous criterion
                </Button>
                {session.step === "assessment_comment" ? (
                  <Button onClick={() => handleAction("assessment:next")} disabled={thinking} size="sm">
                    {(session.questionIndex || 0) === QUESTIONNAIRE.length - 1 ? "Finish criterion" : "Next criterion"}
                  </Button>
                ) : null}
              </>
            ) : null}
            <Button
              onClick={() => handleAction("workflow:back")}
              disabled={thinking}
              variant="outline"
              size="sm"
            >
              Re-enter previous answer
            </Button>
            <Button
              onClick={() => setExitConfirmationOpen(true)}
              disabled={thinking}
              variant="outline"
              size="sm"
              className="text-vodafone-accent hover:text-vodafone-accent"
            >
              Exit current candidate flow
            </Button>
          </div>
        ) : null}

        <div ref={scrollerRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="mx-auto max-w-3xl space-y-5">
            <AnimatePresence initial={false}>
            {savedCandidate ? <CandidateSavedNotice candidateName={savedCandidate.candidateName} /> : null}
            {session.messages.map((message) => {
              const isAssessmentPrompt = message.role === "agent" && isAssessmentPromptMessage(message.content);
              if (isAssessmentPrompt && message.id === lastMessageId) return null;
              return (
                <ChatMessage
                  key={message.id}
                  message={{
                    ...message,
                    actions:
                      (isCandidateSelection || isAssessmentPrompt || (session.step === "assessment_rating" && message.id === lastMessageId) || (session.step === "assessment_comment" && message.id === lastMessageId))
                        ? undefined
                        : message.actions
                  }}
                  onAction={handleAction}
                  actionsDisabled={thinking || message.id !== lastMessageId}
                />
              );
            })}
            {reviewCandidate ? (
              <CandidateReviewCard
                candidate={reviewCandidate}
                disabled={thinking}
                onEdit={(field) => handleAction(`review:edit:${field}`)}
                onConfirm={() => handleAction("review:confirm")}
              />
            ) : null}
            {session.step === "assessment_rating" ? (
              <AssessmentRatingCard
                session={session}
                candidate={assessmentCandidate}
                disabled={thinking}
                onRate={(rating) => handleAction(rating)}
              />
            ) : null}
            {session.step === "assessment_comment" ? (
              <AssessmentCommentCard
                session={session}
                disabled={thinking}
                onSkip={() => handleAction("skip")}
              />
            ) : null}
            {searchResults.length ? (
              <CandidateSearchResults
                candidates={searchResults}
                disabled={thinking}
                onSelect={(candidateId) => handleAction(candidateId)}
              />
            ) : null}
            {completedCandidate ? <AssessmentScoreNotice key={`${completedCandidate.id}-${completedCandidate.finalScore}`} candidate={completedCandidate} /> : null}
            </AnimatePresence>
            {thinking ? <TypingIndicator /> : null}
          </div>
        </div>

        <div className="relative z-10 border-t border-vodafone-red/15 bg-white/90 backdrop-blur px-4 sm:px-8 py-4">
          <div className="mx-auto max-w-3xl">
            <ChatComposer
              value={input}
              onChange={setInput}
              onSubmit={() => submit()}
              disabled={thinking}
              inputDisabled={session.step === "assessment_rating"}
              placeholder={session.step === "assessment_rating" ? "Choose a rating button above…" : session.step === "assessment_comment" ? "Type a comment for this criterion…" : undefined}
              datePicker={session.step === "add_date" || (session.step === "update_field_value" && session.updateField === "interviewDate")}
            />
          </div>
        </div>
        {exitConfirmationOpen ? (
          <ExitConfirmation
            hasDraft={Boolean(session.candidateId && getCandidate(session.candidateId)?.isDraft)}
            onChoice={handleExitChoice}
            onContinue={() => setExitConfirmationOpen(false)}
          />
        ) : null}
        <motion.div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(rgba(24,24,27,.35) 1px, transparent 1px),linear-gradient(90deg, rgba(24,24,27,.35) 1px, transparent 1px)", backgroundSize: "44px 44px" }}
          animate={{ backgroundPosition: ["0 0", "44px 44px"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      </motion.main>
      </motion.div>
    </MotionConfig>
  );
}
