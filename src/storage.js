// Storage adapter: reusable mechanics for persisting a list of entries.
// Knows nothing about what an entry means — it only reads and writes JSON.

export const STORAGE_KEY = "diary.entries.v1";

/** Shape check so damaged stored data can never reach the service or the DOM. */
export function isEntry(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    value.id !== "" &&
    typeof value.text === "string" &&
    typeof value.date === "string"
  );
}

/**
 * @param {{ backend?: Storage, key?: string }} options
 * @returns {{ read: () => {ok: true, entries: unknown[]} | {ok: false, error: string},
 *            write: (entries: unknown[]) => {ok: true} | {ok: false, error: string} }}
 */
export function createStorage({ backend, key = STORAGE_KEY } = {}) {
  // Reaching for `globalThis.localStorage` can throw on its own (a browser with
  // storage blocked raises a SecurityError on access), so the backend is
  // resolved lazily inside each call and never during construction.
  function resolveBackend() {
    if (backend) return { ok: true, backend };
    try {
      const store = globalThis.localStorage;
      if (!store) return { ok: false, error: "this browser has no storage available" };
      return { ok: true, backend: store };
    } catch (error) {
      return { ok: false, error: `storage is not available: ${error.message}` };
    }
  }

  return {
    read() {
      const resolved = resolveBackend();
      if (!resolved.ok) return resolved;

      try {
        const raw = resolved.backend.getItem(key);
        if (raw === null || raw === "") return { ok: true, entries: [] };

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return { ok: false, error: "stored data is not a list" };
        }
        if (!parsed.every(isEntry)) {
          return { ok: false, error: "stored entries are damaged" };
        }
        return { ok: true, entries: parsed };
      } catch (error) {
        return { ok: false, error: `could not read entries: ${error.message}` };
      }
    },

    write(entries) {
      const resolved = resolveBackend();
      if (!resolved.ok) return resolved;

      try {
        resolved.backend.setItem(key, JSON.stringify(entries));
        return { ok: true };
      } catch (error) {
        return { ok: false, error: `could not save entries: ${error.message}` };
      }
    },
  };
}
