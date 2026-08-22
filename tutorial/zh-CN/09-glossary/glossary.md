---
title: 术语表
description: Agent Harness 教材使用的核心术语及中英对照。
lang: zh-CN
content_status: draft
source_version: 2026-08-22
translations:
  en: null
review:
  polish:
    agent: polish-agent
    date: 2026-08-22
    verdict: pass
    summary: 已核对核心术语、中文优先策略和中英对照结构。
  implementation:
    agent: implementation-review-agent
    date: null
    verdict: pending
    evidence_version: Reasonix aa82b2f; DeepSeek Harness b150a55; Pi c49906e
    summary: 待最终事实审查核对全部术语与源码语义映射。
---

# 术语表

本教材使用以下术语。中文章节统一使用中文名，代码和源码引用保留英文名。

## 核心概念

| 中文 | 英文 | 定义 |
| --- | --- | --- |
| 模型 | Model | 接收 prompt 并返回文本或结构化输出的 LLM。 |
| 智能体 | Agent | 具有目标感知、工具调用和多步推理能力的系统。 |
| 线束 | Harness | 编排模型、工具、状态和安全边界的运行时层。 |
| 运行时 | Runtime | 执行 Agent Run 的进程或服务环境。 |
| 会话 | Session | 跨多次交互的持久化上下文容器。 |
| 回合 | Turn | 用户输入一次、Agent 响应一次的最小交互单元。 |
| 运行 | Run | 从输入到最终输出的完整执行过程，可跨多个回合。 |

## 工具与执行

| 中文 | 英文 | 定义 |
| --- | --- | --- |
| 工具 | Tool | Agent 可以调用的函数、API 或命令。 |
| 工具声明 | Tool Schema | 描述工具名称、参数和返回值的结构化定义。 |
| 工具调用 | Tool Call | 模型请求执行某个工具的动作。 |
| 工具结果 | Tool Result | 工具执行后返回给模型的数据。 |
| 副作用 | Side Effect | 工具执行对外部世界产生的不可逆变更。 |
| 幂等性 | Idempotency | 同一操作重复执行的最终效果与执行一次相同。 |
| 重试 | Retry | 在失败后重新执行操作。 |
| 超时 | Timeout | 操作超过指定时间后被终止。 |
| 取消 | Cancellation | 主动终止正在进行的操作或 Run。 |

## 安全与权限

| 中文 | 英文 | 定义 |
| --- | --- | --- |
| 审批 | Approval | 用户确认是否允许某个敏感操作。 |
| 沙箱 | Sandbox | 限制文件系统、网络和进程访问的隔离环境。 |
| 权限 | Permission | 决定哪些操作需要审批或被禁止的规则集。 |
| 提示注入 | Prompt Injection | 通过恶意输入操纵模型行为的安全攻击。 |

## 状态与持久化

| 中文 | 英文 | 定义 |
| --- | --- | --- |
| 状态机 | State Machine | 定义 Run 和工具调用可能状态的模型。 |
| 检查点 | Checkpoint | 在特定时间点保存的可恢复快照。 |
| 恢复 | Resume | 从检查点继续之前中断的 Run。 |
| 持久化 | Persistence | 将状态写入存储以支持恢复和审计。 |
| 可观测性 | Observability | 通过 trace、日志和指标理解系统行为的能力。 |
| 重放 | Replay | 使用已记录的输入重新执行以验证行为一致性。 |

## 架构模式

| 中文 | 英文 | 定义 |
| --- | --- | --- |
| 子智能体 | Sub-agent | 由主 Agent 创建的辅助执行单元。 |
| 委派 | Delegation | 主 Agent 将子任务分配给子 Agent 的过程。 |
| 并发 | Concurrency | 多个工具调用或子任务同时执行。 |
| 流式输出 | Streaming | 模型生成过程中逐步返回部分结果。 |
| 事件流 | Event Stream | 按时间顺序排列的结构化事件序列。 |
