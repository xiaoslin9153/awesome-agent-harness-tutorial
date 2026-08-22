---
date: 2026-08-23
topic: C-01 深度样板重写
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

## 变更文件

- 重写 `tutorial/zh-CN/01-core-concepts/agent-vs-harness.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 更新 `docs/product/progress-tracker.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links`：45 个 Markdown 文件通过。
2. `cd site && npm run build`：44 页构建成功，页面 HTML 包含新增标题。
3. 核对全部关键源码锚点存在；发现旧桌面锚点缺仓库根前缀并已修正。
4. `git diff --check` 通过。

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
2. 请维护者审阅 C-01 样板。
3. 确认风格后再重写 C-02。
