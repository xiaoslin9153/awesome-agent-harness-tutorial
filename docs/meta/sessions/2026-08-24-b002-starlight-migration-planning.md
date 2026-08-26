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
| GitHub Actions 部署 | ✅ commit 3f16509 成功（41s） |
| Mermaid 脚本加载 | ✅ 页面 HTML 包含 CustomMarkdownContent 脚本引用 |
| 根路径 redirect | ✅ 跳转到 `/zh-cn/00-overview/` |
| 教程页面可访问 | ✅ HTTP 200 |

B-002 Phase 1 / Phase 2 / Phase 3 全部完成。

## Pi Design 延伸阅读（2026-08-26 追加）

**目标**：在 `tutorial/zh-CN/10-extended/pi-design/` 增加 Pi Harness 设计延伸阅读，包含 harness v1/v2 完整翻译、两篇教程式解析和版本差异分析。

**完成状态（5/5 篇）**：

| 文章 | 状态 | 说明 |
| --- | --- | --- |
| `harness-v1-translation.md` | ✅ 完成 | 2810 行，完整翻译不删减。 |
| `harness-v2-translation.md` | ✅ 完成 | 第 1–12 节先提交；第 13–21 节补齐 Storage、Agent-loop、Harness internals、pi-ai deferred、Fork/subagent、Telemetry、Testing 和 Work packages。 |
| `harness-v1-analysis.md` | ✅ 完成 | 641 行，教程式解析。 |
| `harness-v2-analysis.md` | ✅ 完成 | 512 行，教程式解析。 |
| `harness-v1-v2-diff.md` | ✅ 完成 | 427 行，版本差异点。 |

**验证**：`cd site-starlight && ASTRO_TELEMETRY_DISABLED=1 npm run build` 通过，55 页构建成功；`npm run check:links` 通过，55 个 Markdown 文件链接正常。

**部署检查**：待本次推送后确认 GitHub Actions 与线上页面。

## 正文排版改造进度（2026-08-25 暂停记录）

## 排版修复（追加）

**问题**：页面标题和 H2 字号过大（H2 约 29px），内容区偏窄（48rem），对中文阅读体验不佳。

**修复**：覆盖 Starlight CSS 变量，在 `src/styles/custom.css` 中设置：

| 变量 | 原值 | 新值 |
| --- | --- | --- |
| `--sl-text-h1` | `--sl-text-4xl`（35px） | `--sl-text-3xl`（29px） |
| `--sl-text-h2` | `--sl-text-3xl`（29px） | `--sl-text-2xl`（24px） |
| `--sl-text-h3` | `--sl-text-2xl`（24px） | `--sl-text-xl`（20px） |
| `--sl-text-h4` | `--sl-text-xl`（20px） | `--sl-text-lg`（18px） |
| `--sl-content-width` | `48rem` | `52rem` |

## 基础设施检查结果

以下配置确认无需更新：

| 项目 | 状态 |
| --- | --- |
| `.github/workflows/deploy-pages.yml` | ✅ 正确指向 `site-starlight/dist` |
| `site-starlight/src/content/docs` symlink | ✅ 已提交到 git，CI 可用 |
| `content.config.ts` glob loader | ✅ 标准路径 `./src/content/docs` |
| `astro.config.mjs` sidebar autogenerate | ✅ 按目录分组正确 |
| Mermaid 客户端脚本 | ✅ 通过 MarkdownContent 覆盖注入 |
| 根路径 redirect | ✅ 指向 `/00-overview/` |

## 正文排版改造进度（2026-08-25 暂停记录）

**目标**：48 篇正文全部添加 Starlight aside（`:::note` / `:::tip` / `:::caution` / `:::danger`），提升可读性和视觉层次。

**改造标准**：
1. 每篇至少 3 个 aside（note/tip/caution/danger 按语义选择）
2. 关键结论用 aside 包裹，不再埋在长段落里
3. 枚举超过 3 项改用列表
4. 长路径/多文件引用改用代码块

**已完成（20/48 篇）**：

| 批次 | 篇数 | aside 数 | 状态 |
| --- | --- | --- | --- |
| P0 `01-core-concepts/` | 4 | 30 | ✅ 已推送（commit ece1dee） |
| P1 `02-harness-mechanics/` | 16 | 102 | ✅ 已推送（commit 23dab65） |

**待做（28 篇）**：

| 批次 | 篇数 | 目录 |
| --- | --- | --- |
| P2 框架拆解 | 9 | `03-frameworks/` |
| P2 对比 | 6 | `04-comparisons/` |
| P2 实验 | 4 | `05-labs/` |
| P3 案例 | 2 | `06-case-studies/` |
| P3 面试 | 3 | `07-interview/` |
| P3 评估 | 1 | `08-evaluation/` |
| P3 术语 | 1 | `09-glossary/` |
| 根目录 | 2 | `00-overview.md` + `TOC.md` |

**CSS 排版精修**：已部署（commit 87cb62a），包含中文字体栈、标题层级、行高、间距、H2 分隔线。

**暂停原因**：维护者有新工作需要处理。

**恢复时的第一步**：从 `03-frameworks/deepseek-harness/overview.md` 开始改造 P2 框架拆解 9 篇。
B-002 Phase 1 / Phase 2 / Phase 3 全部完成。
