---
title: C-02 Agent Run 生命周期会话
date: 2026-08-22
section: C-02
status: completed
---

# C-02 Agent Run 生命周期会话

## 会话目标

完成 `tutorial/zh-CN/01-core-concepts/agent-run-lifecycle.md` 的 Draft、Polish、Implementation Review、本地验证、最小提交、推送和部署检查。

## 执行记录

1. 已阅读 `AGENTS.md`、`docs/meta/session-hook.md`、`docs/product/progress-tracker.md` 和 `tutorial/zh-CN/TOC.md`，确认 C-01 已完成、C-02 是当前小节。
2. 已核对三家快照 commit：Reasonix `aa82b2f94f3dbfccad544ac858c482533e00327f`、DeepSeek Harness `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`、Pi `c49906ec77788625aacbdc53ebca6fbe65bd20f5`。
3. 已提取 Reasonix `Agent.Run` 与工具循环、DeepSeek Harness `ReactLoopAgent` 回合驱动、Pi CLI `AgentSession.prompt` 到通用 agent loop 的主链路证据。
4. 已完成公开 Draft 和三份 C02 证据索引，并通过本地链接检查与构建预检。
5. Polish Agent 结论为 needs-revision，要求拆分长句和类比、统一中文术语与 Run/Turn 用法、修复理想图视觉死路并说明框架图裁剪范围。
6. Implementation Review Agent 结论为 needs-revision，指出 DeepSeek Harness 遗漏 `assistant/message`，并要求把工具治理、终止原因、恢复持久化和 Pi 调用链限定到已验证事实或理想模型。
7. 已根据两项审查修正公开章节和 C02 证据索引，并将两个审查结果记录到 Front Matter。
8. 已更新 `tutorial/zh-CN/TOC.md` 的 C-02 状态和 `docs/product/progress-tracker.md` 中 K03、FR02、FD02、FP02 条目。
9. 正式验证通过：`cd site && npm run check:links && npm run build`。
10. 提交 `6a8c4e9` 已推送成功，远端 `refs/heads/main` 指向同一 SHA；Deploy Pages run `32556630093` 成功。
11. Deploy Agent 检查根路径和 `/zh-CN/01-core-concepts/agent-run-lifecycle/` 均返回 HTTP 200，且分别包含预期入口、标题和 `assistant/message`。
12. 本地 `git push` 更新远端跟踪引用时因 `.git/refs/remotes/origin/main.lock` 出现一次沙箱写入权限错误；远端 SHA 与本地 HEAD 已用 `git ls-remote` 核对一致。

## 会话结果与检查清单

C-02 已完成：公开章节把一次 Run 拆成准备、初始化、请求、推理、分支和收束六类职责，并用三家固定快照说明理想生命周期如何映射到真实调用链。创建或修改了公开章节、TOC、C02 三份证据索引、本会话记录和进度表。替代方案是把工具治理写成三家共同机制，但源码审查证明检查点不同，因此改为理想模型加逐家差异。本地链接检查、构建和线上部署检查均通过。

- 证据：`docs/comparisons/evidence/C02-reasonix.md`、`docs/comparisons/evidence/C02-deepseek-harness.md`、`docs/comparisons/evidence/C02-pi.md`。
- 验证：`cd site && npm run check:links && npm run build`。
- 部署检查：workflow success；`/` HTTP 200；`/zh-CN/01-core-concepts/agent-run-lifecycle/` HTTP 200 且包含标题与关键事件名。
- 环境备注：本地 `origin/main` 跟踪引用显示 ahead 1 是沙箱锁导致的更新失败，不是推送失败。
- 未解决问题：Reasonix 批量执行细节、DeepSeek Harness 完整启动装配、Pi server harness 差异分别留待 M-04、架构章节和框架章节。
- 下一个具体动作：进入 C-03《Session、Turn 与状态模型》。

## 范围与假设

- 本章只拆解一次 Run 的输入、模型流、工具分支、结束原因和恢复主线；Context 组装细节、Tool Schema、事件协议和持久化机制留待后续章节。
- “Run”是教学抽象，不假定所有框架都有同名类型；三家实现分别映射到 `Agent.Run`、`ReactLoopAgent` 驱动和 `AgentSession` / `agent.prompt` 主路径。

## 证据与决策

- Reasonix 在 `run_loop.go` 中把回合初始化、采样恢复、最终响应和工具轮处理集中实现；`Agent.Run` 是显式入口。
- DeepSeek Harness 把 `turn/start`、`step/start`、`user/message`、`assistant/chunk`、`assistant/message`、`tool/call`、`step/end` 和 `turn/end` 写入 Session 日志，由 `ReactLoopAgent.turn()` 和 `step()` 驱动。
- Implementation Review 确认三家快照 commit 一致；Pi 主链路已补上核心 `Agent.prompt` → `runPromptMessages` → `runAgentLoop` 的完整调用链。
- Pi CLI 先做模板扩展、鉴权与扩展预处理，再进入通用 agent loop；消息在 message_end 时交给 `SessionManager` 持久化。

## 开放问题

- Reasonix 的完整持久化格式与 Controller 恢复策略不在本章展开。
- DeepSeek Harness 的 CLI 到 AgentLoop 服务装配只引用已验证锚点，不在本章逐行展开依赖注入。

## 下一步

C-02 已完成。下一小节是依赖它的 C-03。
