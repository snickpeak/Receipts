import type { Entry } from "@/context/EntriesContext";

const STOP_WORDS = new Set([
  "a","an","and","are","as","at","be","but","by","for","from","has","have","he","her","his","i","in","is","it","its","my","of","on","or","our","she","that","the","their","them","they","this","to","was","we","were","will","with","you","your","me","just","like","not","no","do","did","done","get","got","had","im","ive","id","ill","so","up","out","if","then","than","when","what","why","how",
]);

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

interface DocVector {
  id: string;
  termFreq: Map<string, number>;
  norm: number;
}

function buildIndex(entries: Entry[]): { docs: DocVector[]; idf: Map<string, number> } {
  const docs: DocVector[] = entries.map((e) => {
    const tokens = tokenize(`${e.title} ${e.note} ${e.aiSummary ?? ""} ${e.tag} ${e.receiptVendor ?? ""} ${e.receiptLocation ?? ""}`);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { id: e.id, termFreq: tf, norm: 0 };
  });
  const df = new Map<string, number>();
  for (const d of docs) for (const term of d.termFreq.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  const N = docs.length || 1;
  const idf = new Map<string, number>();
  for (const [term, c] of df) idf.set(term, Math.log(1 + N / c));
  for (const d of docs) {
    let s = 0;
    for (const [term, freq] of d.termFreq) {
      const w = freq * (idf.get(term) ?? 0);
      s += w * w;
    }
    d.norm = Math.sqrt(s) || 1;
  }
  return { docs, idf };
}

export function semanticSearch(entries: Entry[], query: string, limit = 30): { entry: Entry; score: number }[] {
  if (!query.trim()) return [];
  const { docs, idf } = buildIndex(entries);
  const qTokens = tokenize(query);
  const qTf = new Map<string, number>();
  for (const t of qTokens) qTf.set(t, (qTf.get(t) ?? 0) + 1);
  let qNorm = 0;
  for (const [term, freq] of qTf) {
    const w = freq * (idf.get(term) ?? 0);
    qNorm += w * w;
  }
  qNorm = Math.sqrt(qNorm) || 1;
  const byId = new Map(entries.map((e) => [e.id, e]));
  const scored = docs.map((d) => {
    let dot = 0;
    for (const [term, qfreq] of qTf) {
      const dfreq = d.termFreq.get(term);
      if (!dfreq) continue;
      const idfV = idf.get(term) ?? 0;
      dot += (qfreq * idfV) * (dfreq * idfV);
    }
    const score = dot / (qNorm * d.norm);
    return { entry: byId.get(d.id)!, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((r) => r.score > 0).slice(0, limit);
}
