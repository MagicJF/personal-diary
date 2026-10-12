// Storage adapter: reusable mechanics for persisting a list of entries.
// Knows nothing about what an entry means — it only reads and writes JSON.

export const STORAGE_KEY = "diary.entries.v1";

/**
 * @param {{ backend?: Storage, key?: string }} options
 * @returns {{ read: () => {ok: true, entries: unknown[]} | {ok: false, error: string},
 *            write: (entries: unknown[]) => {ok: true} | {ok: false, error: string} }}
 */
export function createStorage({ backend, key = STORAGE_KEY } = {}) {
  const store = backend ?? globalThis.localStorage;

  return {
    read() {
      try {
        const raw = store.getItem(key);
        if (raw === null || raw === "") return { ok: true, entries: [] };
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return { ok: false, error: "stored data is not a list" };
        }
        return { ok: true, entries: parsed };
      } catch (error) {
        return { ok: false, error: `could not read entries: ${error.message}` };
      }
    },

    write(entries) {
      try {
        store.setItem(key, JSON.stringify(entries));
        return { ok: true };
      } catch (error) {
        return { ok: false, error: `could not save entries: ${error.message}` };
      }
    },
  };
}
