---
date: 2026-08-23
topic: L-02 Context 膨胀实验初稿
status: 已完成
---

# L-02 Context 膨胀实验初稿

## 目标

完成 L-02 的中文 Draft 和 Polish；建立确定性 Context 膨胀实验，比较无界追加与预算内投影，保留批量 Implementation Review 清单，通过链接与实验检查后做最小提交和推送。

## 范围

- 范围内：`tutorial/zh-CN/05-labs/context-bloat.md`、`labs/context-bloat/`、目录状态、本会话记录和总进度表。
- 范围外：真实模型、向量检索、站点改造、框架集成和 B-001/B-002/B-003 待办。

## 记录与证据

- L-01 已由 `c57251f` 推送，`main` 与 `origin/main` 同步且工作区干净。
- 实验使用确定性消息、字符预算和固定投影规则，不调用网络或模型。
- 实验要验证三个不变量：无界历史会超过预算；安全约束和关键纠正必须保留；被移出请求的内容必须留下可审计记录。

## 成功标准

- `labs/context-bloat` 有 README、package.json、可执行入口和离线测试。
- 实验比较 naive 与 bounded 两种投影，输出 token 估算、保留消息、丢弃记录和预算状态。
- 教材说明膨胀来源、投影边界、优先级、丢失风险和迁移检查单。
- Draft 与 Polish 完成，Implementation Review 保持 `pending`。
- 实验测试、两套链接检查和最小提交推送通过。

## 进展

- 2026-08-23：建立会话检查点，确认 L-02 依赖 M-02 并开始实验设计。
- 2026-08-23：实现 naive 与 bounded 两种请求投影，使用 pinned 消息保护系统约束、任务目标和用户纠正。
- 2026-08-23：完成中文教材 Draft 与 Polish，补充权威历史与请求投影边界、数据流图、观察点和迁移检查单。
- 2026-08-23：执行 `cd labs/context-bloat && npm start && npm test`，4 项断言通过；执行 `node scripts/check-links.mjs` 与 `(cd site && npm run check:links)`，42 个 Markdown 文件链接全部通过。

## 决策

- 区分权威历史和请求投影：压缩只改变本次发送内容，不修改事实来源。
- 使用 pinned 优先和从新到旧装入：保证约束、目标、用户纠正和最新证据优先于普通历史。
- 为 dropped 消息记录 ID、角色、原因和成本：让上下文残缺可归因，而不是静默丢失。
- 对 pinned 超预算抛出异常：禁止静默移除最高优先级信息。

## 自检

- 首次测试发现默认预算过紧，关键纠正保留后最新证据被挤出；已把示例预算调整为 64 token。
- 边界用例首次预算也过紧，无法验证 pinned 与最近消息共存；已调整到 8 token 并通过。
- 教材 Front Matter 记录 Polish 通过和 Implementation Review `pending`。
- 变更只包含 L-02 教材、对应实验、目录状态、会话记录和总进度表。

## 开放问题

- Implementation Review 仍需核对字符估算、pinned 超预算行为、丢弃顺序和框架迁移检查单。
- 当前实验只覆盖静态预算投影，尚未覆盖增量摘要、工具结果规范化或真实 token 计数。

## 下一步

1. 提交并推送 L-02 最小改动。
2. 按 TOC 顺序启动 L-03 Tool 重试副作用实验的 Draft。
3. 保持单主 Agent 串行流程，并把 Implementation Review 继续留在批量待办清单。
