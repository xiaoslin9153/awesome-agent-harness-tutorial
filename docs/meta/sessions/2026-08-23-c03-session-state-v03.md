---
date: 2026-08-23
topic: C-03 Session 状态模型重写与 Goal 运行手册固化
status: 已完成
---

# C-03 Session 状态模型重写与 Goal 运行手册固化

## 目标

1. 用 v0.3 九层展开法重写《Session、Turn 与状态模型》。
2. 把已验证的章节重写流程固化为 `docs/product/goal-mode-chapter-rewrite.md`，供后续 Goal 模式串行执行。

## 范围

- 范围内：C-03 公开章节、TOC 状态、B-004 进度、Goal 运行手册和本会话记录。
- 范围外：C-04 重写、Reasonix 框架样本重写、批量事实审查和站点改造。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/session.go:19-78` 定义锁、版本、rewrite version、persisted baseline、normalized dirty、damaged event log、write authority 和 recovery lane。
   - `session.go:89-95` 的 `Add` 是受锁追加入口。
   - `save.go:190-219` 区分 `SaveSnapshot`、`SaveRewrite` 和 `SaveRewriteCompact`；`:230-244` 使用路径锁与文件锁；`:1442-1499` 的 `LoadSession` 会修复悬挂 tool call、半截参数并保留 raw transcript。
2. DeepSeek Harness `b150a55`：
   - `packages/core/session/src/types.ts:40-56` 定义格式版本 bump 规则和 ignorable 词汇增长。
   - `types.ts:61-99` 持久化 cwd、父 Session、seedLength、subagent origin、delegationDepth 和 agentPreset。
   - `types.ts:236-256` 定义 turn / step 边界事件。
   - `session/src/index.ts:427-434` 与 `:530-534` 显示 SurfaceManager 从事件日志派生模型 surface，校验失败不会部分污染。
3. Pi `c49906e`：
   - `packages/coding-agent/src/core/session-manager.ts:1029-1041` 首次批量 flush 后逐行追加 JSONL。
   - `:1044-1067` 的 `_appendEntry` / `appendMessage` 维护 id、parentId 和 leaf。
   - `packages/agent/docs/harness.md:2320-2329` 区分 `message_end` 过程终点和 `entry_added` durable 可查询终点。

## 决策

1. C-03 核心不变量定为：权威事实单一来源；未闭合记录不能作为恢复依据。
2. 用 class diagram 表达 Session、Turn、Fact 和 Projection，强调投影可重建、权威日志优先追加。
3. 新增 5 个反例：UI 当数据库、只存成功工具结果、压缩覆盖原始日志、并发保存覆盖、崩溃后静默截断。
4. 新增崩溃因果链：tool call 已落盘但 result 未落盘时，必须标记未知或对账，不能删除也不能伪装成功。
5. 三家对照分别提炼启发：Reasonix 修复可观测与 CAS 保存；DeepSeek Harness 事件版本规则与派生 surface；Pi 树状 entry 与 `entry_added` durable 边界。
6. Goal 运行手册固化审计、证据、模板、门禁、记录、提交、部署和停止条件，明确单执行者与一次一节。

## 变更文件

- 重写 `tutorial/zh-CN/01-core-concepts/session-and-state.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增 `docs/product/goal-mode-chapter-rewrite.md`
- 新增本会话记录

## 验证

1. 核对 19 个关键源码行锚点存在且符号匹配。
2. `cd site && npm run check:links`：45 个 Markdown 文件通过。
3. `cd site && npm run build`：44 页构建成功。
4. `git diff --check` 通过。

## 自检

- 理想状态模型未绑定任何框架专有类型。
- 三家行为均绑定固定 commit 和路径。
- 未修改 C-04 正文或外部仓库。
- Goal 手册没有授予自动激活 Backlog 的权限。

## 开放问题

1. Reasonix event log 与 JSONL checkpoint 的完整优先级关系留待 M-10 / M-11 深拆。
2. DeepSeek Harness surface fold 的具体 replace 语义留到 Context 压缩章节。
3. Pi 分支 / merge 产品能力与 Session 图的关系留待框架特色进阶。

## 下一步

1. 提交、推送并检查部署。
2. 维护者确认后，可按 `docs/product/goal-mode-chapter-rewrite.md` 开启 Goal 模式。
3. 下一个目标是 C-04《事件模型与流式输出》。
