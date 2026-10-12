// Genera `diario.html`: la misma app en un solo fichero que funciona al abrirla
// con doble clic (file://), donde los navegadores se niegan a cargar módulos
// externos. No hay duplicación: el fichero se arma a partir de `index.html`,
// `styles.css` y los tres módulos de `src/`.

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Módulos en orden de dependencia: cada uno usa los anteriores. */
export const MODULES = ["src/storage.js", "src/diary-service.js", "src/app.js"];

/**
 * Convierte un módulo ES en código de script clásico: quita los `import`
 * (el código pasa a compartir un mismo ámbito) y los `export`.
 */
export function toClassicScript(source) {
  return source
    .replace(/^import\s+[^;]+;\s*$/gm, "")
    .replace(/^export\s+/gm, "")
    .trim();
}

export function assertNoModuleSyntax(source, label) {
  if (/^\s*(import|export)\s/m.test(source)) {
    throw new Error(`${label} still contains module syntax after the transform`);
  }
  return source;
}

/** Arma el HTML de un solo fichero a partir de index.html, styles.css y src/. */
export async function renderStandalone() {
  const [template, css, ...sources] = await Promise.all([
    readFile(join(ROOT, "index.html"), "utf8"),
    readFile(join(ROOT, "styles.css"), "utf8"),
    ...MODULES.map((file) => readFile(join(ROOT, file), "utf8")),
  ]);

  const script = assertNoModuleSyntax(
    sources.map((source, index) => `// ---- ${MODULES[index]} ----\n${toClassicScript(source)}`).join("\n\n"),
    "the bundled script",
  );

  const banner = "<!-- Fichero generado por scripts/build-standalone.mjs. No lo edites a mano: cambia index.html, styles.css o src/. -->";
  const html = template
    .replace(/^<!doctype html>/i, `<!doctype html>\n${banner}`)
    .replace(
      /<link rel="stylesheet" href="\.\/styles\.css" \/>/,
      `<style>\n${css.trim()}\n</style>`,
    )
    .replace(
      /<script type="module" src="\.\/src\/app\.js"><\/script>/,
      `<script>\n${script}\n</script>`,
    );

  if (html.includes('href="./styles.css"') || html.includes('type="module"')) {
    throw new Error("could not inline the stylesheet or the script into index.html");
  }

  return html;
}

async function build() {
  const html = await renderStandalone();
  await writeFile(join(ROOT, "diario.html"), html, "utf8");
  console.log(`diario.html escrito (${html.length} bytes)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await build();
}
