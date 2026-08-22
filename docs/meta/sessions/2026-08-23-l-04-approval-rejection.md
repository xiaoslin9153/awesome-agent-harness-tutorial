---
date: 2026-08-23
topic: L-04 审批拒绝恢复实验初稿
status: 已完成
---

# L-04 审批拒绝恢复实验初稿

## 目标

完成 L-04 的中文 Draft 和 Polish；建立确定性审批拒绝与恢复实验，验证失败关闭、拒绝观察、替代申请和审计闭环，保留批量 Implementation Review 清单，通过链接与实验检查后做最小提交和推送。

## 范围

- 范围内：`tutorial/zh-CN/05-labs/approval-rejection.md`、`labs/approval-rejection/`、目录状态、本会话记录和总进度表。
- 范围外：真实 UI、身份系统、外部服务、站点改造和 B-001/B-002/B-003 待办。

## 记录与证据

- L-03 已由 `d8664ac` 推送，`main` 与 `origin/main` 同步且工作区干净。
- 实验使用确定性审批服务模拟批准、拒绝、越权重复申请和无法决策四种状态。
- 实验要验证三个不变量：未决或未知审批不执行副作用；拒绝必须生成可修正观察；每次决策和执行都进入同一审计序列。

## 成功标准

- `labs/approval-rejection` 有 README、package.json、可执行入口和离线测试。
- 实验覆盖批准执行、拒绝后替代路径、越权拒绝和无法决策四条路径。
- 教材说明审批对象、决策终态、请求投影、恢复流程和迁移检查单。
- Draft 与 Polish 完成，Implementation Review 保持 `pending`。
- 实验测试、两套链接检查和最小提交推送通过。

## 进展

- 2026-08-23：建立会话检查点，确认 L-04 依赖 M-06 并开始设计审批账本。
- 2026-08-23：实现审批服务、副作用账本和批准、拒绝、替代申请、无法决策四条路径。
- 2026-08-23：完成中文教材 Draft 与 Polish，补充状态机、终态契约、失败关闭、审计顺序和迁移检查单。
- 2026-08-23：执行 `cd labs/approval-rejection && npm start && npm test`，4 条路径通过；执行两套链接检查，44 个 Markdown 文件全部通过。

## 决策

- 把 `undecided` 与 `denied` 建模为不同错误码：前者失败关闭，后者提供可修正约束反馈。
- 拒绝后替代申请使用新审批 ID 和新资源：防止旧授权扩大到漂移后的意图。
- 只有 `approved` 能进入执行器：让副作用绑定明确决策。
- decision 与 effect 写入同一审计序列：保留授权与执行的因果关系。

## 自检

- 首次测试发现 undecided 被误报为 `APPROVAL_DENIED`；已增加独立的 `APPROVAL_UNDECIDED` 分支并通过。
- 实验输出确认两个已执行 ID、一个拒绝观察、一个未决观察，且未决路径没有副作用。
- 教材 Front Matter 记录 Polish 通过和 Implementation Review `pending`。
- 变更只包含 L-04 教材、对应实验、目录状态、会话记录和总进度表。

## 开放问题

- Implementation Review 仍需核对四条路径输出、未决行为、替代申请 ID 和框架审批机制。
- 当前实验未覆盖条件批准、审批过期、并发审批竞争和补偿流程。

## 下一步

1. 提交并推送 L-04 最小改动。
2. 按 TOC 顺序启动 CS-01 长任务中断恢复案例的 Draft。
3. 保持单主 Agent 串行流程，并把 Implementation Review 继续留在批量待办清单。
