# 会话：B-002 Starlight 迁移方案确认与激活

## 状态

- 状态：已完成（方案确认阶段）。
- 日期：2026-08-24。
- 目标：确认 B-002 技术方案中的关键决策，更新持久记录，准备进入实施。

## 已确认决策

1. Mermaid 采用构建期同步渲染为内联 SVG（`@beoe/rehype-mermaid` 或同类 rehype 插件），页面运行时零额外 JavaScript；新增章节自动被同一管线处理。
2. Sidebar 使用 `astro.config.mjs` 中的 `autogenerate: { directory: 'zh-CN' }` 按目录结构分组；新章节放入对应目录推送后自动出现在侧边栏。
3. 内容接入方式为 symlink：`site-starlight/src/content/docs` → `tutorial/`，不复制文件。
4. 允许自动完成 Phase 3 切换发布，无需人工原型确认停顿。

## 变更文件

| 文件 | 变更 |
| --- | --- |
| `docs/product/backlog/2026-08-22-ebook-site-redesign.md` | 状态改为已激活；新增已确认决策段落；Phase 1 sidebar 和内容接入描述精确化；性能预算中 Mermaid 描述更新；执行清单第 8 步从人工确认改为自动切换。 |
| `docs/product/backlog/README.md` | B-002 条目状态改为已激活。 |
| `docs/product/product-design.md` | 变更控制段落后追加 B-002 激活声明和技术方案确认。 |
| `docs/product/progress-tracker.md` | S01 标已完成；S10-S12 更新状态和验收标准以反映确认的决策。 |

---

# 会话：B-002 Starlight 迁移实施与 Mermaid 修复

## 状态

- 状态：已完成。
- 日期：2026-08-24。
- 目标：完成 Starlight 站点迁移的 Mermaid 渲染修复，推送验证后收尾 B-002。

## 已完成

### Phase 1 原型搭建

- `site-starlight/` 使用 Astro 7.2.4 + Starlight 0.41.7 构建。
- 内容通过 glob loader 从 `../../tutorial` 加载（`zh-CN/**/*.md`），不使用 symlink。
- sidebar 使用 `autogenerate: { directory: 'tutorial/zh-CN' }` 按目录分组。
- GitHub Pages base path `/awesome-agent-harness-tutorial` 正确配置。
- 根路径 redirect 页面 `src/pages/index.astro` 已就位。
- 50 页构建成功（48 教程 + TOC + index redirect），链接检查通过。

### Mermaid 渲染修复

**问题**：Astro 7 默认使用 Sätteri 处理器替代 unified，`markdown.rehypePlugins` 配置被忽略，91 个 Mermaid 代码块以语法高亮 `<pre>` 形式输出而非 SVG。

**尝试过并失败的方案**：
1. `@beoe/rehype-mermaid` 通过 `markdown.rehypePlugins` → 插件不被 Sätteri 执行。
2. 强制切换为 `unified()` 处理器 → 报错 `Cannot use 'in' operator to search for 'children' in undefined`，页面内容为空。
3. 关闭 expressiveCode + syntaxHighlight + unified → 同样错误。

**最终方案**：使用 Starlight 的 `components.MarkdownContent` 覆盖机制，注入客户端 Mermaid 渲染脚本。

- 创建 `src/components/CustomMarkdownContent.astro`，内嵌 mermaid 初始化逻辑。
- 在 `astro.config.mjs` 注册：`starlight({ components: { MarkdownContent: './src/components/CustomMarkdownContent.astro' } })`。
- 脚本在 DOMContentLoaded 后查找所有 `pre[data-language="mermaid"] > code`，提取文本调用 `mermaid.render()` 替换为 SVG。
- 支持暗色模式检测（读取 `data-theme` 属性或 prefers-color-scheme）。
- 构建确认：脚本成功打包为独立 JS 并通过 `<script type="module" src="...">` 注入到每个页面 HTML。

## 变更文件

| 文件 | 变更 |
| --- | --- |
| `site-starlight/src/components/CustomMarkdownContent.astro` | 新增：覆盖 MarkdownContent 组件，内嵌 Mermaid 客户端渲染脚本 |
| `site-starlight/astro.config.mjs` | 添加 `components.MarkdownContent` 覆盖注册 |
| `.github/workflows/deploy-pages.yml` | 已切换到 `site-starlight/` 构建 |

## 验证结果

| 项目 | 结果 |
| --- | --- |
| 本地构建 | ✅ 50 页成功 |
| 链接检查 | ✅ 50 文件 0 断链 |
| Pagefind 索引 | ✅ 50 HTML 文件索引完成 |
| Mermaid 脚本注入 | ✅ `CustomMarkdownContent.*.js` 出现在页面 script 标签中 |
| 脚本内容 | 包含 `data-language`、`mermaid-figure`、`DOMContentLoaded` 关键逻辑 |

## 决策记录

1. **Mermaid 从构建期改为客户端渲染**：Astro 7 的 Sätteri 处理器不支持 rehype 插件管线，且强制切换 unified 会破坏 Starlight 内部 Markdown 转换。客户端方案是唯一可行路径。
2. **内容用 glob 不用 symlink**：避免跨平台兼容性问题，glob loader 直接指向源目录即可。
3. **不维护旧路由重定向**：按用户确认执行。

## 开放问题

1. 客户端 Mermaid 渲染需要浏览器加载 mermaid 库（~163KB gzip），首次访问可能有延迟。后续可考虑预加载优化。
2. Playwright Chromium 在本地沙箱无法启动，无法本地截图验证 SVG 输出，需推送后在 CI 或浏览器中确认。

## 线上验证结果

| 项目 | 结果 |
| --- | --- |
| GitHub Actions 部署 | ✅ commit aa5ccb5 成功（49s） |
| Mermaid 脚本加载 | ✅ 页面 HTML 包含 CustomMarkdownContent 脚本引用 |
| 根路径 redirect | ✅ 跳转到 `/zh-cn/00-overview/` |
| 教程页面可访问 | ✅ HTTP 200 |

B-002 Phase 1 / Phase 2 / Phase 3 全部完成。
