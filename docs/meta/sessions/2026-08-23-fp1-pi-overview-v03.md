---
date: 2026-08-23
topic: F-P1 Pi 架构总览 v0.3 重写
status: 已完成
---

# F-P1 Pi 架构总览 v0.3 重写

## 目标

按 Goal 运行手册重写 F-P1，把双层架构（通用内核 + coding-agent 装配）、树状 JSONL 会话与 ExecutionEnv 边界绑定到固定快照锚点。

## 范围

- 范围内：F-P1 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：F-P2 Run 循环细节、F-P3 工具容器化、Lane reducer 完整实现、跨框架对比页。

## 旧稿审计

旧稿已有分层图与核心类型表，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；pending_review 未关闭；未核对 AgentSession 常驻订阅、AgentHarness create restore 限制、ExecutionEnv cleanup 契约。

## 源码证据

1. `packages/coding-agent/src/core/agent-session.ts:310-314`：AgentSession 聚合 agent/sessionManager/settingsManager。
2. `agent-session.ts:398-400`：构造时常驻订阅 Agent 事件（持久化/扩展/压缩/重试）。
3. `packages/agent/src/harness/agent-harness.ts:305-345`：AgentHarness implements AgentLane，字段直接映射配置项。
4. `agent-harness.ts:347-353`：create 对已有 record 抛 HarnessNotImplemented create.restore。
5. `agent-harness.ts:295-303`：AgentLane 接口 getModel/setModel/tools/session.watch。
6. `session-manager.ts:845-854`：append-only 树、leaf 指针、buildSessionContext 文档。
7. `packages/agent/src/harness/types.ts:304-315`：Shell exec/cleanup 契约与 ExecutionEnv 继承。

## 决策

1. 核心不变量定为 append-only 树、leaf 指针分支、常驻订阅驱动持久化、ExecutionEnv 隔离副作用。
2. 用发动机加整车类比解释内核产品双包；随后给出双宿主对比与字段级证据。
3. 用 flowchart 表达宿主到服务图，用 flowchart 表达分支树的 leaf 移动。
4. 新增反例覆盖绕过 leaf 改历史、restore 未实现误用、cleanup 抛错、custom entry 无命名约定、leaf 移动后工具面假设、ExecutionEnv 泄漏、两套概念混用、steering 队列残留。
5. 完整因果链采用重构加 fork 实验：迁移 v3、mutation queue、message_end 追加、leaf 移动、buildSessionContext 处理 compaction。

## Polish

1. 统一通用内核、产品装配、leaf 指针、ExecutionEnv 术语。
2. 明确 AgentHarness restore 尚未实现是诚实限制而非隐藏缺陷。
3. 设计取舍表补充迁移启示顺序：先 ExecutionEnv 再持久化最后拆包。
4. 把 Lane reducer 细节留给批量终审或 F-P2 关联审阅。

## Implementation Review

1. 用脚本核对新稿全部 6 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/03-frameworks/pi/overview.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. AgentHarness restore 的上游实现计划待跟踪。
2. Lane reducer 完整状态机留待批量终审。
3. sqlite backend 切换的适配层设计留待存储专题。

## 下一步

处理 F-P2《Pi Run 生命周期》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
