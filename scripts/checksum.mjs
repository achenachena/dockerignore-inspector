import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const name = "dockerignore-inspector-0.1.0.vsix";
const digest = createHash("sha256")
  .update(await readFile(`dist/${name}`))
  .digest("hex");
await writeFile("dist/SHA256SUMS", `${digest}  ${name}\n`);
console.log(`${digest}  ${name}`);
