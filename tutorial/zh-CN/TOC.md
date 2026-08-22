---
title: 教材目录
description: 全部章节的学习契约、依赖关系、递进问题和写作顺序。
lang: zh-CN
content_status: draft
source_version: 2026-08-23
translations:
  en: null
review:
  polish:
    agent: pending
    date: null
    verdict: pending
    summary: 目录为导航元数据，随每批章节状态同步更新。
  implementation:
    agent: pending
    date: null
    verdict: pending
    summary: 最终发布前统一核对目录链接与章节状态。
---

# 教材目录

## 学习契约使用规则

每一章在重写或新增时必须填写四项契约：

1. **继承问题**：本章开头必须回答上一章留下的核心问题。
2. **解决矛盾**：说明本章要处理的真实工程冲突，而不是只介绍功能。
3. **建立不变量**：声明正常路径和失败路径都不能破坏的约束。
4. **遗留问题**：把本章无法完全解决的矛盾交给下一章，形成递进主线。

章节可以合并相邻标题，但不能省略这四项实质内容。每章还必须满足 `tutorial/writing-pipeline.md` 中的深度与递进门禁。

### 全书递进主线

```mermaid
flowchart LR
  A[C-01 边界与职责] --> B[C-02 Run 主循环]
  B --> C[C-03 状态所有权]
  C --> D[C-04 事件投影]
  D --> E[M-01 Context 组装]
  E --> F[M-02 压缩与截断]
  F --> G[M-03-M-05 工具协议与副作用]
  G --> H[M-06-M-07 审批与沙箱]
  H --> I[M-08-M-09 重试取消与幂等]
  I --> J[M-10-M-13 检查点持久化观测与记忆]
  J --> K[M-14-M-16 并发成本与注入防御]
  K --> L[第三章 框架源码深拆]
```

这条主线的目的不是限制查询路径，而是保证首次学习顺序中，每个新机制都能承接上一个机制暴露的状态、事件或控制权问题。

## 第一章：核心概念

| ID | 标题 | 文件路径 | 依赖 | 继承问题 | 解决矛盾 / 核心不变量 | 遗留问题 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | [Agent、Harness 与 Runtime 的边界](./01-core-concepts/agent-vs-harness.md) | `01-core-concepts/agent-vs-harness.md` | 无 | 为什么一个会调用模型的循环仍不能称为完整 Agent 系统？ | 决策能力与受控执行能力的边界；Harness 必须拥有可审计的控制面。 | 谁启动、暂停、恢复和终止一次 Run？ | 🟡 已按 v0.3 详实方法论补齐；Implementation Review 待批量终审 |
| C-02 | [一次 Agent Run 的完整生命周期](./01-core-concepts/agent-run-lifecycle.md) | `01-core-concepts/agent-run-lifecycle.md` | C-01 | 谁负责 Run 的状态迁移？ | 执行进度与外部副作用的可见性；每次状态变化都必须有明确所有者。 | 多次 Run 如何共享历史、文件和未完成副作用？ | 🟡 已按 v0.3 重写并通过 Polish / Implementation 自检；Implementation Review 待批量终审 |
| C-03 | [Session、Turn 与状态模型](./01-core-concepts/session-and-state.md) | `01-core-concepts/session-and-state.md` | C-02 | Run 结束后哪些事实可以安全复用？ | 区分权威日志、模型上下文投影和用户界面投影；权威事实只能有单一来源。 | 状态变化如何被外部观察者及时且有序地看到？ | 🟡 已按 v0.3 重写并通过 Polish / Implementation 自检；Implementation Review 待批量终审 |
| C-04 | [事件模型与流式输出](./01-core-concepts/events-and-streaming.md) | `01-core-concepts/events-and-streaming.md` | C-03 | 如何在不伪造完成状态的情况下展示进行中的工作？ | 顺序、终态和因果关联必须稳定；部分输出不得提前变成权威事实。 | 组装进模型上下文的内容应遵循什么分层与预算？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |

## 第二章：Harness 核心机制

| ID | 标题 | 文件路径 | 依赖 | 继承问题 | 解决矛盾 / 核心不变量 | 遗留问题 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M-01 | [Context 组装与分层](./02-harness-mechanics/context-assembly.md) | `02-harness-mechanics/context-assembly.md` | C-04 | 哪些事实应该进入下一次模型请求？ | 来源、优先级和引用关系可追踪；上下文是投影，不替代权威日志。 | 上下文超过预算时牺牲什么？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-02 | [Context 压缩与截断](./02-harness-mechanics/context-compression.md) | `02-harness-mechanics/context-compression.md` | M-01 | 如何减少 token 而不破坏任务前提？ | 关键约束、未决副作用和因果链不得被静默删除。 | 模型如何可靠地发现并调用外部能力？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-03 | [Tool Schema 与调用协议](./02-harness-mechanics/tool-schema.md) | `02-harness-mechanics/tool-schema.md` | M-02 | 能力如何被模型理解且不被误解？ | Schema 是契约：名称、参数、返回和错误语义必须一致。 | 通过校验的调用为什么仍可能造成危险副作用？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-04 | [Tool 执行与副作用](./02-harness-mechanics/tool-execution.md) | `02-harness-mechanics/tool-execution.md` | M-03 | 如何把模型意图转成受控动作？ | 执行前有授权，执行中有归属，执行后结果可审计。 | 大输出、畸形输出和失败输出如何回到模型？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-05 | [Tool 结果处理与截断](./02-harness-mechanics/tool-results.md) | `02-harness-mechanics/tool-results.md` | M-04 | 结果如何保留证据又不撑爆上下文？ | 截断必须显式、可定位且不改变成功或失败语义。 | 危险动作应在执行前还是执行中被拦截？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-06 | [审批模型](./02-harness-mechanics/approval.md) | `02-harness-mechanics/approval.md` | M-05 | 自动化效率和安全控制如何共存？ | 未批准的动作不得产生目标副作用；拒绝必须成为模型可见事实。 | 审批通过后，进程和网络仍然能越权怎么办？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-07 | [Sandbox 与权限](./02-harness-mechanics/sandbox.md) | `02-harness-mechanics/sandbox.md` | M-06 | 声明式权限如何变成运行时边界？ | 默认拒绝；能力只授予最小执行环境。 | 失败后重试会不会重复副作用？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-08 | [Retry 与幂等](./02-harness-mechanics/retry-idempotency.md) | `02-harness-mechanics/retry-idempotency.md` | M-07 | 什么时候重试是恢复，什么时候是二次伤害？ | 只有幂等或有副作用账本的操作才能自动重试。 | 正在等待的工具如何超时或取消？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-09 | [Timeout 与取消](./02-harness-mechanics/timeout-cancellation.md) | `02-harness-mechanics/timeout-cancellation.md` | M-08 | 取消信号能否阻止新的副作用？ | 取消必须传播到执行边界；已发生副作用必须进入对账状态。 | 中断后从哪里安全恢复？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-10 | [Checkpoint 与 Resume](./02-harness-mechanics/checkpoint-resume.md) | `02-harness-mechanics/checkpoint-resume.md` | M-09 | 哪些状态可以作为恢复起点？ | 只保存闭合事实；恢复前校验环境、租约和未决副作用。 | 日志落盘和进程崩溃之间存在什么窗口？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-11 | [Persistence](./02-harness-mechanics/persistence.md) | `02-harness-mechanics/persistence.md` | M-10 | 权威状态何时才算提交？ | 追加日志先于状态投影；schema 和环境指纹可迁移。 | 崩溃后如何解释、调试和重放历史？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-12 | [Observability 与 Replay](./02-harness-mechanics/observability.md) | `02-harness-mechanics/observability.md` | M-11 | 观测数据能否重建决策链？ | Trace 必须关联 prompt、工具、事件和版本；敏感数据需脱敏。 | 长期记忆和工作区由谁清理与授权？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-13 | [Memory 与工作区](./02-harness-mechanics/memory-workspace.md) | `02-harness-mechanics/memory-workspace.md` | M-12 | 哪些经验可以跨 Run 复用？ | 记忆有来源和有效期；工作区写入受权限和生命周期约束。 | 多个执行流如何共享工具而不互相破坏？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-14 | [Sub-agent 与并发](./02-harness-mechanics/subagent-concurrency.md) | `02-harness-mechanics/subagent-concurrency.md` | M-13 | 并行收益是否会放大失控风险？ | 子 Agent 权限不升级；并发写必须有隔离和汇合点。 | 并发如何影响 token、队列和延迟？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-15 | [成本与延迟](./02-harness-mechanics/cost-latency.md) | `02-harness-mechanics/cost-latency.md` | M-14 | 质量与预算冲突时降级什么？ | 成本预算是硬边界；降级不能隐藏失败原因。 | 工具输入如何在不可信内容面前保持可控？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| M-16 | [Prompt Injection 与工具安全](./02-harness-mechanics/prompt-injection.md) | `02-harness-mechanics/prompt-injection.md` | M-15 | 来自数据通道的指令为什么不可信？ | 数据与指令分离；高危动作必须经过策略和沙箱双重约束。 | 三家真实框架如何实现这些机制？ | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |

## 第三章：框架拆解

| ID | 框架 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| F-R1 | [Reasonix 架构总览](./03-frameworks/reasonix/overview.md) | `03-frameworks/reasonix/overview.md` | 第二章 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| F-R2 | [Reasonix Run 生命周期](./03-frameworks/reasonix/run-lifecycle.md) | `03-frameworks/reasonix/run-lifecycle.md` | F-R1 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| F-R3 | [Reasonix 工具与审批](./03-frameworks/reasonix/tools-approval.md) | `03-frameworks/reasonix/tools-approval.md` | F-R2 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| F-D1 | [DeepSeek Harness 架构总览](./03-frameworks/deepseek-harness/overview.md) | `03-frameworks/deepseek-harness/overview.md` | 第二章 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| F-D2 | [DeepSeek Harness Run 生命周期](./03-frameworks/deepseek-harness/run-lifecycle.md) | `03-frameworks/deepseek-harness/run-lifecycle.md` | F-D1 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| F-D3 | [DeepSeek Harness 工具与沙箱](./03-frameworks/deepseek-harness/tools-sandbox.md) | `03-frameworks/deepseek-harness/tools-sandbox.md` | F-D2 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| F-P1 | [Pi 架构总览](./03-frameworks/pi/overview.md) | `03-frameworks/pi/overview.md` | 第二章 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| F-P2 | [Pi Run 生命周期](./03-frameworks/pi/run-lifecycle.md) | `03-frameworks/pi/run-lifecycle.md` | F-P1 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| F-P3 | [Pi 工具与容器化](./03-frameworks/pi/tools-containerization.md) | `03-frameworks/pi/tools-containerization.md` | F-P2 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |

## 第四章：横向对比

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| X-01 | [架构风格对比](./04-comparisons/architecture.md) | `04-comparisons/architecture.md` | 第三章 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| X-02 | [Context 策略对比](./04-comparisons/context.md) | `04-comparisons/context.md` | 第三章 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| X-03 | [工具协议对比](./04-comparisons/tools.md) | `04-comparisons/tools.md` | 第三章 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| X-04 | [安全与审批对比](./04-comparisons/security.md) | `04-comparisons/security.md` | 第三章 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| X-05 | [持久化与恢复对比](./04-comparisons/persistence.md) | `04-comparisons/persistence.md` | 第三章 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| X-06 | [设计模式与反模式](./04-comparisons/patterns.md) | `04-comparisons/patterns.md` | X-01 至 X-05 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |

## 第五章：实验

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| L-01 | [最小 Agent Run 实验](./05-labs/minimal-run.md) | `05-labs/minimal-run.md` | C-02 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| L-02 | [Context 膨胀实验](./05-labs/context-bloat.md) | `05-labs/context-bloat.md` | M-02 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| L-03 | [Tool 重试副作用实验](./05-labs/retry-side-effects.md) | `05-labs/retry-side-effects.md` | M-08 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| L-04 | [审批拒绝恢复实验](./05-labs/approval-rejection.md) | `05-labs/approval-rejection.md` | M-06 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |

## 第六章：案例研究

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| CS-01 | [长任务中断恢复](./06-case-studies/long-task-recovery.md) | `06-case-studies/long-task-recovery.md` | M-10 | 🟡 Draft / Polish 已通过；Implementation Review 待批量审查 |
| CS-02 | 多 Agent 委派失败 | `06-case-studies/multi-agent-failure.md` | M-14 | ⬜ 未开始 |

## 第七章：面试题库

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| Q-01 | 概念与架构题 | `07-interview/concepts.md` | 第一、二章 | ⬜ 未开始 |
| Q-02 | 实现与调试题 | `07-interview/implementation.md` | 第二、三章 | ⬜ 未开始 |
| Q-03 | 安全与系统设计题 | `07-interview/security-design.md` | 第二、四章 | ⬜ 未开始 |

## 第八章：评测

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| E-01 | Harness 评测框架 | `08-evaluation/evaluation-framework.md` | 第四章 | ⬜ 未开始 |

## 第九章：术语表

| ID | 标题 | 文件路径 | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| G-01 | [术语表](./09-glossary/glossary.md) | `09-glossary/glossary.md` | 无 | 🟡 待终审 |

## 写作顺序

按依赖关系递进，推荐顺序：

```text
C-01 → C-02 → C-03 → C-04 → M-01 → ... → M-16
→ F-R1 → F-R2 → F-R3 → F-D1 → F-D2 → F-D3 → F-P1 → F-P2 → F-P3
→ X-01 → ... → X-06
→ L-01 → ... → L-04 → CS-01 → CS-02
→ Q-01 → Q-02 → Q-03 → E-01 → G-01
```
