import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { cases } from "./context-fixtures.mjs";
import { createRequire } from "node:module";
const { Engine, activeIgnore, scan } = createRequire(import.meta.url)(
  "../dist/core.cjs",
);
const inspectOnly = process.argv.includes("--inspect-only");
const evidence = [];
if (!inspectOnly) {
  execFileSync("docker", ["version"], { stdio: "inherit" });
  assert.equal(
    execFileSync("docker", ["info", "--format", "{{.OSType}}"], {
      encoding: "utf8",
    }).trim(),
    "linux",
    "These fixtures require a Linux container daemon",
  );
}
const root = await mkdtemp(path.join(os.tmpdir(), "inspector context 世界-"));
const engine = new Engine(path.resolve("dist/worker.cjs"));
async function files(dir, prefix = "") {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = prefix + entry.name;
    if (entry.isDirectory())
      out.push(...(await files(path.join(dir, entry.name), p + "/")));
    else out.push(p);
  }
  return out.sort();
}
try {
  const context = path.join(root, "context");
  await mkdir(path.join(context, "assets"), { recursive: true });
  await mkdir(path.join(context, "cache"));
  await mkdir(path.join(context, "docker"));
  for (const name of [
    "app.txt",
    "MixedCase.TXT",
    "hello 世界.txt",
    "assets/with space.txt",
    "debug.log",
    "assets/logo.svg",
    "assets/draft.txt",
    "cache/keep.txt",
    "cache/drop.txt",
  ])
    await writeFile(path.join(context, name), name);
  const dockerfile = path.join(context, "Dockerfile");
  await writeFile(dockerfile, "FROM scratch\nCOPY . /\n");
  const dedicated = path.join(context, "docker", "build.Dockerfile");
  await writeFile(dedicated, "FROM scratch\nCOPY . /\n");
  for (let i = 0; i < cases.length; i++) {
    const fixture = cases[i];
    await writeFile(path.join(context, ".dockerignore"), fixture.text);
    await rm(dedicated + ".dockerignore", { force: true });
    if (fixture.dedicated !== undefined)
      await writeFile(dedicated + ".dockerignore", fixture.dedicated);
    const selected = fixture.dedicated !== undefined ? dedicated : dockerfile;
    const ignore = await activeIgnore(context, selected);
    const inventory = await scan(
      context,
      1000,
      new AbortController().signal,
      () => {},
    );
    const result = await engine.evaluate(
      ignore.text,
      inventory.entries.map((e) => e.path),
    );
    assert(!result.error);
    const expected = inventory.entries
      .filter((e, index) => e.kind === "file" && !result.excluded[index])
      .map((e) => e.path)
      .sort();
    evidence.push({ name: fixture.name, files: expected });
    if (inspectOnly) continue;
    const output = path.join(root, `output-${i}`);
    execFileSync(
      "docker",
      [
        "buildx",
        "build",
        "--progress=plain",
        "--no-cache",
        "-f",
        selected,
        "--output",
        `type=local,dest=${output}`,
        context,
      ],
      { stdio: "pipe" },
    );
    assert.deepEqual(await files(output), expected, fixture.name);
    console.log(`PASS: ${fixture.name}`);
  }
  if (process.env.INSPECTOR_CONTEXT_RESULT)
    await writeFile(
      process.env.INSPECTOR_CONTEXT_RESULT,
      JSON.stringify(evidence, null, 2),
    );
} finally {
  engine.dispose();
  await rm(root, { recursive: true, force: true });
}
