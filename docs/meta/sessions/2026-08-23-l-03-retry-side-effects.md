---
date: 2026-08-23
topic: L-03 Tool 重试副作用实验初稿
status: 已完成
---

# L-03 Tool 重试副作用实验初稿

## 目标

完成 L-03 的中文 Draft 和 Polish；建立确定性工具副作用与幂等重试实验，比较无键重试、幂等键去重和显式补偿，保留批量 Implementation Review 清单，通过链接与实验检查后做最小提交和推送。

## 范围

- 范围内：`tutorial/zh-CN/05-labs/retry-side-effects.md`、`labs/retry-side-effects/`、目录状态、本会话记录和总进度表。
- 范围外：真实网络、外部服务、站点改造、框架集成和 B-001/B-002/B-003 待办。

## 记录与证据

- L-02 已由 `bcc5875` 推送，`main` 与 `origin/main` 同步且工作区干净。
- 实验使用确定性假件模拟“首次执行成功但确认超时”的状态未知场景。
- 实验要验证三个不变量：副作用必须留下审计记录；相同幂等键只能提交一次；无法自动恢复的未知状态必须进入人工确认而不是盲目重试。

## 成功标准

- `labs/retry-side-effects` 有 README、package.json、可执行入口和离线测试。
- 实验覆盖 no-key retry、idempotent retry 和 unknown-state escalation 三条路径。
- 教材说明错误分类、幂等键生命周期、副作用审计、补偿和迁移检查单。
- Draft 与 Polish 完成，Implementation Review 保持 `pending`。
- 实验测试、两套链接检查和最小提交推送通过。

## 进展

- 2026-08-23：建立会话检查点，确认 L-03 依赖 M-08 并开始设计假件账本。
- 2026-08-23：实现工单服务、无键重试、幂等键去重和提交后超时的状态未知分支。
- 2026-08-23：完成中文教材 Draft 与 Polish，补充错误分类决策流、三条路径契约、副作用审计和迁移检查单。
- 2026-08-23：执行 `cd labs/retry-side-effects && npm start && npm test`，3 条路径通过；执行两套链接检查，43 个 Markdown 文件全部通过。

## 决策

- 把异常分类为 `unknown` 而不是一律失败：区分确认失败和业务未发生。
- 幂等键使用稳定语义字符串：保证重放命中同一资源并返回去重结果。
- 状态未知先查询再标记人工确认：不因异常可见就发起第二次副作用。
- 分开记录 attempts 和 tickets：让尝试历史与已提交副作用都能审计。

## 自检

- 教材 Front Matter 记录 Polish 通过和 Implementation Review `pending`。
- 实验输出确认无键调用产生两张工单；相同键只产生一张；未知状态只尝试一次且最终要求人工确认。
- 变更只包含 L-03 教材、对应实验、目录状态、会话记录和总进度表。

## 开放问题

- Implementation Review 仍需核对输出契约、键生命周期、未知状态分支和框架 Retry 行为。
- 当前实验未覆盖部分完成、补偿执行失败或并发相同键竞争。

## 下一步

1. 提交并推送 L-03 最小改动。
2. 按 TOC 顺序启动 L-04 审批拒绝恢复实验的 Draft。
3. 保持单主 Agent 串行流程，并把 Implementation Review 继续留在批量待办清单。
