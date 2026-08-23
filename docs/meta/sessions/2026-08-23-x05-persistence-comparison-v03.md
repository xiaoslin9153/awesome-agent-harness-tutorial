# 会话：X-05 持久化与恢复对比 v0.3 重写

## 状态与目标

- 状态：已完成。
- 日期：2026-08-23。
- 目标：把 `tutorial/zh-CN/04-comparisons/persistence.md` 升级到 v0.3 标准，完成 Polish 和 Implementation 自检，同步索引记录，并通过本地构建和线上部署检查。
- 范围内：只修订 X-05 公开章节及其 TOC/Backlog/进度/会话同步文件。
- 范围外：不修改 `external/`，不引入新快照 commit，不批量终审其他章节，不推进 X-06。

## 已完成内容

1. 审计旧稿：旧稿已有存储模型和取消重试摘要，但缺少 learning contract、完整因果链、第二个 Mermaid 图、带因果解释的故障模式和显式源码锚点表。
2. 核对继承证据：复核 M-10/M-11 中三家锚点对应的当前 `external/` 内容，确认 Reasonix CAS/WAL、DeepSeek resume/version/event 模型、Pi runtime/migration/JSONL tree 的行为描述一致。
3. 重写公开章节：补充统一生命周期图、三类数据所有权图、七个故障模式、一条崩溃后 open tool call 的完整因果链、设计取舍、框架对照表和实现精妙之处。
4. 完成 Polish 与 Implementation 自检，并把 Front Matter 从 pending 升级为当日主 Agent pass。
5. 同步 TOC 中 X-05 状态、B-004 执行顺序和总进度表 X03/X04 行。

## 决策与证据

1. 保持比较章不新增快照或新源码事实；所有框架行为继承 M-10/M-11 的固定快照结论。
2. 把外部副作用明确分成权威事实、可重建投影和不可回滚世界三类，避免把「恢复」误写成「撤销远端动作」。
3. 因果链中的业务对账接口不写成框架事实；只引用 M-09/M-10 已验证的 unknown/pending 原则，具体查询、补偿和人工裁决留给宿主。
4. 固定快照为 Reasonix `aa82b2f`、DeepSeek Harness `b150a55`、Pi `c49906e`。

## 验证结果

| 门禁 | 结果 |
| --- | --- |
| 内容结构 | 2 张 Mermaid 图；7 个带因果解释的故障模式；1 条覆盖触发、状态变化、观察结果和后续影响的完整因果链。 |
| 源码锚点 | 章内含 23 处 path:line 引用，全部来自已核对的 M-10/M-11 锚点范围。 |
| 链接检查 | `cd site && npm run check:links` 通过，检查 45 个文件。 |
| 本地构建 | `cd site && npm run build` 通过，构建 44 个页面。 |
| Git 检查 | `git diff --check` 通过；当前变更限定在 X-05 及必要状态同步。 |
| 提交部署 | 重写提交 `75ab834` 推送成功；Deploy Pages run `32627461693` 成功。 |
| 线上页面 | `/zh-CN/04-comparisons/persistence/` 返回 HTTP 200，并包含标题、故障模式和完整因果链。 |

## 开放问题

1. X-05 的批量 Implementation 终审仍需逐条复核 M-10/M-11 与本章表格在最终版本中的一致性。
2. 低层 Pi LaneRecord 与 coding-agent SessionManager 的产品级桥接仍属于既有机制页的后续深拆范围；本章只标记风险，不新增未验证行为。

## 下一步

1. X-05 重写、本地验证、提交推送和线上检查已完成。
2. 下一次迭代处理 X-04《安全与审批对比》。
3. 批量终审时统一复核 M-10/M-11 与 X-05 对照表。
