# 会话：CS-02 多 Agent 委派失败 v0.3 新建

## 状态与目标

- 状态：进行中，待提交和部署验证。
- 日期：2026-08-23。
- 目标：新建 `tutorial/zh-CN/06-case-studies/multi-agent-failure.md`，用已验证的 M-14 结论构造一个委派失败案例，完成 Polish 与 Implementation 自检，同步记录并完成部署检查。
- 范围内：只新增 CS-02 公开章节及其 TOC、Backlog、进度表和会话记录。
- 范围外：不新增 labs 代码，不修改 `external/`，不引入新源码事实，不推进 Q-01，不开始批量终审。

## 已完成内容

1. 输入审计：CS-02 原为「未开始」，无旧稿；依赖章 M-14 已通过 v0.3 Implementation 自检，X-03 提供并发语义补充。
2. 证据核对：重新核对 M-14 锚点对应的 8 个源码区间长度，全部存在且匹配：
   - Reasonix `internal/agent/scheduler.go:36-55,78-107,305-333,199-226`
   - DeepSeek Harness `packages/host/apiproxy/src/api/subagents.ts:1-63`
   - Pi `file-mutation-queue.ts:16-61` 与 `agent/types.ts:61-69,371-374`
3. 新建案例：设计 Child A/B 同时触碰 `package.json` 的事故，分别对照 Reasonix fail fast、DeepSeek durable child session/read-vs-route、Pi mutation queue/全员 terminate。
4. 内容结构：2 张 Mermaid 图；7 条故障模式；一条从写冲突到父级 scoped conclusion 的完整因果链；六条核心不变量、设计取舍和迁移追问。
5. Front Matter 记录主 Agent Polish 与 Implementation Review 通过，并声明本章不新增源码事实。
6. 同步 TOC 中 CS-02 链接和状态、B-004 执行顺序和进度表 L01 行。

## 决策与证据

1. 不创建新 lab：M-14 已有机制级结论；CS-02 的价值是把同一事故映射到三家已验证行为，避免复制实验代码。
2. 所有框架事实只引用 M-14 固定快照锚点；本章明确区分「框架已验证行为」与「理想 join 协议」。
3. 把迟到结果定义为 informational/reopen request，不能改写已提交父级结论；这是本章的理想模型约束，不冒充某家实现。
4. 案例中的字段级合并、TTL、GC 等未实现细节只出现在反例或开放问题中，不写成框架能力。

## 验证结果

| 门禁 | 结果 |
| --- | --- |
| 源码锚点 | 8 个引用区间逐个核对，expected/actual 行数一致。 |
| 内容结构 | 2 张 Mermaid 图；7 个带因果解释的故障模式；1 条完整因果链。 |
| 继承证据 | 三家对照均链接回 M-14 锚点和 X-03 补充说明。 |
| 链接检查 | `cd site && npm run check:links` 通过，检查 46 个文件。 |
| 本地构建 | `cd site && npm run build` 通过，构建 45 个页面。 |
| Git 检查 | `git diff --check` 通过；当前变更限定在 CS-02 及必要状态同步。 |
| 提交部署 | 待执行。 |

## 开放问题

1. 字段级写协议（如同一 JSON 文件不同 key）仍无跨框架标准；本章保留在自检问题中。
2. 子会话 GC 与失败证据保留期的生产策略需要后续专门分析。
3. 批量终审时需复核 M-14 若有行号调整，本章三处锚点表必须同步。

## 下一步

1. 只提交本章及状态同步文件，推送后检查 GitHub Actions 和线上页面。
2. 回填部署证据并标记会话完成。
3. 下一次迭代处理 Q-01《概念与架构题》。
