# 会话：基础治理文档卫生审查与修复

## 状态与目标

- 状态：已完成。
- 日期：2026-08-24。
- 目标：系统性审查治理层文档，修正过期声明、消除内部矛盾、删除已失效的临时文件。
- 范围内：`AGENTS.md`、`docs/product/progress-tracker.md`、`docs/product/goal-mode-chapter-rewrite.md`（删除）、本会话记录。
- 范围外：不修改任何公开教材章节、不启动批量事实审查、不改变产品范围或对比标准。

## 审查发现

1. `AGENTS.md` 部署前检查段落声称「当前阶段还没有站点流水线，部署状态固定记录为 `尚未部署`」，但站点已上线且 Actions 多次成功部署。
2. `AGENTS.md` 当前状态段落仍写「仓库处于产品设计阶段，尚无框架源码级拆解结论」，与 B-004 已完成的实际进度严重不符。
3. `progress-tracker` 头部「最近更新」为 2026-08-22，但内部大量条目已是 2026-08-23。
4. 阶段总览中 P2 标为 `未开始` 但 16 篇机制章全部存在；P4 标为 `未开始` 但 X-01 至 X-06 均已有内容；P1 描述说「继续补齐 C04」但 C04 已完成。
5. P1 的 K01-K44 逐章任务表共 44 行，每行都标 `进行中` 且描述重复「Implementation Review 待批量执行」，粒度过细且状态过期。
6. P2 的 M01-M18 表格全部标 `未开始/缺失`，但对应章节文件均已存在并通过 v0.3 自检——完全过期。
7. G08「建立 Markdown 结构与链接检查」标 `未开始`，但 G17 同名任务标 `已完成` 且脚本存在并集成 CI——内部矛盾。
8. `docs/product/goal-mode-chapter-rewrite.md` 是 B-004 执行期间的临时运行手册，B-004 已完成且流程已固化到 `tutorial/writing-pipeline.md` 和 backlog 记录中，可安全删除。
9. 43 个有 Implementation Review pass 的章节缺少 `evidence_version` 字段（仅 C-01 有），这是批量事实审查的核心缺口之一，归入 KR01 范围。

## 修复内容

### AGENTS.md

1. 部署前检查段落改为「当前站点流水线已上线（GitHub Pages + GitHub Actions），每次推送后由主 Agent 执行部署检查并在会话记录中记录结果」。
2. 当前状态更新为 2026-08-24 快照：B-004 已完成约 45 章 v0.3 初稿升级，遗留批量 Implementation Review 未执行。

### progress-tracker

1. 版本升至 v0.2，「最近更新」改为 2026-08-24。
2. 阶段总览：P1 改为 `已完成`；P2/P4/P5 从 `未开始` 改为 `进行中` 并更新完成标准描述。
3. P1：K01-K44 共 44 行压缩为 K00（B-004 初稿升级已完成）和 KR01（批量 Implementation Review 未开始）两行。
4. P2：M01-M18 过期表格替换为 M00 汇总行。
5. P3：FR/FD/FP 三组子任务表压缩为 F00（证据索引模板）和 F01（9 篇框架页初稿升级）。
6. P5 新增 Q00 汇总行覆盖 L/CS/Q/E/G 全部章节。
7. G08 标记为 `已废弃`，注明被 G17 取代。
8. X06 描述中的「待统一事实审查」改为「批量事实审查归入 KR01」，统一指向。
9. 当前优先级队列从 B-004 执行指令改写为 KR01 下一步指引。

### 删除 goal-mode-chapter-rewrite.md

该文件是 B-004 执行期的临时运行手册。核心流程已固化在 `tutorial/writing-pipeline.md`（单执行者模式）和 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`（执行顺序记录），无其他活动文档引用它。会话历史中的引用保留不动（历史记录不追溯修改）。

## 决策与理由

1. 不逐行更新 K01-K44 为 `已完成`：44 行逐章状态维护成本高，且阶段总览已有汇总能力；压缩为 K00 + KR01 更符合本文件「只保存状态总览」的定位。
2. 不追溯修改历史会话记录中对已删文件的路径引用：历史记录反映当时的事实，不应静默改写。
3. evidence_version 缺失不在本次修复范围内：这属于内容级事实审查工作，需要逐章打开源码验证，归入 KR01。

## 验证结果

| 门禁 | 结果 |
| --- | --- |
| 链接检查 | `cd site && npm run check:links` 通过，50 个文件。 |
| Git diff | 变更限定在 AGENTS.md、progress-tracker、删除 goal-mode 手册和本会话记录。 |

## 开放问题

1. KR01 批量 Implementation Review 尚未启动，43 章缺 `evidence_version` 是最大缺口。
2. P3 的 F00 证据索引模板仍只有 C01/C02 部分索引，C03-C25 待补齐——KR01 时一并处理。

## 下一步

1. 维护者确认本次治理修复后提交推送。
2. 启动 KR01 批量 Implementation Review。
