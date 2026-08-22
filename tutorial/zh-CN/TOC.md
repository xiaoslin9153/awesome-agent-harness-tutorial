---
title: 教材目录
description: 全部章节的文件路径、依赖关系和写作顺序。
lang: zh-CN
content_status: draft
source_version: 2026-08-22
translations:
  en: null
---

# 教材目录

## 第一章：核心概念

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| C-01 | Agent、Harness 与 Runtime 的边界 | `tutorial/zh-CN/01-core-concepts/agent-vs-harness.md` | 无 | 已完成 |
| C-02 | 一次 Agent Run 的完整生命周期 | `tutorial/zh-CN/01-core-concepts/agent-run-lifecycle.md` | C-01 | 未开始 |
| C-03 | Session、Turn 与状态模型 | `tutorial/zh-CN/01-core-concepts/session-and-state.md` | C-02 | 未开始 |
| C-04 | 事件模型与流式输出 | `tutorial/zh-CN/01-core-concepts/events-and-streaming.md` | C-02 | 未开始 |

## 第二章：Harness 核心机制

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| M-01 | Context 组装与分层 | `tutorial/zh-CN/02-harness-mechanics/context-assembly.md` | C-03 | 未开始 |
| M-02 | Context 压缩与截断 | `tutorial/zh-CN/02-harness-mechanics/context-compression.md` | M-01 | 未开始 |
| M-03 | Tool Schema 与调用协议 | `tutorial/zh-CN/02-harness-mechanics/tool-schema.md` | C-02 | 未开始 |
| M-04 | Tool 执行与副作用 | `tutorial/zh-CN/02-harness-mechanics/tool-execution.md` | M-03 | 未开始 |
| M-05 | Tool 结果处理与截断 | `tutorial/zh-CN/02-harness-mechanics/tool-results.md` | M-04 | 未开始 |
| M-06 | 审批模型 | `tutorial/zh-CN/02-harness-mechanics/approval.md` | M-04 | 未开始 |
| M-07 | Sandbox 与权限 | `tutorial/zh-CN/02-harness-mechanics/sandbox.md` | M-06 | 未开始 |
| M-08 | Retry 与幂等 | `tutorial/zh-CN/02-harness-mechanics/retry-idempotency.md` | M-04 | 未开始 |
| M-09 | Timeout 与取消 | `tutorial/zh-CN/02-harness-mechanics/timeout-cancellation.md` | M-08 | 未开始 |
| M-10 | Checkpoint 与 Resume | `tutorial/zh-CN/02-harness-mechanics/checkpoint-resume.md` | C-03 | 未开始 |
| M-11 | Persistence | `tutorial/zh-CN/02-harness-mechanics/persistence.md` | M-10 | 未开始 |
| M-12 | Observability 与 Replay | `tutorial/zh-CN/02-harness-mechanics/observability.md` | M-11 | 未开始 |
| M-13 | Memory 与工作区 | `tutorial/zh-CN/02-harness-mechanics/memory-workspace.md` | M-11 | 未开始 |
| M-14 | Sub-agent 与并发 | `tutorial/zh-CN/02-harness-mechanics/subagent-concurrency.md` | M-04 | 未开始 |
| M-15 | 成本与延迟 | `tutorial/zh-CN/02-harness-mechanics/cost-latency.md` | M-14 | 未开始 |
| M-16 | Prompt Injection 与工具安全 | `tutorial/zh-CN/02-harness-mechanics/prompt-injection.md` | M-07 | 未开始 |

## 第三章：框架拆解

| ID | 框架 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| F-R1 | Reasonix 架构总览 | `tutorial/zh-CN/03-frameworks/reasonix/overview.md` | 第二章 | 未开始 |
| F-R2 | Reasonix Run 生命周期 | `tutorial/zh-CN/03-frameworks/reasonix/run-lifecycle.md` | F-R1 | 未开始 |
| F-R3 | Reasonix 工具与审批 | `tutorial/zh-CN/03-frameworks/reasonix/tools-approval.md` | F-R2 | 未开始 |
| F-D1 | DeepSeek Harness 架构总览 | `tutorial/zh-CN/03-frameworks/deepseek-harness/overview.md` | 第二章 | 未开始 |
| F-D2 | DeepSeek Harness Run 生命周期 | `tutorial/zh-CN/03-frameworks/deepseek-harness/run-lifecycle.md` | F-D1 | 未开始 |
| F-D3 | DeepSeek Harness 工具与沙箱 | `tutorial/zh-CN/03-frameworks/deepseek-harness/tools-sandbox.md` | F-D2 | 未开始 |
| F-P1 | Pi 架构总览 | `tutorial/zh-CN/03-frameworks/pi/overview.md` | 第二章 | 未开始 |
| F-P2 | Pi Run 生命周期 | `tutorial/zh-CN/03-frameworks/pi/run-lifecycle.md` | F-P1 | 未开始 |
| F-P3 | Pi 工具与容器化 | `tutorial/zh-CN/03-frameworks/pi/tools-containerization.md` | F-P2 | 未开始 |

## 第四章：横向对比

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| X-01 | 架构风格对比 | `tutorial/zh-CN/04-comparisons/architecture.md` | 第三章 | 未开始 |
| X-02 | Context 策略对比 | `tutorial/zh-CN/04-comparisons/context.md` | 第三章 | 未开始 |
| X-03 | 工具协议对比 | `tutorial/zh-CN/04-comparisons/tools.md` | 第三章 | 未开始 |
| X-04 | 安全与审批对比 | `tutorial/zh-CN/04-comparisons/security.md` | 第三章 | 未开始 |
| X-05 | 持久化与恢复对比 | `tutorial/zh-CN/04-comparisons/persistence.md` | 第三章 | 未开始 |
| X-06 | 设计模式与反模式 | `tutorial/zh-CN/04-comparisons/patterns.md` | X-01 至 X-05 | 未开始 |

## 第五章：实验

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| L-01 | 最小 Agent Run 实验 | `tutorial/zh-CN/05-labs/minimal-run.md` | C-02 | 未开始 |
| L-02 | Context 膨胀实验 | `tutorial/zh-CN/05-labs/context-bloat.md` | M-02 | 未开始 |
| L-03 | Tool 重试副作用实验 | `tutorial/zh-CN/05-labs/retry-side-effects.md` | M-08 | 未开始 |
| L-04 | 审批拒绝恢复实验 | `tutorial/zh-CN/05-labs/approval-rejection.md` | M-06 | 未开始 |

## 第六章：案例研究

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| CS-01 | 长任务中断恢复 | `tutorial/zh-CN/06-case-studies/long-task-recovery.md` | M-10 | 未开始 |
| CS-02 | 多 Agent 委派失败 | `tutorial/zh-CN/06-case-studies/multi-agent-failure.md` | M-14 | 未开始 |

## 第七章：面试题库

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| Q-01 | 概念与架构题 | `tutorial/zh-CN/07-interview/concepts.md` | 第一、二章 | 未开始 |
| Q-02 | 实现与调试题 | `tutorial/zh-CN/07-interview/implementation.md` | 第二、三章 | 未开始 |
| Q-03 | 安全与系统设计题 | `tutorial/zh-CN/07-interview/security-design.md` | 第二、四章 | 未开始 |

## 第八章：评测

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| E-01 | Harness 评测框架 | `tutorial/zh-CN/08-evaluation/evaluation-framework.md` | 第四章 | 未开始 |

## 第九章：术语表

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| G-01 | 术语表 | `tutorial/zh-CN/09-glossary/glossary.md` | 无 | 未开始 |

## 写作顺序

按依赖关系递进，推荐顺序：

```text
C-01 → C-02 → C-03 → C-04 → M-01 → ... → M-16
→ F-R1 → F-R2 → F-R3 → F-D1 → F-D2 → F-D3 → F-P1 → F-P2 → F-P3
→ X-01 → ... → X-06
→ L-01 → ... → L-04 → CS-01 → CS-02
→ Q-01 → Q-02 → Q-03 → E-01 → G-01
```
