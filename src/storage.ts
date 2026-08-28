import { AppState, emptyState } from './model';

const DB_NAME = 'recall-objective-map';
const STORE = 'records';
const FALLBACK_KEY = 'recall-objective-map:data';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened.'));
  });
}

async function fromIndexedDb(): Promise<AppState | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get('state');
    request.onsuccess = () => resolve(request.result as AppState | undefined);
    request.onerror = () => reject(request.error ?? new Error('Local data could not be read.'));
    transaction.oncomplete = () => db.close();
  });
}

async function toIndexedDb(state: AppState): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(state, 'state');
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error ?? new Error('Local data could not be saved.'));
  });
}

export async function loadState(): Promise<{ state: AppState; fallback: boolean }> {
  try {
    return { state: (await fromIndexedDb()) ?? emptyState(), fallback: false };
  } catch {
    const saved = localStorage.getItem(FALLBACK_KEY);
    return { state: saved ? JSON.parse(saved) as AppState : emptyState(), fallback: true };
  }
}

export async function saveState(state: AppState, fallback: boolean): Promise<void> {
  state.updatedAt = new Date().toISOString();
  if (!fallback) {
    try { await toIndexedDb(state); return; } catch { /* use explicit fallback below */ }
  }
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(state));
}
