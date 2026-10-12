// Service layer: reusable mechanics for storing and shaping diary entries.
// It owns ids, timestamps, ordering and persistence. It does not own the
// rules about what the product considers a valid entry, nor the wording the
// user sees — those live in the actions layer (src/app.js).

function defaultId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @param {{ storage: ReturnType<typeof import('./storage.js').createStorage>,
 *           idFactory?: () => string,
 *           now?: () => string }} deps
 */
export function createDiaryService({ storage, idFactory = defaultId, now } = {}) {
  if (!storage) throw new Error("createDiaryService requires a storage adapter");
  const timestamp = now ?? (() => new Date().toISOString());

  function load() {
    return storage.read();
  }

  function listAll() {
    const result = load();
    if (!result.ok) return result;
    const entries = [...result.entries].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
    return { ok: true, entries };
  }

  return {
    /** @returns {{ok: true, entries: object[]} | {ok: false, error: string}} */
    list() {
      return listAll();
    },

    /** @returns {{ok: true, entry: object} | {ok: false, error: string}} */
    get(id) {
      const result = load();
      if (!result.ok) return result;
      const entry = result.entries.find((item) => item.id === id);
      if (!entry) return { ok: false, error: "entry not found" };
      return { ok: true, entry };
    },

    /** Creates and persists a new entry. Caller decides whether the text is acceptable. */
    create({ text, date, mood = "neutral" } = {}) {
      const result = load();
      if (!result.ok) return result;

      const createdAt = timestamp();
      const entry = {
        id: idFactory(),
        text: String(text ?? "").trim(),
        date: date || createdAt.slice(0, 10),
        mood,
        createdAt,
      };

      const next = [...result.entries, entry];
      const written = storage.write(next);
      if (!written.ok) return written;
      return { ok: true, entry };
    },

    /** Applies a partial update; only the fields present in `changes` are touched. */
    update(id, changes = {}) {
      const result = load();
      if (!result.ok) return result;

      const index = result.entries.findIndex((item) => item.id === id);
      if (index === -1) return { ok: false, error: "entry not found" };

      const current = result.entries[index];
      const updated = {
        ...current,
        ...("text" in changes ? { text: String(changes.text ?? "").trim() } : {}),
        ...("date" in changes ? { date: changes.date } : {}),
        ...("mood" in changes ? { mood: changes.mood } : {}),
        updatedAt: timestamp(),
      };

      const next = [...result.entries];
      next[index] = updated;
      const written = storage.write(next);
      if (!written.ok) return written;
      return { ok: true, entry: updated };
    },

    /** @returns {{ok: true, removed: object} | {ok: false, error: string}} */
    remove(id) {
      const result = load();
      if (!result.ok) return result;

      const removed = result.entries.find((item) => item.id === id);
      if (!removed) return { ok: false, error: "entry not found" };

      const next = result.entries.filter((item) => item.id !== id);
      const written = storage.write(next);
      if (!written.ok) return written;
      return { ok: true, removed };
    },

    /** Case-insensitive substring match over the entry text. */
    search(query) {
      const result = listAll();
      if (!result.ok) return result;

      const needle = String(query ?? "").trim().toLowerCase();
      if (!needle) return result;

      const entries = result.entries.filter((entry) =>
        entry.text.toLowerCase().includes(needle),
      );
      return { ok: true, entries };
    },
  };
}
