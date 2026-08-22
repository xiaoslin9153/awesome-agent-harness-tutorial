---
date: 2026-08-23
topic: M-01 Context 组装与分层 v0.3 重写
status: 已完成
---

# M-01 Context 组装与分层 v0.3 重写

## 目标

按 Goal 运行手册重写 M-01，回答 C-04 留下的“哪些事实进入下一次模型请求”，并把理想分层绑定到三家固定快照的真实组装路径。

## 范围

- 范围内：M-01 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：M-02 压缩算法质量、工具 Schema 设计细节、跨框架对比页和批量终审。

## 旧稿审计

旧稿已有层次表和基本机制，但缺少 learning_contract、核心不变量失效边界、7 个反例、完整因果链和第二张 Mermaid 图；框架对照只有目录级 pending_review；没有区分 Reasonix 两级预算、DeepSeek Harness surface/header 和 Pi 编译式 prompt 的不同架构。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/context_manager.go:68-153` 核对 Prepare 单飞入口、pre-interceptor 估算、fold/hard threshold、stuck input hash、prune 与 foldContext 调用。
   - `context_manager.go:156-214` 核对 pressure 最多两次 summary、stale context 阻断、overflow/manual 失败语义。
   - `sampling_request.go:88-155` 核对 admission 失败后的一次 overflow recovery、projection version、CreatedAt 移除、role projection、`context.prepare`、tools/request intercept。
2. DeepSeek Harness `b150a55`：
   - `packages/core/session/src/index.ts:701-747` 核对 surface 是唯一消息来源、derived cache generation、raw chunk 不入 transcript、replace 重建、deep-frozen 快照。
   - `packages/core/agent-loop/src/agent.ts:225-243,332-341,440-513` 核对 preStep 组装 dynamic contexts、deriveMessages、request waterfall、canonical request header/context。
   - `packages/core/system-prompt/src/index.ts:52-120,142-178,204-255` 核对 named sections/contexts/tools、order 约定、toolOrder rest marker、严格变量渲染和 supersede 快照。
3. Pi `c49906e`：
   - `packages/coding-agent/src/core/resource-loader.ts:119-157,515-530` 核对全局与祖先 context files 去重、资源刷新和 override。
   - `packages/coding-agent/src/core/agent-session.ts:1035-1067,1220-1283,540-560` 核对 valid tool snippets/guidelines 构建 base prompt、pending next-turn 消息、extension messages/systemPrompt override。
   - `packages/coding-agent/src/core/system-prompt.ts:8-72,121-161` 核对带 path 的 `<project_instructions>`、skills 和 cwd。
   - `packages/coding-agent/src/core/extensions/runner.ts:1081-1145` 核对 before_agent_start handlers 收集 custom message 与 modified systemPrompt。

## 决策

1. 核心不变量定为来源分离、可审计、每请求重建、预算显式、扩展受控。
2. 归纳三种架构：durable log 派生、内存会话加维护入口、编译式 prompt 加运行时 state。
3. 用 sequence diagram 表达固定 hook、预算 admission、超限恢复和请求头记录。
4. 新增反例：复用 wire payload、插件绕过预算、改写回写日志、项目文件热更新失败、header 无变化规则、检索当事实、相似工具乱序。
5. 完整因果链覆盖第 12 轮请求：AGENTS.md 更新、pre-step 注入、hard ceiling、prune/overflow recovery、冻结请求和审计。
6. 明确把摘要质量留给 M-02，把工具 Schema 设计留给 M-03。

## Polish

1. 统一权威日志、可见投影、请求头、动态快照、临时注入和 admission 术语。
2. 每个关键抽象按直觉、精确机制、失效边界展开；工作包类比只承担入门，不替代字段级说明。
3. 设计取舍表补充适用条件和四步迁移路径。
4. 三家对照分别提炼实现代价：Reasonix 区分 stable shape/wire shape；DeepSeek Harness 维护 generation cache；Pi 处理 base prompt 复位。

## Implementation Review

1. 用脚本核对新稿全部 13 个外部锚点起止行在文件范围内。
2. 核对至少 7 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/context-assembly.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix summary 的具体保留策略和锚点重建留待 M-02。
2. DeepSeek Harness runtimeContext.project 的完整 replace/fold 语义留待 M-02。
3. Pi compaction 的 branch summary 触发条件留待 M-02 或 Pi 特色章节。
4. 工具声明顺序对模型选择的影响实验留待评测阶段。

## 下一步

按依赖顺序处理 M-02《Context 压缩与截断》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
