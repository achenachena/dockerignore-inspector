import * as vscode from "vscode";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";
import { activeIgnore, Engine, inside, scan, totals } from "./core";
import type { Scan, Snapshot } from "./types";

export function activate(extension: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined;
  let selection = extension.workspaceState.get<{
    context: string;
    dockerfile: string;
  }>("selection");
  let snapshot: Snapshot | undefined;
  let inventory: Scan | undefined;
  let abort: AbortController | undefined;
  let engine: Engine | undefined;
  let version = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let busy = false;
  const send = (message: unknown) => panel?.webview.postMessage(message);
  const supported = () => {
    if (
      vscode.env.remoteName ||
      !vscode.workspace.isTrusted ||
      vscode.workspace.workspaceFolders?.some((f) => f.uri.scheme !== "file")
    ) {
      void vscode.window.showWarningMessage(
        "Dockerignore Inspector requires a trusted, local VS Code Desktop workspace.",
      );
      return false;
    }
    if (process.platform === "win32") {
      void vscode.window.showWarningMessage(
        "Windows path semantics are not yet validated. Use this preview on macOS or Linux.",
      );
      return false;
    }
    return true;
  };
  function stop() {
    version++;
    abort?.abort();
    engine?.dispose();
    engine = undefined;
    busy = false;
  }
  async function render() {
    if (!snapshot) return;
    await send({
      type: "snapshot",
      snapshot: { ...snapshot, text: undefined, savedText: undefined },
      totals: totals(snapshot.entries, snapshot.excluded),
    });
  }
  async function update(refresh: boolean) {
    if (!selection || !panel || !supported()) return;
    stop();
    const run = version;
    const current = { ...selection };
    abort = new AbortController();
    const signal = abort.signal;
    busy = true;
    await send({
      type: "status",
      busy: true,
      message: refresh ? "Scanning context…" : "Recalculating rules…",
    });
    const started = Date.now();
    try {
      const rootStat = await fs.stat(current.context);
      const dockerStat = await fs.stat(current.dockerfile);
      if (run !== version) return;
      if (!rootStat.isDirectory() || !dockerStat.isFile())
        throw new Error("Select an existing context directory and Dockerfile.");
      if (refresh || !inventory) {
        const result = await scan(
          current.context,
          vscode.workspace
            .getConfiguration("dockerignore")
            .get<number>("maxEntries", 100000),
          signal,
          (count) => {
            if (run === version)
              void send({
                type: "status",
                busy: true,
                message: `Scanning context… ${count.toLocaleString()} entries`,
              });
          },
        );
        if (run !== version) return;
        inventory = result;
      }
      const ignore = await activeIgnore(current.context, current.dockerfile);
      if (run !== version) return;
      const document = ignore.file
        ? vscode.workspace.textDocuments.find(
            (d) => d.uri.scheme === "file" && d.uri.fsPath === ignore.file,
          )
        : undefined;
      const text = document?.getText() ?? ignore.text;
      const draft = document?.isDirty ?? false;
      engine = new Engine(extension.asAbsolutePath("dist/worker.cjs"));
      const localEngine = engine;
      const paths = inventory!.entries.map((e) => e.path);
      const result = await localEngine.evaluate(text, paths);
      const saved = draft
        ? await localEngine.evaluate(ignore.text, paths)
        : result;
      if (run !== version) return;
      snapshot = {
        ...inventory!,
        ...current,
        ignore: ignore.file,
        specific: ignore.specific,
        draft,
        text,
        savedText: ignore.text,
        excluded: result.excluded ?? [],
        savedExcluded: saved.excluded ?? [],
        error:
          result.error ||
          (saved.error ? `Saved rules: ${saved.error}` : undefined),
        elapsed: Date.now() - started,
      };
      busy = false;
      await render();
      if (run !== version) return;
      await send({
        type: "status",
        busy: false,
        message: snapshot.error
          ? snapshot.error
          : `${snapshot.partial ? "Partial scan" : "Ready"} · ${paths.length.toLocaleString()} entries · ${snapshot.elapsed} ms`,
      });
    } catch (error) {
      if (run !== version) return;
      busy = false;
      snapshot = undefined;
      await send({ type: "error", message: String(error) });
    }
  }
  async function chooseContext() {
    const picked = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      title: "Select the Docker build context directory",
      defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
    });
    if (!picked?.[0]) return;
    const context = await fs.realpath(picked[0].fsPath);
    const dockerfile = await chooseDockerfile(context);
    if (!dockerfile) return;
    stop();
    selection = { context, dockerfile };
    inventory = undefined;
    snapshot = undefined;
    await extension.workspaceState.update("selection", selection);
    await update(true);
  }
  async function chooseDockerfile(context: string) {
    const picked = await vscode.window.showOpenDialog({
      canSelectFolders: false,
      canSelectFiles: true,
      canSelectMany: false,
      title: "Select the Dockerfile used for this build",
      defaultUri: vscode.Uri.file(context),
    });
    return picked?.[0] ? fs.realpath(picked[0].fsPath) : undefined;
  }
  async function show() {
    if (!supported()) return;
    if (panel) {
      panel.reveal(vscode.ViewColumn.Beside);
      return;
    }
    panel = vscode.window.createWebviewPanel(
      "dockerignoreInspector",
      "Dockerignore Inspector",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extension.extensionUri, "webview"),
        ],
      },
    );
    const webview = panel.webview;
    const nonce = randomBytes(18).toString("base64");
    let html = await fs.readFile(
      extension.asAbsolutePath("webview/index.html"),
      "utf8",
    );
    html = html
      .replaceAll("{{csp}}", webview.cspSource)
      .replaceAll("{{nonce}}", nonce)
      .replaceAll(
        "{{css}}",
        webview
          .asWebviewUri(
            vscode.Uri.joinPath(extension.extensionUri, "webview/style.css"),
          )
          .toString(),
      )
      .replaceAll(
        "{{js}}",
        webview
          .asWebviewUri(
            vscode.Uri.joinPath(extension.extensionUri, "webview/app.js"),
          )
          .toString(),
      );
    panel.onDidDispose(() => {
      stop();
      panel = undefined;
      snapshot = undefined;
      inventory = undefined;
    });
    panel.webview.onDidReceiveMessage(async (message) => {
      if (!message || typeof message.type !== "string") return;
      try {
        switch (message.type) {
          case "ready":
            if (selection) await update(true);
            break;
          case "context":
            await chooseContext();
            break;
          case "dockerfile": {
            if (!selection) {
              await chooseContext();
              break;
            }
            const file = await chooseDockerfile(selection.context);
            if (file) {
              selection.dockerfile = file;
              await extension.workspaceState.update("selection", selection);
              await update(false);
            }
            break;
          }
          case "refresh":
            await update(true);
            break;
          case "cancel":
            stop();
            await send({
              type: "status",
              busy: false,
              message:
                "Cancelled. Previous results are stale; refresh to continue.",
            });
            break;
          case "example":
            await example();
            break;
          case "edit":
            if (snapshot?.ignore) {
              await vscode.window.showTextDocument(
                vscode.Uri.file(snapshot.ignore),
                { viewColumn: vscode.ViewColumn.One },
              );
              panel?.reveal(vscode.ViewColumn.Two, true);
            }
            break;
          case "explain": {
            if (
              busy ||
              !snapshot ||
              !engine ||
              typeof message.path !== "string" ||
              !snapshot.entries.some((e) => e.path === message.path)
            )
              break;
            const run = version;
            const selected = snapshot;
            const target = message.path;
            const result = await engine.evaluate(selected.text, [], target);
            if (run === version)
              await send({
                type: "explanation",
                path: target,
                reasons: result.reasons,
                error: result.error,
              });
            break;
          }
          case "rule": {
            if (
              busy ||
              !snapshot?.ignore ||
              !Number.isInteger(message.line) ||
              message.line < 1 ||
              message.line > snapshot.text.split("\n").length
            )
              break;
            const position = new vscode.Position(message.line - 1, 0);
            await vscode.window.showTextDocument(
              vscode.Uri.file(snapshot.ignore),
              {
                viewColumn: vscode.ViewColumn.One,
                selection: new vscode.Range(position, position),
              },
            );
            panel?.reveal(vscode.ViewColumn.Two, true);
            break;
          }
          case "open": {
            if (!snapshot || typeof message.path !== "string") break;
            const entry = snapshot.entries.find((e) => e.path === message.path);
            if (entry?.kind !== "file") break;
            const target = await fs.realpath(
              path.join(snapshot.context, entry.path),
            );
            if (inside(snapshot.context, target))
              await vscode.window.showTextDocument(vscode.Uri.file(target), {
                viewColumn: vscode.ViewColumn.One,
              });
            break;
          }
        }
      } catch (error) {
        await send({ type: "error", message: String(error) });
      }
    });
    webview.html = html;
  }
  async function example() {
    if (!supported()) return;
    const destination = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "dockerignore-example-")),
    );
    await fs.cp(extension.asAbsolutePath("examples/context"), destination, {
      recursive: true,
    });
    selection = {
      context: destination,
      dockerfile: path.join(destination, "Dockerfile"),
    };
    inventory = undefined;
    snapshot = undefined;
    await extension.workspaceState.update("selection", selection);
    await vscode.window.showTextDocument(
      vscode.Uri.file(path.join(destination, ".dockerignore")),
      { viewColumn: vscode.ViewColumn.One },
    );
    await show();
    panel?.reveal(vscode.ViewColumn.Two, true);
    await update(true);
  }
  function schedule() {
    if (!panel || !selection) return;
    stop();
    clearTimeout(timer);
    void send({
      type: "status",
      busy: true,
      message: "Rules changed. Updating preview…",
    });
    timer = setTimeout(() => {
      void update(false);
    }, 250);
  }
  extension.subscriptions.push(
    vscode.commands.registerCommand("dockerignore.inspect", show),
    vscode.commands.registerCommand("dockerignore.example", example),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.fsPath === snapshot?.ignore) schedule();
    }),
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.uri.fsPath === snapshot?.ignore) schedule();
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      if (document.uri.fsPath === snapshot?.ignore) schedule();
    }),
    {
      dispose: () => {
        clearTimeout(timer);
        stop();
        panel?.dispose();
      },
    },
  );
  const watcher = vscode.workspace.createFileSystemWatcher("**/*dockerignore");
  for (const event of [
    watcher.onDidChange,
    watcher.onDidCreate,
    watcher.onDidDelete,
  ])
    extension.subscriptions.push(event(() => schedule()));
  extension.subscriptions.push(watcher);
  return { getSnapshot: () => snapshot, isBusy: () => busy };
}
