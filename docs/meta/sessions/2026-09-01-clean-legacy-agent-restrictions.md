---
date: 2026-09-01
topic: 清理旧 Agent 遗留执行限制
status: 已完成
---

# 清理旧 Agent 遗留执行限制

## 目标

删除 2026-08-22 在 Claude Code Goal 模式下因 HTTP 402/429 限流引入的执行限制。这些限制服务于旧的模型调用链和额度策略，现在已无对应前提，且阻碍并行执行。

## 范围内

1. `tutorial/writing-pipeline.md`「单执行者模式」：禁止 Subagent 与并行子任务的硬约束。
2. `AGENTS.md` 中主 Agent 串行完成三阶段的表述。
3. `docs/product/backlog/` 中「Goal Agent 不得自动执行」类措辞。
4. `docs/product/progress-tracker.md` 中 G11 / G15 / G26 与现状矛盾的状态。
5. `tutorial/writing-pipeline.md` Front Matter 接口中硬编码的 `agent:` 角色字段。

## 范围外

1. 公开章节 Front Matter 里已有的 92 处 `agent: main-agent` 字面值，涉及 47 个文件。本次不改，与维护者确认后单独处理。
2. B 类项目治理约束和 C 类写作质量门禁，全部保留。
3. `AGENTS.md:48` 的 `cd site` 命令过时问题，属于另一处修正，不在本次提交内。

## 初始假设

1. 限流是旧服务商策略导致，不是当前执行环境的固有约束。
2. 「批量草稿模式」是项目节奏决策，不是执行限制，应保留但去掉角色绑定。
3. 阶段边界分离（Polish 管语言、Implementation Review 管事实）是好设计，与谁执行无关，应保留。

## 成功标准

1. 仓库中没有禁止 Subagent 或并行执行的现行规则。
2. 进度表中不再存在互相矛盾的执行策略条目。
3. 链接检查和本地构建通过。
4. B、C 两类约束未受影响。

## 执行记录

### 步骤 1：定位与分类

扫描确认仓库内只有一个 agent 指令文件 `AGENTS.md`，无 `.claude/`、无 `CLAUDE.md`，父目录和用户级配置均无覆盖。`AGENTS.md` 链向 6 个文件，二级再拉入 backlog、evidence、skill 三处。硬约束总计 147 条，按来源分为 A 旧 Agent 遗留、B 项目自身治理、C 写作质量门禁三类。

### 步骤 2：Front Matter agent 字段分布

`grep` 统计：`tutorial/zh-CN/` 下 47 个文件共 92 处 `agent: main-agent`，另有 2 处 `agent: pending`。写入流水线规范里的示例写的是 `polish-agent` 和 `implementation-review-agent`，与文件中的 `main-agent` 不一致。该字段不在 `tutorial/language-interface.md` 的必填字段表中。

决定：本次只改规范里的字段定义，不动 47 个文件的字面值，避免把规则清理和批量内容改写混在同一次提交里。

### 步骤 3：分批提交

按「一次提交一个可独立说明的小点」拆成五批：

1. `7b001f9` 移除 `tutorial/writing-pipeline.md`「单执行者模式」整节，改为「执行方式与阶段边界」。新增按改动形态选择串行或分派的三行判断表。Polish 与 Implementation Review 阶段说明、部署检查职责、Front Matter `agent` 字段定义一并去掉角色绑定。
2. `47b6bfd` `AGENTS.md` 三阶段改为可串行可分派，部署检查去掉「主 Agent」主语。
3. `2cd55a7` backlog 五处「Goal Agent」改为与工具无关的表述。保留「待办需维护者显式激活」这条治理规则本身。
4. `1c8a0a7` 进度表 G26 改 `已废弃`，新增 G29 记录本次清理；G11 改名三阶段并转 `已完成`，G15 去掉 Subagent 绑定，G21 去掉 Goal 前缀，G24、G25 补上二级作废链。
5. `01e0375` 两份限流时期的历史决策追加作废说明，未删除。

### 步骤 4：验证

`site-starlight` 下 `npm run check:links` 通过，55 个文件无断链。

注意：`AGENTS.md:48` 记录的链接检查命令是 `cd site && npm run check:links`，指向已废弃的 `site/`。本次按实际生效的 `site-starlight/` 执行。该处修正不在本次范围内，留作后续。

## 结果

A 类限制全部解除。仓库中已无禁止 Subagent 或并行执行的现行规则，无「Goal Agent」绑定，无 429/402 恢复流程。

保留的 A 类衍生结论两条：阶段边界分离（Polish 管语言、Implementation Review 管事实、部署检查管可达性），批量草稿模式（Implementation Review 延后到发布前，但不降低发布门槛）。

B、C 两类未触碰。

## 创建或修改的文件

| 文件 | 改动 |
| --- | --- |
| `tutorial/writing-pipeline.md` | 「单执行者模式」重写为「执行方式与阶段边界」；5 处去掉角色绑定；Front Matter `agent` 字段加定义说明 |
| `AGENTS.md` | 三阶段改为可串行可分派；部署检查去掉「主 Agent」 |
| `docs/product/backlog/README.md` | 第 13 条改为「Agent 不得自动执行任何待办」 |
| `docs/product/backlog/2026-08-22-directory-restructure.md` | 2 处 Goal Agent 措辞 |
| `docs/product/backlog/2026-08-22-ebook-site-redesign.md` | 2 处 Goal Agent 措辞 |
| `docs/product/backlog/2026-08-22-interactive-learning-system.md` | 2 处 Goal Agent 措辞 |
| `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md` | 3 处 Goal Agent 措辞 |
| `docs/product/progress-tracker.md` | G26 废弃、新增 G29、修正 G11/G15/G21/G24/G25 |
| `docs/meta/sessions/2026-08-22-single-agent-execution-policy.md` | 追加 2026-09-01 作废说明 |
| `docs/meta/sessions/2026-08-22-serialize-goal-execution.md` | 追加 2026-09-01 作废说明 |
| `.gitignore` | 新增 `.workbuddy/` |

## 下一步动作

等维护者确认三件待议事项（见开放问题），再决定是否处理 47 个章节的 `agent` 字面值和 `AGENTS.md` 的三处过时内容。

## 开放问题

1. 47 个公开章节 Front Matter 里 92 处 `agent: main-agent` 是否改写？规范已把它定义成实际执行者，字面值仍是旧角色名，两者现在不一致。
2. `AGENTS.md:48` 的 `cd site` 命令、`AGENTS.md:76-87` 缺 `labs/`、`scripts/`、`site-starlight/`、`docs/skills/` 的仓库结构块，以及第 49、50 行两个编号均为 `4.`，三处是否一并修正？
3. 是否需要把本次新增的并行能力写进 KR01 的执行计划？批量事实审查现在可以按章节清单分派。
