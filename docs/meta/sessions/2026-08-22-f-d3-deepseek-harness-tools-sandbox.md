---
date: 2026-08-22
topic: F-D3 DeepSeek Harness 工具与沙箱初稿
status: 推送前检查完成
---

# F-D3 DeepSeek Harness 工具与沙箱初稿

## 目标

按串行流水线完成 F-D3 的中文 Draft 和 Polish，保留批量 Implementation Review 清单；通过链接检查、最小提交和推送后同步目录、会话记录和总进度表。

## 范围

- 范围内：`tutorial/zh-CN/03-frameworks/deepseek-harness/tools-sandbox.md`、目录状态、本会话记录和总进度表。
- 范围外：其他框架工具实现、具体平台沙箱内核和批量事实审查。

## 记录与证据

- 已确认 F-D2 已由 `2d1ed92` 推送，`main` 与远端同步且工作区干净。
- 已定位 Tools registry 的 pre-execute、ask、guard、around dispatch、post-execute 管线；ApprovalService；exclusive/parallel 执行模式；Code Mode；以及 landlock-run 失败关闭启动器。
- 本章覆盖注册与 Schema、调度模式、审批管线、结果规范化、沙箱边界和扩展点。

## 成功标准

- 章节包含 Mermaid 工具链路图和调用链，覆盖核心类型、持久化影响、扩展点和设计取舍。
- 明确并发分类失败时退回 exclusive，审批服务缺失时失败关闭。
- Polish 通过后语言清晰；平台行为保留在 `pending_review`。
- 两套链接检查通过。

## 进展

- 2026-08-22：建立会话检查点，确认 F-D3 是 F-D2 后的下一个章节。
- 2026-08-22：主 Agent 完成 F-D3 Draft，新增 DeepSeek Harness 工具与沙箱章节，覆盖 Registry 管线、并发分类、ApprovalService、Code Mode 和 Landlock。
- 2026-08-22：主 Agent 直接完成 Polish，统一失败关闭、单调拒绝、Code 子调用、允许清单和结果规范化术语。

## 自检证据

- `node scripts/check-links.mjs` 通过。
- `cd site && npm run check:links` 通过。
- 已检查 diff 只包含 F-D3 章节、TOC、本会话记录和总进度表。

## 下一步

F-D3 推送后按 TOC 顺序启动 F-P1 Pi 架构总览。
