# 记录电子书站点改造待办会话

## 状态

已完成。

## 目标

调研适合电子书阅读和移动端的站点方案，并把结构性改造保存为不自动执行的 B-002。

## 决策

推荐 Astro Starlight 作为后续站点方案。它在电子书侧边栏、本页 TOC、Pagefind 本地搜索、深色模式、多语言路由、响应式布局和 GitHub Pages 支持上最匹配当前需求。Material for MkDocs 虽然成熟，但已进入维护模式；mdBook 的中文搜索仍存在风险；Docusaurus 和 VitePress 作为备选。

## 变更

- 新增 B-002 电子书站点改造待办。
- 待办索引加入 B-002。
- 产品设计声明站点生成器变更必须手动激活。
- 总进度表新增 G23。

## 验证

基于网络调研和当前 `site/build.mjs`、`styles.css`、Pages workflow 分析。未修改现有站点。

### 部署验证

- 提交 `33856a7` 后，本地 `node scripts/check-links.mjs` 通过；`site` 内 `npm run check:links` 和 `npm run build` 通过，构建 6 个页面。
- GitHub Actions 工作流 [32558666948](https://github.com/xiaoslin9153/awesome-agent-harness-tutorial/actions/runs/32558666948) 对该提交执行成功。
- 线上入口 `/` 和 `/zh-CN/00-overview/` 返回 HTTP 200。
- 线上语言索引 `/zh-CN/` 返回 HTTP 404。该问题先于本次文档变更存在；B-002 激活时必须把语言入口纳入迁移验收。

## 下一步

Goal Agent 到达稳定检查点后，人工决定是否激活 B-001 或 B-002。
