---
date: 2026-08-23
topic: C-02 按 v0.3 详实方法论重写
status: 已完成
---

# C-02 按 v0.3 详实方法论重写

## 目标

用九层展开法和深入浅出三层法重写《一次 Agent Run 的完整生命周期》，让初学者理解 Run 为什么必须是有状态边界的受控循环，让工程师能看到三家真实实现的调用链、事件边界、取消语义和失败恢复取舍。

## 范围

- 范围内：C-02 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：Session 状态模型的正式重写（C-03）、Checkpoint / Persistence 深拆、批量 Implementation Review。

## Draft 与源码证据

先读取旧章节，再核对固定快照：

1. Reasonix `aa82b2f`：`Agent.Run` 入口与 run 租约在 `internal/agent/agent.go:1239`；`beginRunTurn` 在 `run_loop.go:125` 区分 per-turn `turnRuntime` 与跨 turn `taskRuntime`；`runToolLoop` 在 `:245` 消费 steering 并取工具 Schema；`:340` 的 sampling recovery 只在干净终端提交；`:643-667` 显示取消时仍保存成对工具结果后才返回错误。
2. DeepSeek Harness `b150a55`：`send()` 处理 abort 后的 next-turn 投递（`agent.ts:113`）；`kick()` / `turn()` / `step()` 构成驱动循环（`:210`、`:246`、`:332`）；`assistant/message` 连同 usage 和 chunk 序列落日志（`:400`）；无 tool call 返回 completed，有 tool call 则执行后决定继续（`:414`）；`TurnEndReasonMap` 定义 completed / aborted / blocked / error / max-tokens / interrupted（`session/types.ts:155-173`）。
3. Pi `c49906e`：`prompt()` 在活动期间抛错并建议 steer / followUp（`agent.ts:350`）；`abort()` 触发当前 AbortController（`:318`）；`runWithLifecycle()` 管理 activeRun 并在 finally 清理（`:486-508`）；失败也构造 failure message 并发出四类标准事件（`:511-526`）；Coding 层在 `message_end` 把 user、assistant、toolResult 和 custom 消息交给 Session Manager（`coding-agent/src/core/agent-session.ts:651-669`）。

## 决策

1. 用 `learning_contract` 显式承接 C-01 遗留问题「谁启动、暂停、恢复和终止一次 Run？」。
2. 核心不变量定为：部分输出不得提前成为权威事实；取消后已发生副作用仍可追溯。
3. 用 state diagram 表达 Prepared、Requesting、Streaming、ToolRound、Finalizing 和多种终态，并强调每次迁移要回答谁触发、哪些字段有效、哪些事实落盘。
4. 反例从 5 个旧坑扩展为 5 个带因果链的故障模式：流式投影当状态源、执行截断参数、取消当撤销、无差别重启、turn 计数当业务进度。
5. 三家实现不只列主链路，还解释采样恢复、崩溃孤儿 turn、failure message 事件链等精妙设计和代价。
6. 恢复协议只确立原则，把检查点格式、租约和环境指纹显式留给 M-10 / M-11，避免越权断言。

## 变更文件

- 重写 `tutorial/zh-CN/01-core-concepts/agent-run-lifecycle.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. 逐一核对 18 个关键源码行锚点存在且符号匹配。
2. `cd site && npm run check:links`：45 个 Markdown 文件通过。
3. `cd site && npm run build`：44 页构建成功。
4. `git diff --check` 通过。

## 自检

- 章节包含 5 个反例、一条完整因果链、state diagram 和工具控制流程图。
- 理想模型与三家实现分离；未把 Reasonix 的 turnRuntime 直接写成通用定义。
- 所有框架行为绑定 commit 和路径；未验证的持久化协议标记为后续章节主题。
- 未修改 C-03 正文或实验代码。

## 开放问题

1. DeepSeek Harness 的 `interrupted` 由持久化后端补写，具体判定条件留待 P3 深拆核对。
2. Reasonix steering 的缓存代价注释值得在 Context 组装章节进一步展开。
3. Pi failure message 进入 Session 后如何参与压缩，需要 C-04 或 C-05 时确认。

## 下一步

1. 提交、推送并检查部署。
2. 维护者确认 C-02 后，开始 C-03 Session、Turn 与状态模型。
