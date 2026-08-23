---
date: 2026-08-23
topic: F-D1 DeepSeek Harness 架构总览 v0.3 重写
status: 已完成
---

# F-D1 DeepSeek Harness 架构总览 v0.3 重写

## 目标

按 Goal 运行手册重写 F-D1，把第二章机制映射到 DeepSeek Harness 的 Cordis 装配、factory 反转、Agent 接口与 SessionHeader 治理字段。

## 范围

- 范围内：F-D1 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：F-D2 Run 状态机细节（下一章）、F-D3 工具/审批、profile-boot 完整装载顺序核对、跨框架对比页。

## 旧稿审计

旧稿已有分层与核心类型表，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；pending_review 未关闭；未核对 AgentFactory 顺序契约、initiator 边界声明、AgentStatus 两态语义、SessionHeader 治理字段注释。

## 源码证据

1. `packages/core/agent/src/index.ts:183-214`：AgentFactory create/resume JSDoc——setup→commit→insert→ordered announce→session-start→loop start；rollback 配对 disposed 通知；resume 需 sessionPersistence。
2. `index.ts:216-217`：NO_FACTORY_MESSAGE 表明 registry 是诚实空门面。
3. `index.ts:244-255`：AgentRegistry 注释限定 initiator 为 same-process causal attribution only，ambient presence 非 liveness/authorization。
4. `runtime-types.ts:23-31,33-41,43-50,52-58,60-61,63-110`：AgentOptions 三字段、CancelOptions.keepInbox、AgentStatus 两态及 disposal 非状态、whenIdle/runMaintenance/cancel(cause) 契约。
5. `agent-loop/src/index.ts:296-330`：AgentLoop inject 五服务、Config schema、maxParallelToolCalls read-through 注释、identity 互斥校验。
6. `session/src/types.ts:58-98`：SessionHeader 全部治理字段注释——version no migration、seedLength 区分父史、origin 仅展示分类、delegationDepth 跨重启存活、agentPreset 决定 tools/prompt。

## 决策

1. 核心不变量定为创建经 factory 抽象、身份/血缘/深度/preset 持久化于 header、event log 唯一权威、并行有上限且按序提交。
2. 用“插座标准”类比 Cordis 契约层；随后给出三层分离与 initiator 边界。
3. 用 flowchart 表达宿主→容器→服务图，用 sequence diagram 表达 createAgent 顺序契约。
4. 新增反例覆盖绕过门面、depth 存内存、preset 不校验、origin 当可续聊证明、disposal 轮询、parallel 上限冻结、无 seedLength、cancel 无 cause。
5. 完整因果链采用 headless 子代理 resume：header 四字段如何在崩溃重启后恢复治理语义。

## Polish

1. 统一 service inject、factory slot、initiator chain、durable header、inbox boundary 术语。
2. 强调 SESSION_FORMAT_VERSION=0 与 header 字段注释的“诚实不兼容”哲学。
3. 设计取舍表补充迁移启示：先抽身份注册与事实层，再拆宿主装配。
4. 把 turn/step 细节留给 F-D2，工具执行细节留给 F-D3。

## Implementation Review

1. 用脚本核对新稿全部 15 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/03-frameworks/deepseek-harness/overview.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. profile-boot 完整装载顺序留待批量终审或部署专题。
2. Inbox splice/disposed 通知的事件负载未逐字段展开。
3. agentPreset 组合的具体定义位置待上游文档核对。

## 下一步

处理 F-D2《DeepSeek Harness Run 生命周期》。

## 部署检查

- 提交：`e25000a docs: rewrite deepseek harness overview`。
- 构建首次因 Front Matter 缺少闭合分隔线失败；修复后 `check:links` 与 build 通过，未触发连续两次失败停止条件。
- GitHub Actions：run `32614026961`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/03-frameworks/deepseek-harness/overview/` 可访问，并包含标题、AgentFactory、delegationDepth 和 seedLength。
