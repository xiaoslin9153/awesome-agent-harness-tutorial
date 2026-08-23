---
date: 2026-08-23
topic: F-D3 DeepSeek Harness 工具与沙箱 v0.3 重写
status: 已完成
---

# F-D3 DeepSeek Harness 工具与沙箱 v0.3 重写

## 目标

按 Goal 运行手册重写 F-D3，把工具执行管线、四态审批、Code Mode 折叠、monotonic guard 与多后端 sandbox 链绑定到固定快照锚点。

## 范围

- 范围内：F-D3 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：F-P1 起 Pi 簇、ApprovalService 具体 UI 实现、shell escalation 平台细节。

## 旧稿审计

旧稿已有管线概述与 Landlock 表，但缺少 learning_contract、核心不变量失效边界、9 个反例、完整因果链和第二张 Mermaid 图；pending_review 未关闭；未核对 createExecution 三分支、prepare 三取消检查点、collapse 前置拒绝语义、runner chain probe 与 denial/failure 规则。

## 源码证据

1. `packages/core/tools/src/index.ts:1389-1451`：createExecution collapsed/unknown/aborted 分支；args deepFreeze；cancellationStates 初始化 bodyInvoked=false。
2. `index.ts:1463-1503`：三处 callerCancelled 检查（创建后、approvalCancelled 后、guard 后）；denial reason 转 error result。
3. `index.ts:1678-1729`：serviceAsk 无服务/无 agent degrade to deny；allowed-once/rejected/cancelled/unavailable 四态映射。
4. `index.ts:1100-1128`：guard monotonic deny，global 到 scope chain 取第一个 denial。
5. `index.ts:1527-1599`：dispatchToolBody fuse signals；body promise 达 quiescence 才标 ABORTED。
6. `index.ts:1731-1781`：post-execute accept/block/value 替换约束；failed result 不可替换 value。
7. `index.ts:1269-1285`：executionMode 仅精确 true 并行，异常 exclusive。
8. `packages/sandbox/sandbox/src/index.ts:118-157`：SandboxProvider confine fail closed；SANDBOX_UNAVAILABLE。
9. `sandbox-local/src/index.ts:500-539,305-344,205-240`：selectRunner probe walk；confine per-platform 组装与 operator runnerCommand；DENIAL_SIGNATURES 与 RUNNER_FAILURE_RULES（exit gate + fatal signature + informational 排除）。
10. `sandbox-local/src/profiles.ts:16-58`：bwrap/landlock/seatbelt profile 参数生成。

## 决策

1. 核心不变量定为并发 fail closed、ask 四态、guard 单调、collapse 先拒、取消不弃 promise、sandbox 失败关闭、post 不反转失败。
2. 归纳七段管线顺序并说明不可交换的原因（collapse 前置省审批资源）。
3. 用 flowchart 表达全管线分支，用 flowchart 表达 Code Mode 子调用 log-only 特性。
4. 新增反例覆盖 collapse 后置审批、并发异常仍并行、审批缺失默认 allow、cancelled/rejected 同文案、guard force-allow、post 反转失败、弃 body promise、退出码误判、跨方言 union。
5. 完整因果链采用 Linux bash：ask 批准、exclusive 调度、bwrap confine、dialect 判 denial、caller cancel 转 aborted、Session 收 sourceEventSeqs 结果。

## Polish

1. 统一 collapse denial、four-outcome ask、runner chain probe、denial dialect、runner failure rule 术语。
2. 机场流程类比只承担入门；随后给出 createExecution 三分支与 prepare 三检查点。
3. 设计取舍表补充 operator runnerCommand 的半配置风险。
4. 明确 Code Mode bridge 内子调用继承父能力面的信任模型。

## Implementation Review

1. 用脚本核对新稿全部 12 个锚点区间均在文件范围内。
2. 核对至少 9 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/03-frameworks/deepseek-harness/tools-sandbox.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. ApprovalService 具体 UI 实现留待部署专题。
2. shell escalation 各平台差异留待安全进阶。
3. deferred contexts 的完整消费路径待 F-D2 关联审阅。

## 下一步

DeepSeek Harness 三章完成。处理 F-P1《Pi 架构总览》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
