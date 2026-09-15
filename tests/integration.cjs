const vscode = require("vscode");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
async function until(fn) {
  const end = Date.now() + 20000;
  while (Date.now() < end) {
    const result = fn();
    if (result) return result;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Timed out waiting for installed extension");
}
exports.run = async () => {
  const extension = vscode.extensions.getExtension(
    "achenachen.dockerignore-inspector",
  );
  assert(extension, "Installed VSIX not found");
  const api = await extension.activate();
  await vscode.commands.executeCommand("dockerignore.example");
  const initial = await until(() => !api.isBusy() && api.getSnapshot());
  assert(!initial.error);
  assert(!initial.draft);
  const index = initial.entries.findIndex((e) => e.path === "assets/logo.svg");
  assert(index >= 0);
  assert.equal(initial.excluded[index], false);
  const alias = path.join(
    process.env.INSPECTOR_RESULT_DIR,
    `alias space 世界-${Date.now()}`,
  );
  await fs.symlink(
    initial.context,
    alias,
    process.platform === "win32" ? "junction" : "dir",
  );
  const document = await vscode.workspace.openTextDocument(
    vscode.Uri.file(path.join(alias, ".dockerignore")),
  );
  assert(initial.entries.every((entry) => !entry.path.includes("\\")));

  const original = document.getText();
  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(
      document.positionAt(0),
      document.positionAt(original.length),
    ),
    original.replace("!assets/logo.svg", "assets/logo.svg"),
  );
  await vscode.workspace.applyEdit(edit);
  const draft = await until(() => {
    const s = api.getSnapshot();
    return !api.isBusy() && s?.draft && s.text !== original && s;
  });
  assert.equal(draft.excluded[index], true);
  assert.equal(draft.savedExcluded[index], false);
  await vscode.window.showTextDocument(document);
  await vscode.commands.executeCommand("undo");
  await until(() => {
    const s = api.getSnapshot();
    return !api.isBusy() && s?.text === original && !s.excluded[index];
  });
  const invalid = new vscode.WorkspaceEdit();
  invalid.insert(document.uri, new vscode.Position(0, 0), "!\n");
  await vscode.workspace.applyEdit(invalid);
  await until(
    () => !api.isBusy() && api.getSnapshot()?.error?.includes("Line 1"),
  );
  await vscode.window.showTextDocument(document);
  await vscode.commands.executeCommand("undo");
  await until(
    () => !api.isBusy() && !!api.getSnapshot() && !api.getSnapshot().error,
  );
  const saved = new vscode.WorkspaceEdit();
  saved.insert(document.uri, new vscode.Position(0, 0), "*.svg\n");
  await vscode.workspace.applyEdit(saved);
  await document.save();
  await until(
    () =>
      !api.isBusy() &&
      !api.getSnapshot()?.draft &&
      api.getSnapshot()?.text.startsWith("*.svg"),
  );
  for (let i = 0; i < 12; i++) {
    const change = new vscode.WorkspaceEdit();
    change.replace(
      document.uri,
      new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length),
      ),
      i === 11 ? "assets/*\n!assets/logo.svg\n" : `# revision ${i}\n*\n`,
    );
    await vscode.workspace.applyEdit(change);
  }
  const final = await until(() => {
    const s = api.getSnapshot();
    return !api.isBusy() && s?.text === "assets/*\n!assets/logo.svg\n" && s;
  });
  assert.equal(final.excluded[index], false);
  await new Promise((resolve) => setTimeout(resolve, 400));
  assert.equal(api.getSnapshot().text, final.text);
  await fs.writeFile(
    path.join(process.env.INSPECTOR_RESULT_DIR, "integration-result.json"),
    JSON.stringify(
      {
        passed: true,
        vscode: vscode.version,
        platform: process.platform,
        arch: process.arch,
        installedPath: extension.extensionPath,
        checks: [
          "installed VSIX activation",
          "bundled WASM worker",
          "example scan",
          "unsaved draft difference through directory alias",
          "portable slash-separated context paths",
          "undo restores result",
          "invalid rule line",
          "save baseline",
          "rapid draft updates discard stale results",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: installed VSIX activation, WASM, example, draft, undo, invalid rules, save",
  );
};
