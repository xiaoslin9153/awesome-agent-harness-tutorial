---
date: 2026-08-23
topic: M-09 Timeout 与取消 v0.3 重写
status: 已完成
---

# M-09 Timeout 与取消 v0.3 重写

## 目标

按 Goal 运行手册重写 M-09，把“取消信号能否阻止新的副作用”绑定到三家固定快照的 controller cancel、bodyInvoked 状态机、进程树终止和 retry sleep 取消实现。

## 范围

- 范围内：M-09 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：checkpoint 格式、崩溃恢复算法、远端 job reaper 产品设计和跨框架对比页。

## 旧稿审计

旧稿已有分层时限、取消传播和清理原则，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix CancelRequested/local-only 保护、DeepSeek Harness bodyInvoked/quiescence、Pi killProcessTree/abortRetry。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/control/controller.go:2052-2069`：Cancel 设置 canceling、approval.clearAll、cancel context；无活动 turn 时停止 Goal。
   - `controller.go:2090-2119`：CancelRequested/RuntimeStatus 暴露取消状态和 Cancellable。
   - `internal/control/turn_orchestrator.go:291-324`：explicit cancel 与 provider interrupted 分支；保留 real prompt 和 fully paired tool work，partial display 转 local-only。
   - `internal/agent/execute_batch.go:154-166,250-340,631-668`：markCancelled 填充剩余结果、各阶段 ctx.Err 检查、写完全批结果后才返回。
2. DeepSeek Harness `b150a55`：
   - `packages/core/tools/src/index.ts:1510-1525`：callerSignal/bodyInvoked 状态，cancellationResult 区分 aborted 与 aborted-before-dispatch。
   - `index.ts:1527-1545`：fuse caller/wrapper signal；started promise reaches quiescence before ABORTED。
   - `index.ts:1590-1616,1932-1944`：dispatch/post 后成功结果也转 cancellation result；canonical AbortError/code。
3. Pi `c49906e`：
   - `packages/coding-agent/src/core/tools/bash.ts:115-151`：timeoutHandle/onAbort 都调用 killProcessTree；waitForChildProcess 后区分 aborted/timedOut；finally 清理 tracker/listener/timer。
   - `agent-session.ts:1558-1565`：abort 先 abortRetry 再 agent.abort 再 waitForIdle。
   - `agent-session.ts:2863-2868`：abortRetry abort 当前 retry sleep。

## 决策

1. 核心不变量定为信号可达边界、原因不合并、分界清晰、副作用不消失、清理有限且可观察。
2. 明确 before-dispatch/body-running/after-completion 三种取消时刻及其结果形态。
3. 用 flowchart 表达分层 deadline 到 paired result，用 state diagram 表达 PartialKnown/UnknownRemote 终态。
4. 新增反例覆盖取消只改 UI、立即 SIGKILL、丢弃已启动 promise、timeout 当业务错误、清空中断输出、pending approval 泄漏、detached descendant 挂起和 lease 未续期。
5. 完整因果链采用 bash 测试 80% 时 Stop：kill tree、保留 tail、未派发 read 配对、Controller 保留 prompt 并准备 recovery。

## Polish

1. 统一 timeout/cancelled/shutting_down/state unknown、quiescence、aborted-before-dispatch、local-only display 术语。
2. 微波炉类比只承担入门，随后给出层级表、清理责任表和三种时刻状态机。
3. 设计取舍表补充 await quiescence 与 TERM→grace→KILL 的适用条件。
4. 把 checkpoint pending 对账留给 M-10，把 lease 心跳细节留给 M-10/M-15。

## Implementation Review

1. 用脚本核对新稿全部 6 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/timeout-cancellation.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix interrupted recovery summary 的具体折叠格式留待 M-10/M-11。
2. DeepSeek Harness fuseToolSignals 的 dispose 语义未逐行展开。
3. Pi Windows 进程树终止实现留待跨平台实验。
4. 远端 lease TTL/reaper 需要独立部署样例。

## 下一步

处理 M-10《Checkpoint 与 Resume》。

## 部署检查

- 提交：`447f9f2 docs: rewrite timeout cancellation`。
- 构建首次因 Front Matter 缺少闭合分隔线失败；修复后 `check:links` 与 build 通过，未触发连续两次失败停止条件。
- GitHub Actions：run `32608972308`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/02-harness-mechanics/timeout-cancellation/` 可访问，并包含标题、aborted-before-dispatch、quiescence 和 killProcessTree。
