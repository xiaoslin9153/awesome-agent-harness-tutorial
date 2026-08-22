# 会话：修复 TOC 链接与表格渲染

## 元数据

- 日期：2026-08-22
- 状态：已完成
- 目标：让 TOC 页的已完成章节可以点击跳转，并支持 Markdown 表格渲染。

## 根因

1. TOC 中文件路径使用反引号代码格式，不是可点击链接。
2. 站点构建器不支持 Markdown 表格语法。

## 修复

1. TOC 中已完成的 C-01 和 G-01 标题改为相对路径 Markdown 链接。
2. 构建器新增表格解析（`|` 分隔行），输出 `<table>` HTML。
3. 构建器新增内联链接和行内代码渲染。
4. 相对 `.md` 链接自动转换为带 `SITE_BASE_URL` 前缀的目录路由。

## 验证

- 本地构建通过（5 pages）。
- 链接检查通过（6 files checked）。
- TOC 页表格正确渲染为 `<table>`。
- C-01 链接指向 `/awesome-agent-harness-tutorial/zh-CN/01-core-concepts/agent-vs-harness/`。

## 下一步

推送后检查线上部署和 TOC 页可交互性。
