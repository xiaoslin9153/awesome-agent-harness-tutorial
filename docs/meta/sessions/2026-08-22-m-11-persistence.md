---
date: 2026-08-22
topic: M-11 Persistence 初稿
status: 推送前检查完成
---

# M-11 Persistence 初稿

## 目标

按串行流水线完成 M-11 的中文 Draft 和 Polish，保留批量 Implementation Review 清单；通过链接检查、最小提交和推送后同步目录、会话记录和总进度表。

## 范围

- 范围内：`tutorial/zh-CN/02-harness-mechanics/persistence.md`、目录状态、本会话记录和总进度表。
- 范围外：Observability 展示层、Memory 策略、具体存储选型迁移和批量事实审查。

## 记录与证据

- 已确认 M-10 已由 `4240db1` 推送，`main` 与远端同步且工作区干净。
- 本章承接 Checkpoint 的恢复依据，处理持久分层、事件日志、一致性、迁移、保留和多进程访问。
- 框架对照沿用三个快照版本；具体存储实现保留待审。

## 成功标准

- 章节包含理想模型图、双读者解释、持久层次、写入模式、一致性策略和常见坑。
- 区分权威事件、派生投影、临时缓存和工作区文件。
- Polish 通过后语言清晰；框架行为保留在 `pending_review`。
- 两套链接检查通过。

## 进展

- 2026-08-22：建立会话检查点，确认 M-11 是 M-10 后的下一个章节。
- 2026-08-22：主 Agent 完成 M-11 Draft，新增 Persistence 章节。
- 2026-08-22：主 Agent 直接完成 Polish，统一权威事件、派生投影、临时缓存、副作用登记和迁移术语，强调业务边界提交点与并发访问协议。

## 自检证据

- `node scripts/check-links.mjs` 通过。
- `cd site && npm run check:links` 通过。
- 已检查 diff 只包含 M-11 章节、TOC、本会话记录和总进度表。

## 下一步

M-11 推送后按 TOC 顺序启动 M-12 Observability 与 Replay。
