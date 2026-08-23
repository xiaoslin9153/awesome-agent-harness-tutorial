# 会话：L-03 Tool 重试副作用实验 v0.3 重写

## 状态与目标

- 状态：已完成。
- 日期：2026-08-23。
- 目标：把 `tutorial/zh-CN/05-labs/retry-side-effects.md` 升级到 v0.3 标准，执行真实实验并核对其状态语义，完成 Polish 与 Implementation 自检，同步记录并完成部署检查。
- 范围内：只修订 L-03 公开章节及其 TOC、Backlog、进度表和会话记录。
- 范围外：不修改 `labs/retry-side-effects` 代码，不修改 `external/`，不推进 L-04，不开始批量终审。

## 已完成内容

1. 审计旧稿：旧稿已有三条路径和决策图，但缺少 learning contract、理想模型、机制深拆、故障链、完整因果链、源码行号和实际输出证据。
2. 核对实现：读取 service、runner 和测试，确认 attempts/tickets 分离、幂等 Map、UNKNOWN_STATE 携带 ticketId、catch 中即时 markRequiresHuman、无键未知返回 null。
3. 执行验证：
   - 无键两次调用得到 `ticket-1`、`ticket-2` 且 `duplicated:true`。
   - 同键重放 attempts 为 2、tickets 为 1，replay 带 `deduplicated:true`。
   - unknown-state 只尝试一次；first 即 `{status:"unknown", code:"UNKNOWN_STATE", result.requiresHuman:true}`。
   - 后续 lookup 是确认读取，不会二次升级。
   - `npm test` 输出 3 条路径通过。
4. 重写章节：新增状态图和决策流、7 条故障模式、UNKNOWN_STATE 完整因果链、设计取舍、本地代码锚点和 M-08 框架对照。
5. Front Matter 记录主 Agent Polish 与 Implementation Review 通过。
6. 同步 TOC 中 L-03 状态、B-004 执行顺序和进度表 L01 行。

## 决策与证据

1. 不修改 lab 代码。实测发现「即时升级」是当前实现的防御式语义，教材如实描述，不把后续 lookup 夸大成第二次升级。
2. 把 UNKNOWN_STATE 定义为独立状态，禁止映射为 failed 或触发二次 create。
3. 幂等键被定义为业务身份，而不是请求装饰；无键未知路径用于暴露无法查询的缺口。
4. 框架对照引用 M-08 的固定快照结论：Reasonix `aa82b2f`、DeepSeek Harness `b150a55`、Pi `c49906e`；本章不新增源码锚点。

## 验证结果

| 门禁 | 结果 |
| --- | --- |
| 实验运行 | `cd labs/retry-side-effects && npm start` 成功并输出完整 JSON。 |
| 实验测试 | `cd labs/retry-side-effects && npm test` 成功，3 paths passed。 |
| 内容结构 | 2 张 Mermaid 图；7 个带因果解释的故障模式；1 条完整因果链。 |
| 源码锚点 | 引用 `labs/retry-side-effects/src/*.mjs` 和 test 的存在行号区间。 |
| 链接检查 | `cd site && npm run check:links` 通过，检查 45 个文件。 |
| 本地构建 | `cd site && npm run build` 通过，构建 44 个页面。 |
| Git 检查 | `git diff --check` 通过；变更限定在 L-03 及必要状态同步。 |
| 提交部署 | 重写提交 `ef38430` 推送成功；Deploy Pages run `32629758827` 成功。 |
| 线上页面 | `/zh-CN/05-labs/retry-side-effects/` 返回 HTTP 200，并包含标题、故障模式和完整因果链。 |

## 开放问题

1. 批量终审需在不同 Node LTS 复跑实验，确认 ESM、structuredClone 和 JSON 输出说明仍准确。
2. 若后续把 unknown-state 注入方式或幂等键生成策略参数化，必须同步更新本章参数环境和完整因果链。

## 下一步

1. L-03 重写、实验执行、本地验证、提交推送和线上检查已完成。
2. 下一次迭代处理 L-04《审批拒绝恢复实验》。
3. 批量终审时在不同 Node LTS 复跑重试实验。
