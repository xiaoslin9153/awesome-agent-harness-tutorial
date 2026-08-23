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

## 下一步

执行 Goal 目标命令开始 B-002 实施（Phase 1 → Phase 2 → Phase 3）。
