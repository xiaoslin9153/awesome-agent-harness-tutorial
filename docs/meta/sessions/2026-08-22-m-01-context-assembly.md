---
date: 2026-08-22
topic: M-01 Context 组装与分层初稿
status: 暂停
---

# M-01 Context 组装与分层初稿

## 目标

按串行流水线完成 M-01 的中文 Draft 和 Polish，保留批量 Implementation Review 清单；通过链接检查、最小提交和推送后同步目录、会话记录和总进度表。

## 范围

- 范围内：`tutorial/zh-CN/02-harness-mechanics/context-assembly.md`、目录状态、本会话记录和总进度表。
- 范围外：Context 压缩细节、工具协议、B 系列改造和批量事实审查。

## 记录与证据

- 已确认 C-04 已由 `26a2e9d` 推送，`main` 与远端同步且工作区干净。
- M-01 依赖 C-03 的状态边界；本章只处理一次模型请求前的组装，不展开截断算法。
- 框架对照沿用 Reasonix `aa82b2f`、DeepSeek Harness `b150a55` 和 Pi `c49906e` 快照锚点，具体行为保留待审。

## 成功标准

- 章节包含理想模型图、双读者解释、组装顺序、预算分配、动态上下文、工具声明和常见坑。
- 区分持久来源、请求投影、系统层指令和应用层资料。
- Polish 通过后语言清晰；框架行为保留在 `pending_review`。
- 两套链接检查通过。

## 进展

- 2026-08-22：建立会话检查点，确认 M-01 是 C-04 后的下一个章节。
- 2026-08-22：主 Agent 完成 M-01 Draft，新增 Context 组装与分层章节。
- 2026-08-22：主 Agent 直接完成 Polish，统一上下文、组装器和线束术语，强化预算优先级、动态状态、工具声明和可追溯性边界；框架事实保留待审。

## 自检证据

- `node scripts/check-links.mjs` 通过。
- `cd site && npm run check:links` 通过。
- 已检查 diff 只包含 M-01 章节、TOC、本会话记录和总进度表。

## 下一步

M-01 推送后按 TOC 顺序启动 M-02 Context 压缩与截断。
