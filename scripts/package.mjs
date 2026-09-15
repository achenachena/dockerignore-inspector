import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const manifest = JSON.parse(await readFile("package.json", "utf8"));
const target = process.argv[2] || `${process.platform}-${process.arch}`;
if (!["darwin-arm64", "linux-x64"].includes(target) &&
    !(target === "win32-x64" && process.env.INSPECTOR_WINDOWS_VALIDATION === "1")) {
  throw new Error(`Unsupported release target: ${target}`);
}
const output = `dist/${manifest.name}-${manifest.version}-${target}.vsix`;
execFileSync(process.execPath, ["node_modules/@vscode/vsce/vsce", "package", "--target", target, "--out", output], { stdio: "inherit" });
execFileSync(process.execPath, ["scripts/checksum.mjs", output], { stdio: "inherit" });
