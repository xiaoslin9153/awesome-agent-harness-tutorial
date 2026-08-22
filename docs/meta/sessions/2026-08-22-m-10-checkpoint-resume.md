---
date: 2026-08-22
topic: M-10 Checkpoint 与 Resume 初稿
status: 推送前检查完成
---

# M-10 Checkpoint 与 Resume 初稿

## 目标

按串行流水线完成 M-10 的中文 Draft 和 Polish，保留批量 Implementation Review 清单；通过链接检查、最小提交和推送后同步目录、会话记录和总进度表。

## 范围

- 范围内：`tutorial/zh-CN/02-harness-mechanics/checkpoint-resume.md`、目录状态、本会话记录和总进度表。
- 范围外：通用 Persistence 存储选型、具体框架源码审查和批量事实审查。

## 记录与证据

- 已确认 M-09 已由 `1b637f6` 推送，`main` 与远端同步且工作区干净。
- 本章承接 Timeout 与取消的恢复入口，处理检查点内容、提交边界、恢复验证、租约和崩溃一致性。
- 框架对照沿用三个快照版本；具体 checkpoint 路径保留待审。

## 成功标准

- 章节包含理想模型图、双读者解释、检查点字段、恢复流程、失败分支和常见坑。
- 区分持久事实、运行时缓存和工作区外部状态。
- Polish 通过后语言清晰；框架行为保留在 `pending_review`。
- 两套链接检查通过。

## 进展

- 2026-08-22：建立会话检查点，确认 M-10 是 M-09 后的下一个章节。
- 2026-08-22：主 Agent 完成 M-10 Draft，新增 Checkpoint 与 Resume 章节。
- 2026-08-22：主 Agent 直接完成 Polish，统一检查点、恢复、一致性边界、租约和对账术语，并区分持久事实与界面投影。

## 自检证据

- `node scripts/check-links.mjs` 通过。
- `cd site && npm run check:links` 通过。
- 已检查 diff 只包含 M-10 章节、TOC、本会话记录和总进度表。

## 下一步

M-10 推送后按 TOC 顺序启动 M-11 Persistence。
