import { cp, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(root, "tutorial");
const outputRoot = path.join(root, "site", "dist");
const baseURL = process.env.SITE_BASE_URL ?? "/";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInline(value) {
  const baseURL = process.env.SITE_BASE_URL ?? "/";
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(
      /\[([^\]]*)\]\((\.\/[^)]+\.md)\)/g,
      (_, text, mdPath) => {
        const route = mdPath.replace(/\.md$/, "").replace(/^\.\//, "");
        return `<a href="${baseURL}zh-CN/${route}/">${text}</a>`;
      },
    )
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  let inCodeBlock = false;
  let codeLanguage = "";
  let unorderedListItems = 0;
  const html = [];
  let orderedListItems = 0;
  let tableRows = [];

  function flushTable() {
    if (tableRows.length === 0) return;
    const [header, ...bodyRows] = tableRows;
    html.push("<table><thead><tr>");
    for (const cell of header) html.push(`<th>${renderInline(cell)}</th>`);
    html.push("</tr></thead>");
    if (bodyRows.length > 0) {
      html.push("<tbody>");
      for (const row of bodyRows) {
        html.push("<tr>");
        for (const cell of row) html.push(`<td>${renderInline(cell)}</td>`);
        html.push("</tr>");
      }
      html.push("</tbody>");
    }
    html.push("</table>");
    tableRows = [];
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html.push(codeLanguage === "mermaid" ? "</div>" : "</code></pre>");
        inCodeBlock = false;
        codeLanguage = "";
      } else {
        codeLanguage = line.slice(3).trim();
        html.push(
          codeLanguage === "mermaid" ? '<div class="mermaid">' : "<pre><code>",
        );
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(line));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      flushTable();
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const unorderedItem = line.match(/^\s*[-*]\s+(.*)$/);
    if (unorderedItem) {
      flushTable();
      if (orderedListItems > 0) {
        html.push("</ol>");
        orderedListItems = 0;
      }
      if (unorderedListItems === 0) html.push("<ul>");
      unorderedListItems += 1;
      html.push(`<li>${renderInline(unorderedItem[1])}</li>`);
      continue;
    }

    const orderedItem = line.match(/^\s*\d+\.\s+(.*)$/);
    if (orderedItem) {
      flushTable();
      if (orderedListItems === 0) html.push("<ol>");
      if (unorderedListItems > 0) {
        html.push("</ul>");
        unorderedListItems = 0;
      }
      orderedListItems += 1;
      html.push(`<li>${renderInline(orderedItem[1])}</li>`);
      continue;
    }

    if (orderedListItems > 0) {
      flushTable();
      html.push("</ol>");
      orderedListItems = 0;
    }

    if (unorderedListItems > 0) {
      flushTable();
      html.push("</ul>");
      unorderedListItems = 0;
    }

    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      if (cells.every((c) => /^-{3,}$/.test(c))) continue;
      if (tableRows.length === 0) {
        // First data row of the table.
      }
      tableRows.push(cells);
      continue;
    }

    flushTable();

    if (line.trim() === "") continue;
    html.push(`<p>${renderInline(line)}</p>`);
  }

  flushTable();

  return html.join("\n");
}

async function collectMarkdown(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true,
    recursive: true,
  });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name));
}

async function buildPage(sourcePath) {
  const raw = await readFile(sourcePath, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`Missing front matter: ${sourcePath}`);

  const frontMatter = Object.fromEntries(
    match[1].split(/\r?\n/).map((line) => {
      const separator = line.indexOf(":");
      return [
        line.slice(0, separator).trim(),
        line.slice(separator + 1).trim(),
      ];
    }),
  );
  const content = renderMarkdown(raw.slice(match[0].length));
  const relativePath = path.relative(sourceRoot, sourcePath);
  const route = relativePath.replace(/\.md$/, "");
  const outputRelativePath = relativePath
    .replace(/\.md$/, "")
    .replaceAll(path.sep, "/");
  const outputPath = path.join(outputRoot, outputRelativePath, "index.html");

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `<!doctype html>
<html lang="${frontMatter.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(frontMatter.title)}</title>
  <meta name="description" content="${escapeHtml(frontMatter.description)}">
  <link rel="stylesheet" href="${baseURL}styles.css">
</head>
<body>
  <main>
    <article>
      ${content}
    </article>
  </main>
  <script src="${baseURL}mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true, securityLevel: "strict" });
  </script>
</body>
</html>
`,
  );

  return {
    route: `${baseURL}${outputRelativePath}/`,
    lang: frontMatter.lang,
    title: frontMatter.title,
  };
}

await mkdir(outputRoot, { recursive: true });
await cp(path.join(root, "site", "public"), outputRoot, { recursive: true });
await cp(
  path.join(root, "site", "node_modules", "mermaid", "dist", "mermaid.min.js"),
  path.join(outputRoot, "mermaid.min.js"),
);

const markdownFiles = await collectMarkdown(sourceRoot);
const excludedFiles = new Set(["language-interface.md", "writing-pipeline.md"]);
const pages = [];
for (const sourcePath of markdownFiles) {
  if (excludedFiles.has(path.basename(sourcePath))) continue;
  pages.push(await buildPage(sourcePath));
}

const zhHomeRoute = `${baseURL}zh-CN/00-overview/`;
const zhHomeExists = pages.some((page) => page.route === zhHomeRoute);
if (!zhHomeExists) throw new Error("Missing Chinese overview page");

await writeFile(
  path.join(outputRoot, "index.html"),
  `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${zhHomeRoute}">
  <title>Agent Harness 学习指南</title>
  <link rel="canonical" href="${zhHomeRoute}">
</head>
<body>
  <p><a href="${zhHomeRoute}">进入中文教程</a></p>
</body>
</html>
`,
);

console.log(`Built ${pages.length + 1} pages.`);
