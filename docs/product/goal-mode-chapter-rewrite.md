# Goal 模式章节重写运行手册

## 用途

本手册把 B-004 已验证的章节重写流程固化成 Goal Agent 可串行执行的标准流程。适用于 `tutorial/<locale>/` 下所有需要按 v0.3 详实方法论升级的章节。

## 硬性约束

1. 只使用主 Agent 一个执行者；不创建 Subagent 或并行任务。
2. 一次 Goal 迭代只处理一个章节或一个可独立说明的小节。
3. 每章必须先审计旧稿，再核对源码证据，再重写，最后验证、记录、提交、部署。
4. 不修改 `external/`；所有框架引用绑定固定快照 commit 和存在的 `path:line`。
5. 不把理想模型写成框架事实；不确定行为标 `未验证` 或留给对应机制章节。
6. Goal Agent 不得自动激活 `docs/product/backlog/` 中的待办。

## 每章标准流程

### 1. 审计旧稿

读取目标章节，对照九层展开法列出缺口：

1. 问题：解决什么矛盾？
2. 直觉：是否有准确类比和失效边界？
3. 定义：核心术语是否精确？
4. 正常路径：数据流、状态和调用顺序是否完整？
5. 参数与环境：宿主、配置和版本差异是否说明？
6. 失败路径：超时、取消、畸形输入、权限拒绝和部分副作用是否覆盖？
7. 常见误解：是否解释错误做法为什么看起来有效？
8. 真实实现：是否有 commit 和 `path:line`？
9. 取舍：收益、代价、替代方案和迁移路径是否齐全？

### 2. 核对源码证据

1. 在 `external/DeepSeek-Reasonix`、`external/deepseek-harness`、`external/pi` 中定位关键符号。
2. 记录固定快照 commit：Reasonix `aa82b2f`、DeepSeek Harness `b150a55`、Pi `c49906e`。
3. 每条框架行为至少有一个存在的 `path:line`；引用区间时首行必须可核对。
4. 不得引用未打开过的文件；不得把测试注释当成生产行为。

### 3. 按模板重写

章节结构必须覆盖：

```text
Front Matter + learning_contract
## 上一章遗留问题
## 本章解决什么矛盾
## 核心不变量
## 理想模型
## 初学者主线
## 机制深拆
## 反例与故障模式
## 一条完整因果链
## 设计取舍
## 框架实现对照
## 实现精妙之处
## 自检与面试追问
## 交给下一章的问题
## 相关页面
```

最低内容门禁：

1. 至少 5 个带因果解释的反例或故障模式。
2. 至少 1 条覆盖触发、状态变化、观察结果和后续影响的完整因果链。
3. 至少 2 张有明确用途的 Mermaid 图。
4. 每个抽象概念有「直觉 → 精确机制 → 失效边界」。
5. 每家框架有关键源码片段和实现代价。
6. 翔实优先；不为篇幅删除失败分支、宿主差异或迁移路径。

### 4. 自检

1. 核对文中全部 `path:line` 确实存在且符号匹配。
2. 检查 Front Matter、标题、表格、代码块、Mermaid 和相对链接。
3. 执行 `cd site && npm run check:links`。
4. 执行 `cd site && npm run build`。
5. Polish 与 Implementation Review 都由主 Agent 完成，并写入 Front Matter。

### 5. 同步记录

1. 更新 `tutorial/zh-CN/TOC.md` 中该章状态。
2. 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md` 的执行进度。
3. 新增 `docs/meta/sessions/YYYY-MM-DD-<chapter>-v03.md`，记录目标、证据、决策、验证和开放问题。
4. 如有范围变化，同步 `docs/product/progress-tracker.md`。

### 6. 提交与部署

1. `git diff --check`。
2. 只 add 当前章节、TOC、Backlog、会话记录和必要进度表。
3. Conventional Commits，例如 `docs: rewrite session state chapter`。
4. 推送后检查最新 GitHub Actions run 为 success。
5. 检查站点入口 HTTP 200 和受影响页面包含关键标题。
6. 部署结果写入当天章节会话记录。

## 推荐顺序

当前基准章节剩余：

1. C-04 `events-and-streaming.md`
2. Reasonix Run lifecycle 样本 `03-frameworks/reasonix/run-lifecycle.md`

基准确认后，再按 TOC 顺序处理 M-01 起的机制章节；每章仍按本手册串行执行。

## 停止条件

遇到以下情况必须停止并记录阻塞，不得继续批量推进：

1. 关键源码锚点无法验证。
2. 三家行为与现有对比账本冲突。
3. 链接检查或构建失败两次。
4. 工作区出现不属于当前章节的未跟踪文件。
5. 需要修改产品范围、框架快照或对比标准。
