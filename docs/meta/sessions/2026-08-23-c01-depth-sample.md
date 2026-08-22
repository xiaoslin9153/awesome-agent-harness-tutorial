---
date: 2026-08-23
topic: C-01 深度样板重写、语言润色与 v0.3 补齐
status: 已完成
---

# C-01 深度样板重写

## 目标

执行 `B-004` 第三步的首个基准章节：用新写作流水线和 TOC 学习契约重写 `agent-vs-harness.md`，验证「初学者能读懂原理、工程师能看到源码证据」的双读者结构。

## 范围

- 范围内：C-01 公开章节、TOC 状态、总进度表和本会话记录。
- 范围外：C-02 及后续章节重写、第三章框架页扩展、批量事实审查。

## Draft 与 Implementation 依据

先读取旧章节，再核对固定快照源码：

1. Reasonix `aa82b2f`：`internal/agent/agent.go:280` 定义 Agent 聚合 Provider、Registry 和 Session；`:1239` 的 `Run` 驱动工具循环；`:300-315` 区分 Plan Mode、构造期只读执行和 mutation barrier；Boot Runtime 位于 `internal/boot/runtime.go:96`。
2. DeepSeek Harness `b150a55`：`packages/core/agent/src/runtime-types.ts:64-74` 把 Session 日志定义为 durable source of truth；`ReactLoopAgent` 在 `packages/core/agent-loop/src/agent.ts:80-97` 从 Session 派生 last turn；工厂服务在 `index.ts:296-297` 注入 sessions、llm、tools 和 systemPrompt。
3. Pi `c49906e`：通用 `Agent` 在 `packages/agent/src/agent.ts:167-181` 声明状态、上下文转换、模型流和工具回调；Coding SDK 在 `sdk.ts:304-400` 装配流函数、Session Manager 和工具集；`agent-session.ts:484-504` 用 `beforeToolCall` 接入 Extension Runner。

所有外部理论表述保持为理想模型；框架行为均绑定 commit 和路径锚点。

## 决策

1. 采用「上一章问题 → 本章矛盾 → 不变量 → 理想模型 → 初学者主线 → 深拆 → 反例 → 取舍 → 三家实现 → 精妙之处 → 追问 → 下一章」结构。
2. 初学者主线保留实验室类比，但明确说明失效边界：只要出现副作用或多步任务，四类 Harness 能力不可省略。
3. 反例从 3 个增加到 4 个，覆盖无控制面循环、包名误判、UI 审批旁路和 CLI 直接服务化。
4. 每家实现不只写「支持什么」，还解释装配关系、状态所有权、失败分支和设计代价。
5. Front Matter 记录主 Agent 已完成 Polish 和 Implementation Review；章节仍保持 `draft`，等待维护者终审后才考虑改发布状态。

维护者反馈深度可以接受但语言生硬后，追加第二遍 Polish：

1. 把「这是第一章第一节。读者带着一个常见误解进入本书」改写成更自然的引入。
2. 将反例和实现分析中的短列表腔改成有因果推进的段落。
3. 保留所有源码锚点、技术结论、图、表格和学习契约不变。
4. Front Matter 的 Polish 摘要更新为「完成第二遍语言润色，降低列表腔和翻译腔」。

## 2026-08-23 v0.3 九层复审补齐

维护者确认方向为「翔实而不是简略，深入浅出而不机械」后，用九层展开法复审 C-01，发现并补齐五处缺口：

1. **定义**：新增 Agent、Harness 和 Runtime 的精确口径，避免类比代替定义。
2. **直觉边界**：说明实验室类比的失效点——Harness 只能约束真正接入的执行路径。
3. **参数与环境**：补充本地 CLI、桌面和服务端对控制面闭环的不同要求。
4. **失败路径**：新增反例 5「把恢复误当成自动重放」，并显式声明恢复细节交给 Checkpoint / Persistence 章节。
5. **迁移取舍**：在理论取舍后增加从零实现最小 Harness 的四步迁移路径。

Polish 摘要更新为已按 v0.3 九层法补齐上述内容。所有源码锚点和框架结论未改动；本次只补理论与工程解释层。

## 变更文件

- 重写 `tutorial/zh-CN/01-core-concepts/agent-vs-harness.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 更新 `docs/product/progress-tracker.md`
- 新增本会话记录

## 验证

1. 第二遍润色后重新执行 `cd site && npm run check:links`：45 个 Markdown 文件通过。
2. v0.3 补齐后再次执行链接检查：45 个文件通过。
3. 再次构建：44 页成功；HTML 包含精确定义、宿主差异、反例 5 和迁移路径标记。
4. 首次重写时核对全部关键源码锚点；已修正旧桌面锚点的仓库根前缀。
5. 三轮变更均执行 `git diff --check` 并通过。

## 自检

- 章节包含至少 4 个反例、一条完整因果链、两张 Mermaid 图和三段注释化源码片段。
- 理想模型与真实实现分离；未把类比写成框架事实。
- 未提交 `external/`、构建产物或密钥信息。

## 开放问题

1. 当前篇幅约 330 行，是否作为后续机制章节的长度基准仍需维护者确认。
2. Reasonix Boot Runtime 一词容易和 OS Runtime 混淆，可能需要术语表补充分辨说明。
3. C-02 若沿用本章结构，需要在开头显式继承「谁控制 Run 状态迁移」。

## 下一步

1. 提交、推送并检查部署。
2. 请维护者复核 v0.3 补齐后的 C-01。
3. 确认后再按同一方法重写 C-02。
