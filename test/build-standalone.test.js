import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MODULES,
  renderStandalone,
  toClassicScript,
  assertNoModuleSyntax,
} from "../scripts/build-standalone.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("toClassicScript strips imports and exports", () => {
  const source = [
    'import { a } from "./a.js";',
    "export const X = 1;",
    "export function f() { return X; }",
  ].join("\n");

  const classic = toClassicScript(source);
  assert.ok(!classic.includes("import"));
  assert.ok(!classic.includes("export"));
  assert.match(classic, /const X = 1;/);
  assert.match(classic, /function f\(\)/);
});

test("assertNoModuleSyntax rejects leftover module syntax", () => {
  assert.throws(() => assertNoModuleSyntax('export const a = 1;', "sample"), /module syntax/);
  assert.throws(() => assertNoModuleSyntax('import x from "y";', "sample"), /module syntax/);
  assert.equal(assertNoModuleSyntax("const a = 1;", "sample"), "const a = 1;");
});

test("the standalone build inlines every module and needs no network", async () => {
  const html = await renderStandalone();

  for (const file of MODULES) {
    assert.ok(html.includes(`// ---- ${file} ----`), `missing ${file} in the bundle`);
  }
  assert.ok(!html.includes('href="./styles.css"'), "stylesheet was not inlined");
  assert.ok(!html.includes('type="module"'), "script is still a module");
  assert.ok(!/^\s*(import|export)\s/m.test(html), "bundle still has module syntax");
  assert.match(html, /<style>[\s\S]*\.entry-text[\s\S]*<\/style>/);
});

test("the committed diario.html is up to date with the sources", async () => {
  const committed = await readFile(join(ROOT, "diario.html"), "utf8");
  const fresh = await renderStandalone();

  assert.equal(
    committed,
    fresh,
    "diario.html is stale: run `npm run build` and commit the result",
  );
});
