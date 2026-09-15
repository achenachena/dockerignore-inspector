import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
const { inside, sameFile, localWindowsPath, windowsRuleError } = createRequire(
  import.meta.url,
)("../dist/core.cjs");

test("Windows canonical containment respects drives, boundaries and case-sensitive components", () => {
  assert(inside("C:\\Repo", "c:/Repo/sub/file", "win32"));
  for (const candidate of [
    "C:\\Repository\\file",
    "D:\\Repo\\file",
    "C:\\Repo\\..\\secret",
    "C:\\repo\\file",
  ])
    assert(!inside("C:\\Repo", candidate, "win32"), candidate);
  assert(localWindowsPath("C:\\Repo"));
  for (const candidate of [
    "C:Repo",
    "\\\\server\\share",
    "\\\\wsl.localhost\\Ubuntu\\home",
    "\\\\wsl$\\Ubuntu",
    "\\\\?\\C:\\Repo",
    "vscode-remote://host",
  ])
    assert(!localWindowsPath(candidate), candidate);
});

test("document identity follows directory aliases without folding file name case", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "identity space 世界-"));
  try {
    await mkdir(path.join(root, "real"));
    const file = path.join(root, "real", ".dockerignore");
    await writeFile(file, "*");
    await writeFile(path.join(root, "real", "other"), "*");
    await symlink(
      path.join(root, "real"),
      path.join(root, "alias"),
      process.platform === "win32" ? "junction" : "dir",
    );
    assert(await sameFile(file, path.join(root, "alias", ".dockerignore")));
    assert(!(await sameFile(file, path.join(root, "real", "other"))));
    assert(!(await sameFile(file, path.join(root, "missing"))));
    if (process.platform === "win32") {
      assert(await sameFile(file, file[0].toLowerCase() + file.slice(1)));
      assert(
        await sameFile(file, file.replace(".dockerignore", ".DOCKERIGNORE")),
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Windows rejects unverified backslash rules with original line numbers", () => {
  assert.equal(
    windowsRuleError("\ufeff# C:\\demo\r\nassets/*\r\n!assets/logo.svg"),
    undefined,
  );
  assert.match(windowsRuleError("# comment\r\nassets\\*.svg"), /Line 2/);
  assert.match(windowsRuleError("\\!literal"), /Backslash/);
});
