// Actions / boundary layer: it owns the domain rules ("when is an entry
// acceptable", "what does the user read when something fails") and wires the
// DOM to the diary service. The reusable mechanics live in src/diary-service.js.

import { createStorage } from "./storage.js";
import { createDiaryService } from "./diary-service.js";

const MAX_LENGTH = 2000;

const MESSAGES = {
  empty: "Escribe algo antes de guardar.",
  tooLong: `La entrada no puede pasar de ${MAX_LENGTH} caracteres.`,
  saveFailed: "No se pudo guardar la entrada.",
  loadFailed: "No se pudieron leer tus entradas guardadas.",
};

/** Domain rule: what the product accepts as a writable entry. */
export function validateEntry({ text }) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return { ok: false, error: MESSAGES.empty };
  if (trimmed.length > MAX_LENGTH) return { ok: false, error: MESSAGES.tooLong };
  return { ok: true, text: trimmed };
}

export function todayISO(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(isoDate) {
  const [year, month, day] = String(isoDate).split("-");
  if (!year || !month || !day) return String(isoDate);
  return `${day}/${month}/${year}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function startDiary(root, { storage } = {}) {
  const diary = createDiaryService({ storage: storage ?? createStorage() });

  const form = root.querySelector("[data-form]");
  const textInput = root.querySelector("[data-input]");
  const dateInput = root.querySelector("[data-date]");
  const moodInput = root.querySelector("[data-mood]");
  const searchInput = root.querySelector("[data-search]");
  const list = root.querySelector("[data-list]");
  const status = root.querySelector("[data-status]");
  const count = root.querySelector("[data-count]");

  dateInput.value = todayISO();

  function setStatus(message, kind = "info") {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function render() {
    const query = searchInput.value;
    const result = query.trim() ? diary.search(query) : diary.list();

    if (!result.ok) {
      setStatus(MESSAGES.loadFailed, "error");
      list.innerHTML = "";
      count.textContent = "";
      return;
    }

    const entries = result.entries;
    count.textContent =
      entries.length === 1 ? "1 entrada" : `${entries.length} entradas`;

    if (entries.length === 0) {
      list.innerHTML = `<p class="empty">${
        query.trim() ? "Nada coincide con esa búsqueda." : "Todavía no escribiste nada."
      }</p>`;
      return;
    }

    list.innerHTML = entries
      .map(
        (entry) => `
      <article class="entry" data-id="${escapeHtml(entry.id)}">
        <header class="entry-head">
          <span class="entry-date">${escapeHtml(formatDate(entry.date))}</span>
          <span class="entry-mood">${escapeHtml(moodLabel(entry.mood))}</span>
        </header>
        <p class="entry-text">${escapeHtml(entry.text)}</p>
        <div class="entry-actions">
          <button type="button" data-action="edit">Editar</button>
          <button type="button" data-action="delete">Borrar</button>
        </div>
      </article>`,
      )
      .join("");
  }

  function moodLabel(mood) {
    return { good: "Bien", neutral: "Normal", bad: "Bajo" }[mood] ?? "Normal";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const check = validateEntry({ text: textInput.value });
    if (!check.ok) {
      setStatus(check.error, "error");
      textInput.focus();
      return;
    }

    const created = diary.create({
      text: check.text,
      date: dateInput.value || todayISO(),
      mood: moodInput.value,
    });

    if (!created.ok) {
      setStatus(MESSAGES.saveFailed, "error");
      return;
    }

    textInput.value = "";
    dateInput.value = todayISO();
    moodInput.value = "neutral";
    setStatus("Entrada guardada.", "ok");
    render();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const article = button.closest(".entry");
    const id = article?.dataset.id;
    if (!id) return;

    if (button.dataset.action === "delete") {
      const result = diary.remove(id);
      if (!result.ok) {
        setStatus(MESSAGES.saveFailed, "error");
        return;
      }
      setStatus("Entrada borrada.", "ok");
      render();
      return;
    }

    if (button.dataset.action === "edit") {
      const current = diary.get(id);
      if (!current.ok) return;

      const draft = prompt("Editar entrada:", current.entry.text);
      if (draft === null) return;

      const check = validateEntry({ text: draft });
      if (!check.ok) {
        setStatus(check.error, "error");
        return;
      }

      const result = diary.update(id, { text: check.text });
      if (!result.ok) {
        setStatus(MESSAGES.saveFailed, "error");
        return;
      }
      setStatus("Entrada actualizada.", "ok");
      render();
    }
  });

  searchInput.addEventListener("input", render);

  render();
  return diary;
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-diary]");
  if (root) startDiary(root);
}
