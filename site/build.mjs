import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(root, 'tutorial');
const outputRoot = path.join(root, 'site', 'dist');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderInline(value) {
  return escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  let inCodeBlock = false;
  let unorderedListItems = 0;
  const html = [];
  let orderedListItems = 0;

  for (const line of lines) {
    if (line.startsWith('```')) {
      html.push(inCodeBlock ? '</code></pre>' : '<pre><code>');
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(line));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const unorderedItem = line.match(/^\s*[-*]\s+(.*)$/);
    if (unorderedItem) {
      if (orderedListItems > 0) { html.push('</ol>'); orderedListItems = 0; }
      if (unorderedListItems === 0) html.push('<ul>');
      unorderedListItems += 1;
      html.push(`<li>${renderInline(unorderedItem[1])}</li>`);
      continue;
    }

    const orderedItem = line.match(/^\s*\d+\.\s+(.*)$/);
    if (orderedItem) {
      if (orderedListItems === 0) html.push('<ol>');
      if (unorderedListItems > 0) { html.push('</ul>'); unorderedListItems = 0; }
      orderedListItems += 1;
      html.push(`<li>${renderInline(orderedItem[1])}</li>`);
      continue;
    }

    if (orderedListItems > 0) {
      html.push('</ol>');
      orderedListItems = 0;
    }

    if (unorderedListItems > 0) {
      html.push('</ul>');
      unorderedListItems = 0;
    }

    if (line.trim() === '') continue;
    html.push(`<p>${escapeHtml(line)}</p>`);
  }

  return html.join('\n');
}

async function collectMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name));
}

async function buildPage(sourcePath) {
  const raw = await readFile(sourcePath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`Missing front matter: ${sourcePath}`);

  const frontMatter = Object.fromEntries(
    match[1].split(/\r?\n/).map((line) => {
      const separator = line.indexOf(':');
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
  );
  const content = renderMarkdown(raw.slice(match[0].length));
  const relativePath = path.relative(sourceRoot, sourcePath);
  const route = relativePath.replace(/\.md$/, '');
  const outputRelativePath = relativePath.replace(/\.md$/, '').replaceAll(path.sep, '/');
  const outputPath = path.join(outputRoot, outputRelativePath, 'index.html');

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `<!doctype html>
<html lang="${frontMatter.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(frontMatter.title)}</title>
  <meta name="description" content="${escapeHtml(frontMatter.description)}">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main>
    <article>
      ${content}
    </article>
  </main>
</body>
</html>
`);

  return { route: `/${outputRelativePath}/`, lang: frontMatter.lang, title: frontMatter.title };
}

await mkdir(outputRoot, { recursive: true });
await cp(path.join(root, 'site', 'public'), outputRoot, { recursive: true });

const markdownFiles = await collectMarkdown(sourceRoot);
const pages = [];
for (const sourcePath of markdownFiles) {
  if (path.basename(sourcePath) === 'language-interface.md') continue;
  pages.push(await buildPage(sourcePath));
}

const zhHome = pages.find((page) => page.route === '/zh-CN/00-overview/');
if (!zhHome) throw new Error('Missing Chinese overview page');

await writeFile(path.join(outputRoot, 'index.html'), `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=/zh-CN/00-overview/">
  <title>Agent Harness 学习指南</title>
  <link rel="canonical" href="/zh-CN/00-overview/">
</head>
<body>
  <p><a href="/zh-CN/00-overview/">进入中文教程</a></p>
</body>
</html>
`);

console.log(`Built ${pages.length + 1} pages.`);
