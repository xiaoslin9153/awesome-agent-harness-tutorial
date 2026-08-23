---
date: 2026-08-23
topic: M-12 Observability 与 Replay v0.3 重写
status: 已完成
---

# M-12 Observability 与 Replay v0.3 重写

## 目标

按 Goal 运行手册重写 M-12，把“观测数据能否重建决策链”落到三家固定快照的 durable receipt、sourceEventSeqs、typed telemetry schema 和 secret-free 原则。

## 范围

- 范围内：M-12 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：memory/workspace 生命周期（M-13）、APM 选型、评测指标体系和跨框架对比页。

## 旧稿审计

旧稿已有 metrics/logs/traces/replay 表，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix ContextMaintenanceReceipt、DeepSeek Harness sourceEventSeqs、Pi telemetry schema。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/projection.go:80-104`：ContextMaintenanceReceipt durable/provider-neutral；transcript content intentionally not included；hashes/counters 覆盖 status/action/trigger/version/tokens/cache break/reason。
   - `projection.go:116-130`：CompactionState 持久化 last trigger/mode/cost/generation/blockedInputHash。
   - `internal/agent/context_receipt.go:54-64`：emitContextMaintenance 发送关键子集到 Sink。
2. DeepSeek Harness `b150a55`：
   - `packages/core/session/src/types.ts:408-436`：SessionEvent 的 seq/time/data/ignorable/sourceEventSeqs。
   - `types.ts:372-392`：surface replacement 必须引用 shadowed surface nodes。
3. Pi `c49906e`：
   - `packages/agent/src/harness/telemetry.ts:42-118`：AI_TELEMETRY_SCHEMA pi.ai.request 的 operation/provider/model/streaming、usage/cost/TTFT/error.type。
   - `telemetry.ts:193-230,235-256`：operationStartAttributes required session/lane/operation id/recovery；低基数 error code/type；run outcome 枚举。
   - `packages/agent/docs/harness.md:2477`：events 可含敏感内容，serving layers 负责 authorization/redaction；Telemetry alone is content- and secret-free by default。

## 决策

1. 核心不变量定为 ID 因果完整、错误全量、telemetry 无秘密、低基数分类、replay 隔离、版本可追溯。
2. 区分 metrics/logs/traces/replay 四类信号及各自必含字段。
3. 用 flowchart 表达 canonical events 到诊断与 replay，用 sequence diagram 表达 fixture + recorded side effects。
4. 新增反例覆盖只有截图、日志无 ID、高 cardinality label、采样丢错、telemetry 泄密、真实副作用 replay、成功样本偏斜和版本缺失伪回退。
5. 完整因果链采用“测试通过但代码没改”：trace 定位 bash、mutation receipt 缺失、cwd stale 假设、fixture 复现与修复回归。

## Polish

1. 统一 telemetry schema、durable receipt、event trace、replay fixture、redaction boundary 术语。
2. 快递类比只承担入门，随后给出 trace 树、receipt 字段和 redaction 分层表。
3. 设计取舍表补充 head/tail sampling 与 recorded replay 的适用条件。
4. 把 memory 清理授权留给 M-13。

## Implementation Review

1. 用脚本核对新稿全部 6 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/observability.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix evidence/readiness audit 的完整 schema 未逐字段展开。
2. DeepSeek Harness 与外部 APM exporter 的集成未在本快照核对。
3. Pi harness telemetry 的具体 exporter 配置留待部署专题。
4. replay fixture 的存储格式需要评测阶段定义。

## 下一步

处理 M-13《Memory 与工作区》。

## 部署检查

- 提交：`53934da docs: rewrite observability replay`。
- 构建首次因 Front Matter 缺少闭合分隔线失败；修复后 `check:links` 与 build 通过，未触发连续两次失败停止条件。
- GitHub Actions：run `32610176172`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/02-harness-mechanics/observability/` 可访问，并包含标题、ContextMaintenanceReceipt、sourceEventSeqs 和 secret-free。
