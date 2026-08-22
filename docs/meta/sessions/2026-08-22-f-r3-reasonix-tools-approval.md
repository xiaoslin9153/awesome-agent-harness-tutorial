---
date: 2026-08-22
topic: F-R3 Reasonix 工具与审批初稿
status: 推送前检查完成
---

# F-R3 Reasonix 工具与审批初稿

## 目标

按串行流水线完成 F-R3 的中文 Draft 和 Polish，保留批量 Implementation Review 清单；通过链接检查、最小提交和推送后同步目录、会话记录和总进度表。

## 范围

- 范围内：`tutorial/zh-CN/03-frameworks/reasonix/tools-approval.md`、目录状态、本会话记录和总进度表。
- 范围外：其他框架工具实现、具体平台沙箱内核和批量事实审查。

## 记录与证据

- 已确认 F-R2 已由 `a82a5d4` 推送，`main` 与远端同步且工作区干净。
- 已定位 `tool.Tool`、`Registry.ResolveCall/Schemas`、`executeBatch/executeOne`、`permission.Policy/Gate`、Auto Guard、Workspace Lease 和 sandbox Escape Approver。
- 本章覆盖注册、可见性、解析、门控顺序、并发规则、审批决策、依赖屏障、结果规范化和扩展点。

## 成功标准

- 章节包含 Mermaid 工具链路图和调用链，覆盖核心类型、持久化影响、扩展点和设计取舍。
- 明确只读批次才并行，混合批次保持 Provider 顺序。
- Polish 通过后语言清晰；字段级行为保留在 `pending_review`。
- 两套链接检查通过。

## 进展

- 2026-08-22：建立会话检查点，确认 F-R3 是 F-R2 后的下一个章节。
- 2026-08-22：主 Agent 完成 F-R3 Draft，新增 Reasonix 工具与审批章节，覆盖 Registry、执行批处理、单次调用管线、权限策略、Auto Guard、沙箱和扩展点。
- 2026-08-22：主 Agent 直接完成 Polish，统一工具能力面、解析、门控顺序、审批决策、依赖屏障和沙箱兜底术语。

## 自检证据

- `node scripts/check-links.mjs` 通过。
- `cd site && npm run check:links` 通过。
- 已检查 diff 只包含 F-R3 章节、TOC、本会话记录和总进度表。

## 下一步

F-R3 推送后按 TOC 顺序启动 F-D1 DeepSeek Harness 架构总览。
