import type { Entry } from "@/context/EntriesContext";

export interface MemoryThread {
  id: string;
  tag: string;
  title: string;
  entries: Entry[];
  start: string;
  end: string;
}

const STOP = new Set(["the","and","for","with","from","that","this","have","was","were","you","your","but","not","are","just"]);

function topKeyword(entries: Entry[]): string {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const text = `${e.title} ${e.note}`.toLowerCase().replace(/[^a-z\s]/g, " ");
    for (const word of text.split(/\s+/)) {
      if (word.length < 4 || STOP.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  let best = "";
  let max = 0;
  for (const [w, c] of counts) if (c > max) { max = c; best = w; }
  return best;
}

const WINDOW_DAYS = 14;

export function clusterThreads(entries: Entry[]): MemoryThread[] {
  const threads: MemoryThread[] = [];
  const byTag = new Map<string, Entry[]>();
  for (const e of entries) {
    if (!byTag.has(e.tag)) byTag.set(e.tag, []);
    byTag.get(e.tag)!.push(e);
  }
  for (const [tag, list] of byTag) {
    const sorted = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let group: Entry[] = [];
    const flush = () => {
      if (group.length < 2) { group = []; return; }
      const kw = topKeyword(group);
      const title = kw ? kw.charAt(0).toUpperCase() + kw.slice(1) : `${tag} cluster`;
      threads.push({
        id: `t-${tag}-${group[0].id}`,
        tag,
        title,
        entries: [...group].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        start: group[0].createdAt,
        end: group[group.length - 1].createdAt,
      });
      group = [];
    };
    for (const e of sorted) {
      if (!group.length) { group.push(e); continue; }
      const last = new Date(group[group.length - 1].createdAt).getTime();
      const cur = new Date(e.createdAt).getTime();
      if ((cur - last) / 86400000 <= WINDOW_DAYS) group.push(e);
      else { flush(); group.push(e); }
    }
    flush();
  }
  return threads.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());
}
