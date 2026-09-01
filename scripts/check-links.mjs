#!/usr/bin/env node

/**
 * 链接检查脚本，两个阶段：
 *
 * 1. 源码层：tutorial/ 下所有 Markdown 的相对链接必须指向存在的 .md 源文件。
 * 2. 构建产物层（若 site-starlight/dist 存在）：扫描 dist 内所有 HTML 的内部链接，
 *    去掉 base 前缀后必须命中 dist 里真实存在的页面/资源，防止部署后 404。
 *
 * 阶段 2 在 CI 中位于 `npm run build` 之后执行，用于拦截
 * 「源码链接存在但发布站点 404」这类断链。
 */

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const tutorialRoot = path.join(repoRoot, "tutorial");
const distRoot = path.join(repoRoot, "site-starlight", "dist");
const errors = [];

/* ---------------- 阶段 1：源码层 Markdown 链接 ---------------- */

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

async function checkSourceLinks() {
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
        errors.push(
          `[source] ${path.relative(tutorialRoot, filePath)}: broken link "${text}" -> ${href}`
        );
      }
    }
  }
  return files.length;
}

/* ---------------- 阶段 2：构建产物链接 ---------------- */

async function checkDistLinks() {
  // 收集 dist 下所有 html 文件
  const htmlFiles = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(full);
    }
  }
  await walk(distRoot);
  if (htmlFiles.length === 0) return 0;

  const linkRe = /href="([^"]+)"/g;
  const BASE_PREFIX = "/awesome-agent-harness-tutorial/";

  for (const htmlFile of htmlFiles) {
    const content = await readFile(htmlFile, "utf8");
    const relPage = path.relative(distRoot, htmlFile);
    const dirname = path.dirname(relPage);

    let match;
    while ((match = linkRe.exec(content)) !== null) {
      const href = match[1];
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("data:") ||
        href.startsWith("javascript:")
      ) {
        continue;
      }
      const target = href.split("#")[0].split("?")[0];
      if (!target) continue;

      // 归一化为相对 dist 的路径
      let norm;
      if (target.startsWith(BASE_PREFIX)) {
        norm = target.slice(BASE_PREFIX.length);
      } else if (target.startsWith("/")) {
        norm = target.slice(1);
      } else {
        norm = path.normalize(path.join(dirname, target));
      }

      const candidates = [
        norm,
        norm + "/",
        norm + "/index.html",
        norm + ".html",
      ];
      let ok = false;
      for (const c of candidates) {
        const abs = path.join(distRoot, c);
        try {
          const st = await stat(abs);
          if (st.isFile()) {
            ok = true;
            break;
          }
        } catch {
          /* 尝试下一个候选 */
        }
        // 目录形式：c 以 / 结尾时 abs 本身是目录
        if (c.endsWith("/")) {
          try {
            const st = await stat(abs);
            if (st.isDirectory()) {
              ok = true;
              break;
            }
          } catch {
            /* 尝试下一个候选 */
          }
        }
      }
      if (!ok) {
        errors.push(
          `[dist] ${relPage}: broken link -> ${href} (resolved under ${norm})`
        );
      }
    }
  }
  return htmlFiles.length;
}

/* ---------------- 主流程 ---------------- */

const sourceCount = await checkSourceLinks();
console.log(`[1/2] source: ${sourceCount} markdown file(s) checked.`);

let distCount = 0;
try {
  await stat(distRoot);
  distCount = await checkDistLinks();
  console.log(`[2/2] dist: ${distCount} html file(s) checked.`);
} catch {
  console.log(
    "[2/2] dist not found; skipping built-output link check (run after build)."
  );
}

if (errors.length > 0) {
  console.error(`\nFound ${errors.length} broken link(s):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
} else {
  console.log("All links OK.");
}
