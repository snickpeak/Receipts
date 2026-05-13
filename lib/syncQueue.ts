import AsyncStorage from "@react-native-async-storage/async-storage";

export type SyncOp =
  | { id: string; op: "create"; entryId: string; payload: unknown; attempts: number; queuedAt: number }
  | { id: string; op: "update"; entryId: string; payload: unknown; attempts: number; queuedAt: number }
  | { id: string; op: "delete"; entryId: string; attempts: number; queuedAt: number };

export type EnqueueInput =
  | { op: "create"; entryId: string; payload: unknown }
  | { op: "update"; entryId: string; payload: unknown }
  | { op: "delete"; entryId: string };

const DEFAULT_QUEUE_KEY = "receipts_sync_queue_v1";

let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

export async function readQueue(key = DEFAULT_QUEUE_KEY): Promise<SyncOp[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try { return JSON.parse(raw) as SyncOp[]; } catch { return []; }
}

export async function writeQueue(ops: SyncOp[], key = DEFAULT_QUEUE_KEY): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(ops));
}

export function enqueue(op: EnqueueInput, key = DEFAULT_QUEUE_KEY): Promise<void> {
  return withLock(async () => {
    const ops = await readQueue(key);
    const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    ops.push({ ...op, id, attempts: 0, queuedAt: Date.now() } as SyncOp);
    await writeQueue(ops, key);
  });
}

export function replaceProcessed(processedIds: Set<string>, retryOps: SyncOp[], key = DEFAULT_QUEUE_KEY): Promise<number> {
  return withLock(async () => {
    const latest = await readQueue(key);
    const kept = latest.filter((o) => !processedIds.has(o.id));
    const retryIds = new Set(retryOps.map((o) => o.id));
    const finalQueue = [...kept.filter((o) => !retryIds.has(o.id)), ...retryOps];
    await writeQueue(finalQueue, key);
    return finalQueue.length;
  });
}

export async function clearQueue(key = DEFAULT_QUEUE_KEY): Promise<void> {
  await withLock(async () => { await AsyncStorage.removeItem(key); });
}

export async function queueLength(key = DEFAULT_QUEUE_KEY): Promise<number> {
  return (await readQueue(key)).length;
}
