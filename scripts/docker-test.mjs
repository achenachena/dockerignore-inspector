import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { Engine, activeIgnore, scan } = createRequire(import.meta.url)(
  "../dist/core.cjs",
);
execFileSync("docker", ["version"], { stdio: "inherit" });
const root = await mkdtemp(path.join(os.tmpdir(), "inspector-docker-"));
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
  const cases = [
    { name: "no rules", text: "" },
    {
      name: "negations and ancestors",
      text: "cache\n!cache/keep.txt\n**/*.log\nassets/*\n!assets/logo.svg",
    },
    {
      name: "control files excluded",
      text: "Dockerfile\n.dockerignore\ndocker\n*.log",
    },
    {
      name: "dedicated overrides root",
      text: "*",
      dedicated: "assets/*\n!assets/logo.svg",
    },
    { name: "empty dedicated overrides root", text: "*", dedicated: "" },
    {
      name: "BOM CRLF and normalization",
      text: "\ufeff# Header\r\n /cache/ \r\n!cache/keep.txt\r\nassets/[dl]*\r\n",
    },
  ];
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
} finally {
  engine.dispose();
  await rm(root, { recursive: true, force: true });
}
