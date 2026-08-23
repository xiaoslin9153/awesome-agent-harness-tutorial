---
date: 2026-08-23
topic: F-D2 DeepSeek Harness Run 生命周期 v0.3 重写
status: 已完成
---

# F-D2 DeepSeek Harness Run 生命周期 v0.3 重写

## 目标

按 Goal 运行手册重写 F-D2，把 ReactLoopAgent 的 phase 状态机、粘性终态、chunk 溯源与结构化错误绑定到固定快照锚点。

## 范围

- 范围内：F-D2 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：F-D3 工具调度细节、maintenance 任务具体实现、跨框架对比页。

## 旧稿审计

旧稿已有生命周期图与粘性 max-tokens 描述，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；pending_review 未关闭；未核对 send abort 重定向、wake latch 规则、turn-stopping serial、错误 UNKNOWN 合成。

## 源码证据

1. `packages/core/agent-loop/src/agent.ts:104-111`：setPhase 仅状态变化时发 agent/status。
2. `agent.ts:113-119`：send 在 splice 前捕获 wakingAfterAbort，防 reentrant cancel 改分类。
3. `agent.ts:172-181`：wakeDriver 非 idle 时 maintenance/aborted latch wakeRequested，disposed 不 latch。
4. `agent.ts:182-192,210-222`：新 AbortController 启动 running phase；withInitiator(kick)；收敛后按 latch 与 hasPending 再唤醒。
5. `agent.ts:245-301`：turn() 全骨架——turn/start、preStep reject→blocked、空初始输入→completed、step/start/end finally、max-tokens sticky 条件赋值、turn-stopping serial、catch aborted/other 结构化 turnEnds、finally turn/end。
6. `agent.ts:225-243`：preStep assemble/project/pre-step waterfall，reject 映射 blocked。
7. `agent.ts:332-341,477-512`：buildRequest 用 deriveMessages 并记录 header/context。
8. `agent.ts:343-368,372-389,392-408`：chunk append 收集 seqs；中断 message 带 interrupted 与 sourceEventSeqs；request-error waterfall 仅 retry 继续，否则 LlmError；正常完成 message 带 sourceEventSeqs。

## 决策

1. 核心不变量定为每回合必有 start/end、终态 sticky、chunk 先落盘、取消重定向、结构化错误、turn/end 必达。
2. 归纳四条状态机规则：边界分区、粘性 max-tokens、waking-after-abort 重定向、异常合成唯一 reason。
3. 用 state diagram 表达 Idle→Running→TurnStarted→PreStep→Step→TurnEnd 循环，用 flowchart 表达 send/wake 分支。
4. 新增反例覆盖空输入不开回合、max-tokens 被覆盖、step/end 缺失、chunk 不落盘、aborted 收 waking、默认 retry、错误吞事实、maintenance 强插 turn。
5. 完整因果链采用长评审任务中途 steer 加 max-tokens 终态：chunk 溯源、next-step 注入、粘性检查、turn-stopping 瀑布、审计可答三问。

## Polish

1. 统一 phase、sticky max-tokens、waking-after-abort、turn-stopping waterfall、structured error chain 术语。
2. 流水线工头类比只承担入门，随后给出 turn() 骨架伪代码与两条关键注释引用。
3. 设计取舍表补充迁移顺序建议：先边界后终态再 chunk 最后 inbox。
4. 把工具调度细节留给 F-D3。

## Implementation Review

1. 用脚本核对新稿全部 10 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/03-frameworks/deepseek-harness/run-lifecycle.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Inbox splice/disposed 事件负载细节留待 F-D3 或批量终审。
2. BlockAssembler 内部块合并规则未逐行展开。
3. request-error 监听器的典型 retry policy 实现待上游示例核对。

## 下一步

处理 F-D3《DeepSeek Harness 工具与沙箱》。

## 部署检查

- 提交：`82a41b4 docs: rewrite deepseek run lifecycle`。
- GitHub Actions：run `32614790482`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/03-frameworks/deepseek-harness/run-lifecycle/` 可访问，并包含标题、max-tokens、turn-stopping 和 sourceEventSeqs。
