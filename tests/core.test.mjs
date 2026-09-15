import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir, symlink, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  Engine,
  scan,
  activeIgnore,
  totals,
  inside,
} = require("../dist/core.cjs");
const worker = path.resolve("dist/worker.cjs");

test("WASM matches order, ancestors, reinclusion, normalization and line mapping", async () => {
  const engine = new Engine(worker);
  try {
    const text =
      "\uFEFF# Header\r\n\r\ncache\r\n!cache/keep.txt\r\ncache/keep.txt\r\n**/*.log\r\n";
    const result = await engine.evaluate(
      text,
      ["app.js", "cache/a.txt", "cache/keep.txt", "a/b/debug.log"],
      "cache/keep.txt",
    );
    assert.equal(result.error, undefined);
    assert.deepEqual(result.excluded, [false, true, true, true]);
    assert.deepEqual(
      result.reasons.map((r) => [r.line, r.excluded]),
      [
        [3, true],
        [4, false],
        [5, true],
      ],
    );
    assert.deepEqual(
      (
        await engine.evaluate("assets/*\n!assets/logo.svg", [
          "assets/logo.svg",
          "assets/a.txt",
        ])
      ).excluded,
      [false, true],
    );
    assert.deepEqual(
      (
        await engine.evaluate("a?/[xy].txt\n/foo/\n.", [
          "ab/x.txt",
          "ab/z.txt",
          "foo/a",
          "other",
        ])
      ).excluded,
      [true, false, true, false],
    );
    assert.match((await engine.evaluate("ok\n!", ["a"])).error, /Line 2/);
    assert.match((await engine.evaluate("[", ["a"])).error, /Line 1/);
    assert.deepEqual(
      (await engine.evaluate("", ["a", ".git/config"])).excluded,
      [false, false],
    );
  } finally {
    engine.dispose();
  }
});
test("scanner includes Git-ignored entries, avoids symlink traversal and respects limits", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "inspector-test-"));
  try {
    await mkdir(path.join(root, "node_modules"));
    await mkdir(path.join(root, ".git"));
    await writeFile(path.join(root, "node_modules", "a"), "abc");
    await writeFile(path.join(root, ".git", "config"), "12345");
    await writeFile(path.join(root, "hello 世界.txt"), "hello");
    await writeFile(path.join(root, ".gitignore"), "*");
    await symlink(
      os.tmpdir(),
      path.join(root, "outside"),
      process.platform === "win32" ? "junction" : "dir",
    );
    const result = await scan(
      root,
      100,
      new AbortController().signal,
      () => {},
    );
    assert.equal(result.partial, false);
    assert.equal(
      result.entries.find((e) => e.path === "outside").kind,
      "symlink",
    );
    assert(result.entries.some((e) => e.path === "node_modules/a"));
    assert(result.entries.some((e) => e.path === ".git/config"));
    assert.equal(
      totals(
        result.entries,
        result.entries.map(() => false),
      ).bytes,
      14,
    );
    const limited = await scan(root, 2, new AbortController().signal, () => {});
    assert.equal(limited.entries.length, 2);
    assert(limited.partial);
    const controller = new AbortController();
    controller.abort();
    assert((await scan(root, 100, controller.signal, () => {})).partial);
    assert(inside(root, path.join(root, "a")));
    assert(!inside(root, root + "-sibling/a"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("empty dedicated ignore overrides root, and invalid files are not treated as absent", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "inspector-ignore-"));
  try {
    const dockerfile = path.join(root, "Dockerfile");
    await writeFile(dockerfile, "FROM scratch");
    await writeFile(path.join(root, ".dockerignore"), "*");
    assert.equal((await activeIgnore(root, dockerfile)).text, "*");
    await writeFile(dockerfile + ".dockerignore", "");
    const result = await activeIgnore(root, dockerfile);
    assert(result.specific);
    assert.equal(result.text, "");
    await rm(dockerfile + ".dockerignore");
    await rm(path.join(root, ".dockerignore"));
    assert.equal((await activeIgnore(root, dockerfile)).file, null);
    await mkdir(dockerfile + ".dockerignore");
    await assert.rejects(activeIgnore(root, dockerfile));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("worker termination interrupts pending work", async () => {
  const engine = new Engine(worker);
  await engine.evaluate("", []);
  const pending = engine.evaluate(
    "**/*.log",
    Array.from({ length: 100000 }, (_, i) => `a/${i}.log`),
  );
  await new Promise((resolve) => setImmediate(resolve));
  engine.dispose();
  await assert.rejects(pending, /Cancelled|stopped/);
});

test("active scan cancellation stops discovery and unreadable directories stay unknown", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "inspector-cancel-"));
  try {
    for (let batch = 0; batch < 6; batch++)
      await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          writeFile(path.join(root, `file-${batch * 100 + i}.txt`), "x"),
        ),
      );
    const abort = new AbortController();
    const result = await scan(root, 1000, abort.signal, (count) => {
      if (count >= 250) abort.abort();
    });
    assert(result.partial);
    assert.equal(result.entries.length, 250);
    assert(result.issues.some((issue) => issue.includes("cancelled")));
    if (process.platform === "win32") return; // POSIX mode bits do not model Windows ACLs.
    const { chmod } = await import("node:fs/promises");
    const locked = path.join(root, "unreadable");
    await mkdir(locked);
    await chmod(locked, 0);
    try {
      const unreadable = await scan(
        root,
        1000,
        new AbortController().signal,
        () => {},
      );
      assert(unreadable.partial);
      assert(unreadable.entries.find((e) => e.path === "unreadable").error);
    } finally {
      await chmod(locked, 0o700);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
