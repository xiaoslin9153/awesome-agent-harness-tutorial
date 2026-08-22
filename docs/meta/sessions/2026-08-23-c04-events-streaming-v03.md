---
date: 2026-08-23
topic: C-04 事件模型与流式输出 v0.3 重写
status: 已完成
---

# C-04 事件模型与流式输出 v0.3 重写

## 目标

按 Goal 运行手册和 v0.3 九层展开法重写《事件模型与流式输出》，补齐学习契约、双阶段自检、故障模式、完整因果链、设计取舍和三家固定快照证据。

## 范围

- 范围内：C-04 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：Reasonix Run lifecycle 样本重写、M-01 及后续章节、批量终审、站点改造。

## 旧稿审计

旧稿已有传输层与语义层区分，但只有 5 个标题、无 learning_contract、无核心不变量、无完整因果链；框架对照停留在目录级“待核对”；缺少取消三分支、持久提交边界、重放限制和并行工具归属机制。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/event/event.go:21-61` 定义 Reasoning/Text delta、完整 Message、ToolDispatch/ToolResult 和 TurnDone 终态。
   - `internal/event/sync.go:10-35` 用 mutex 串行化并发 Emit，维持 Sink 的 serial invariant。
   - `internal/agent/run_loop.go:71-96` 在 missing reasoning recovery 中缓冲推测事件，直到可重放再 flush。
   - `internal/agent/session_events.go:25-48,92-103,711-783` 定义 append/replace 记录字段、安全预算、O_APPEND 写入、replace fsync 和 digest/writer 元数据。
2. DeepSeek Harness `b150a55`：
   - `packages/core/session/src/types.ts:230-436` 把 append-only SessionEventMap 作为来源，turn/step/chunk/message/tool 事件带边界，SessionEvent 支持连续 seq、ignorable 和 sourceEventSeqs。
   - `packages/core/session/src/known-event-types.ts:19-68` 列出已知事件词汇并说明未知必需事件会阻止重建。
   - `packages/core/agent-loop/src/agent.ts:339-409` 收集 chunk seq、组装 assistant message，并在中断或正常完成时写入 sourceEventSeqs。
   - `packages/core/agent-loop/src/tool-calls.ts:145-159,237-288` 按模型顺序槽位 commit 结果，为取消调用补 skipped result，并把 result 引用到 callSeq。
3. Pi `c49906e`：
   - `packages/agent/src/types.ts:420-443` 定义 message 与 tool execution 生命周期。
   - `packages/coding-agent/src/core/agent-session.ts:398-400,650-668,2510-2515` 常驻订阅 Agent 事件，在 message_end 后追加 SessionManager entry，扩展 appendEntry 也先写入再通知。
   - `packages/coding-agent/src/core/session-manager.ts:1020-1067` 批量首刷后逐行 JSONL append，entry 维护 id/parentId 并推进 leaf。
   - `packages/agent/docs/harness.md:2272-2329,2442-2450` 规定 watch 快照 + 缓冲、message_end 只是过程终点、entry_added 是 durable 可查询证明。

## 决策

1. 核心不变量定为可排序、可归属、有生命周期、草稿与事实分层、副作用不可伪装。
2. 明确 Provider stream、Agent semantic event、Durable record/event 三层；用 `entry_added` 类 durable 事件表达最强提交语义。
3. 新增 6 个故障模式，覆盖 delta 入库、只记成功、乱序提交、传输误判、崩溃截断和监听器反向改状态。
4. 完整因果链采用三工具并发批次被取消：未派发调用获得 skipped 结果、执行中等待退出并保留部分输出、已产生副作用的调用保留错误事实。
5. 三家对照不互相混同：Reasonix 区分 UI Sink 与 Session 日志；DeepSeek Harness 强调 chunk 因果链和模型顺序工具提交；Pi 区分 coding-agent 的 message_end 持久化和 harness 层的 entry_added。

## 变更文件

- 重写 `tutorial/zh-CN/01-core-concepts/events-and-streaming.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## Polish

1. 统一“传输流 / 过程事件 / 持久记录 / 界面投影”术语，避免把 SSE 状态当作任务状态。
2. 每个关键抽象按直觉、精确机制、失效边界展开；初学者主线保留会议记录类比，但不替代机制定义。
3. 用 flowchart 表达投影与恢复来源，用 state diagram 表达 Draft 到 Committed/Failed/Cancelled/Replayed。
4. 设计取舍表补充适用条件和三步迁移路径。

## Implementation Review

1. 核对文中 18 个区间锚点均在固定快照工作树内存在且符号匹配；另用脚本验证起止行不超过文件总行数。
2. 核对至少 5 个带因果解释的故障模式、1 条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. 核对 Front Matter learning_contract 与 TOC 契约一致；Polish 和 Implementation Review 均由主 Agent 完成。
4. 未把 Reasonix UI Sink 冒充持久事件；未把 Pi 文档声明直接冒充所有部署行为，并绑定其仓库文档锚点。

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 提交推送后执行 GitHub Actions 与线上页面检查，结果见下文部署检查。

## 开放问题

1. DeepSeek Harness SurfaceOp 的 replace 语义留待 M-02 Context 压缩深拆。
2. Reasonix event log 与 checkpoint 的完整优先级关系留待 M-10 / M-11。
3. Pi harness 的 deferred/resume 事件顺序留到 M-10 checkpoint/resume 或 Pi Run lifecycle 展开。

## 下一步

1. 推送本章节后检查 GitHub Actions 和线上页面。
2. 按 Goal 运行手册进入 Reasonix Run lifecycle 样本重写。

## 部署检查

- 提交：`96dbc53 docs: rewrite events and streaming`。
- GitHub Actions：run `32594350412`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/01-core-concepts/events-and-streaming/` 可访问，并包含“事件模型与流式输出”、`Provider stream` 和 `entry_added`。
