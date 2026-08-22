---
date: 2026-08-22
topic: 主 Agent 单执行者模式
status: 已完成
---

# 主 Agent 单执行者模式

## 目标

在 Polish Subagent 连续返回 HTTP 402 后，简化执行链路，避免模型调用链和额度策略继续阻塞教材写作。

## 决策

1. 只保留主 Agent 一个执行者。
2. Draft、Polish、Implementation Review、部署检查和进度同步全部由主 Agent 串行完成。
3. 不创建 Subagent 或并行子任务。
4. 移除现行流水线中的 token 预算、402 和 429 恢复流程。
5. 历史事故记录保留为背景，不作为现行执行规范。

## 变更

- `AGENTS.md` 改为主 Agent 独立完成三个写作阶段和部署检查。
- `tutorial/writing-pipeline.md` 将 Agent 角色改为主 Agent 内部的阶段边界。
- 总进度表新增 G26，并把 G24、G25 标记为 `已废弃`。

## 下一步

恢复 Goal Agent 后从 C-03 Polish 阶段继续，由主 Agent 直接完成润色。
