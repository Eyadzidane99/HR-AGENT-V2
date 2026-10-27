const pptxgen = require('/private/tmp/hr-agent-pptx-tools/node_modules/pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'HR Agent Project Team';
pptx.subject = 'Vodafone HR Agent project introduction';
pptx.title = 'HR Agent — Candidate Assessment & Process Filtration';
pptx.company = 'Vodafone';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US'
};
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: 'FCFCFC' },
  objects: [
    { line: { x: 0.45, y: 7.12, w: 12.45, h: 0, line: { color: 'E7E7E7', width: 0.8 } } },
    { text: { text: 'C2 General', options: { x: 0.48, y: 7.17, w: 1.2, h: 0.16, fontFace: 'Aptos', fontSize: 5.5, color: '8A8A8A', margin: 0 } } }
  ],
  slideNumber: { x: 12.47, y: 7.16, color: '999999', fontSize: 6 }
});

const slide = pptx.addSlide('MASTER');
const C = { red: 'E60000', rose: 'F6DEDE', pale: 'F8F8FA', ink: '252525', gray: '626262', light: 'E5E7EB', blue: '5368D9', teal: '43A99A', white: 'FFFFFF' };
const S = pptx.ShapeType;

function txt(text, x, y, w, h, o = {}) {
  slide.addText(text, {
    x, y, w, h, margin: 0, fontFace: o.fontFace || 'Aptos', fontSize: o.fontSize || 12,
    color: o.color || C.ink, bold: !!o.bold, breakLine: false, valign: o.valign || 'mid',
    align: o.align || 'left', fit: 'shrink', paraSpaceAfterPt: o.paraSpaceAfterPt || 0,
    bullet: o.bullet, isTextBox: true
  });
}
function line(x, y, w, h, color = 'A9B0BA', width = 1.25, beginArrowType, endArrowType) {
  slide.addShape(S.line, { x, y, w, h, line: { color, width, beginArrowType, endArrowType } });
}
function rounded(x, y, w, h, fill, stroke = fill, radius = 0.08) {
  slide.addShape(S.roundRect, { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { color: stroke, width: 1 } });
}
function pill(text, x, y, w, color) {
  rounded(x, y, w, 0.27, color, color);
  txt(text, x, y + 0.01, w, 0.22, { fontSize: 8.2, color: C.white, bold: true, align: 'center' });
}
function personIcon(x, y, scale, color) {
  slide.addShape(S.ellipse, { x: x + 0.18 * scale, y, w: 0.16 * scale, h: 0.16 * scale, fill: { color: 'FFFFFF', transparency: 100 }, line: { color, width: 1.5 } });
  slide.addShape(S.arc, { x, y: y + 0.18 * scale, w: 0.52 * scale, h: 0.34 * scale, adjustPoint: 0.22, rotate: 0, fill: { color: 'FFFFFF', transparency: 100 }, line: { color, width: 1.5 } });
}
function docIcon(x, y, scale, color) {
  slide.addShape(S.rect, { x, y, w: 0.32 * scale, h: 0.43 * scale, fill: { color: 'FFFFFF', transparency: 100 }, line: { color, width: 1.3 } });
  line(x + 0.07 * scale, y + 0.16 * scale, 0.18 * scale, 0, color, 1);
  line(x + 0.07 * scale, y + 0.24 * scale, 0.18 * scale, 0, color, 1);
  line(x + 0.07 * scale, y + 0.32 * scale, 0.13 * scale, 0, color, 1);
}
function checkIcon(x, y, scale, color) {
  rounded(x, y, 0.38 * scale, 0.38 * scale, 'FFFFFF', color);
  line(x + 0.09 * scale, y + 0.20 * scale, 0.08 * scale, 0.08 * scale, color, 1.5);
  line(x + 0.17 * scale, y + 0.28 * scale, 0.14 * scale, -0.17 * scale, color, 1.5);
}

// Reference-inspired red wave header.
slide.addShape(S.ellipse, { x: -0.82, y: -1.22, w: 4.25, h: 2.18, fill: { color: C.red }, line: { color: C.red } });
slide.addShape(S.ellipse, { x: 3.12, y: 0.23, w: 0.78, h: 0.78, fill: { color: C.red }, line: { color: C.red } });
txt('HR', 0.70, 0.28, 0.65, 0.38, { fontSize: 20, color: C.white, bold: true, align: 'center' });
personIcon(3.30, 0.34, 0.85, C.white);

txt('HR Agent', 4.72, 0.29, 4.0, 0.34, { fontSize: 23, color: C.red, bold: true, align: 'center' });
txt('Candidate Assessment & Process Filtration', 4.10, 0.68, 5.25, 0.26, { fontSize: 10.5, color: C.gray, bold: true, align: 'center' });

// Decorative top-right sparkle/wand.
line(10.63, 0.53, 0.56, 0.44, C.red, 1.5);
slide.addShape(S.diamond, { x: 10.56, y: 0.29, w: 0.17, h: 0.17, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: C.red, width: 1.2 } });
slide.addShape(S.diamond, { x: 11.05, y: 0.18, w: 0.20, h: 0.20, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: C.red, width: 1.2 } });
slide.addShape(S.diamond, { x: 11.27, y: 0.55, w: 0.13, h: 0.13, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: C.red, width: 1.1 } });

// Left process panel.
rounded(0.62, 1.38, 5.82, 3.15, 'F2F3F6', 'F2F3F6');
pill('INPUTS', 0.95, 1.68, 0.78, C.blue);
pill('OUTPUTS', 5.12, 1.68, 0.92, C.teal);

// Input cards.
rounded(0.88, 2.12, 1.50, 0.74, C.white, 'E3E5EA');
docIcon(1.00, 2.27, 0.86, C.red);
txt('Candidate CV', 1.37, 2.23, 0.88, 0.17, { fontSize: 9.2, bold: true });
txt('PDF upload & extraction', 1.37, 2.43, 0.88, 0.23, { fontSize: 6.7, color: C.gray });
rounded(0.88, 3.04, 1.50, 0.74, C.white, 'E3E5EA');
personIcon(0.99, 3.21, 0.72, C.blue);
txt('Interview Data', 1.37, 3.15, 0.88, 0.17, { fontSize: 9.2, bold: true });
txt('Role, interviewer & feedback', 1.37, 3.35, 0.88, 0.25, { fontSize: 6.7, color: C.gray });

// Agent center.
rounded(3.05, 2.10, 1.38, 1.72, C.white, 'BCC1CA');
slide.addShape(S.ellipse, { x: 3.52, y: 2.22, w: 0.44, h: 0.44, fill: { color: C.blue }, line: { color: C.blue } });
txt('AI', 3.52, 2.27, 0.44, 0.18, { fontSize: 11, color: C.white, bold: true, align: 'center' });
txt('HR AGENT', 3.25, 2.79, 0.98, 0.25, { fontSize: 12.5, color: '30343B', bold: true, align: 'center' });
txt('Guided workflow', 3.23, 3.08, 1.02, 0.18, { fontSize: 7.5, color: C.gray, align: 'center' });
txt('19-point assessment', 3.20, 3.29, 1.08, 0.18, { fontSize: 7.2, color: C.gray, align: 'center' });

line(2.40, 2.93, 0.48, 0, C.blue, 1.6, undefined, 'triangle');
line(4.52, 2.93, 0.46, 0, C.blue, 1.6, undefined, 'triangle');

// Output cards.
rounded(5.00, 2.12, 1.22, 0.74, C.white, 'E3E5EA');
docIcon(5.12, 2.27, 0.84, C.teal);
txt('Candidate\nRecord', 5.52, 2.20, 0.58, 0.38, { fontSize: 8.4, bold: true });
txt('Structured & saved', 5.52, 2.60, 0.58, 0.13, { fontSize: 5.8, color: C.gray });
rounded(5.00, 3.04, 1.22, 0.74, C.white, 'E3E5EA');
checkIcon(5.10, 3.22, 0.78, C.teal);
txt('Score &\nDecision', 5.52, 3.11, 0.58, 0.38, { fontSize: 8.4, bold: true });
txt('Pass / fail ready', 5.52, 3.52, 0.58, 0.13, { fontSize: 5.8, color: C.gray });

txt('From CV Intake to Consistent, Searchable Hiring Decisions in One Guided Flow', 0.73, 4.70, 5.62, 0.28, { fontSize: 11.3, color: '42464D', bold: true, align: 'center' });

// Right narrative.
txt('Challenge', 6.86, 1.40, 1.55, 0.30, { fontSize: 17.5, color: C.red, bold: true });
const challenges = [
  ['Fragmented Candidate Records', 'CVs, interview notes, and assessment results are often stored in separate places.'],
  ['Inconsistent Technical Evaluation', 'Unstructured interviews make candidate comparison subjective and difficult to audit.'],
  ['High Manual Effort & Slow Retrieval', 'Repeated data entry and record searching delay shortlisting and follow-up.']
];
let cy = 1.79;
for (const [head, body] of challenges) {
  slide.addShape(S.ellipse, { x: 6.86, y: cy + 0.07, w: 0.07, h: 0.07, fill: { color: C.red }, line: { color: C.red } });
  txt(head, 7.06, cy, 5.16, 0.22, { fontSize: 10.4, bold: true });
  txt(body, 7.06, cy + 0.24, 5.16, 0.38, { fontSize: 8.5, color: C.gray, valign: 'top' });
  cy += 0.79;
}

txt('Solution', 6.86, 4.25, 1.30, 0.30, { fontSize: 17.5, color: C.red, bold: true });
const solutions = [
  'Guided Add, Search, and Update candidate workflows',
  'PDF CV upload with text extraction and record storage',
  'Standardized 19-criteria QA technical assessment',
  'Automatic scoring with pass / fail recommendation',
  'Searchable profiles with resumable assessment history',
  'One Vodafone-branded interface for the full process'
];
let sy = 4.66;
for (const item of solutions) {
  slide.addShape(S.ellipse, { x: 6.88, y: sy + 0.06, w: 0.055, h: 0.055, fill: { color: C.red }, line: { color: C.red } });
  txt(item, 7.06, sy, 5.2, 0.22, { fontSize: 9.1, color: '454545' });
  sy += 0.31;
}

// Bottom branding and small robot motif.
slide.addShape(S.arc, { x: 0.60, y: 6.52, w: 0.37, h: 0.37, rotate: 35, fill: { color: C.red }, line: { color: C.red } });
slide.addShape(S.ellipse, { x: 0.70, y: 6.61, w: 0.16, h: 0.16, fill: { color: C.white }, line: { color: C.white } });
txt('vodafone', 0.99, 6.49, 1.38, 0.36, { fontSize: 20, color: C.red, bold: true });

rounded(11.13, 6.09, 0.58, 0.48, 'FFFFFF', C.red);
slide.addShape(S.ellipse, { x: 11.27, y: 6.20, w: 0.06, h: 0.06, fill: { color: C.red }, line: { color: C.red } });
slide.addShape(S.ellipse, { x: 11.49, y: 6.20, w: 0.06, h: 0.06, fill: { color: C.red }, line: { color: C.red } });
line(11.42, 5.92, 0, 0.17, C.red, 1.2);
slide.addShape(S.ellipse, { x: 11.38, y: 5.87, w: 0.08, h: 0.08, fill: { color: C.red }, line: { color: C.red } });
line(11.02, 6.23, 0.11, 0.10, C.red, 1.2);
line(11.71, 6.23, 0.11, -0.10, C.red, 1.2);

pptx.writeFile({ fileName: 'HR_Agent_Project_Introduction.pptx' });
