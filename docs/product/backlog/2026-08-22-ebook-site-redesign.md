# B-002：电子书阅读体验与移动端改造

## 状态

- `已激活`
- 创建日期：2026-08-22
- 激活日期：2026-08-24
- 执行前提：暂停当前写作任务，确认 Git 干净并与远端同步。

## 已确认决策（2026-08-24）

1. Mermaid 采用构建期同步渲染为内联 SVG（使用 rehype 插件如 `@beoe/rehype-mermaid`），页面零额外 JavaScript；后续新增章节中的 Mermaid 图自动被同一管线处理。
2. Sidebar 使用 Starlight config 中的 `autogenerate: { directory: 'zh-CN' }` 按当前目录结构分组；新章节放入对应目录后推送即自动出现在侧边栏。
3. 内容接入方式：`site-starlight/src/content/docs` symlink 到仓库根的 `tutorial/`，不复制文件。
4. 允许自动完成 Phase 3 切换发布，无需人工确认原型 URL 后再继续。

## 背景与目标

当前站点是极简构建器：每篇 Markdown 生成一个独立页面，有 Mermaid、表格和基础样式，但没有全局目录、上一章 / 下一章导航、站内搜索、深色模式、面包屑或阅读进度。随着章节增加，它无法提供电子书式阅读体验，也不适合手机上的长文阅读。

本次改造的目标是把站点升级为可长期维护的电子书：

1. 桌面端呈现清晰的三栏结构：左侧全书目录、中间正文、右侧本页目录。
2. 移动端优先保证正文可读；目录折叠为抽屉，避免挤压正文。
3. 支持上一章 / 下一章连续阅读。
4. 支持站内搜索和代码块横向滚动。
5. 支持浅色 / 深色模式，并默认跟随系统设置。
6. 保持 `tutorial/` 作为唯一内容源和多语言接口。

## 方案对比结论

| 方案 | 结论 | 原因 |
| --- | --- | --- |
| **Astro Starlight（推荐）** | 首选 | 电子书式侧边栏、本页 TOC、Pagefind 本地搜索、深色模式、多语言路由、响应式布局和 GitHub Pages 支持完整；静态输出性能好。 |
| Docusaurus | 备选 | 版本化、i18n 和生态最成熟，但 React 与配置负担更重；本项目暂不需要版本化和博客。 |
| VitePress | 备选 | 快速简洁，但多语言和电子书定制不如 Starlight 匹配。 |
| Material for MkDocs | 不推荐新项目 | 阅读体验成熟，但 2025 年底进入维护模式，团队转向 Zensical；不适合五年期教材主栈。 |
| mdBook | 不推荐为主方案 | 书籍形态最接近，但中文搜索仍有未完全解决的问题；多语言接口弱于 Starlight。 |
| 继续自研 | 只作短期兜底 | 可控性高，但要重复建设搜索、TOC、移动导航和无障碍能力，长期成本最高。 |

### 推荐：Astro Starlight

选择 Starlight 的核心理由：

1. 默认界面已经是文档/书籍型布局。
2. Pagefind 在构建期生成本地索引，无需外部服务或 API key。
3. 中文 UI 翻译开箱即用。
4. 多语言路由和 fallback 内容机制符合 `tutorial/language-interface.md`。
5. Markdown 可以逐步迁移到 MDX，但现有普通 Markdown 大部分可直接使用。
6. Astro 输出静态 HTML，适合 GitHub Pages 和移动端首屏。

## 目标信息架构

```text
/
└── zh-CN/
    ├── 学习地图 /
    ├── 第一章 核心概念 /
    ├── 第二章 Harness 核心机制 /
    ├── 第三章 最小实验 /
    ├── 第四章 框架基础拆解 /
    ├── 第五章 框架高级机制 /
    ├── 第六章 横向对比与设计模式 /
    └── 第七章 工程化与面试 /
```

该结构依赖 B-001 的六部分重构。维护者决定暂缓 B-001，B-002 直接使用当前目录结构（`00-overview` 到 `09-glossary`）配置 Starlight sidebar；后续如果激活 B-001，再同步更新 sidebar。

## 分阶段实施

### Phase 1：并行原型

1. 新建独立 `site-starlight/` 原型，不删除 `site/`。
2. 配置站点标题、描述、中文 locale、GitHub Pages base path 和社会卡片。
3. 建立 `site-starlight/src/content/docs` → `tutorial/` 的 symlink 接入内容。
4. 在 `astro.config.mjs` 中配置 `sidebar.autogenerate.directory: 'zh-CN'` 按目录自动分组，验证首页、章节页、术语表和 404。
5. 验证 Mermaid、表格、行内代码、相对链接和 Front Matter 兼容性。
6. 本地检查桌面宽度、iPhone SE 宽度和平板宽度。

### Phase 2：迁移验收

1. Pagefind 中文关键词搜索可用。
2. 左侧全书目录、右侧页面 TOC、上一章 / 下一章链接正确。
3. 移动端汉堡菜单打开后不遮挡正文，关闭后焦点恢复。
4. Mermaid 图在窄屏可横向滚动，文字不溢出。
5. 表格在小屏可滚动，不破坏页面布局。
6. Lighthouse 移动端 Performance、Accessibility、Best Practices 和 SEO 达到目标分。
7. GitHub Actions 使用项目 base path 构建成功。
8. Pages 上入口、总览、C-01、C-02 和新增页面返回 HTTP 200 且包含关键内容。

### Phase 3：替换发布

1. 把 workflow 构建目录切到 Starlight 产物。
2. 不维护旧路由重定向；旧 URL 失效可接受，新路由以 Starlight 生成的路径为准。
3. 更新 README、产品设计和进度表。
4. 稳定后移除旧 `site/` 构建器和旧 workflow 配置。

## 设计要求

1. 正文最大宽度控制在舒适长文范围，移动端左右留白充足。
2. 正文字号、行高、段落间距按中文长文优化。
3. 代码块必须横向滚动，不允许撑破屏幕。
4. Mermaid 初始缩放以可读为先，允许横向滚动。
5. 目录层级最多三级，超过时只展示当前章节。
6. 所有交互控件满足键盘可达和触控热区要求。
7. 图片和图表必须有替代文本或上下文说明。
8. 页面标题层级保持唯一 H1。

## 性能预算

| 指标 | 目标 |
| --- | --- |
| 正文页初始 JavaScript | 尽量低；Mermaid 按需加载。 |
| Mobile Lighthouse Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |
| LCP | ≤ 2.5s |
| CLS | ≤ 0.1 |

Mermaid 目前全站同步加载，是主要优化点。迁移时改为构建期渲染为内联 SVG，页面运行时不加载 Mermaid 库。

## 回滚条件

满足任一条件时不替换线上站点：

1. Mermaid、表格或既有章节链接迁移损失不可控。
2. Pagefind 对核心中文词检索失败且短期无修复方案。
3. GitHub Pages base path 或资源路径反复出错。
4. 移动端目录遮挡正文、代码溢出或触控目标过小。
5. 构建时间或依赖体积明显损害维护体验。

## 执行清单

1. 确认 Git 干净并与远端同步。
2. 创建 `site-starlight/` 原型和会话记录。
3. 建立 Markdown 适配器或内容同步策略。
4. 配置中文 locale、sidebar、搜索和 GitHub Pages base path。
5. 运行本地构建和预览。
6. 执行桌面、移动、链接、Mermaid、表格和搜索验收。
7. 提交并行原型，推送并等待 Actions 成功。
8. 自动切换 workflow 构建目录并推送部署。
9. 验证新路由内容正确。
10. 更新产品设计、总进度表、TOC 和部署协议。

## 明确不做

1. 未激活前不自动开工。
2. 不引入需要外部服务的搜索方案。
3. 不为第一版增加评论、账号、付费、PDF 导出或自定义域名。
4. 不为了视觉装饰牺牲正文可读性。
