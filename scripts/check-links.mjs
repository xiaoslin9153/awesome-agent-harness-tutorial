#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const tutorialRoot = path.resolve(import.meta.dirname, "..", "tutorial");
const errors = [];

function extractMarkdownLinks(content) {
  const links = [];
  const inline = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = inline.exec(content)) !== null) {
    const [, text, href] = match;
    if (!href.startsWith("http") && !href.startsWith("#") && !href.startsWith("mailto:")) {
      links.push({ text, href });
    }
  }
  return links;
}

async function collectMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name));
}

const files = await collectMarkdownFiles(tutorialRoot);

for (const filePath of files) {
  const content = await readFile(filePath, "utf8");
  const dir = path.dirname(filePath);
  for (const { text, href } of extractMarkdownLinks(content)) {
    const targetPath = href.split("#")[0];
    if (!targetPath) continue;
    const resolved = path.resolve(dir, targetPath);
    try {
      await readFile(resolved);
    } catch {
      errors.push(`${path.relative(tutorialRoot, filePath)}: broken link "${text}" -> ${href}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Found ${errors.length} broken link(s):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
} else {
  console.log(`All markdown links OK (${files.length} files checked).`);
}
