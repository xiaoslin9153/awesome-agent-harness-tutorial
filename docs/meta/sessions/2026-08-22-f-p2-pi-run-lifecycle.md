---
date: 2026-08-22
topic: F-P2 Pi Run 生命周期初稿
status: 推送前检查完成
---

# F-P2 Pi Run 生命周期初稿

## 目标

按串行流水线完成 F-P2 的中文 Draft 和 Polish，保留批量 Implementation Review 清单；通过链接检查、最小提交和推送后同步目录、会话记录和总进度表。

## 范围

- 范围内：`tutorial/zh-CN/03-frameworks/pi/run-lifecycle.md`、目录状态、本会话记录和总进度表。
- 范围外：容器化细节、其他框架对照和批量事实审查。

## 记录与证据

- 已确认 F-P1 已由 `3b79881` 推送，`main` 与远端同步且工作区干净。
- 已定位 runAgentLoop、runLoop、streamAssistantResponse、executeToolCalls、Agent 事件状态机和 Steering/FollowUp 队列。
- 本章区分 Agent 运行、Turn、模型响应和工具批次；保留 message_end 与持久化的待审关系。

## 成功标准

- 章节包含 Mermaid 生命周期图和调用链，覆盖核心类型、状态持久化、工具链路、扩展点和设计取舍。
- 明确 stopReason 为 length 时失败整批截断工具调用。
- Polish 通过后语言清晰；字段级行为保留在 `pending_review`。
- 两套链接检查通过。

## 进展

- 2026-08-22：建立会话检查点，确认 F-P2 是 F-P1 后的下一个章节。
- 2026-08-22：主 Agent 完成 F-P2 Draft，新增 Pi Run 生命周期章节，覆盖 runAgentLoop、事件流、Steering、工具批处理和 Agent 状态机。
- 2026-08-22：主 Agent 直接完成 Polish，统一事件流、Steering、稳定消息、工具批、截断失败和 idle 术语；首次整包补丁因列表上下文不匹配未生效，已分步重试成功。

## 自检证据

- `node scripts/check-links.mjs` 通过。
- `cd site && npm run check:links` 通过。
- 已检查 diff 只包含 F-P2 章节、TOC、本会话记录和总进度表。

## 下一步

F-P2 推送后按 TOC 顺序启动 F-P3 Pi 工具与容器化。
