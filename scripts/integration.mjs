import {
  runTests,
  downloadAndUnzipVSCode,
  resolveCliPathFromVSCodeExecutablePath,
} from "@vscode/test-electron";
import {
  mkdir,
  writeFile,
  mkdtemp,
  rm,
  readFile,
  readdir,
  access,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
const root = path.resolve(".test-work");
await mkdir(root, { recursive: true });
const executable =
  process.env.VSCODE_EXECUTABLE_PATH ||
  (process.platform === "darwin"
    ? "/Applications/Visual Studio Code.app/Contents/MacOS/Code"
    : await downloadAndUnzipVSCode("stable"));
const cli =
  process.env.VSCODE_CLI_PATH ||
  resolveCliPathFromVSCodeExecutablePath(executable);
const extensions = await mkdtemp(path.join(root, "extensions-"));
const user = await mkdtemp(path.join(root, "run-"));
await rm(path.join(root, "integration-result.json"), { force: true });
const harness = path.join(root, "harness");
await mkdir(harness, { recursive: true });
await writeFile(
  path.join(harness, "package.json"),
  JSON.stringify({
    name: "inspector-test-harness",
    version: "0.0.1",
    publisher: "local-test",
    engines: { vscode: "^1.96.0" },
    main: "./main.cjs",
  }),
);
await writeFile(path.join(harness, "main.cjs"), "exports.activate = () => {};");
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
let windowsCli;
if (process.platform === "win32") {
  const launcher = await readFile(cli, "utf8");
  console.log(`Windows CLI launcher (${cli}):\n${launcher}`);
  const scripts = [...launcher.matchAll(/"([^"\r\n]*%~dp0[^"\r\n]*\.js)"/gi)];
  const entry = scripts.at(-1)?.[1];
  windowsCli = entry
    ? path.resolve(path.dirname(cli), entry.replace(/%~dp0/gi, ""))
    : path.join(path.dirname(executable), "resources", "app", "out", "cli.js");
  try {
    await access(windowsCli);
  } catch (error) {
    console.log(
      "VS Code root entries:",
      await readdir(path.dirname(executable)),
    );
    throw error;
  }
}
execFileSync(
  process.platform === "win32" ? executable : cli,
  [
    ...(windowsCli ? [windowsCli] : []),
    "--user-data-dir",
    user,
    "--extensions-dir",
    extensions,
    "--install-extension",
    path.resolve("dist/dockerignore-inspector-0.1.0.vsix"),
    "--force",
  ],
  {
    stdio: "inherit",
    env:
      process.platform === "win32"
        ? { ...env, ELECTRON_RUN_AS_NODE: "1" }
        : env,
  },
);
await runTests({
  vscodeExecutablePath: executable,
  extensionDevelopmentPath: harness,
  extensionTestsPath: path.resolve("tests/integration.cjs"),
  launchArgs: [
    "--user-data-dir",
    user,
    "--extensions-dir",
    extensions,
    "--skip-welcome",
    "--skip-release-notes",
    "--disable-workspace-trust",
    "--disable-updates",
    "--disable-telemetry",
    "--disable-gpu",
    path.resolve("examples/context"),
  ],
  extensionTestsEnv: {
    ...env,
    INSPECTOR_RESULT_DIR: root,
    INSPECTOR_WINDOWS_VALIDATION: "1",
  },
});
