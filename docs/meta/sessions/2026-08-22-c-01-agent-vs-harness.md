---
title: C-01 Agent、Harness 与 Runtime 边界会话
date: 2026-08-22
section: C-01
status: completed
---

# C-01 Agent、Harness 与 Runtime 边界会话

## 会话目标

完成 `tutorial/zh-CN/01-core-concepts/agent-vs-harness.md` 的 Draft、Polish、Implementation Review、构建验证和最小提交。

## 执行记录

1. 已阅读 `AGENTS.md`、`docs/meta/session-hook.md`、`docs/product/progress-tracker.md` 和 `tutorial/zh-CN/TOC.md`，确认当前小节为无依赖的 C-01。
2. 已核对三家框架快照的 commit：Reasonix `aa82b2f`、DeepSeek Harness `b150a55`、Pi `c49906e`。
3. 已定位 Reasonix `Agent.Run`、DeepSeek Harness `ReactLoopAgent`、Pi `AgentHarness` 等入口，并继续补齐边界证据。
4. 已完成公开 Draft，新增 C01 三家证据索引，并通过本地链接检查和构建预检。
5. Polish Agent 结论为 needs-revision，要求统一中文术语、压缩框架表密度、补充双读者过渡和类比收束。
6. Implementation Review Agent 结论为 needs-revision，指出 Pi CLI/TUI 主路径实际使用 `AgentSession`，`AgentHarness` 属于 server 装配；同时要求补强 Reasonix 共享前端、DeepSeek Harness 驱动来源和 Pi 抽象的证据。
7. 已根据两项审查修正公开章节和 C01 证据索引，并将两个审查结果记录到 Front Matter。
8. 已更新 `tutorial/zh-CN/TOC.md` 的 C-01 状态和 `docs/product/progress-tracker.md` 中 K06、FR01、FD01、FP01 条目。
9. 正式验证通过：`cd site && npm run check:links && npm run build`；生成路由包含 `AgentSession` 和 server 装配关键内容。

## 会话结果与检查清单

C-01 已完成：公开章节建立智能体、线束、运行时三层模型，并用三家固定快照说明逻辑边界如何映射到真实装配。创建或修改了公开章节、TOC、C01 三份证据索引、本会话记录和进度表。替代方案是把 Pi 统一写成 `AgentHarness` 主路径，但源码审查证明 CLI 使用 `AgentSession`，因此改为两条装配线。本地链接检查和构建均通过；部署检查将在推送后执行。

- 证据：`docs/comparisons/evidence/C01-reasonix.md`、`docs/comparisons/evidence/C01-deepseek-harness.md`、`docs/comparisons/evidence/C01-pi.md`。
- 验证：`cd site && npm run check:links && npm run build`。
- 未解决问题：DeepSeek Harness 完整启动链路、Pi 恢复协议、Reasonix Controller 到各前端的事件桥接留待后续章节。
- 下一个具体动作：推送后执行 Deploy Subagent 检查，随后进入 C-02《一次 Agent Run 的完整生命周期》。

## 证据与决策

- 理想模型把智能体定义为任务决策者，线束定义为编排层，运行时定义为进程或服务承载环境；该分层是教学抽象，不假定任何框架同名实现。
- 公开章节先建立不绑定框架的心智模型，再以源码入口说明三家如何吸收或重命名这些职责。
- Implementation Review 确认 Reasonix `aa82b2f`、DeepSeek Harness `b150a55`、Pi `c49906e` 与对比账本一致；Pi 的表述已改为 CLI `AgentSession` 主路径和 server `AgentHarness` 装配两条线。

## 开放问题

- DeepSeek Harness 的 CLI 到 `ReactLoopAgent` 的完整装配链路尚未逐行展开；本章只声明已验证的核心类型关系。
- Pi 的 `AgentHarness.create` 当前拒绝恢复既有记录，其恢复协议留到 Checkpoint 章节分析。

## 下一步

重新运行链接检查和站点构建；通过后更新 TOC 与进度表，执行最小提交、推送和部署检查。
