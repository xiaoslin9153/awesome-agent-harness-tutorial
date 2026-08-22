# 项目级科技写作 Skill 会话

## 状态

已完成。

## 目标

把已调研的中文技术写作、简化英语技术写作、结构化写作和 Google 技术写作经验提炼成项目级 Skill，统一后续公开教材的 Polish 标准。

## 范围

- 范围内：新增 `docs/skills/tutorial-tech-writing/SKILL.md`，并在 `tutorial/writing-pipeline.md` 的 Polish Agent 输入中挂接该 Skill。
- 范围外：不复制外部仓库，不修改已有教材内容，不引入自动构建依赖。

## 决策

采用提炼而非照搬外部仓库。外部风格指南包含大量与本仓库无关的场景示例；项目只需要可执行的中文排版、简化表达、结构化改写和出版级 Review 规则。

## 变更

- 新增 Skill 入口，覆盖中文与排版、简化表达、结构化改写、Review 清单和输出约定。
- Polish Agent 增加统一 Skill 加载入口，保留原有六条规则作为最低标准。

## 证据

- Fenng/Tech-Doc-Style-Chinese：中文文案风格与排版。
- SimpleEnglish / ASD-STE100：短句、条件前置、主动语态和段落限制。
- gwagjiug/technical-writing：四原则、结构化改写和 Review Rubric。
- Google technical writing：读者导向、主动语态和清晰结构。

## 下一步

后续撰写或润色 `tutorial/` 公开教材时，先加载项目级科技写作 Skill；如果发现规则冲突，以更严格约束为准并记录修订。

## 自 Review 结果

- 变更只包含 Skill 新增、Polish Agent 挂接、进度表记录和本会话记录。
- `node scripts/check-links.mjs` 通过。
- diff 无凭证、密钥路径、指纹或构建产物。

## 部署检查

Commit `867dbc6` 的 GitHub Actions 部署成功。站点入口、总览页和 Agent Run 生命周期页均返回 HTTP 200，且包含预期标题。
