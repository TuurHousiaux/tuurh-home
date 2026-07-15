import { cp, mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "src");
const output = resolve(root, "dist");

for (const file of ["index.html", "styles.css", "app.js", "staticwebapp.config.json"]) {
  const info = await stat(resolve(source, file));
  if (!info.isFile()) throw new Error(`Ontbrekend bronbestand: ${file}`);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });

console.log("tuurh-home gebouwd in dist/");

