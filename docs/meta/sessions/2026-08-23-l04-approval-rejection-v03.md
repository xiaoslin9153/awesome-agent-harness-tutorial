# 会话：L-04 审批拒绝恢复实验 v0.3 重写

## 状态与目标

- 状态：已完成。
- 日期：2026-08-23。
- 目标：把 `tutorial/zh-CN/05-labs/approval-rejection.md` 升级到 v0.3 标准，执行真实实验并核对其审计语义，完成 Polish 与 Implementation 自检，同步记录并完成部署检查。
- 范围内：只修订 L-04 公开章节及其 TOC、Backlog、进度表和会话记录。
- 范围外：不修改 `labs/approval-rejection` 代码，不修改 `external/`，不推进 CS-01，不开始批量终审。

## 已完成内容

1. 审计旧稿：旧稿已有状态机和四个观察点，但缺少 learning contract、理想模型图、机制深拆、故障链、完整因果链、显式源码行号和实际审计序列。
2. 核对实现：读取 service、runner 和测试，确认 approved-only execute、denied/undecided 分类、唯一审批 ID、同序 audit、blocked effect 记录和 structuredClone 读取。
3. 执行验证：
   - 四条主路径分别为 executed、denied、executed、undecided。
   - 审计共 6 条：approve-public decision/effect、deny-private decision、approve-alternative decision/effect、timeout-public decision。
   - `executedIds` 为 `["approve-public","approve-alternative"]`。
   - 额外验证重复 ID 异常 `Approval id already exists: x` 和 denied approval 直接 execute 时 audit 追加 blocked effect。
   - `npm test` 通过 4 条路径。
4. 重写章节：新增状态机与决策流两张 Mermaid 图、7 条故障模式、从拒绝到替代授权的完整因果链、设计取舍、本地代码锚点和 M-06 框架对照。
5. Front Matter 记录主 Agent Polish 与 Implementation Review 通过。
6. 同步 TOC 中 L-04 状态、B-004 执行顺序和进度表 L01 行。

## 决策与证据

1. 不修改 lab 代码；当前实现已覆盖教学不变量，本章如实描述「即时双重检查」和 blocked effect 语义。
2. 明确区分 denied 与 undecided：前者是约束反馈，后者是缺少有效决策，必须失败关闭。
3. 强调新意图新 ID：资源变化后不能复用旧授权；重复 ID 快速失败是因果完整性的一部分。
4. 框架对照引用 M-06 的固定快照结论：Reasonix `aa82b2f`、DeepSeek Harness `b150a55`、Pi `c49906e`；本章不新增源码锚点。

## 验证结果

| 门禁 | 结果 |
| --- | --- |
| 实验运行 | `cd labs/approval-rejection && npm start` 成功并输出完整 JSON。 |
| 实验测试 | `cd labs/approval-rejection && npm test` 成功，4 paths passed。 |
| 边界验证 | 重复 ID 抛错；非 approved execute 追加 effect/blocked。 |
| 内容结构 | 2 张 Mermaid 图；7 个带因果解释的故障模式；1 条完整因果链。 |
| 源码锚点 | 引用 `labs/approval-rejection/src/*.mjs` 和 test 的存在行号区间。 |
| 链接检查 | `cd site && npm run check:links` 通过，检查 45 个文件。 |
| 本地构建 | `cd site && npm run build` 通过，构建 44 个页面。 |
| Git 检查 | `git diff --check` 通过；变更限定在 L-04 及必要状态同步。 |
| 提交部署 | 重写提交 `4a5d9da` 推送成功；Deploy Pages run `32630182164` 成功。 |
| 线上页面 | `/zh-CN/05-labs/approval-rejection/` 返回 HTTP 200，并包含标题、故障模式和完整因果链。 |

## 开放问题

1. 批量终审需在不同 Node LTS 复跑实验，确认 ESM、structuredClone 和 JSON 输出说明仍准确。
2. 生产迁移还需补齐过期时间、撤销、条件批准、并发弹窗去重和 denial dedupe；本章已在失效边界中声明。

## 下一步

1. L-04 重写、实验执行、本地验证、提交推送和线上检查已完成；第五章实验初稿升级完成。
2. 下一次迭代处理 CS-01《长任务中断恢复》。
3. 批量终审时在不同 Node LTS 复跑审批实验。
