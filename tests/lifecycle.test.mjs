import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";

const require = createRequire(import.meta.url);
test("Cancel clears queued draft work; later changes still schedule and disposal clears it", async () => {
  const timers = new Map();
  const commands = new Map();
  let nextTimer = 0, onMessage, onChange, onDispose;
  const uri = (fsPath) => ({ fsPath, scheme: "file", toString: () => fsPath });
  const disposable = { dispose() {} };
  const panel = {
    reveal() {},
    onDidDispose(fn) { onDispose = fn; },
    dispose() { onDispose?.(); },
    webview: {
      cspSource: "test",
      asWebviewUri: (value) => value,
      postMessage: async () => {},
      onDidReceiveMessage(fn) { onMessage = fn; },
    },
  };
  const vscode = {
    env: {}, ViewColumn: { Beside: 2 },
    Uri: { joinPath: (root, ...parts) => uri(path.join(root.fsPath, ...parts)) },
    window: { createWebviewPanel: () => panel },
    commands: { registerCommand(name, fn) { commands.set(name, fn); return disposable; } },
    workspace: {
      isTrusted: true,
      onDidChangeTextDocument: () => disposable,
      onDidSaveTextDocument: () => disposable,
      onDidCloseTextDocument: () => disposable,
      createFileSystemWatcher: () => ({
        onDidChange(fn) { onChange = fn; return disposable; },
        onDidCreate: () => disposable, onDidDelete: () => disposable,
        dispose() {},
      }),
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(await readFile("dist/extension.cjs", "utf8"), {
    module, exports: module.exports,
    require: (name) => name === "vscode" ? vscode : require(name),
    process: { platform: "darwin", env: {} },
    setTimeout(fn) { const id = ++nextTimer; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  const context = {
    subscriptions: [], extensionUri: uri(process.cwd()),
    asAbsolutePath: (file) => path.resolve(file),
    workspaceState: { get: () => ({ context: "/fixture", dockerfile: "/fixture/Dockerfile" }) },
  };
  module.exports.activate(context);
  await commands.get("dockerignore.inspect")();
  onChange();
  assert.equal(timers.size, 1, "A rule change must queue an update");
  await onMessage({ type: "cancel" });
  assert.equal(timers.size, 0, "Cancelled work must not remain queued");
  onChange();
  assert.equal(timers.size, 1, "A later change must still queue work");
  onChange();
  assert.equal(timers.size, 1, "Rapid changes must replace pending work");
  for (const subscription of context.subscriptions) subscription.dispose();
  assert.equal(timers.size, 0, "Disposal must clear pending work");
});
