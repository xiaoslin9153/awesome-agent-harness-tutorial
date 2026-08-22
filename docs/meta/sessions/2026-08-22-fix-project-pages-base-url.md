# 会话：修复 GitHub Pages 项目路径 404

## 元数据

- 日期：2026-08-22
- 状态：已完成
- 目标：修复项目站点根路径重定向到用户域名根路径导致的 404。

## 根因

GitHub Pages 项目站点发布在 `/awesome-agent-harness-tutorial/` 子路径下。此前构建器把首页重定向、canonical、样式和 Mermaid 资源写成绝对根路径，例如 `/zh-CN/00-overview/` 和 `/styles.css`。浏览器因此跳转到 `xiaoslin9153.github.io/zh-CN/00-overview/`，该路径不存在。

## 修复

1. 构建器新增 `SITE_BASE_URL` 环境变量，默认值为 `/`。
2. 所有页面资源和首页跳转都拼接基础路径。
3. GitHub Actions 构建时设置：

   ```sh
   SITE_BASE_URL=/${{ github.event.repository.name }}/
   ```

4. 本地以 `/awesome-agent-harness-tutorial/` 构建，确认产物路径正确。

## 验证

本地产物中：

- 根页跳转：`/awesome-agent-harness-tutorial/zh-CN/00-overview/`
- 中文页样式：`/awesome-agent-harness-tutorial/styles.css`
- Mermaid 脚本：`/awesome-agent-harness-tutorial/mermaid.min.js`

## 结果

本地构建通过。待推送后检查远端部署和线上 URL。
