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

## 下一步

Goal Agent 到达稳定检查点后，人工决定是否激活 B-001 或 B-002。
