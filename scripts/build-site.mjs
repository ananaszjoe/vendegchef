import { cp, mkdir, rm } from "node:fs/promises";

const outputDirectory = new URL("../dist/", import.meta.url);
const projectDirectory = new URL("../", import.meta.url);
const publicFiles = ["index.html", "styles.css", "app.js", "config.js"];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const file of publicFiles) {
  await cp(new URL(file, projectDirectory), new URL(file, outputDirectory));
}

console.log(`Prepared ${publicFiles.length} static files in dist/.`);
