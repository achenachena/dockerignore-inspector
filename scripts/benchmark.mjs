import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
const { Engine } = createRequire(import.meta.url)("../dist/core.cjs");
const engine = new Engine(path.resolve("dist/worker.cjs"));
try {
  const paths = Array.from(
    { length: 100000 },
    (_, i) =>
      `packages/p${i % 100}/${i % 3 === 0 ? "node_modules/" : "src/"}file-${i}.${i % 4 === 0 ? "log" : "ts"}`,
  );
  const start = performance.now();
  await engine.evaluate("", []);
  const startup = performance.now() - start;
  const begin = performance.now();
  const result = await engine.evaluate(
    "**/node_modules\n**/*.log\n!packages/p0/src/**",
    paths,
  );
  console.log(
    JSON.stringify(
      {
        platform: process.platform,
        arch: process.arch,
        cpu: os.cpus()[0].model,
        node: process.version,
        paths: paths.length,
        workerStartupMs: Math.round(startup),
        matchMs: Math.round(performance.now() - begin),
        excluded: result.excluded.filter(Boolean).length,
        scope:
          "Synthetic paths only; no filesystem enumeration or UI rendering.",
      },
      null,
      2,
    ),
  );
} finally {
  engine.dispose();
}
