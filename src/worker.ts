import { parentPort } from "node:worker_threads";
import { readFileSync } from "node:fs";
import path from "node:path";
import { webcrypto } from "node:crypto";
if (!(globalThis as any).crypto)
  Object.defineProperty(globalThis, "crypto", { value: webcrypto });
require(path.join(__dirname, "wasm_exec.cjs"));
const runtime = globalThis as any;
const go = new runtime.Go();
(async () => {
  const wasm = await runtime.WebAssembly.instantiate(
    readFileSync(path.join(__dirname, "engine.wasm")),
    go.importObject,
  );
  void go.run(wasm.instance);
  parentPort!.on("message", ({ id, request }) => {
    try {
      parentPort!.postMessage({
        id,
        result: JSON.parse(
          runtime.dockerignoreEvaluate(JSON.stringify(request)),
        ),
      });
    } catch (error) {
      parentPort!.postMessage({ id, result: { error: String(error) } });
    }
  });
  parentPort!.postMessage({ ready: true });
})().catch((error) => {
  throw error;
});
