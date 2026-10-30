import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const sourcePath = path.resolve("HR_Agent_Project_Introduction.pptx");
const draftPath = path.resolve(".codex-pptx-build/HR_Agent_Project_Introduction_updated_draft.pptx");

const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));

const replacements = {
  "sh/fu94fe98": "Guided Candidate Intake • Search • Update • Assessment",
  "sh/e94v2hon": "Candidate Profile",
  "sh/90ve1w7q": "Name, phone, no CV upload step",
  "sh/p4bu5s76": "Interview Context",
  "sh/432dwn6l": "Role, date, interviewer & feedback",
  "sh/h072l4jy": "HR AGENT",
  "sh/i1gje90j": "Guided workflow",
  "sh/j2pkne14": "19 technical criteria",
  "sh/036h8but": "Candidate\nRecord",
  "sh/nqxgjqtk": "Phone searchable",
  "sh/at8zelcb": "Score &\nDecision",
  "sh/8zqx4vq9": "Pass / fail ready",
  "sh/t0jyd0ru": "From structured intake to consistent, searchable hiring decisions",
  "sh/6x8f2583": "Challenge",
  "sh/kvqx0vqd": "Unstructured Candidate Intake",
  "sh/lwzy90ry": "Missing phone data, inconsistent fields, and manual entry slow down the process.",
  "sh/juhg7q9s": "Hard-to-find Candidate Records",
  "sh/wr6xwbq1": "Names alone can return multiple matches; recruiters need a reliable way to find the right profile.",
  "sh/dc7md8fe": "Low Control During Data Entry",
  "sh/cby5k3yt": "Wrong answers can force users to restart, while long forms make correction and exit unclear.",
  "sh/ra54bix8": "Solution",
  "sh/5onm98f2": "Guided add, search, and update flows",
  "sh/3m547yxw": "Egyptian mobile validation and phone-based search",
  "sh/9kr6lsfm": "Multi-match selection before profile details",
  "sh/6psjmpwj": "Structured 19-criteria assessment with comments",
  "sh/8ra1oze9": "Automatic scoring with pass / fail recommendation",
  "sh/ylsjipw7": "Local records with exit, back, and auto-focus controls",
};

for (const [anchorId, text] of Object.entries(replacements)) {
  presentation.resolve(anchorId).text = text;
}

for (const anchorId of ["sh/buh0nqtg", "sh/3ahk3u54"]) {
  const shape = presentation.resolve(anchorId);
  const position = shape.position;
  if (position.height < 0) {
    shape.position = {
      left: position.left,
      top: position.top + position.height,
      width: position.width,
      height: Math.abs(position.height),
    };
  }
}

presentation.resolve("sl/y90nupkv").speakerNotes.textFrame.setText(
  "Updated to reflect the current HR Agent implementation: direct candidate entry without CV upload/download, Egyptian mobile validation, name and phone search, multiple-match selection, structured technical assessment, automatic scoring, local persistence, and workflow controls for exit and correction."
);

await fs.mkdir(path.dirname(draftPath), { recursive: true });
await (await PresentationFile.exportPptx(presentation)).save(draftPath);
console.log(draftPath);
