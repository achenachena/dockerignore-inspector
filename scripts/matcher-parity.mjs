import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import assert from "node:assert/strict";
import { cases } from "./context-fixtures.mjs";
const { Engine } = createRequire(import.meta.url)("../dist/core.cjs");
const paths = [
  "app.txt",
  "MixedCase.TXT",
  "hello 世界.txt",
  "assets/logo.svg",
  "assets/with space.txt",
  "cache/drop.txt",
  "cache/keep.txt",
  "nested/debug.log",
];
const requests = cases.map((fixture) => ({
  text: fixture.dedicated ?? fixture.text,
  paths,
  explain: "assets/logo.svg",
}));
const native = JSON.parse(
  execFileSync("go", ["run", "./cmd/native"], {
    cwd: "engine",
    input: JSON.stringify(requests),
    encoding: "utf8",
  }),
);
const engine = new Engine(path.resolve("dist/worker.cjs"));
try {
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const wasm = await engine.evaluate(
      request.text,
      request.paths,
      request.explain,
    );
    assert.deepEqual(wasm, native[i], cases[i].name);
  }
  console.log(
    `PASS: ${requests.length} native ${process.platform} / WASM matching and explanation comparisons`,
  );
} finally {
  engine.dispose();
}
