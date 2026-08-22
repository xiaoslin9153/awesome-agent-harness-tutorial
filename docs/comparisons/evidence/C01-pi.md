# C01 定位证据：Pi

## 元数据

- 维度 ID：C01
- 维度名称：定位
- 分析对象：Pi
- 版本 / commit：`c49906ec77788625aacbdc53ebca6fbe65bd20f5`
- 访问日期：2026-08-22

## 结论摘要

Pi 的通用 agent 包包含两层能力：`Agent` 与 agentLoop 构成模型执行循环；agent 包内的 `AgentLane` / `AgentHarness`、Session context 和 ExecutionEnv 提供 harness 抽象。coding-agent 包有两条装配线：CLI 主路径由 main 进入 SDK 并创建 `AgentSession`；server 路径由 `createCodingAgentHarness` 创建通用包中的 `AgentHarness`。

## 证据列表

| # | 声明 | 类型 | 文件路径 | 行号 | 说明 |
| --- | --- | --- | --- | --- | --- |
| E1 | agent 核心包自我描述为 transport abstraction、state management 和 attachment support。 | 已验证 | `packages/agent/package.json` | L4-L4 | package description。 |
| E2 | coding-agent 包自我描述为带读写、bash、edit、write 工具与会话管理的 CLI。 | 已验证 | `packages/coding-agent/package.json` | L4-L6 | package description。 |
| E3 | `AgentLane` 统一 prompt、resume、取消队列和 run-to-completion 等操作。 | 已验证 | `packages/agent/src/harness/agent-harness.ts` | L267-L294 | 接口方法集中定义。 |
| E4 | 通用包中的 `AgentHarness` 是名为 main 的 lane，聚合 durable session、model、tools、retry 和 compaction 设置。 | 已验证 | `packages/agent/src/harness/agent-harness.ts` | L305-L345 | 类字段与构造函数。 |
| E5 | CLI 入口把参数转换成 `createAgentSession()` options，SDK 承担主要装配。 | 已验证 | `packages/coding-agent/src/main.ts`; `packages/coding-agent/src/core/sdk.ts` | L1-L6; L386-L404 | CLI 注释和 `new AgentSession` 返回点。 |
| E6 | `AgentSession` 聚合 Agent、SessionManager 和 SettingsManager。 | 已验证 | `packages/coding-agent/src/core/agent-session.ts` | L310-L314 | 类 readonly 字段。 |
| E7 | server 装配函数 `createCodingAgentHarness` 创建通用包中的 `AgentHarness`。 | 已验证 | `packages/coding-agent/src/server/create-harness.ts` | L80-L95 | 函数入口与 getHarness 类型。 |
| E8 | 通用包定义 Session context 与文件系统、shell 合成的 ExecutionEnv 抽象。 | 已验证 | `packages/agent/src/harness/session/context.ts`; `packages/agent/src/harness/types.ts` | L5-L23; L303-L315 | 接口定义。 |

## 开放问题

1. CLI/TUI 与 server harness 的差异装配需要后续章节补充。

## 下一步

在 C02 中比较三家 Run 循环的阶段划分。
