"use client";

import {
  Candidate,
  FinalDecision,
  InterviewStatus,
  TechnicalAnswer,
  findCandidates,
  getCandidate,
  removeCandidate,
  upsertCandidate
} from "./candidates";

export type QuickAction = { label: string; value: string };
export type WorkflowMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
  createdAt: number;
  actions?: QuickAction[];
};

export type WorkflowCheckpoint = {
  version: 2;
  step: WorkflowStep;
  messages: WorkflowMessage[];
  candidateId?: string;
  questionIndex?: number;
  pendingRating?: number;
  assessmentReturn?: "add" | "search" | "update";
  singleCriterion?: boolean;
  updateField?: WorkflowSession["updateField"];
  previousStep?: WorkflowStep;
};

export type WorkflowStep =
  | "main"
  | "add_name"
  | "add_phone"
  | "add_date"
  | "add_title"
  | "add_interviewer"
  | "add_feedback"
  | "assessment_rating"
  | "assessment_comment"
  | "search_name"
  | "search_select"
  | "search_status"
  | "search_details"
  | "scheduled_assessment"
  | "update_name"
  | "update_select"
  | "update_menu"
  | "update_field_select"
  | "update_field_value"
  | "update_status"
  | "update_assessment_mode"
  | "update_criterion_select"
  | "cancel_confirm";

export type WorkflowSession = {
  version: 2;
  step: WorkflowStep;
  messages: WorkflowMessage[];
  candidateId?: string;
  questionIndex?: number;
  pendingRating?: number;
  assessmentReturn?: "add" | "search" | "update";
  singleCriterion?: boolean;
  updateField?: keyof Pick<
    Candidate,
    | "candidateName"
    | "phoneNumber"
    | "interviewDate"
    | "titleInterviewedFor"
    | "interviewerName"
    | "interviewerFeedback"
  >;
  previousStep?: WorkflowStep;
  history?: WorkflowCheckpoint[];
};

export const QUESTIONNAIRE = [
  ["Testing Fundamentals", "STLC, SDLC, test case design, test scenarios"],
  ["Test Documentation", "Writing test cases, test plans, test data, and checklists"],
  ["Bug Tracking & Reporting", "Logging clear, detailed, and reproducible bugs"],
  ["Test Execution", "Functional, regression, smoke, and UAT testing"],
  ["Defect Lifecycle Management", "Understanding defect states and workflows"],
  ["Testing Tools", "Jira, TestRail, Zephyr, or similar platforms"],
  ["Exploratory Testing", "App behavior across OS, devices, browsers, screen sizes"],
  ["Cross-Browser/Device Testing", "UI/functionality validation across browsers and devices"],
  ["Programming/Scripting Skills", "Proficiency in Java, Python, JavaScript, or equivalent"],
  ["Automation Frameworks", "Experience with Selenium, Cypress, Playwright, Appium, etc."],
  ["Test Script Development", "Writing, debugging, and maintaining test automation scripts"],
  ["CI/CD Integration", "Integration with Jenkins, GitLab CI, GitHub Actions, or similar tools"],
  ["API Testing", "Postman, REST-assured, Swagger, or similar tools"],
  ["Mobile Testing", "Manual & automation testing on iOS and Android devices"],
  ["Database Testing", "Validating data integrity, queries, stored procedures"],
  ["Compatibility Testing", "App behavior across OS, devices, browsers, screen sizes"],
  ["Automation Design Patterns", "Page Object Model (POM), data-driven and keyword-driven testing"],
  ["Version Control", "Git commands: clone, commit, merge, branching, pull requests"],
  ["AI Tools", "Copilot, Claude, Cursor"]
] as const;

const SESSION_KEY = "hr-agent:chat-session:v2";
const MAIN_ACTIONS: QuickAction[] = [
  { label: "1 · Add candidate", value: "1" },
  { label: "2 · Search", value: "2" },
  { label: "3 · Update", value: "3" }
];
const YES_NO: QuickAction[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" }
];
const STATUS_ACTIONS: QuickAction[] = [
  { label: "1 · Done", value: "1" },
  { label: "2 · Scheduled", value: "2" },
  { label: "3 · Not scheduled", value: "3" }
];
const RATINGS: QuickAction[] = [1, 2, 3, 4, 5].map((rating) => ({
  label: String(rating),
  value: String(rating)
}));

function id() {
  return crypto.randomUUID();
}

function agent(content: string, actions?: QuickAction[]): WorkflowMessage {
  return { id: id(), role: "agent", content, createdAt: Date.now(), actions };
}

export function userMessage(content: string): WorkflowMessage {
  return { id: id(), role: "user", content, createdAt: Date.now() };
}

function mainMessage(extraActions: QuickAction[] = []) {
  return agent(
    "Welcome to **Vodafone Candidate Assessment**. What would you like to do today?\n\n1. Add a new candidate\n2. Search for an existing candidate\n3. Update candidate details",
    [...extraActions, ...MAIN_ACTIONS]
  );
}

export function createSession(): WorkflowSession {
  return { version: 2, step: "main", messages: [mainMessage()] };
}

export function loadSession(): WorkflowSession {
  if (typeof window === "undefined") return createSession();
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as WorkflowSession) : undefined;
    if (parsed?.version !== 2 || !Array.isArray(parsed.messages)) return createSession();

    const candidateSteps: WorkflowStep[] = [
      "add_name",
      "add_phone",
      "add_date",
      "add_title",
      "add_interviewer",
      "add_feedback",
      "assessment_rating",
      "assessment_comment",
      "search_status",
      "search_details",
      "scheduled_assessment",
      "update_menu",
      "update_field_select",
      "update_field_value",
      "update_status",
      "update_assessment_mode",
      "update_criterion_select"
    ];
    if (candidateSteps.includes(parsed.step) && !getCandidate(parsed.candidateId)) {
      const fresh = createSession();
      return {
        ...fresh,
        messages: [
          agent("The saved candidate for the previous conversation is no longer available. I returned you to the main menu."),
          ...fresh.messages
        ]
      };
    }
    return parsed;
  } catch {
    return createSession();
  }
}

export function saveSession(session: WorkflowSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function cancelFlow(session: WorkflowSession) {
  const candidate = getCandidate(session.candidateId);
  if (candidate?.isDraft) removeCandidate(candidate.id);
  return returnMain(session, "The current candidate flow was cancelled.");
}

export function reenterPreviousStep(session: WorkflowSession) {
  const history = session.history || [];
  const previous = history.at(-1);
  if (!previous) return withAgent(session, "There is no previous step to re-enter.");
  return { ...previous, history: history.slice(0, -1) };
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

function withAgent(session: WorkflowSession, content: string, actions?: QuickAction[]): WorkflowSession {
  return { ...session, messages: [...session.messages, agent(content, actions)] };
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

function isEgyptianMobile(value: string) {
  return /^01[0125]\d{8}$/.test(value.trim());
}

function invalidMobileMessage(value: string) {
  return `mobile number ${value} mesh Sah, Garab tani keda`;
}

function isChoice(value: string, number: string, words: string[]) {
  const input = normalized(value);
  return input === number || words.some((word) => input.includes(word));
}

function parseDate(input: string): string | undefined {
  const value = input.trim();
  let year: number;
  let month: number;
  let day: number;
  let match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) [, day, month, year] = match.map(Number);
  else {
    match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return undefined;
    [, year, month, day] = match.map(Number);
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return undefined;
  }
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

function answers(): TechnicalAnswer[] {
  return QUESTIONNAIRE.map(([criteria, skills], index) => ({
    criterionId: `q${index + 1}`,
    criteria,
    skills,
    comment: ""
  }));
}

function updateCandidate(id: string | undefined, patch: Partial<Candidate>) {
  const candidate = getCandidate(id);
  if (!candidate) return undefined;
  const updated = { ...candidate, ...patch, updatedAt: Date.now() };
  upsertCandidate(updated);
  return updated;
}

function basicSummary(candidate: Candidate) {
  return [
    `**${candidate.candidateName}**`,
    `Phone: ${candidate.phoneNumber || "Not set"}`,
    `Interview date: ${candidate.interviewDate || "Not set"}`,
    `Title: ${candidate.titleInterviewedFor || "Not set"}`,
    `Interviewer: ${candidate.interviewerName || "Not set"}`,
    `Interview status: ${candidate.interviewStatus}`,
    `Feedback: ${candidate.interviewerFeedback || "Not set"}`
  ].join("\n");
}

function searchResultSummary(matches: Candidate[]) {
  return matches
    .map((candidate, index) => `**Result ${index + 1}**\n${basicSummary(candidate)}`)
    .join("\n\n");
}

function assessmentPrompt(index: number) {
  const [criteria, skills] = QUESTIONNAIRE[index];
  return agent(
    `Question ${index + 1} of ${QUESTIONNAIRE.length}: How would you rate the candidate on **${criteria}** (${skills})?`,
    RATINGS
  );
}

function ratingScale() {
  return (
    "Please use this rating scale:\n\n" +
    "1 → Poor (Lacks competency)\n" +
    "2 → Basic (Minimal demonstration)\n" +
    "3 → Developing (Moderate, needs improvement)\n" +
    "4 → Proficient (Solid and relevant application)\n" +
    "5 → Expert (Exceptional, insightful examples)"
  );
}

function startAssessment(
  session: WorkflowSession,
  candidate: Candidate,
  returnTo: "add" | "search" | "update",
  reset: boolean
): WorkflowSession {
  if (reset || candidate.technicalAssessment.length !== QUESTIONNAIRE.length) {
    updateCandidate(candidate.id, { technicalAssessment: answers() });
  }
  return {
    ...session,
    step: "assessment_rating",
    candidateId: candidate.id,
    questionIndex: 0,
    assessmentReturn: returnTo,
    singleCriterion: false,
    messages: [...session.messages, agent(ratingScale()), assessmentPrompt(0)]
  };
}

function calculate(candidate: Candidate) {
  const complete = candidate.technicalAssessment.length === QUESTIONNAIRE.length &&
    candidate.technicalAssessment.every((answer) => typeof answer.rating === "number");
  if (!complete) return candidate;
  const totalScore = candidate.technicalAssessment.reduce((sum, answer) => sum + (answer.rating || 0), 0);
  const finalScore = Number(((totalScore / 95) * 100).toFixed(2));
  const finalDecision: FinalDecision = finalScore >= 50 ? "Passed" : "Failed";
  return updateCandidate(candidate.id, {
    totalScore,
    finalScore,
    finalDecision,
    interviewStatus: "done",
    isDraft: false,
    legacy: false
  })!;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Basic",
  3: "Developing",
  4: "Proficient",
  5: "Expert"
};

function details(candidate: Candidate) {
  return candidate.technicalAssessment
    .map((answer, index) => {
      const score =
        typeof answer.rating === "number"
          ? `${answer.rating}/5 — **${RATING_LABELS[answer.rating] || "Unknown"}**`
          : "Not rated";
      return `${index + 1}. **${answer.criteria}** — ${score}\nComment: ${answer.comment || "No comment"}`;
    })
    .join("\n\n");
}

function candidateActions(matches: Candidate[]): QuickAction[] {
  return matches.map((candidate) => ({
    label: `${candidate.candidateName} · ${candidate.phoneNumber || "No phone"} · ${candidate.titleInterviewedFor || "No title"} · ${
      candidate.interviewDate || "No date"
    }`,
    value: candidate.id
  }));
}

function updateMenu(session: WorkflowSession, prefix = "What would you like to update?") {
  return withAgent(session, prefix, [
    { label: "Basic details", value: "1" },
    { label: "Interview status", value: "2" },
    { label: "Technical assessment", value: "3" },
    { label: "Main menu", value: "menu" }
  ]);
}

function returnMain(
  session: WorkflowSession,
  message?: string,
  extraActions: QuickAction[] = []
): WorkflowSession {
  return {
    version: 2,
    step: "main",
    messages: [...session.messages, ...(message ? [agent(message)] : []), mainMessage(extraActions)]
  };
}

function selectCandidate(session: WorkflowSession, input: string, next: WorkflowStep) {
  const candidate = getCandidate(input.trim());
  if (!candidate) {
    const step = next === "search_status" ? "search_name" : "update_name";
    return withAgent(
      { ...session, step, candidateId: undefined },
      "That selection is no longer available. Please enter the candidate's name again."
    );
  }
  const selected = { ...session, candidateId: candidate.id, step: next };
  return next === "search_status"
    ? withAgent(
        selected,
        `${basicSummary(candidate)}\n\nWhat is the candidate's current interview status?`,
        STATUS_ACTIONS
      )
    : updateMenu(selected, `Selected **${candidate.candidateName}**. What would you like to update?`);
}

export function handleText(session: WorkflowSession, rawInput: string): WorkflowSession {
  const input = rawInput.trim();
  const value = normalized(input);
  if (!input) return session;

  if ((value === "cancel" || value === "menu") && session.step !== "main" && session.step !== "cancel_confirm") {
    const candidate = getCandidate(session.candidateId);
    if (candidate?.isDraft) {
      return withAgent(
        { ...session, previousStep: session.step, step: "cancel_confirm" },
        "This will discard the unfinished candidate. Return to the main menu?",
        YES_NO
      );
    }
    return returnMain(session);
  }

  if (session.step === "cancel_confirm") {
    if (isChoice(input, "1", ["yes", "confirm"])) {
      if (session.candidateId) removeCandidate(session.candidateId);
      return returnMain(session, "The unfinished candidate was discarded.");
    }
    if (isChoice(input, "2", ["no", "back"])) {
      return withAgent({ ...session, step: session.previousStep || "main", previousStep: undefined }, "Continuing where you left off.");
    }
    return withAgent(session, "Please choose Yes or No.", YES_NO);
  }

  switch (session.step) {
    case "main":
      if (isChoice(input, "1", ["add", "new candidate"])) {
        const now = Date.now();
        const candidate: Candidate = {
          id: id(),
          candidateName: "",
          phoneNumber: "",
          interviewDate: "",
          titleInterviewedFor: "",
          interviewerName: "",
          interviewerFeedback: "",
          interviewStatus: "notScheduled",
          technicalAssessment: [],
          isDraft: true,
          createdAt: now,
          updatedAt: now
        };
        upsertCandidate(candidate);
        return withAgent({ ...session, candidateId: candidate.id, step: "add_name" }, "What is the candidate's name?");
      }
      if (isChoice(input, "2", ["search", "find", "existing candidate"])) {
        return withAgent({ ...session, step: "search_name" }, "Enter the candidate's name or Egyptian mobile number.");
      }
      if (isChoice(input, "3", ["update", "edit"])) {
        return withAgent({ ...session, step: "update_name" }, "Enter the candidate's name or Egyptian mobile number.");
      }
      return withAgent(session, "Please choose 1, 2, or 3.", MAIN_ACTIONS);

    case "add_name": {
      if (input.length < 2) return withAgent(session, "Please enter a valid candidate name.");
      updateCandidate(session.candidateId, { candidateName: input });
      return withAgent({ ...session, step: "add_phone" }, "What is the candidate's Egyptian mobile number? Use 010xxxxxxxx, 011xxxxxxxx, 012xxxxxxxx, or 015xxxxxxxx.");
    }
    case "add_phone": {
      if (!isEgyptianMobile(input)) {
        return withAgent(session, invalidMobileMessage(input));
      }
      updateCandidate(session.candidateId, { phoneNumber: input });
      return withAgent({ ...session, step: "add_date" }, "What is the interview date? Use DD/MM/YYYY.");
    }
    case "add_date": {
      const interviewDate = parseDate(input);
      if (!interviewDate) return withAgent(session, "Please enter a valid date in DD/MM/YYYY format.");
      updateCandidate(session.candidateId, { interviewDate });
      return withAgent({ ...session, step: "add_title" }, "What title is the candidate being interviewed for?");
    }
    case "add_title":
      if (input.length < 2) return withAgent(session, "Please enter a valid interviewed title.");
      updateCandidate(session.candidateId, { titleInterviewedFor: input });
      return withAgent({ ...session, step: "add_interviewer" }, "What is the interviewer's name?");
    case "add_interviewer":
      if (input.length < 2) return withAgent(session, "Please enter a valid interviewer name.");
      updateCandidate(session.candidateId, { interviewerName: input });
      return withAgent({ ...session, step: "add_feedback" }, "Please enter the interviewer's overall feedback.");
    case "add_feedback": {
      const candidate = updateCandidate(session.candidateId, {
        interviewerFeedback: input,
        interviewStatus: "scheduled"
      });
      if (!candidate) return returnMain(session, "The candidate draft could not be found.");
      return startAssessment({ ...session }, candidate, "add", true);
    }

    case "assessment_rating": {
      const rating = Number(input);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return withAgent(session, "Please enter a rating from 1 to 5.", RATINGS);
      }
      const index = session.questionIndex || 0;
      return withAgent(
        { ...session, step: "assessment_comment", pendingRating: rating },
        `Add a comment for **${QUESTIONNAIRE[index][0]}**, or type **skip**.`,
        [{ label: "Skip comment", value: "skip" }]
      );
    }
    case "assessment_comment": {
      const candidate = getCandidate(session.candidateId);
      if (!candidate) return returnMain(session, "The candidate could not be found.");
      const index = session.questionIndex || 0;
      const updatedAnswers = [...candidate.technicalAssessment];
      updatedAnswers[index] = {
        ...updatedAnswers[index],
        rating: session.pendingRating,
        comment: value === "skip" ? "" : input
      };
      const updated = updateCandidate(candidate.id, { technicalAssessment: updatedAnswers })!;
      if (session.singleCriterion) {
        const recalculated = calculate(updated);
        const result = recalculated.finalDecision
          ? `Assessment updated. Current result: **${recalculated.finalDecision}** at **${recalculated.finalScore?.toFixed(2)}%**.`
          : "Criterion updated. A final result will be calculated after all criteria have ratings.";
        return updateMenu(
          {
            ...session,
            step: "update_menu",
            pendingRating: undefined,
            singleCriterion: false
          },
          result
        );
      }
      const nextIndex = index + 1;
      if (nextIndex < QUESTIONNAIRE.length) {
        return {
          ...session,
          step: "assessment_rating",
          questionIndex: nextIndex,
          pendingRating: undefined,
          messages: [...session.messages, assessmentPrompt(nextIndex)]
        };
      }
      const finished = calculate(updated);
      const summary = `Candidate **${finished.candidateName}** has **${finished.finalDecision}** with a score of **${finished.finalScore?.toFixed(
        2
      )}%**.`;
      if (session.assessmentReturn === "update") {
        return updateMenu({ ...session, step: "update_menu", pendingRating: undefined }, summary);
      }
      return returnMain(session, summary);
    }

    case "search_name":
    case "update_name": {
      const matches = findCandidates(input);
      if (!matches.length) {
        return withAgent(
          session,
          isEgyptianMobile(input)
            ? "mafesh Profile bel Rakam da"
            : `No candidate matched **${input}**. Try another name or phone number, or type menu.`
        );
      }
      const next = session.step === "search_name" ? "search_status" : "update_menu";
      if (matches.length === 1) return selectCandidate(session, matches[0].id, next);
      return withAgent(
        { ...session, step: session.step === "search_name" ? "search_select" : "update_select" },
        `${searchResultSummary(matches)}\n\nI found multiple matches. Select one to continue:`,
        candidateActions(matches)
      );
    }
    case "search_select":
      return selectCandidate(session, input, "search_status");
    case "update_select":
      return selectCandidate(session, input, "update_menu");

    case "search_status": {
      let status: InterviewStatus | undefined;
      if (isChoice(input, "1", ["done", "complete", "concluded"])) status = "done";
      else if (isChoice(input, "3", ["not scheduled", "unscheduled"])) status = "notScheduled";
      else if (isChoice(input, "2", ["scheduled"])) status = "scheduled";
      if (!status) return withAgent(session, "Please select Done, Scheduled, or Not Scheduled Yet.", STATUS_ACTIONS);
      const candidate = updateCandidate(session.candidateId, { interviewStatus: status });
      if (!candidate) return returnMain(session, "The candidate could not be found.");
      if (status === "notScheduled") {
        return returnMain(
          session,
          `This interview is not scheduled yet.\n\n${basicSummary(candidate)}`
        );
      }
      if (status === "scheduled") {
        return withAgent(
          { ...session, step: "scheduled_assessment" },
          `This interview is scheduled.\nInterviewer: **${candidate.interviewerName || "Not set"}**\n\nIf it has now concluded, would you like to enter the technical assessment?`,
          YES_NO
        );
      }
      if (candidate.finalDecision && typeof candidate.finalScore === "number") {
        return withAgent(
          { ...session, step: "search_details" },
          `Candidate: **${candidate.candidateName}**\nInterviewer: **${
            candidate.interviewerName || "Not set"
          }**\nFinal decision: **${candidate.finalDecision}**\nFinal score: **${candidate.finalScore.toFixed(
            2
          )}%**\n\nWould you like to see detailed technical feedback?`,
          YES_NO
        );
      }
      return withAgent(
        { ...session, step: "scheduled_assessment" },
        "This candidate has no completed technical assessment. Would you like to enter it now?",
        YES_NO
      );
    }
    case "search_details": {
      const candidate = getCandidate(session.candidateId);
      if (isChoice(input, "1", ["yes", "show", "details"]) && candidate) {
        return returnMain(session, details(candidate));
      }
      if (isChoice(input, "2", ["no"])) return returnMain(session);
      return withAgent(session, "Please choose Yes or No.", YES_NO);
    }
    case "scheduled_assessment": {
      if (isChoice(input, "1", ["yes", "start"])) {
        const candidate = getCandidate(session.candidateId);
        if (!candidate) return returnMain(session, "The candidate could not be found.");
        return startAssessment(session, candidate, "search", true);
      }
      if (isChoice(input, "2", ["no"])) return returnMain(session);
      return withAgent(session, "Please choose Yes or No.", YES_NO);
    }

    case "update_menu":
      if (isChoice(input, "1", ["basic", "details"])) {
        return withAgent({ ...session, step: "update_field_select" }, "Which field would you like to update?", [
          { label: "Candidate name", value: "1" },
          { label: "Phone number", value: "2" },
          { label: "Interview date", value: "3" },
          { label: "Interviewed title", value: "4" },
          { label: "Interviewer name", value: "5" },
          { label: "Interviewer feedback", value: "6" }
        ]);
      }
      if (isChoice(input, "2", ["status"])) {
        return withAgent({ ...session, step: "update_status" }, "Select the new interview status:", STATUS_ACTIONS);
      }
      if (isChoice(input, "3", ["technical", "assessment", "rating"])) {
        return withAgent({ ...session, step: "update_assessment_mode" }, "How would you like to update the assessment?", [
          { label: "Restart all criteria", value: "1" },
          { label: "Edit one criterion", value: "2" }
        ]);
      }
      return updateMenu(session, "Please select an update option.");

    case "update_field_select": {
      const fields: WorkflowSession["updateField"][] = [
        "candidateName",
        "phoneNumber",
        "interviewDate",
        "titleInterviewedFor",
        "interviewerName",
        "interviewerFeedback"
      ];
      const index = Number(input) - 1;
      const field = fields[index];
      if (!field) return withAgent(session, "Please select a field from 1 to 6.");
      return withAgent(
        { ...session, step: "update_field_value", updateField: field },
        field === "interviewDate"
          ? "Enter the new date in DD/MM/YYYY."
          : field === "phoneNumber"
            ? "Enter the new Egyptian mobile number in 010xxxxxxxx, 011xxxxxxxx, 012xxxxxxxx, or 015xxxxxxxx format."
            : "Enter the new value."
      );
    }
    case "update_field_value": {
      if (!session.updateField) return updateMenu({ ...session, step: "update_menu" });
      let newValue = input;
      if (session.updateField === "interviewDate") {
        const parsed = parseDate(input);
        if (!parsed) return withAgent(session, "Please enter a valid date in DD/MM/YYYY format.");
        newValue = parsed;
      } else if (session.updateField === "phoneNumber") {
        if (!isEgyptianMobile(input)) {
          return withAgent(session, invalidMobileMessage(input));
        }
      } else if (
        (session.updateField === "candidateName" ||
          session.updateField === "titleInterviewedFor" ||
          session.updateField === "interviewerName") &&
        input.length < 2
      ) {
        return withAgent(session, "Please enter at least two characters.");
      }
      const candidate = updateCandidate(session.candidateId, { [session.updateField]: newValue });
      if (!candidate) return returnMain(session, "The candidate could not be found.");
      return updateMenu(
        { ...session, step: "update_menu", updateField: undefined },
        `Updated **${candidate.candidateName}** successfully.`
      );
    }
    case "update_status": {
      let status: InterviewStatus | undefined;
      if (isChoice(input, "1", ["done"])) status = "done";
      else if (isChoice(input, "3", ["not scheduled"])) status = "notScheduled";
      else if (isChoice(input, "2", ["scheduled"])) status = "scheduled";
      if (!status) return withAgent(session, "Please select a status.", STATUS_ACTIONS);
      updateCandidate(session.candidateId, { interviewStatus: status });
      return updateMenu({ ...session, step: "update_menu" }, "Interview status updated.");
    }
    case "update_assessment_mode": {
      const candidate = getCandidate(session.candidateId);
      if (!candidate) return returnMain(session, "The candidate could not be found.");
      if (isChoice(input, "1", ["restart", "all"])) return startAssessment(session, candidate, "update", true);
      if (isChoice(input, "2", ["one", "single"])) {
        return withAgent(
          { ...session, step: "update_criterion_select" },
          "Select the criterion number (1–19):\n\n" +
            QUESTIONNAIRE.map(([criterion], index) => `${index + 1}. ${criterion}`).join("\n")
        );
      }
      return withAgent(session, "Please choose Restart all or Edit one criterion.");
    }
    case "update_criterion_select": {
      const index = Number(input) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= QUESTIONNAIRE.length) {
        return withAgent(session, "Please enter a criterion number from 1 to 19.");
      }
      const candidate = getCandidate(session.candidateId);
      if (!candidate) return returnMain(session, "The candidate could not be found.");
      if (candidate.technicalAssessment.length !== QUESTIONNAIRE.length) {
        updateCandidate(candidate.id, { technicalAssessment: answers() });
      }
      return {
        ...session,
        step: "assessment_rating",
        questionIndex: index,
        assessmentReturn: "update",
        singleCriterion: true,
        messages: [...session.messages, assessmentPrompt(index)]
      };
    }
  }
}
