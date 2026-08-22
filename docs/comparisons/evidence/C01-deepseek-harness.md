# C01 定位证据：DeepSeek Harness

## 元数据

- 维度 ID：C01
- 维度名称：定位
- 分析对象：DeepSeek Harness（dsh）
- 版本 / commit：`b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`
- 访问日期：2026-08-22

## 结论摘要

DeepSeek Harness 将智能体抽象为可注册的运行句柄，将具体驱动实现为基于 Session 日志的 React Loop。`AgentLoop` 服务是具体工厂和驱动服务，实例化 `ReactLoopAgent`。CLI 是独立应用装配层，负责 profile boot、插件管理和浏览器 UI 入口。

## 证据列表

| # | 声明 | 类型 | 文件路径 | 行号 | 说明 |
| --- | --- | --- | --- | --- | --- |
| E1 | `@deepseek-ai/dsh-agent` 定义 Agent 接口、注册表和事件词汇。 | 已验证 | `packages/core/agent/package.json` | L4-L4 | package description。 |
| E2 | `Agent.id` 与 Session 共用身份，Session log 是持久事实来源。 | 已验证 | `packages/core/agent/src/runtime-types.ts` | L64-L74 | 接口字段注释明确两者关系。 |
| E3 | `ReactLoopAgent` 从 Session 日志派生请求并驱动回合与步骤。 | 已验证 | `packages/core/agent-loop/src/agent.ts` | L1-L8、L63-L97 | 模块注释与类定义一致。 |
| E4 | CLI 应用提供 profile boot、插件管理和 Web UI 别名。 | 已验证 | `apps/cli/package.json` | L4-L7 | description 和 bin 配置。 |
| E5 | `AgentLoop` 是具体工厂和驱动服务，注入 agents、sessions、llm、tools 和 systemPrompt。 | 已验证 | `packages/core/agent-loop/src/index.ts` | L295-L297 | 类声明与依赖注入字段。 |
| E6 | 工厂创建 `ReactLoopAgent` 实例并返回给调用方。 | 已验证 | `packages/core/agent-loop/src/index.ts` | L549-L555 | 实例化点与返回对象。 |

## 开放问题

1. CLI boot 到 AgentRegistry 的依赖注入链路需要在架构章节继续拆解。

## 下一步

在 C02 中分析 `ReactLoopAgent` 的 idle、running 和 maintenance 阶段。
