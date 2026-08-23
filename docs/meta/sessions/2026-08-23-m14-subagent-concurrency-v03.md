---
date: 2026-08-23
topic: M-14 Sub-agent 与并发 v0.3 重写
status: 已完成
---

# M-14 Sub-agent 与并发 v0.3 重写

## 目标

按 Goal 运行手册重写 M-14，把“并行收益是否放大失控风险”落到三家固定快照的 SubagentScheduler、durable parent-child 域、file mutation queue 和 batch terminate 规则。

## 范围

- 范围内：M-14 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：Cost/Latency 预算（M-15）、多租户队列产品、评测基准和跨框架对比页。

## 旧稿审计

旧稿已有任务契约和汇合策略，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix scheduler 配额/nested fail fast/parent claims、DeepSeek Harness durable child catalog、Pi terminate hint。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/scheduler.go:36-55`：SubagentScheduler 服务 task/fleet/parallel_tasks/profile skills/nested；maxTotal/maxWriters；parentClaims 不占子槽。
   - `scheduler.go:78-107`：non-nested FIFO vs nested fail fast，错误文案解释 deadlock 风险；release exactly once。
   - `scheduler.go:305-332`：total/writer 上限、whole-workspace conflict、path overlap、parent write conflict 的具体 reason。
   - `scheduler.go:199-226`：ReserveParentWrite conflict fails immediately，release once 并 pump waiters。
2. DeepSeek Harness `b150a55`：
   - `packages/host/apiproxy/src/api/subagents.ts:1-4,13-36,48-63`：persisted reads never activate Agent；continuable prompts 经 live direct parent；child entry activity/hasChildren/mode/diagnostic；SubagentAddress 由 parent+child+mode 组成。
3. Pi `c49906e`：
   - `packages/coding-agent/src/core/tools/file-mutation-queue.ts:16-61`：realpath key 同文件串行不同文件并行。
   - `packages/agent/src/types.ts:61-69,371-374`：terminate hint 与 shouldTerminateToolBatch 全员一致才提前结束批次。

## 决策

1. 核心不变量定为并发显式声明、权限不升级、写路径唯一、嵌套防死锁、分支可观测、取消全树传播。
2. 区分 parallel tool calls 与 subagents 两类并发及各自隔离手段。
3. 用 flowchart 表达拆分→claim→join，用 state diagram 表达 FailedFast/WriteConflict/Cancelled 分支。
4. 新增反例覆盖依赖任务强行并行、同文件双写、父写放行子写、嵌套排队死锁、继承凭据、迟到分支覆盖、opaque 声明过窄、取消不传子树。
5. 完整因果链采用三模块重构：路径分区 claim、父 edit 触发 B 冲突 fail fast、重试后 join，迟到结果 superseded。

## Polish

1. 统一 concurrency slot、writer claim、parent reservation、one-shot/continuable、join contract 术语。
2. 装修队类比只承担入门，随后给出三类配额与冲突判定规则。
3. 设计取舍表补充 opaque whole-workspace lock 的代价。
4. 明确 Pi 核心无通用 subagent scheduler，跨流编排在宿主层。

## Implementation Review

1. 用脚本核对新稿全部 9 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/subagent-concurrency.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix WritePathSet 的提取算法（含 bash 分类）留待 M-07/M-14 进阶。
2. DeepSeek Harness continuable prompt 的 inbox 协议细节未逐行展开。
3. Pi 跨 AgentSession 编排需要宿主实验验证。
4. join 评分函数设计留待评测阶段。

## 下一步

处理 M-15《Cost 与延迟》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
