---
date: 2026-08-23
topic: M-08 Retry 与幂等 v0.3 重写
status: 已完成
---

# M-08 Retry 与幂等 v0.3 重写

## 目标

按 Goal 运行手册重写 M-08，把“失败后是否自动重试”绑定到三家固定快照的 provider retry、request-error waterfall、auto retry 和尝试记录实现。

## 范围

- 范围内：M-08 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：checkpoint 崩溃恢复算法、超时取消细节、补偿产品设计和跨框架对比页。

## 旧稿审计

旧稿已有错误分类、幂等键和退避原则，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix frozen/rebuilt 二分、DeepSeek Harness request-error waterfall、Pi auto retry 状态机。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/run_loop.go:340-344,362-388,371-379,391-459,498-517`：frozen sampling request、1+5 attempts、stream interrupted exact replay、context limit 替换 frozen 并归零 attempt、missing reasoning protocol recovery、指数退避。
   - `internal/agent/agent.go:48-51`：maxStreamRecoveries=5，maxSamplingAttempts=6。
   - `internal/agent/sampling_request.go:59-80`：discard speculative sink、emit Retrying、cancel 返回 interrupted terminal、耗尽后 flush local-only。
   - `internal/agent/sampling_attempt.go:10-52`：RequestAttemptCount delta、billable aggregate。
2. DeepSeek Harness `b150a55`：
   - `packages/core/agent-loop/src/agent.ts:372-389`：finish error/aborted 进入 agent/request-error waterfall；只有 kind==='retry' 才 continue，否则抛 LlmError。
   - `agent.ts:339-370`：chunk seq 收集、干净终态才 append assistant/message 并携带 sourceEventSeqs。
3. Pi `c49906e`：
   - `packages/coding-agent/src/core/settings-manager.ts:878-905`：retry 默认 maxRetries=3/baseDelayMs=2000，provider timeout/maxRetries/maxRetryDelayMs。
   - `agent-session.ts:2811-2860,2835-2839`：attempt 递增与上限回退、指数 delay、auto_retry_start/end、abortable sleep、Retry cancelled、live state 移除但 session 保留。
   - `agent-session.ts:2782-2804`：summarization retry callbacks 与 scheduled/start/finished 事件。

## 决策

1. 核心不变量定为分类先行、重放稳定、预算多维、尝试可审计、幂等键稳定、未知不对账成成功。
2. 区分 transport/provider retry、protocol retry、tool retry、business retry 和 workflow retry。
3. 用 flowchart 表达失败分类分支，用 sequence diagram 表达 attempt ledger、查询对账和补偿。
4. 新增反例覆盖 403 无限退避、随机幂等键、重放前改 history、timeout 当确定失败、覆盖错误历史、补偿风暴、业务方案冒充 retry、崩溃丢 pending。
5. 完整因果链采用发布 API timeout：state unknown → 同 key 查询 → in progress → completed，证明查询优于重复 POST。

## Polish

1. 统一 transient/deterministic/partial/state-unknown/infra-unavailable、idempotency key、attempt ledger、reconciliation 术语。
2. 快递类比只承担入门，随后给出 safety class、键组成、错误信号表和账本字段。
3. 设计取舍表补充 precheck+saga/manual gate 的适用条件。
4. 把 timeout/cancel 留给 M-09，把 checkpoint pending 对账留给 M-10。

## Implementation Review

1. 用脚本核对新稿全部 9 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/retry-idempotency.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. DeepSeek Harness 具体 RetryPolicy 插件实现未展开。
2. Reasonix context limit recovery 的压缩质量留待 M-02/M-10 关联审阅。
3. Pi summarization retry 的上限配置细节留待 M-02 或实验。
4. 外部 API 幂等合同设计需要独立评测样例。

## 下一步

处理 M-09《Timeout 与取消》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
