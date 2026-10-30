export type OfflineEntry = {
  id: string;
  kind: "practice" | "example";
  completedAt: string;
  synced: boolean;
};

const DB_NAME = "embedc-lab";
const DB_VERSION = 2;
const STORE = "progress";
const WRONG_STORE = "wrongnotes";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("kind", "kind", { unique: false });
        store.createIndex("synced", "synced", { unique: false });
      }
      if (!db.objectStoreNames.contains(WRONG_STORE)) {
        const store = db.createObjectStore(WRONG_STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveOfflineEntry(id: string, kind: OfflineEntry["kind"] = "practice"): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  store.put({ id, kind, completedAt: new Date().toISOString(), synced: false } satisfies OfflineEntry);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getOfflineEntries(): Promise<OfflineEntry[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const req = store.getAll();
  const rows = await new Promise<OfflineEntry[]>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as OfflineEntry[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows;
}

export async function getUnsyncedEntries(): Promise<OfflineEntry[]> {
  const rows = await getOfflineEntries();
  return rows.filter((r) => !r.synced);
}

export async function markOfflineSynced(id: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const req = store.get(id);
  const entry = await new Promise<OfflineEntry | undefined>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as OfflineEntry | undefined);
    req.onerror = () => reject(req.error);
  });
  if (entry) {
    entry.synced = true;
    store.put(entry);
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function syncOfflineEntries(): Promise<{ synced: number; failed: number }> {
  const unsynced = await getUnsyncedEntries();
  let synced = 0;
  let failed = 0;
  for (const entry of unsynced) {
    try {
      if (entry.kind !== "practice") continue;
      const res = await fetch("/api/practice/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId: entry.id }),
      });
      if (res.ok) {
        await markOfflineSynced(entry.id);
        synced += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }
  return { synced, failed };
}

export type WrongNote = {
  id: string;
  createdAt: string;
  exampleId?: string;
  stage: "compile" | "run" | "mismatch";
  diagnostics?: string;
  stdout?: string;
  stderr?: string;
  expectedOutput?: string;
  code?: string;
};

export async function saveWrongNote(note: Omit<WrongNote, "id" | "createdAt">): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const tx = db.transaction(WRONG_STORE, "readwrite");
  const store = tx.objectStore(WRONG_STORE);
  const entry: WrongNote = {
    ...note,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  store.put(entry);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getWrongNotes(): Promise<WrongNote[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  const tx = db.transaction(WRONG_STORE, "readonly");
  const store = tx.objectStore(WRONG_STORE);
  const req = store.getAll();
  const rows = await new Promise<WrongNote[]>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as WrongNote[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function clearWrongNotes(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const tx = db.transaction(WRONG_STORE, "readwrite");
  tx.objectStore(WRONG_STORE).clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}