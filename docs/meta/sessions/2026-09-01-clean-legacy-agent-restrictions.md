---
date: 2026-09-01
topic: 清理旧 Agent 遗留执行限制
status: 进行中
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
