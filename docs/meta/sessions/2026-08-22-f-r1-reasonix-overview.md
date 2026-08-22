---
date: 2026-08-22
topic: F-R1 Reasonix 架构总览初稿
status: 推送前检查完成
---

# F-R1 Reasonix 架构总览初稿

## 目标

按串行流水线完成 F-R1 的中文 Draft 和 Polish，保留批量 Implementation Review 清单；通过链接检查、最小提交和推送后同步目录、会话记录和总进度表。

## 范围

- 范围内：`tutorial/zh-CN/03-frameworks/reasonix/overview.md`、目录状态、本会话记录和总进度表。
- 范围外：Run 生命周期逐行拆解、工具审批细节、其他两家框架和批量事实审查。

## 记录与证据

- 已确认 M-16 已由 `57b29e5` 推送，`main` 与远端同步且工作区干净。
- 已定位 Reasonix 快照 `aa82b2f` 中的 `boot.BuildRuntime`、`boot.Build`、`control.Controller`、`agent.Agent`、`agent.Session` 和 `tool.Registry`。
- 框架深拆按必备结构组织：定位、架构分层、核心类型、调用链、状态持久化、工具链路、扩展点和设计取舍。
- 具体字段级行为保留待审；本节先建立可复核源码入口。

## 成功标准

- 章节包含 Mermaid 架构图、调用链、核心类型表和设计取舍。
- 覆盖状态持久化、工具链路、扩展点和部署形态。
- Polish 通过后语言清晰；未核实的字段级行为保留在 `pending_review`。
- 两套链接检查通过。

## 进展

- 2026-08-22：建立会话检查点，确认 F-R1 是 M-16 后的下一个章节。
- 2026-08-22：主 Agent 完成 F-R1 Draft，新增 Reasonix 架构总览章节，覆盖启动装配、Controller/Agent 边界、核心类型、调用链、持久化、工具链路、扩展点和设计取舍。
- 2026-08-22：主 Agent 直接完成 Polish，统一控制面、前端、权威历史、Provider 可见面和 Runtime Owner 术语，压缩分层导语。

## 自检证据

- `node scripts/check-links.mjs` 通过。
- `cd site && npm run check:links` 通过。
- 已检查 diff 只包含 F-R1 章节、TOC、本会话记录和总进度表。

## 下一步

F-R1 推送后按 TOC 顺序启动 F-R2 Reasonix Run 生命周期。
