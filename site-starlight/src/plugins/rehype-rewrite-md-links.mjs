/**
 * rehype 插件：构建期把教程 Markdown 里的 `.md` 相对链接重写为最终页面 URL。
 *
 * 背景：Starlight 对 Markdown 链接零转换，教程内 399 个 `.md` 相对链接会原样输出，
 * 而发布站点是目录式 URL（foo.md → /foo/），导致线上点击 404。
 *
 * 本插件在构建期把相对路径的 `.md` 链接（如 `./TOC.md`、`../09-glossary/glossary.md`）
 * 重写为带 base 的最终页面 URL（如 `/awesome-agent-harness-tutorial/toc/`）。
 * slug 生成规则与 Astro content 层一致（github-slugger 逐段处理、去掉扩展名、index 折叠）。
 *
 * 保留锚点（#section）与外部链接（http/mailto/绝对路径）不做处理。
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { slug } from "github-slugger";

/**
 * @param {{ base?: string }} [options] base 为站点基础路径，缺省时从 SITE_BASE_URL 读取。
 */
export default function rehypeRewriteMdLinks(options = {}) {
  const rawBase =
    options.base ?? process.env.SITE_BASE_URL ?? "/awesome-agent-harness-tutorial";
  // 统一为 "/xxx/" 形式，去掉尾斜杠再统一拼接
  const base = rawBase.endsWith("/")
    ? rawBase.slice(0, -1)
    : rawBase;

  return function transformer(tree, file) {
    const fileUrl = file.path;
    if (!fileUrl) return;
    const currentPath = fileUrl.href ? fileURLToPath(fileUrl) : String(fileUrl);
    if (!currentPath.endsWith(".md")) return;

    // content 集合根目录：site-starlight/src/content/docs（可能为 symlink，按 vfile 所在路径推算）
    // 通过当前文件路径向上找 src/content/docs
    const srcContentIndex = currentPath.indexOf(path.sep + "src" + path.sep + "content");
    if (srcContentIndex === -1) return;
    const contentRoot = currentPath.slice(0, srcContentIndex + 1) +
      path.join("src", "content");
    // 实际 docs 目录名可能不同，但 content 集合 base 是 ./src/content/docs
    const docsRoot = path.join(contentRoot, "docs");

    const currentDir = path.dirname(currentPath);

    for (const child of tree.children || []) {
      walk(child, (node) => {
        if (node.type !== "element" || node.tagName !== "a") return;
        const props = node.properties;
        if (!props || typeof props.href !== "string") return;
        const href = props.href;
        // 只处理指向 .md 的相对链接
        if (href.startsWith("http")) return;
        if (href.startsWith("mailto:")) return;
        if (href.startsWith("#")) return;
        if (href.startsWith("/")) return; // 已是绝对路径
        if (href.startsWith("//")) return;

        // 分离锚点
        const hashIndex = href.indexOf("#");
        const targetPath = hashIndex === -1 ? href : href.slice(0, hashIndex);
        const anchor = hashIndex === -1 ? "" : href.slice(hashIndex);

        if (!/\.(md|markdown|mdx)$/i.test(targetPath)) return;

        const resolved = path.resolve(currentDir, targetPath);
        // 目标必须在 docsRoot 之内
        const rel = path.relative(docsRoot, resolved);
        if (rel.startsWith("..") || path.isAbsolute(rel)) return;

        // 生成 slug：去掉扩展名，按段 slugify（与 Astro getContentEntryIdAndSlug 一致）
        const withoutExt = rel.replace(/\.(md|markdown|mdx)$/i, "");
        const segments = withoutExt.split(path.sep).map((s) => slug(s));
        let slugPath = segments.join("/");
        if (slugPath === "index") slugPath = "";
        slugPath = slugPath.replace(/\/index$/, "");

        const newUrl = base + "/" + slugPath + "/" + anchor;
        props.href = newUrl;
      });
    }
  };
}

/** 深度优先遍历 hast 树 */
function walk(node, cb) {
  cb(node);
  if (!node.children) return;
  for (const child of node.children) {
    if (child && typeof child === "object") walk(child, cb);
  }
}
