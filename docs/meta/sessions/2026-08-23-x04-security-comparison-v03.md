# 会话：X-04 安全与审批对比 v0.3 重写

## 状态与目标

- 状态：已完成。
- 日期：2026-08-23。
- 目标：把 `tutorial/zh-CN/04-comparisons/security.md` 升级到 v0.3 标准，完成 Polish 和 Implementation 自检，同步状态记录，并通过链接检查、构建、提交推送和线上页面验证。
- 范围内：只修订 X-04 公开章节及其 TOC、Backlog、进度表和会话记录。
- 范围外：不修改 `external/`，不更新快照 commit，不批量终审其他章节，不推进 X-06。

## 已完成内容

1. 审计旧稿：旧稿已有统一决策链、三家摘要和取舍，但缺少 learning contract、第二个 Mermaid 图、带因果解释的故障模式清单、完整因果链、显式锚点表和当日 Implementation pass。
2. 复核继承证据：重新打开 M-06/M-07/M-16 引用的 Reasonix approval/control/sandbox/writable roots、DeepSeek tools/sandbox 和 Pi types/loop/extensions 源码区间。
3. 重写章节：新增信任输入图和安全决策链、九个评估问题、核心不变量、初学者三层解释、七条故障链、README 注入完整因果链、设计取舍、25 个 path:line 锚点和实现精妙之处。
4. Front Matter 记录主 Agent Polish 和 Implementation Review 均通过。
5. 同步 TOC 中 X-04 状态、B-004 执行顺序和总进度表 X03/X04 行。

## 决策与证据

1. 继续遵守比较章约束：不引入新快照或新源码事实；所有行为继承 M-06/M-07/M-16 的固定快照结论。
2. 把「项目信任」明确限制为资源加载闸门，把强制隔离留给 OS 或外部环境，避免读者误用 Pi 信任开关。
3. 保留 DeepSeek 审批四态语义，强调 rejected、cancelled、unavailable 的用户体验和审计差异。
4. 固定快照为 Reasonix `aa82b2f`、DeepSeek Harness `b150a55`、Pi `c49906e`。

## 验证结果

| 门禁 | 结果 |
| --- | --- |
| 内容结构 | 2 张 Mermaid 图；7 个带因果解释的故障模式；1 条覆盖触发、策略判断、状态变化、观察和后续影响的因果链。 |
| 源码锚点 | 章内含 25 处 path:line 引用，全部来自已核对的 M-06/M-07/M-16 锚点范围。 |
| 链接检查 | `cd site && npm run check:links` 通过，检查 45 个文件。 |
| 本地构建 | `cd site && npm run build` 通过，构建 44 个页面。 |
| Git 检查 | `git diff --check` 通过；变更限定在 X-04 及必要状态同步。 |
| 提交部署 | 重写提交 `c625352` 推送成功；Deploy Pages run `32627937804` 成功。 |
| 线上页面 | `/zh-CN/04-comparisons/security/` 返回 HTTP 200，并包含标题、故障模式和完整因果链。 |

## 开放问题

1. 批量 Implementation 终审时需逐条复核 M-06/M-07/M-16 与本章对照表在最终版本中的行号一致性。
2. Pi 外置 Gondolin/Docker/OpenShell 方案属于宿主部署文档结论，本章只作为集成边界说明；未在本章重复声明为源码级强制层。

## 下一步

1. X-04 重写、本地验证、提交推送和线上检查已完成。
2. 下一次迭代处理 X-06《设计模式与反模式》。
3. 批量终审时统一复核 M-06/M-07/M-16 与 X-04 对照表。
