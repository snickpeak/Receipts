import AsyncStorage from "@react-native-async-storage/async-storage";

export type SyncOp =
  | { id: string; op: "create"; entryId: string; payload: unknown; attempts: number; queuedAt: number }
  | { id: string; op: "update"; entryId: string; payload: unknown; attempts: number; queuedAt: number }
  | { id: string; op: "delete"; entryId: string; attempts: number; queuedAt: number };

export type EnqueueInput =
  | { op: "create"; entryId: string; payload: unknown }
  | { op: "update"; entryId: string; payload: unknown }
  | { op: "delete"; entryId: string };

const QUEUE_KEY = "receipts_sync_queue_v1";

// In-process mutex so concurrent enqueue/replace calls cannot clobber each other.
// AsyncStorage is shared mutable state and we read-modify-write it in several places.
let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

export async function readQueue(): Promise<SyncOp[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as SyncOp[]; } catch { return []; }
}

export async function writeQueue(ops: SyncOp[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
}

export function enqueue(op: EnqueueInput): Promise<void> {
  return withLock(async () => {
    const ops = await readQueue();
    const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    ops.push({ ...op, id, attempts: 0, queuedAt: Date.now() } as SyncOp);
    await writeQueue(ops);
  });
}

/**
 * Run `mutator` against a fresh snapshot of the queue under the lock, then
 * persist the result merged with anything that was enqueued in the meantime.
 * `processedIds` lists ops that the mutator handled (success or terminal drop)
 * so we can drop them from the latest queue without losing concurrent inserts.
 */
export function replaceProcessed(processedIds: Set<string>, retryOps: SyncOp[]): Promise<number> {
  return withLock(async () => {
    const latest = await readQueue();
    const kept = latest.filter((o) => !processedIds.has(o.id));
    // Avoid duplicate retry entries if the same id reappears.
    const retryIds = new Set(retryOps.map((o) => o.id));
    const finalQueue = [...kept.filter((o) => !retryIds.has(o.id)), ...retryOps];
    await writeQueue(finalQueue);
    return finalQueue.length;
  });
}

export async function clearQueue(): Promise<void> {
  await withLock(async () => { await AsyncStorage.removeItem(QUEUE_KEY); });
}

export async function queueLength(): Promise<number> {
  return (await readQueue()).length;
}
