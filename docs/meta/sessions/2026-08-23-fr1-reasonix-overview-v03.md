---
date: 2026-08-23
topic: F-R1 Reasonix 架构总览 v0.3 重写
status: 已完成
---

# F-R1 Reasonix 架构总览 v0.3 重写

## 目标

按 Goal 运行手册重写 F-R1，把第二章的机制抽象映射到 Reasonix 固定快照的启动装配、Runtime 生命周期、Controller/Agent/Session/Registry 结构归属。

## 范围

- 范围内：F-R1 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：F-R2 Run 循环细节（已重写）、F-R3 工具审批细节、桌面/Bot 前端逐一核对、跨框架对比页。

## 旧稿审计

旧稿已有分层图和核心类型表，但缺少 learning_contract、核心不变量失效边界、6 个反例、完整因果链和第二张 Mermaid 图；pending_review 未关闭；未核对 BuildResult/Owner/generation、Agent 结构字段归属、Session writeAuth/recoveryLane。

## 源码证据

1. Boot：`internal/boot/runtime.go:88-98` BuildRuntime frozen snapshot；`:100-115` Build 兼容包装且 runtime set chained into controller cleanup；`:25-53` BuildResult 字段（Snapshot/Runtime/Owner/Dispatcher/ExtensionUI/ProviderResolver）；`:78-86` runtimeGeneration 与 CloseIfGeneration 防 stale cleanup。
2. Controller：`internal/control/controller.go:93-95` 自述职责；`:66-95` 回合互斥/rotation/readiness 恢复错误；`:104-146` budget/goal/sink/policy/subagentGate/skills/hooks/memory 字段群。
3. Agent：`internal/agent/agent.go:280-288` 单任务定位；`:296-315` unwrittenResolve 归属、planMode 非安全边界、readOnlyExecution 构造期、mutationDependencyBarrier 防 use_capability 绕过。
4. Provider：`internal/provider/provider.go:952-960` Stream 契约（ctx 取消中止、closed channel 完成）；`:962-975` ToolCallReasoningPolicy 能力探测。
5. Session：`internal/agent/session.go:15-21` 锁策略；`:22-31` version/rewriteVersion/persistedRewriteVersion 存于 Session 防 swap 错乱；`:33-48` normalizedDirty/eventLogDamaged/rawMessages；`:62-77` writeAuth fail closed 与 recoveryLane。
6. Registry：`internal/tool/tool.go:1-4,281-295,287-330,609-635` per-run、provider-visible/executable 分离、stable schema order。

## 决策

1. 核心不变量定为前端只消费控制面、runtime 资源随 Controller 代次生灭、Session 写权受租约约束、Provider 可见面可收窄。
2. 用“酒店房卡 + 行李托管”类比解释 BuildResult/Owner；随后给出 generation 机制。
3. 用 flowchart 表达分层，用 sequence diagram 表达 Build→freeze snapshot→cleanup chain。
4. 新增反例覆盖只 Close Controller、stale cleanup、planMode 当安全边界、跨 goroutine 直读、swap 后复用旧 baseline、无 authority save。
5. 完整因果链采用桌面标签页快速关闭与重建：generation 防误杀 + writeAuth 防覆盖。

## Polish

1. 统一 BuildResult、RuntimeSet/Owner、controller generation、write authority、provider-visible surface 术语。
2. 明确 planMode 与 readOnlyExecution 的语义差异是本章关键区分点。
3. 设计取舍表补充“先拆 Boot 再拆 Control 最后补 Session 版本”的迁移路径。
4. 把 Run 循环细节显式交给已重写的 F-R2，避免重复。

## Implementation Review

1. 用脚本核对新稿全部 22 个外部锚点起止行均在文件范围内。
2. 核对至少 6 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/03-frameworks/reasonix/overview.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. 桌面/Bot/ACP 前端的逐一差异核对留待前端专题或批量终审。
2. extension kernel snapshot 的完整字段图留待 F-R3 后视需要补充。
3. SessionLease 获取协议细节留待 M-10/M-11 关联审阅。

## 下一步

处理 F-R3《Reasonix 工具与审批》（F-R2 已在基准阶段完成）。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
