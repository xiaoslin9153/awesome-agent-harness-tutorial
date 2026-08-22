# C01 定位证据：Reasonix

## 元数据

- 维度 ID：C01
- 维度名称：定位
- 分析对象：Reasonix
- 版本 / commit：`aa82b2f94f3dbfccad544ac858c482533e00327f`
- 访问日期：2026-08-22

## 结论摘要

Reasonix 把本地引擎作为核心，CLI/TUI、桌面应用和编辑器扩展通过共享启动装配接入同一引擎。`Agent` 聚合 Provider、工具 Registry 和 Session 并驱动主循环；`boot.BuildRuntime` 组装运行时能力，Controller 提供面向交互层的控制面。

## 证据列表

| # | 声明 | 类型 | 文件路径 | 行号 | 说明 |
| --- | --- | --- | --- | --- | --- |
| E1 | 产品文档声明一个本地引擎服务终端、桌面、浏览器和 ACP 编辑器接入。 | 已验证 | `external/DeepSeek-Reasonix/README.md` | L43-L77 | 这是仓库自述；具体接入路径另由源码入口佐证。 |
| E2 | `Agent` 聚合 Provider、工具 Registry 和 Session 并接入主循环。 | 已验证 | `internal/agent/agent.go` | L280-L289 | 结构体注释直接描述三项协作对象。 |
| E3 | `Agent.Run(ctx, input)` 是单任务执行入口。 | 已验证 | `internal/agent/agent.go` | L1239-L1239 | 方法接收上下文与用户输入并返回错误。 |
| E4 | 启动层提供 `BuildRuntime` 与 Controller 组装点。 | 已验证 | `internal/boot/runtime.go` | L96-L110 | `BuildRuntime` 返回 BuildResult，`Build` 返回 Controller。 |
| E5 | 注释说明模型解析、工具注册、权限门和 Coordinator 位于 internal/boot，并与 desktop frontend 共享。 | 已验证 | `internal/cli/cli.go` | L259-L268 | 直接描述共享装配层。 |
| E6 | ACP 工厂复用 `boot.Build`，保持与 chat、desktop、serve 装配一致。 | 已验证 | `internal/cli/acp.go` | L96-L99 | acpFactory 注释明确共享装配。 |
| E7 | 桌面 tab controller 通过薄包装调用 `boot.Build`。 | 已验证 | `desktop/tab_controller_boot.go` | L13-L17 | 桌面端进入同一 Controller 装配路径。 |

## 开放问题

1. Controller 到 TUI、桌面和 ACP 的完整事件桥接仍需在生命周期章节展开。

## 下一步

在 C02 中追踪 `Agent.Run` 的状态迁移和循环阶段。
