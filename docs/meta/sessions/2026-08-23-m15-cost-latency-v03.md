---
date: 2026-08-23
topic: M-15 Cost 与延迟 v0.3 重写
status: 已完成
---

# M-15 Cost 与延迟 v0.3 重写

## 目标

按 Goal 运行手册重写 M-15，把“质量与预算冲突时降级什么”落到 Reasonix 多轴预算、DeepSeek Harness usage ledger 和 Pi telemetry/cost breakdown。

## 范围

- 范围内：M-15 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：Prompt Injection（M-16）、计费产品化、APM 选型和跨框架对比页。

## 旧稿审计

旧稿已有预算分层和缓存策略，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix TaskBudget/unpriced guard/双账本、DeepSeek Harness append-only UsageRow、Pi cost breakdown。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/run_budget.go:13-37`：TaskBudget cost/wall/tokens 三轴与负值 normalize。
   - `run_budget.go:39-59,104-123`：rounds 是 poor proxy；observe 保证未到 usage 也计数；exceeded 按 token→cost→wall 且 unpriced 不判 cost。
   - `run_budget.go:91-102,125-168`：totals counts and money never content；taskBudgetLimit host override；ResetTaskBudget 保留 evidence/Goal totals；observeRunBudget turn+task 双账本并 RecordRunBudgetSample。
   - `run_usage.go:269-286`：emitTurnUsage 保护 lastUsage 单请求形状，携带 CacheDiagnostics 并返回 CostQuote。
2. DeepSeek Harness `b150a55`：
   - `external/pi/packages/agent/docs/harness.md:452-458,280-288,2440`：append-only UsageRow 覆盖成功/失败/重试/合成尝试；settlement 同事务；row.seq 防回退。
3. Pi `c49906e`：
   - `packages/agent/src/harness/telemetry.ts:93-113`：usage 各类 token、cost、chunk_count、TTFT、error.type schema。
   - `packages/coding-agent/src/core/usage-totals.ts:22-69`：UsageTotals 累加与 getUsageCostBreakdown 按 model/Tools summaries 分桶。

## 决策

1. 核心不变量定为多轴预算、归因到 ID、未计费保护、ledger 只追加、硬边界收口、降级显式。
2. 区分单请求形状与 billable aggregate，防止 compaction 决策被重试污染。
3. 用 flowchart 表达预算分配与 exceeded 分支，用 flowchart 表达 pricing → 双账本 → RunBudgetSample。
4. 新增反例覆盖只限轮数、未计费当免费、aggregate 覆盖 latest、缓存忽略租户、静默换小模型、TTFT 当全部延迟、预算不分层和硬限制静默截断。
5. 完整因果链采用无人值守任务 cost 触顶：RunBudgetSample → armFinalizationRound → gracePause → ResetTaskBudget。

## Polish

1. 统一 TaskBudget、turn/task ledger、unpriced guard、RunBudgetSample、grace pause、downgrade_reason 术语。
2. 装修合同类比只承担入门，随后给出延迟解剖和缓存键要求。
3. 设计取舍表补充 cache everything 的风险。
4. 明确 DeepSeek Harness 的 UsageRow 文档锚点位于 pi 包 harness.md，属 Pi 仓库内文档，避免框架归属歧义。

## Implementation Review

1. 用脚本核对新稿全部 11 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/cost-latency.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix CostQuote 多币种换算细节留待计费专题。
2. DeepSeek Harness storage 实现的 seq 分配算法未逐行展开。
3. Pi breakdown 的 Tools/summaries 归桶是否需要细分待评测反馈。
4. 降级阶梯的量化阈值需实验标定。

## 下一步

处理 M-16《Prompt Injection 防护》。

## 部署检查

- 提交：`05959d2 docs: rewrite cost latency`。
- GitHub Actions：run `32611815327`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/02-harness-mechanics/cost-latency/` 可访问，并包含标题、TaskBudget、RunBudgetSample 和 UsageRow。
