# 2026-09-01 科技写作 Skill 增强（中英边界）

## 会话目标

按诊断给 `docs/skills/tutorial-tech-writing/SKILL.md` 补齐「中英边界」规则，回应教程正文中英夹杂、源码注释直译导致的拗口问题。

## 范围内

- 给 `SKILL.md` 新增「中英边界」小节（含术语统一规则与正反例对照）。
- 给「出版级 Review」增加一条中英边界检查项。
- 在「适用范围」说明 `SKILL.md` 与 `tutorial/writing-pipeline.md` 的权威关系。

## 范围外

- 不重写 `tutorial/writing-pipeline.md`。
- 不改公开教材正文；试点润色（如 `reasonix/overview.md`）留待后续会话。
- 不落地 P2 级建议（简化表达正反例、类比张力协调、Front Matter 接口指向）。

## 背景与证据

- 用户反馈教程语言拗口、像机翻。
- 启发式统计（正则检测「中文句子夹带整句英文」）：机制章 02 命中 122 处、框架拆解 03 命中 47 处、Pi 译文 10 命中 23 处、横向对比 04 命中 12 处。
- 典型病句：`Build` 是兼容包装：frontends keep their existing signature（`tutorial/zh-CN/03-frameworks/reasonix/overview.md:78`）。
- 现状：`SKILL.md` 自称统一入口，但无中英边界、术语统一规则；术语规则只存在于 `tutorial/writing-pipeline.md` 中文写作标准第 5 条。
- 命令输出：`python3` 启发式统计脚本（本会话执行）产出分组命中数。

## 初始假设

- 中英夹杂主要来自 Draft/Polish 阶段直接引用源码英文注释。
- 术语混用源于执行者只读 `SKILL.md`、未读 `writing-pipeline.md`。

## 成功标准

- `SKILL.md` 含中英边界硬规则、术语规则、正反例。
- 出版级 Review 含中英边界检查项。
- 适用范围说明与 pipeline 的权威关系。
- 链接检查通过；Git 提交只含本小点。

## 过程记录

1. 读取 `AGENTS.md`、`session-hook.md`、`progress-tracker.md`、`product-design.md`、`session-checklist.md`、`writing-pipeline.md` 与现有 `SKILL.md`。
2. 采样正文确认病根：`agent-run-lifecycle.md`（顺）、`reasonix/overview.md`（中英夹杂严重）、`patterns.md`（顺）。
3. 启发式统计确认问题集中于 02/03/10 三组。
4. 评估系统 `doubao-human-signal` Skill：定位是去 AI 味/模板感，明确排除翻译/本地化类任务，不适配"中英夹杂直译注释"。
5. 向用户给出诊断、覆盖矩阵与改进清单，用户批准按 P0+P1 落地。
6. 修改 `SKILL.md`：新增「中英边界」、Review 检查项、适用范围权威关系说明。
7. 更新 `progress-tracker.md` G20 行。

## 结果

- `docs/skills/tutorial-tech-writing/SKILL.md` 已新增「中英边界」小节（4 条规则 + 正反例表），含术语首现英译、禁完整英文句、禁半中半英、源码注释翻译与 `path:line` 标注。
- 「出版级 Review」新增第 7 条中英边界检查项。
- 「适用范围」补充与 `writing-pipeline.md` 的权威关系。
- 本次只改内部治理文档，不触发公开教材部署。

## 下一步

- 用 `reasonix/overview.md` 试点润色，验证新规则效果。
- 视效果决定是否批量处理 02/03/10 三组章节（Polish 阶段）。
- 评估 P2 建议（简化表达正反例、类比张力、Front Matter 接口）是否需要落地。
