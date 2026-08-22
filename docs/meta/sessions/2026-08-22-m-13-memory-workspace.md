---
date: 2026-08-22
topic: M-13 Memory 与工作区初稿
status: 推送前检查完成
---

# M-13 Memory 与工作区初稿

## 目标

按串行流水线完成 M-13 的中文 Draft 和 Polish，保留批量 Implementation Review 清单；通过链接检查、最小提交和推送后同步目录、会话记录和总进度表。

## 范围

- 范围内：`tutorial/zh-CN/02-harness-mechanics/memory-workspace.md`、目录状态、本会话记录和总进度表。
- 范围外：Sub-agent 并发、成本延迟、具体向量库选型和批量事实审查。

## 记录与证据

- 已确认 M-12 已由 `a185c6b` 推送，`main` 与远端同步且工作区干净。
- 本章区分模型可见 Memory、持久项目知识、检索资料和可执行工作区；不展开并发委派。
- 框架对照沿用三个快照版本；具体记忆和工作区路径保留待审。

## 成功标准

- 章节包含理想模型图、双读者解释、Memory 类型、写入门槛、工作区边界和常见坑。
- 明确记忆必须可溯源、可撤销，并区分事实、偏好和假设。
- Polish 通过后语言清晰；框架行为保留在 `pending_review`。
- 两套链接检查通过。

## 进展

- 2026-08-22：建立会话检查点，确认 M-13 是 M-12 后的下一个章节。
- 2026-08-22：主 Agent 完成 M-13 Draft，新增 Memory 与工作区章节。
- 2026-08-22：主 Agent 直接完成 Polish，统一长期记忆、检索知识、工作区基线、来源溯源、冲突处理和遗忘策略术语。

## 自检证据

- `node scripts/check-links.mjs` 通过。
- `cd site && npm run check:links` 通过。
- 已检查 diff 只包含 M-13 章节、TOC、本会话记录和总进度表。

## 下一步

M-13 推送后按 TOC 顺序启动 M-14 Sub-agent 与并发。
