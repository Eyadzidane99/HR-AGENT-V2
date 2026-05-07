"use client";

const PDFJS_VERSION = "3.11.174";
let workerInitialized = false;

async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerInitialized) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.min.js`;
    workerInitialized = true;
  }
  return pdfjs;
}

export type PdfExtraction = {
  text: string;
  pages: number;
  charCount: number;
};

export async function extractPdfText(file: File): Promise<PdfExtraction> {
  const pdfjs = await getPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .filter(Boolean)
      .join(" ");
    parts.push(pageText);
  }
  const text = parts.join("\n\n").replace(/[ \t]+/g, " ").trim();
  return { text, pages: doc.numPages, charCount: text.length };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
