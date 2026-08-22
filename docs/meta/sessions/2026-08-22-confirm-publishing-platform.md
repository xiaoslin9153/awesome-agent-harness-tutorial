# 会话：确认发布平台

## 元数据

- 日期：2026-08-22
- 状态：已完成
- 目标：确定公开教材的发布平台。

## 范围

### 范围内

- 对比 GitBook 与 GitHub Pages 的适配性。
- 更新产品设计的发布策略。

### 范围外

- 立即选择最终静态站点生成器。
- 实现部署流水线。
- 迁移或生成教材页面。

## 决策

使用 GitHub Pages（github.io），不使用 GitBook。

## 理由

| 维度 | 结论 |
| --- | --- |
| 内容源 | 仓库中的 Markdown 是唯一来源。 |
| 自动化 | GitHub Actions 可完成构建、检查和发布。 |
| 协作 | Issue、Pull Request、Review 和源码留在同一平台。 |
| 可迁移性 | 静态产物不依赖 GitBook 托管。 |
| 成本 | 公开仓库的 GitHub Pages 部署成本最低。 |
| 品牌与域名 | 可使用 `github.io`，也可后续绑定自有域名。 |

GitBook 的优点是开箱即用和在线编辑体验，但会引入外部平台同步、权限管理和导出一致性成本。本项目优先保持内容源、代码实验和发布链路统一，因此选择 GitHub Pages。

## 影响

1. `tutorial/` 保持唯一公开教材内容入口。
2. 后续站点方案只在 Astro Starlight 和 Docusaurus 中选择。
3. 部署目标固定为 GitHub Pages。
4. 产品设计中的阶段 6 已同步更新。

## 下一步

在第一篇教材稳定后，做一个最小 GitHub Pages 构建验证，再根据多语言路由和搜索需求选择 Astro Starlight 或 Docusaurus。
