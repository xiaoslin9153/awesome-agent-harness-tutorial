# 会话记录：教程链接 404 根因分析与修复

- 日期：2026-09-01
- 状态：已完成（分析 + 修复 B+C 已实现、本地验证、推送并部署成功，线上验证通过）
- 范围：`tutorial/` 链接断链分析；`site-starlight/` 构建配置、插件；`scripts/check-links.mjs`

## 会话目标

1. 找出教程中全部链接（内部相对链接、锚点、外部链接）。
2. 确认线上 GitHub Pages 点击 404 的真实 URL 与分布。
3. 定位根因并区分"源码层 vs 发布层"。
4. 用户确认后实施方案 B（构建期重写）+ C（检查升级），本地验证。

## 关键事实与证据

- 教程共 55 个 `.md` 文件，466 条链接：399 个相对路径链接、67 个页内锚点（`#...`）、0 个 HTTP 外部链接（正文内）。front matter 中另有 4 个 `source_url` 外链，不参与正文渲染。
- 旧 `scripts/check-links.mjs` 只验证**源 `.md` 文件是否存在**，不验证构建产物。
- 本地 `site-starlight` 构建成功（55 页）。扫描 `dist/` 全部 3473 个内部 href：399 个链接**原样输出 `.md`**，无一条被重写为页面 URL。
- 线上验证（2026-09-01）：
  - `/00-overview/` → 200；模拟点击 `./TOC.md` → `/00-overview/TOC.md` → **404**
  - 正确页面 `/09-glossary/glossary/`、`/01-core-concepts/agent-run-lifecycle/` → 200
- 67 个页内锚点经核对在构建产物中均有对应 `id`，有效。

## 根因

**发布链路系统性断链，而非个别链接写错。** 根因链：

1. 教程内部链接全部写成 `.md` 相对路径（如 `./TOC.md`），在 GitHub 仓库源码浏览时正常。
2. Starlight 官方确认**不对 Markdown 链接做任何转换**（withastro/starlight#2214）。构建后 `href` 原样保留为 `.md`。
3. Starlight 生成的页面 URL 为目录式（`foo.md` → `/foo/`），站点上不存在 `.md` 文件。
4. 浏览器以相对路径 + 当前页 URL（含尾斜杠）解析 `.md` 链接 → 指向不存在路径 → 404。
5. 旧 `check-links.mjs` 只做源码层校验，未做构建产物校验 → CI 全绿但线上 404。

## 修复实施（方案 B + C，2026-09-01）

### 方案 B：构建期 .md 链接重写（已完成）

- 新增 `site-starlight/src/plugins/rehype-rewrite-md-links.mjs`：rehype 插件，把相对路径的 `.md` 链接（`./TOC.md`、`../09-glossary/glossary.md`）重写为带 base 的最终页面 URL（如 `/awesome-agent-harness-tutorial/toc/`）。
  - slug 生成与 Astro content 层一致：github-slugger 逐段处理、去扩展名、`index` 折叠。
  - 保留锚点（`#section`）与外部链接（http/mailto/绝对路径）不动。
- `site-starlight/astro.config.mjs`：改用 `markdown.processor: unified({ rehypePlugins: [...] })`（Astro 7 推荐方式，避免 `markdown.rehypePlugins` deprecation）。
- 验证：构建后 `dist/` 中 `.md` 链接残留 0，3473 个内部 href 全部命中，0 断链；本地 preview 全部页面 200，链接指向正确页面。

### 方案 C：check-links 升级（已完成）

- `scripts/check-links.mjs` 升级为两阶段：
  1. 源码层：`tutorial/` 下 Markdown 相对链接必须指向存在的 `.md` 源文件。
  2. 构建产物层：若 `site-starlight/dist` 存在，扫描全部 HTML 内部链接（去 base 前缀后）必须命中 dist 中真实文件/页面。
- 验证：正常全绿；注入一条断链后脚本能报 `[dist] ... broken link` 并 exit 1；恢复后全绿。

## 决策

1. 选 B + C 组合，不选 A（避免改 399 处源码链接，保留 `.md` 在仓库内可读性）。
2. 采用自定义 rehype 插件而非 `remark-link-rewrite` 第三方包：可控、无新增依赖、slug 规则与 Astro 一致。
3. 采用 `markdown.processor: unified()` 而非废弃的 `markdown.rehypePlugins`，消除 deprecation 警告。

## 部署与线上验证（已完成）

- 提交 `5d5d8e0` 推送到 `main`，GitHub Actions "Deploy Pages" 运行成功（conclusion=success）。
- 线上验证（2026-09-01）：
  - 全部 54 个页面 + 首页访问均 200（线上抽查）。
  - `/toc/`、`/09-glossary/glossary/`、`/01-core-concepts/agent-run-lifecycle/` 均 200。
  - 线上 `00-overview/` 页面内链接已为带 base 的目录式 URL，不再指向 `.md`。
- git 状态：`## main...origin/main` 干净，本地与远端一致。
- 说明：`sitemap-index.xml` 返回 404 为 Astro 默认不生成该文件，非本次断链问题。

## 下一步

1. 后续每次推送部署后，继续观察链接检查在 CI 中的表现（check-links 阶段 2 已集成）。
