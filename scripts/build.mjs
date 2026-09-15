import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
await mkdir("dist", { recursive: true });
const env = {
  ...process.env,
  GOMODCACHE: process.env.GOMODCACHE || "/private/tmp/dockerignore-go-mod",
  GOCACHE: process.env.GOCACHE || "/private/tmp/dockerignore-go-cache",
};
if (process.platform !== "darwin") {
  delete env.GOMODCACHE;
  delete env.GOCACHE;
}
execFileSync(
  "go",
  [
    "build",
    "-trimpath",
    "-ldflags=-s -w",
    "-o",
    "../dist/engine.wasm",
    "./cmd/wasm",
  ],
  {
    cwd: "engine",
    env: { ...env, GOOS: "js", GOARCH: "wasm" },
    stdio: "inherit",
  },
);
const goroot = execFileSync("go", ["env", "GOROOT"], {
  encoding: "utf8",
}).trim();
await copyFile(
  path.join(goroot, "lib/wasm/wasm_exec.js"),
  "dist/wasm_exec.cjs",
);
for (const name of ["extension", "worker", "core"])
  await build({
    entryPoints: [`src/${name}.ts`],
    outfile: `dist/${name}.cjs`,
    bundle: true,
    platform: "node",
    target: "node20",
    external: ["vscode"],
    sourcemap: false,
  });
