# 会话：准备工作审计与流程补齐

## 元数据

- 日期：2026-08-22
- 状态：已完成
- 目标：审计当前准备度，评估目录框架，并固化最小提交、提交前 Review 和部署检查规则。

## 审计结论

| 事项 | 状态 | 说明 |
| --- | --- | --- |
| Git 历史 | 已就绪 | `main` 与 `origin/main` 同步，最近提交为 `2530619 docs: choose github pages publishing`。 |
| 推送身份 | 已就绪 | 使用 `github.com-personal` 别名绑定账号 `xiaoslin9153`。 |
| 内部记录 | 已就绪 | 产品设计、对比账本、会话钩子、检查清单和历史会话均为中文。 |
| 框架源码 | 已就绪 | Reasonix、DeepSeek Harness、Pi 均已浅克隆并固定 commit；`external/` 已忽略。 |
| 多语言接口 | 已就绪 | 中文优先和翻译路径已定义。 |
| 发布平台 | 已决策 | GitHub Pages，不使用 GitBook。 |
| 最小提交纪律 | 本次补齐 | 已写入 Agent 工作约定。 |
| 提交前 Review | 本次补齐 | 已写入会话检查清单和工作约定。 |
| 部署检查 | 本次补齐 | 当前无流水线，状态固定为“尚未部署”。 |
| 第一篇公开教材 | 未完成 | 尚未创建 `tutorial/zh-CN/00-overview.md` 或生命周期文章。 |
| C01-C25 证据索引 | 未完成 | 三家框架还没有机制级源码定位。 |
| 站点生成器 | 未完成 | Astro Starlight 与 Docusaurus 尚未选型。 |
| Pages 流水线 | 未完成 | 没有 workflow、构建配置或部署验证。 |

## 目录框架结论

当前目录分层合理。`docs/` 服务维护者和内部决策，`tutorial/` 服务公开读者，未来 `labs/` 承载实验代码，未来 `site/` 只放生成器配置。这个边界可以避免内部修订记录泄漏到站点，也避免教材正文混入项目管理细节。

## 会话迁移追踪

当前追踪机制已经具备三层：

1. Git 提交历史记录每次落盘变更。
2. `docs/meta/sessions/` 记录目标、证据、结果、阻塞和下一步。
3. `AGENTS.md` 强制新会话读取会话钩子和关键账本。

本次再补一层提交粒度约束：一次提交只处理一个可独立说明的小点。这样即使会话切换，每个提交也能作为最小恢复单元。

## 本次修改

- `.gitignore`
- `AGENTS.md`
- `docs/meta/session-checklist.md`
- `docs/product/product-design.md`
- 本会话记录

## 下一步

1. 创建 `tutorial/zh-CN/00-overview.md`。
2. 开始 C03 Run 生命周期和 C04 状态模型的源码索引。
3. 第一篇教材稳定后选择 Astro Starlight 或 Docusaurus。
4. 建立 GitHub Pages 构建与部署流水线。
