---
date: 2026-08-23
topic: M-02 Context 压缩与截断 v0.3 重写
status: 已完成
---

# M-02 Context 压缩与截断 v0.3 重写

## 目标

按 Goal 运行手册重写 M-02，把“减少 token 但不破坏任务前提”落到三家固定快照的 prune、summary、surface replacement、cut point 和 truncation 实现。

## 范围

- 范围内：M-02 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：工具 Schema 设计、审批沙箱、checkpoint 崩溃修复算法和跨框架对比页。

## 旧稿审计

旧稿已有策略分层和常见坑，但缺少 learning_contract、核心不变量失效边界、7 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有区分 durable projection receipt、append-only surface replacement 和 entry-tree cut point 三种机制。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/prune.go:16-39,67-110,124-146`：8192 rune 阈值、4096 head/1024 tail/marker；durable prune projection 的 version/generation/receipt/hash/cache break；提交前 stale check 与持久化失败回滚。
   - `compact_projection.go:403-405,412-450,489-520`：canonical 不重写、Noop 语义、fold region 规划、CompactionStarted/hook、mustFree 空间检查、prefix + digest + kept + live tail splice、accept candidate 与 CompactionDone。
   - `compact_fold_input.go:32-45`：单次 summary、无私有二次转换、输入预算扣除 output reserve。
2. DeepSeek Harness `b150a55`：
   - `packages/core/session/src/surface.ts:1-8,40-68,210-243,286-318,320-379`：append-only source、append-origin vs replacement、sourceEventSeqs 证明、tool/result 只能改 content、连续 seq 与 replaceGeneration。
   - `packages/compaction/compaction-basic/src/region.ts:98-134,152-254,386-424,447-477`：retainTokens 反向选择、tool pairing balance、start lock、stability check、summary/replacement/end transaction、失败 end。
   - `packages/compaction/compaction-tool-result-pruner/src/index.ts:43-121,124-184`：code point 测量、head/middle/tail、shadow-price event、content-only replacement。
3. Pi `c49906e`：
   - `compaction.ts:126-138,198-238`：reserve/recent 默认值、usage-backed estimate、shouldCompact。
   - `compaction.ts:308-363,387-461,467-537,642-680,659-662,740-764,821,975`：cut point 禁止 toolResult 切割、结构化 checkpoint/update prompt、0.8 reserve max tokens、增量 boundary 和 split-turn prompt。
   - `agent-session.ts:2122-2150,2166-2180`：threshold/overflow 分支、error/all-zero usage 回退估算和 stale usage guard。
   - `tools/truncate.ts:40-160`：默认行/字节上限、head/tail 截断、total/output/truncatedBy 元数据。

## 决策

1. 核心不变量定为权威不可改写、调用结果成对、摘要不是新真相、失败显式、预算分级。
2. 把压缩分为进入 Session 前的工具截断和历史中的投影折叠，避免混淆原始输出与可回放投影。
3. 用 flowchart 表达 threshold/prune/summary/overflow 分级，用 state diagram 表达 pressure 失败不必然致命。
4. 新增反例覆盖长度删除、拆散 pair、摘要美化、stale summary、截断标记误读、manual no-op 和 recovery 循环。
5. 完整因果链采用第 119 轮触发的 prune + summary + commit + 审计回放。

## Polish

1. 统一 canonical log、projection、receipt、shadowed range、cut point、structured checkpoint 和 overflow recovery 术语。
2. 会议纪要类比只承担入门，随后给出优先级、事务形状和 cache/version 机制。
3. 设计取舍表补充成立条件与四步迁移路径。
4. 明确把 checkpoint crash repair 留给 M-10/M-11，把工具协议留给 M-03。

## Implementation Review

1. 用脚本核对全部外部完整锚点和相对 shorthand 锚点起止行均在文件范围内；发现两处 shorthand 被解析到错误文件后已改为完整路径。
2. 核对至少 7 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/context-compression.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix compaction state 持久化和崩溃恢复细节留待 M-10/M-11。
2. DeepSeek Harness token meter 的具体估价模型未在本章展开。
3. Pi branch navigation summary 与普通 threshold compaction 的差异留待框架特色或 M-10。
4. summary 质量评测需要专门实验，本章不做结论。

## 下一步

处理 M-03《Tool Schema 与调用协议》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
