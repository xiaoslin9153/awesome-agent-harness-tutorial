---
date: 2026-08-23
topic: M-11 Persistence v0.3 重写
status: 已完成
---

# M-11 Persistence v0.3 重写

## 目标

按 Goal 运行手册重写 M-11，把“权威状态何时提交”落到三家固定快照的 canonical log、format version、ignorable marker 和 entry tree/migration 实现。

## 范围

- 范围内：M-11 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：observability trace/replay（M-12）、数据库选型评测、加密存储和跨框架对比页。

## 旧稿审计

旧稿已有数据分层和迁移原则，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix 四重重放预算、DeepSeek Harness writer-centric bump rule、Pi v1→v3 migration。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/session_events.go:21-48`：schema v1、replace/append、bytes/records/messages/collectionItems 预算、compact floor/factor、ErrSessionReplayLimitExceeded 不回退旧 checkpoint。
   - `session_events.go:711-755`：O_APPEND 写入、chmod 0600、replace fsync。
   - `session_events.go:92-103`：record 字段 revision/baseRevision/messageIndex/digest/writerID。
2. DeepSeek Harness `b150a55`：
   - `packages/core/session/src/types.ts:33-56`：SESSION_FORMAT_VERSION pinned 0；writer 语义决定 bump；“parses without error”不是正确性。
   - `types.ts:230-235`：SessionEventMap append-only source of truth，seq 连续含 raw chunks。
   - `types.ts:408-436`：SessionEvent seq/time/data/ignorable/sourceEventSeqs。
3. Pi `c49906e`：
   - `packages/coding-agent/src/core/session-manager.ts:30,230-291`：CURRENT_SESSION_VERSION=3；v1→v2 id/parentId 树与 compaction index→id；v2→v3 hookMessage→custom。
   - `session-manager.ts:514-543`：StringDecoder 流式读取、完整 newline 解析。
   - `session-manager.ts:1296-1345`：entries append-only、orphan as root、branch 改 leaf。

## 决策

1. 核心不变量定为权威先提交、可解释历史、未知必需即拒绝、版本单调、投影可重建、副作用登记。
2. 区分 informational event、语义新事件、header/envelope/surface 变化三种演进路径。
3. 用 flowchart 表达 canonical log→projections/cache，用 state flow 表达 torn tail/unknown required 的读取分支。
4. 新增反例覆盖只存答案、UI 当权威、无版本、未知事件跳过、半行 JSON、双写、迁移覆盖原文件和外部副作用无登记。
5. 完整因果链采用 v1→v3 copy-on-read 迁移：树化、index 转 id、role 改名、失败可重试、orphan 可见。

## Polish

1. 统一 canonical log、projection、cache、external effect registry、required/ignorable、format bump 术语。
2. 餐厅小票类比只承担入门，随后给出信封字段、投影声明和并发选项。
3. 设计取舍表补充 JSONL/SQLite/object storage/copy-on-read 适用条件。
4. 把 trace/replay 与脱敏留给 M-12。

## Implementation Review

1. 用脚本核对新稿全部 9 个锚点区间均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/persistence.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix meta sidecar 与 event log 的完整一致性协议已在 M-10 展开，本章只引用预算与写入。
2. DeepSeek Harness persistence backend 具体实现未展开。
3. Pi branch/fork 的 UI 语义留待 Pi 特色章节。
4. 加密归档和合规保留期需产品决策。

## 下一步

处理 M-12《Observability 与 Replay》。

## 部署检查

- 提交：`a0ac955 docs: rewrite persistence`。
- 构建首次因 Front Matter 缺少闭合分隔线失败；修复后 `check:links` 与 build 通过，未触发连续两次失败停止条件。
- GitHub Actions：run `32609801820`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/02-harness-mechanics/persistence/` 可访问，并包含标题、SESSION_FORMAT_VERSION、ignorable 和 CURRENT_SESSION_VERSION。
