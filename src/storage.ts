import { AppState, emptyState } from './model';

const STORE = 'records';
export type StorageSpace = 'real' | 'demo';

const databaseName = (space: StorageSpace) => space === 'demo' ? 'recall-objective-map-demo' : 'recall-objective-map';
const fallbackKey = (space: StorageSpace) => space === 'demo' ? 'demo:recall-objective-map:data' : 'recall-objective-map:data';

function openDatabase(space: StorageSpace): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(space), 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened.'));
  });
}

async function fromIndexedDb(space: StorageSpace): Promise<AppState | undefined> {
  const db = await openDatabase(space);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get('state');
    request.onsuccess = () => resolve(request.result as AppState | undefined);
    request.onerror = () => reject(request.error ?? new Error('Local data could not be read.'));
    transaction.oncomplete = () => db.close();
  });
}

async function toIndexedDb(state: AppState, space: StorageSpace): Promise<void> {
  const db = await openDatabase(space);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(state, 'state');
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error ?? new Error('Local data could not be saved.'));
  });
}

export async function loadState(space: StorageSpace = 'real'): Promise<{ state: AppState; fallback: boolean }> {
  try {
    return { state: (await fromIndexedDb(space)) ?? emptyState(), fallback: false };
  } catch {
    const saved = localStorage.getItem(fallbackKey(space));
    return { state: saved ? JSON.parse(saved) as AppState : emptyState(), fallback: true };
  }
}

export async function saveState(state: AppState, fallback: boolean, space: StorageSpace = 'real'): Promise<void> {
  state.updatedAt = new Date().toISOString();
  if (!fallback) {
    try { await toIndexedDb(state, space); return; } catch { /* use explicit fallback below */ }
  }
  localStorage.setItem(fallbackKey(space), JSON.stringify(state));
}
