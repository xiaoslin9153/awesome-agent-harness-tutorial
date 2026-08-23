---
date: 2026-08-23
topic: M-13 Memory 与工作区 v0.3 重写
status: 已完成
---

# M-13 Memory 与工作区 v0.3 重写

## 目标

按 Goal 运行手册重写 M-13，把“哪些经验可跨 Run 复用”落到 Reasonix 结构化 memory store、workspace mutation 事件，以及 Pi 会话树 custom/compaction entry。

## 范围

- 范围内：M-13 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：Subagent 并发编排（M-14）、向量检索选型、记忆产品 UX 和跨框架对比页。

## 旧稿审计

旧稿已有写入门槛和冲突遗忘原则，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix subject_key/CAS/revisions、forget queue disregard、WorkspaceMutation，以及 Pi custom entry。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/memory/store.go:97-125`：ArchivedMemory traceability；StoreFor project/global 目录；userDir 空时 disabled no-op；global fallback to Dir。
   - `internal/memory/remember.go:41-78`：description 策略与 schema 字段 type/scope/activation/volatility/subject_key/expires_at/verified/keywords/expected_revision。
   - `internal/memory/forget.go:45-69`：Read→Archive→QueueMemory disregard；返回 archived from 路径。
   - `internal/memory/store_v2.go:553-580`：revision snapshot 到 .revisions；atomic temp+fsync+replace。
   - `internal/event/workspace_mutation.go:5-34`：host-only invalidation；paths/content/tree/git meta；failed writer 也发事件；sink opt-in。
2. DeepSeek Harness `b150a55`：
   - `packages/core/session/src/types.ts:230-235`：append-only SessionEventMap 是 source of truth；本章核心快照未见独立 long-term memory 子系统。
3. Pi `c49906e`：
   - `packages/coding-agent/src/core/session-manager.ts:1096-1119`：CompactionEntry 含 firstKeptEntryId/tokensBefore/usage/fromHook。
   - `session-manager.ts:1121-1133`：appendCustomEntry 生成 customType/data/id/parentId/timestamp 并推进 leaf。

## 决策

1. 核心不变量定为来源可溯、范围显式、修订不覆盖历史、激活有预算、遗忘可审计、工作区写入有登记。
2. 把 memory 分为 durable fact、derived retrieval、workspace state 三层，检索只是投影。
3. 用 flowchart 表达确认→store→assembly，用 state diagram 表达 Proposed/Active/Conflicted/HumanGate/Archived。
4. 新增反例覆盖一次失败永久规则、global 滥用、pinned 挤爆、并发覆盖、forget 本轮失效、检索冒充来源、无基线审查和 temp 永生。
5. 完整因果链采用 pnpm→npm 迁移：查询 holder、CAS revision、快照旧版、旧会话冲突报错、后续 forget/archive。

## Polish

1. 统一 durable fact、subject key、revision、activation/volatility、archive/disregard、mutation event 术语。
2. 笔记本类比只承担入门，随后给出字段表、唯一性约束和原子发布协议。
3. 设计取舍表补充 instructions file、pinned、custom entries 的边界。
4. 明确 DeepSeek Harness 核心快照未含通用 memory 子系统，避免夸大框架能力。

## Implementation Review

1. 用脚本核对新稿全部 10 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/memory-workspace.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix auto recall 的打分细节留待检索专题。
2. DeepSeek Harness 是否计划引入 memory service 需跟踪上游。
3. Pi extension custom entry 的护栏策略留待扩展设计。
4. workspace baseline 与 Git HEAD 指纹的产品化需实验验证。

## 下一步

处理 M-14《Subagent 与并发》。

## 部署检查

- 提交：`39ba2af docs: rewrite memory workspace`。
- GitHub Actions：run `32610734661`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/02-harness-mechanics/memory-workspace/` 可访问，并包含标题、subject_key、expected_revision 和 WorkspaceMutation。
