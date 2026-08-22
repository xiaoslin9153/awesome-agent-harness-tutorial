---
date: 2026-08-23
topic: Reasonix Run lifecycle v0.3 样本重写
status: 已完成
---

# Reasonix Run lifecycle v0.3 样本重写

## 目标

按 Goal 运行手册重写 Reasonix Run 生命周期样本，把 C-02/C-04 的通用抽象绑定到固定快照 `aa82b2f`，补齐采样恢复、提交边界、工具批次、取消保存和可续跑暂停的机制级证据。

## 范围

- 范围内：F-R2 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：F-R3 工具审批细节、M-10/M-11 恢复与持久化深拆、跨框架对比和批量终审。

## 旧稿审计

旧稿已有三层回合、生命周期图、宽限轮和恢复表，但缺少 learning_contract、核心不变量的失效边界、6 个带因果解释的反例、完整因果链和第二张 Mermaid 图；部分 pending_review 未关闭；采样重试只写“有限次”，没有区分 stream retry、context rebuild 和 missing reasoning replay。

## 源码证据

1. Controller：`internal/control/controller.go:1111-1119` 同步前台入口；`turn_orchestrator.go:209-267,285-324` 处理 input.receive、checkpoint、hook、Recovery Episode 和取消后保留配对工具工作。
2. Agent Run：`internal/agent/agent.go:1234-1305` 说明宿主拥有 max steps、Workspace Lease、before_start、pending reservation 和 turnRuntime 初始化。
3. Turn state：`turnruntime.go:8-11,12-96,98-117` 区分每 Run 清零状态、跨 Run 状态和外部预置状态。
4. Sampling：`run_loop.go:247-277,340-344,371-379,391-459,498-517` 覆盖 Steering、prefix shape、冻结请求、6 attempts、context rebuild、missing reasoning replay/backoff；`sampling_request.go:59-80` 与 `sampling_attempt.go:10-52` 记录错误分类和 HTTP usage delta。
5. Commit 与 final：`run_loop.go:293-317,519-610` 定义干净终态提交、空 final 重试、readiness pause 和 handoff nudge；`errors.go:101-139` 定义结构化 readiness/recovery 暂停。
6. Tools/budget：`run_loop.go:612-721` 与 `execute_batch.go:83-98,154-198,250-397` 核对 read-only 并行、writer 串行、mutation barrier、recovery stop、取消填充和 ToolResult 顺序；`finalization.go:81-116` 核对 graceRound 与 task/max steps pause。
7. Interrupted display：`agent.go:46-51,2048-2079` 记录 LocalOnly、interrupted tools 和 dropped partial text/reasoning。

## 决策

1. 核心不变量定为失败采样不入历史、tool call/result 配对、暂停保留现场、宿主拥有上限、本地草稿不进入模型推理。
2. 明确三种回合粒度：Controller foreground turn、Agent Run、model round/step；预算语义绑定 model round。
3. 用第二张 flowchart 单独表达 frozen request 的三类错误分支，避免第一张状态图隐藏 attempt 归零语义。
4. 新增反例覆盖提前执行 partial call、执行 unreplayable tool、取消清空、pause 当 fatal、Goal 穿透 grace round、skipped verification 当成功。
5. 完整因果链采用 `max_steps=3` 的三步工作加宽限总结，证明“先收口再暂停”。

## Polish

1. 统一 speculative attempt、clean terminal、durable Session、local-only display、grace round 和 resumable pause 术语。
2. 初学者主线用施工会议类比，随后用精确字段和调用链替换类比。
3. 设计取舍表补充成立条件，并给出从单一 error 终态迁移到结构化 pause 的路径。
4. 将旧稿“工具链路与扩展点”中未核对的内容移交给 F-R3，不再混入本章结论。

## Implementation Review

1. 用脚本核对新稿全部 28 个外部锚点起止行均在文件范围内；所有锚点均来自本章实际打开过的生产源码或仓库内文档。
2. 核对至少 6 个故障模式、一条触发到后续影响的因果链、2 张用途明确的 Mermaid 图。
3. 核对 Front Matter 契约与 TOC 状态一致；Polish 和 Implementation Review 由主 Agent 完成。
4. 不修改 `external/`；不引用测试注释作为生产行为。

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 与线上页面，结果记录在部署检查。

## 开放问题

1. Workspace Lease、approval policy 和沙箱细节留待 F-R3。
2. checkpoint rewind 与 event log repair 的优先级留待 M-10/M-11。
3. Goal FSM 如何消费 ProgressKey 留待框架特色或 M-15 展开。

## 下一步

按 TOC 依赖顺序处理第一章剩余尚未升级章节；随后继续 M-01 到 M-16。

## 部署检查

- 提交：`138691d docs: rewrite reasonix run lifecycle`。
- GitHub Actions：run `32594995291`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/03-frameworks/reasonix/run-lifecycle/` 可访问，并包含标题、`streamWithSamplingRecovery`、`maxStepsPause` 和 `LocalOnly`。
