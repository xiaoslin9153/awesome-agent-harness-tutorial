# B-003：可运行、可视化与证据驱动的学习系统

## 状态

- `待手动激活`
- 创建日期：2026-08-22
- 执行前提：暂停当前写作任务，完成稳定检查点，且现有 TOC 与三家框架初稿达到可验证状态。

## 背景与目标

当前教材主线是文字、图和源码证据。为了让读者从“理解机制”进入“观察、操作和验证机制”，后续可以把产品从教程升级为可运行、可视化、证据驱动的 Agent Harness 学习系统。

本待办不改变当前写作主线，只保存候选方向；必须由维护者手动拆分和激活。

## 候选交互能力

| 方向 | 教学价值 | 依赖 |
| --- | --- | --- |
| Agent Run 模拟器 | 用 Mock Model 和 Mock Tool 展示 Run 状态、事件、工具调用、审批、取消和恢复。 | 确定性实验基座。 |
| Context 压缩可视化 | 展示原始上下文、清理过期工具输出、摘要压缩和恢复执行的过程。 | 上下文策略章节和固定输入样本。 |
| Failure Museum | 收录上下文溢出、副作用重复执行、权限继承过大、恢复后重复写文件和审批疲劳等故障模式。 | 故障脚本、Trace 和复现步骤。 |
| Policy / Sandbox Playground | 让读者调整只读、写入、网络、MCP 和子任务权限规则，观察 allow、deny 或 require approval。 | 策略模型和安全实验。 |
| Trace Explorer | 展示 prompt 版本、模型响应、工具结果、耗时、token、错误和重放路径。 | 结构化 Trace schema。 |
| 面试系统设计模板 | 提供设计 Coding Agent Runtime、安全 MCP 控制面和可恢复长任务的答题框架。 | 概念、机制和对比内容成熟。 |

## 候选内容扩展

1. 生产就绪检查表：状态持久化、幂等工具、权限边界、审计日志、成本预算、降级策略和评测门禁。
2. 设计模式 / 反模式库：Read-only Parallelism、Two-stage Compaction、Authority Contract for Subagents、Trajectory Persistence。
3. 框架选型决策树：区分 CLI 型、服务型、IDE 型和多 Agent 编排型场景。
4. Harness Atlas：把 C01-C25 从内部对比维度扩展为公开索引，每维连接理论解释、三家实现对比和最小实验。

## 外部参考信号

以下材料只作为趋势证据，不直接复制结论：

1. UNU《Engineering and Governing the Agent Harness》总结 bounded iteration、read-only parallelism、two-stage context compaction、resumable sessions、lifecycle hooks 和 provider abstraction 等趋同模式。
2. Anthropic 的沙箱工程文章讨论审批疲劳、OS 级隔离和子任务信任升级。
3. Microsoft 的 MCP 控制面文章提出在工具发现与执行之间加入确定性策略、定义扫描、响应检查和审计重放。
4. Inference Engineering 展示动画、计算器、测验和进度追踪对交互式技术书的增强效果。

## 分阶段建议

### Phase 1：完成教材基线

继续按 TOC 完成中文初稿和三家框架深拆，不扩大范围。

### Phase 2：建立 Labs

建立 `labs/` 规范、Mock Model、Mock Tool、事件记录和确定性重放基座。

### Phase 3：站点预留交互层

结合 B-002 的站点改造，为模拟器、图表、测验和进度追踪预留组件位置。

### Phase 4：按价值激活子项

优先级暂定为：Agent Run 模拟器 → Context 压缩可视化 → Failure Museum → Policy Playground → Trace Explorer → Harness Atlas。

## 明确不做

1. 未激活前不自动实现。
2. 不引入账号体系、评论系统、付费课程或自定义域名。
3. 第一版不做 PDF 出版。
4. 不为了互动牺牲静态站点的性能和无障碍要求。
