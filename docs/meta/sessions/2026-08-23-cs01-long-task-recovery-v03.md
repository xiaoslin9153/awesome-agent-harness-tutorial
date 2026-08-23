# 会话：CS-01 长任务中断恢复 v0.3 重写

## 状态与目标

- 状态：已完成。
- 日期：2026-08-23。
- 目标：把 `tutorial/zh-CN/06-case-studies/long-task-recovery.md` 升级到 v0.3 标准，执行真实恢复实验并核对边界语义，完成 Polish 与 Implementation 自检，同步记录并完成部署检查。
- 范围内：只修订 CS-01 公开章节及其 TOC、Backlog、进度表和会话记录。
- 范围外：不修改 `labs/long-task-recovery` 代码，不修改 `external/`，不推进 CS-02，不开始批量终审。

## 已完成内容

1. 审计旧稿：旧稿已有恢复流程和观察点，但缺少 learning contract、理想状态机、决策流图、故障链、完整因果链、显式源码行号和真实输出证据。
2. 核对实现：读取 recovery、runner 和测试，确认 checkpoint 只取 effect、fingerprint/lease 校验、replayed/effect 分离、拒绝分支不写账和步骤切片逻辑。
3. 执行验证：
   - 无状态对照重复 `scan/patch/test` 三个副作用。
   - checkpoint 为 schemaVersion 1、`/workspace/demo@abc123`、completedSteps `scan,patch`、nextStep `test`。
   - 有效恢复只执行 `test,publish`，事件为 2 个 replayed、2 个 effect、1 个 completed。
   - revision 漂移返回 environment_drift；额外实测租约不匹配返回 lease_conflict。
   - 额外验证四步全闭合时 replay 全部、executedSteps 为空。
   - `npm test` 通过 3 条路径。
4. 重写章节：新增恢复状态机和决策流、7 条故障模式、崩溃后恢复完整因果链、设计取舍、本地代码锚点和 M-10/M-11 框架对照。
5. Front Matter 记录主 Agent Polish 与 Implementation Review 通过。
6. 同步 TOC 中 CS-01 状态、B-004 执行顺序和进度表 L01 行。

## 决策与证据

1. 不修改 lab 代码；实测发现 nextStep 只是标注，恢复权威来自 completedSteps，教材如实声明该边界。
2. 把 replayed 与 effect 分离作为核心审计不变量，避免恢复过程伪装成新副作用。
3. 拒绝分支不写 events/effects，只返回 checkpoint 证据，防止「拒绝恢复」污染账本。
4. 框架对照引用 M-10/M-11 的固定快照结论：Reasonix `aa82b2f`、DeepSeek Harness `b150a55`、Pi `c49906e`；本章不新增源码锚点。

## 验证结果

| 门禁 | 结果 |
| --- | --- |
| 实验运行 | `cd labs/long-task-recovery && npm start` 成功并输出完整 JSON。 |
| 实验测试 | `cd labs/long-task-recovery && npm test` 成功，3 paths passed。 |
| 边界验证 | 租约冲突拒绝；全闭合 checkpoint 零新 effect。 |
| 内容结构 | 2 张 Mermaid 图；7 个带因果解释的故障模式；1 条完整因果链。 |
| 源码锚点 | 引用 `labs/long-task-recovery/src/*.mjs` 和 test 的存在行号区间。 |
| 链接检查 | `cd site && npm run check:links` 通过，检查 45 个文件。 |
| 本地构建 | `cd site && npm run build` 通过，构建 44 个页面。 |
| Git 检查 | `git diff --check` 通过；变更限定在 CS-01 及必要状态同步。 |
| 提交部署 | 重写提交 `f3d0882` 推送成功；Deploy Pages run `32630642733` 成功。 |
| 线上页面 | `/zh-CN/06-case-studies/long-task-recovery/` 返回 HTTP 200，并包含标题、故障模式和完整因果链。 |

## 开放问题

1. 生产迁移需补齐租约 TTL/心跳、外部副作用对账、依赖与镜像指纹和 schema 迁移；本章已在失效边界声明。
2. 批量终审需在不同 Node LTS 复跑实验，确认 ESM 和 structuredClone 行为说明仍准确。

## 下一步

1. CS-01 重写、实验执行、本地验证、提交推送和线上检查已完成。
2. 下一次迭代处理 CS-02《多 Agent 委派失败》。
3. 批量终审时在不同 Node LTS 复跑恢复实验。
