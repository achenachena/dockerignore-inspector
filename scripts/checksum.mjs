import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const files = process.argv.slice(2);
if (!files.length) throw new Error("Pass the exact VSIX files to checksum.");
const lines = await Promise.all(files.map(async (file) => {
  const digest = createHash("sha256").update(await readFile(file)).digest("hex");
  return `${digest}  ${path.basename(file)}\n`;
}));
await writeFile(path.join(path.dirname(files[0]), "SHA256SUMS"), lines.join(""));
console.log(lines.join(""));
