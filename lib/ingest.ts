// Splits authorised source text into chunks with locators. Paragraph boundaries are kept where possible.
// A line such as "[page 12]" or "[00:14:05]" sets the locator for the text that follows it.

export type ChunkInput = { ordinal: number; content: string; locator: string | null };

const MARKER = /^\s*\[(page\s+\d+|p\.\s*\d+|\d{1,2}:\d{2}(?::\d{2})?)\]\s*$/i;
export const MAX_INGEST_CHARS = 200_000;

type Para = { text: string; locator: string | null };

function paragraphs(text: string): Para[] {
  const out: Para[] = [];
  let locator: string | null = null;
  let buf: string[] = [];
  const end = () => {
    const t = buf.join(' ').replace(/\s+/g, ' ').trim();
    if (t) out.push({ text: t, locator });
    buf = [];
  };
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const m = line.match(MARKER);
    if (m) {
      end();
      locator = /^p/i.test(m[1]) ? `page ${m[1].replace(/\D+/g, '')}` : m[1];
    } else if (!line.trim()) end();
    else buf.push(line);
  }
  end();
  return out;
}

// Breaks an over-long paragraph at sentence ends, falling back to a hard cut.
function split(text: string, max: number): string[] {
  const parts: string[] = [];
  let rest = text;
  while (rest.length > max) {
    const dot = rest.lastIndexOf('. ', max);
    const cut = dot > max / 2 ? dot + 1 : max;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

export function chunkText(text: string, maxChars = 1200): ChunkInput[] {
  if (text.length > MAX_INGEST_CHARS) throw new Error(`Text is too long (limit ${MAX_INGEST_CHARS.toLocaleString()} characters per upload).`);
  const chunks: ChunkInput[] = [];
  let current: Para | null = null;
  const push = () => {
    if (current) chunks.push({ ordinal: chunks.length, content: current.text, locator: current.locator });
    current = null;
  };
  for (const p of paragraphs(text)) {
    for (const piece of split(p.text, maxChars)) {
      // A new locator starts a new chunk so every citation points to one place.
      if (current && (current.locator !== p.locator || current.text.length + piece.length + 2 > maxChars)) push();
      current = current ? { text: `${current.text}\n\n${piece}`, locator: current.locator } : { text: piece, locator: p.locator };
    }
  }
  push();
  return chunks.map((c, i) => ({ ...c, locator: c.locator ?? `part ${i + 1}` }));
}
