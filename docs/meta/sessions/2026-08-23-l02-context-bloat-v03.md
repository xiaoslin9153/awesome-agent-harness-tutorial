# 会话：L-02 Context 膨胀实验 v0.3 重写

## 状态与目标

- 状态：进行中，待提交和部署验证。
- 日期：2026-08-23。
- 目标：把 `tutorial/zh-CN/05-labs/context-bloat.md` 升级到 v0.3 标准，核对并执行真实实验命令，完成 Polish 和 Implementation 自检，同步状态记录并通过部署检查。
- 范围内：只修订 L-02 公开章节及其 TOC、Backlog、进度表和会话记录。
- 范围外：不修改 `labs/context-bloat` 代码，不修改 `external/`，不推进 L-03，不开始批量终审。

## 已完成内容

1. 审计旧稿：旧稿已有数据流图和核心观察，但缺少 learning contract、理想模型图、机制深拆、故障链、完整因果链、显式源码行号和真实命令输出。
2. 核对实验实现：读取 `src/context.mjs`、`src/run.mjs`、测试和 README，确认零依赖 ESM、code point/4 估算、pinned-first、newest-to-oldest、dropped 审计和 pinned 溢出抛错。
3. 执行验证：
   - `npm start` 输出 naive 114 tokens / selected 8，bounded 56/64 tokens / selected `system,task,correction,obs-5`。
   - dropped 精确为 `obs-4`(15)、`obs-3`(15)、`obs-2`(14)、`obs-1`(14)，原因均为 budget。
   - `npm test` 通过 4 项检查。
   - 额外验证 pinned 溢出输出 `Pinned messages exceed context budget`，以及三消息 8-token 小样本 selected `system,new`、dropped `old`。
4. 重写章节：新增预算流程图和请求审计图、逐条成本表、7 条故障模式、完整因果链、设计取舍、本地代码锚点和 M-02 框架对照。
5. Front Matter 记录主 Agent Polish 与 Implementation Review 通过。
6. 同步 TOC 中 L-02 状态、B-004 执行顺序和进度表 L01 行。

## 决策与证据

1. 不修改 lab 代码；当前实现已能覆盖教学不变量，本章只修正描述差并补充验证证据。
2. 把 dropped 明确定义为审计事实，而不是垃圾数据；selected 解释模型看到什么，dropped 解释模型没看到什么。
3. 字符估算只作为策略预判；章节明确它与 Provider tokenizer、图片、schema 和计费口径的边界。
4. 框架对照引用 M-02 的固定快照结论：Reasonix `aa82b2f`、DeepSeek Harness `b150a55`、Pi `c49906e`；本章不新增源码锚点。

## 验证结果

| 门禁 | 结果 |
| --- | --- |
| 实验运行 | `cd labs/context-bloat && npm start` 成功。 |
| 实验测试 | `cd labs/context-bloat && npm test` 成功，4 checks passed。 |
| 失败路径 | 手动执行 pinned overflow，得到预期异常文本。 |
| 内容结构 | 2 张 Mermaid 图；7 个带因果解释的故障模式；1 条完整因果链。 |
| 源码锚点 | 引用 `labs/context-bloat/src/*.mjs` 和 test 的存在行号区间。 |
| 链接检查 | `cd site && npm run check:links` 通过，检查 45 个文件。 |
| 本地构建 | `cd site && npm run build` 通过，构建 44 个页面。 |
| Git 检查 | `git diff --check` 通过；变更限定在 L-02 及必要状态同步。 |
| 提交部署 | 待执行。 |

## 开放问题

1. 批量终审需在不同 Node LTS 复跑实验，确认 Unicode code point 迭代和 ESM 行为说明仍准确。
2. 若后续把 token 估算、priority 元数据或预算配置参数化，必须同步更新本章「参数与环境」和取舍表。

## 下一步

1. 只提交本章及状态同步文件，推送后检查 GitHub Actions 和线上页面。
2. 回填部署证据并标记会话完成。
3. 下一次迭代处理 L-03《Tool 重试副作用实验》。
