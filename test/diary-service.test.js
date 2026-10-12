import test from "node:test";
import assert from "node:assert/strict";

import { createStorage, STORAGE_KEY } from "../src/storage.js";
import { createDiaryService } from "../src/diary-service.js";
import { validateEntry, formatDate, todayISO } from "../src/app.js";

/** Minimal in-memory stand-in for localStorage. */
function memoryBackend(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function serviceWith(seed) {
  let counter = 0;
  let clock = Date.parse("2026-10-12T09:00:00.000Z");
  return createDiaryService({
    storage: createStorage({ backend: memoryBackend(seed) }),
    idFactory: () => `id-${++counter}`,
    now: () => new Date((clock += 1000)).toISOString(),
  });
}

test("storage returns an empty list when nothing was written", () => {
  const storage = createStorage({ backend: memoryBackend() });
  assert.deepEqual(storage.read(), { ok: true, entries: [] });
});

test("storage reports a structured error on corrupt data", () => {
  const storage = createStorage({ backend: memoryBackend({ [STORAGE_KEY]: "{not json" }) });
  const result = storage.read();
  assert.equal(result.ok, false);
  assert.match(result.error, /could not read entries/);
});

test("storage round-trips written entries", () => {
  const storage = createStorage({ backend: memoryBackend() });
  assert.deepEqual(storage.write([{ id: "a" }]), { ok: true });
  assert.deepEqual(storage.read(), { ok: true, entries: [{ id: "a" }] });
});

test("create persists an entry with id, date and mood", () => {
  const diary = serviceWith();
  const created = diary.create({ text: "  primer día  ", mood: "good" });

  assert.equal(created.ok, true);
  assert.equal(created.entry.text, "primer día");
  assert.equal(created.entry.id, "id-1");
  assert.equal(created.entry.mood, "good");
  assert.equal(created.entry.date, "2026-10-12");
  assert.deepEqual(diary.list().entries.length, 1);
});

test("list returns newest entries first", () => {
  const diary = serviceWith();
  diary.create({ text: "vieja" });
  diary.create({ text: "nueva" });

  assert.deepEqual(
    diary.list().entries.map((entry) => entry.text),
    ["nueva", "vieja"],
  );
});

test("update only touches the fields it is given", () => {
  const diary = serviceWith();
  const { entry } = diary.create({ text: "borrador", mood: "bad" });

  const updated = diary.update(entry.id, { text: "versión final" });

  assert.equal(updated.ok, true);
  assert.equal(updated.entry.text, "versión final");
  assert.equal(updated.entry.mood, "bad");
  assert.equal(updated.entry.id, entry.id);
  assert.ok(updated.entry.updatedAt);
});

test("update and remove report a missing entry instead of throwing", () => {
  const diary = serviceWith();
  assert.deepEqual(diary.update("nope", { text: "x" }), {
    ok: false,
    error: "entry not found",
  });
  assert.deepEqual(diary.remove("nope"), { ok: false, error: "entry not found" });
});

test("remove deletes exactly one entry", () => {
  const diary = serviceWith();
  const first = diary.create({ text: "se queda" }).entry;
  const second = diary.create({ text: "se va" }).entry;

  assert.equal(diary.remove(second.id).ok, true);
  assert.deepEqual(
    diary.list().entries.map((entry) => entry.id),
    [first.id],
  );
});

test("search matches text case-insensitively and ignores empty queries", () => {
  const diary = serviceWith();
  diary.create({ text: "Caminé por el parque" });
  diary.create({ text: "Leí un libro" });

  assert.deepEqual(
    diary.search("PARQUE").entries.map((entry) => entry.text),
    ["Caminé por el parque"],
  );
  assert.equal(diary.search("   ").entries.length, 2);
});

test("entries survive a reload through the same storage backend", () => {
  const backend = memoryBackend();
  const storage = createStorage({ backend });
  const first = createDiaryService({ storage });
  first.create({ text: "no se pierde" });

  const reopened = createDiaryService({ storage: createStorage({ backend }) });
  assert.deepEqual(
    reopened.list().entries.map((entry) => entry.text),
    ["no se pierde"],
  );
});

test("validateEntry rejects empty and oversized input", () => {
  assert.deepEqual(validateEntry({ text: "   " }), {
    ok: false,
    error: "Escribe algo antes de guardar.",
  });
  assert.equal(validateEntry({ text: "x".repeat(2001) }).ok, false);
  assert.deepEqual(validateEntry({ text: "  hola  " }), { ok: true, text: "hola" });
});

test("date helpers use the local day, not UTC", () => {
  const noon = new Date("2026-10-12T12:00:00");
  assert.equal(todayISO(noon), "2026-10-12");
  assert.equal(formatDate("2026-10-12"), "12/10/2026");
});
