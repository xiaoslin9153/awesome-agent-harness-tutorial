# Agent 工作约定

## 项目目标

构建一个可长期维护、可发布的 Agent Harness 学习仓库。仓库必须以 Markdown 持久保存产品设计决策、框架拆解、实验、踩坑记录和面试准备材料。

## 必读文件

- 开始实质性工作前，必须阅读 `docs/meta/session-hook.md`。
- 查看或更新整体状态前，必须阅读 `docs/product/progress-tracker.md`。
- 修改产品范围、框架范围、对比标准或发布策略前，必须阅读 `docs/product/product-design.md` 和 `docs/comparisons/framework-comparison-ledger.md`。

## 内容分层

| 类型 | 位置 | 语言策略 | 说明 |
| --- | --- | --- | --- |
| 内部治理与产品记录 | `AGENTS.md`、`docs/product/`、`docs/comparisons/`、`docs/meta/` | 仅中文 | 面向维护者，记录目标、决策、证据和会话修订。 |
| 公开教材 | `tutorial/` | 中文优先，预留多语言接口 | 面向外部读者，后续可发布到 GitHub Pages。 |
| 实验代码 | `labs/` | 按实验技术栈决定 | 必须能被教材引用，避免把临时脚本混入教材正文。 |

内部治理和产品修订记录不需要多语言版本。只有 `tutorial/` 下的公开教材内容需要遵循 `tutorial/language-interface.md`。

## 会话流程

1. 在 `docs/meta/sessions/` 中打开或继续当前会话记录。
2. 开始非平凡修改前，先记录本次会话目标。
3. 每个有意义的步骤后更新会话记录，包括已完成内容、决策、证据、开放问题和下一步。
4. 会话结束前完成 `docs/meta/session-checklist.md`。
5. 如果未能完成计划步骤，必须记录确切阻塞原因和下一个具体动作。
6. 会话结束前更新 `docs/product/progress-tracker.md` 中受影响条目的状态、证据和日期。

## 公开教材写作流水线

`tutorial/` 下的每一章必须经过 Draft、Polish 和 Implementation Review 三个阶段。主 Agent 独立串行完成三个阶段：先写清内容，再润色语言，最后核对描述是否与真实实现、源码路径、命令行为或实验结果一致。

三个阶段的检查清单、输入、输出和验收标准定义在 `tutorial/writing-pipeline.md`。公开章节必须在 Front Matter 中记录 Polish 和 Implementation Review 的结果。每次公开教材变更推送到 `main` 后，由主 Agent 执行线上部署检查；输出接口定义在 `tutorial/writing-pipeline.md`。

## 最小改动与提交纪律

1. 一次会话可以包含多个主题，但一次提交只处理一个可独立说明的小点，例如一个机制、一条决策、一份索引或一处修正。
2. 提交前必须执行自 Review：
   - 确认变更只覆盖当前小点。
   - 阅读 diff，删除顺手修改、调试残留和无关格式化。
   - 检查标题、链接、表格、代码块、Front Matter 和事实标记。
   - 确认没有提交 `external/`、构建产物、私有研究材料或 `.DS_Store`。
   - 确认没有提交凭证、token、私钥内容、密钥文件名、密钥路径或公钥指纹。
   - 确认会话记录已经反映本次变更。
3. 提交前在本地运行 `cd site && npm run check:links` 验证教材内链接无断链。
4. Commit message 使用 Conventional Commits；类型优先使用 `docs`、`chore`、`feat` 或 `fix`。
4. 不允许把多个机制分析合并成一次大提交；如果已经发生，必须在后续记录中拆分说明，不强行重写历史。

## 部署前检查

每次会影响公开教材、站点配置或部署流程的提交后，必须执行部署检查并记录结果：

1. 确认 `git status --short --branch` 干净且本地分支与远端一致。
2. 确认 GitHub Actions 部署成功，或在站点未初始化时明确记录“尚未部署”。
3. 确认站点入口、语言路由和受影响页面可访问。
4. 如果部署失败，记录失败链接、关键日志、根因假设和下一个修复动作。

当前站点流水线已上线（GitHub Pages + GitHub Actions），每次推送后由主 Agent 执行部署检查并在会话记录中记录结果。

## 文档规则

- 持久项目知识优先使用 Markdown。
- 尽量让一份文档聚焦一个主题。
- 使用稳定文件名和相对链接。
- 公开教材放在 `tutorial/<locale>/`，内部记录放在 `docs/`；不要把面向读者的内容混入产品或会话记录。
- 公开教材必须同时服务初学者和有经验程序员：先给不啰嗦的原理与图，再给实现细节和源码入口。
- 不允许静默替换既有结论；追加带日期的决策或创建修订章节。
- 不确定内容必须标记 `未验证`，并列出所需证据。
- 事实与解释必须分离。
- 所有框架对比必须以 `docs/comparisons/framework-comparison-ledger.md` 作为唯一标准来源。
- 每次会话必须留下足够上下文，让其他人或其他 Agent 可以无追问地继续工作。

## 仓库结构

```text
AGENTS.md
docs/
  product/
  comparisons/
  meta/
    sessions/
tutorial/
  language-interface.md
```

`tutorial/` 目录是公开教材的唯一入口。后续网站生成器应从这里读取多语言内容。

## Git 与远端策略

- 使用 Git 作为 Markdown 记录之外的历史机制。
- 只提交有意图、自包含的变更。
- Commit message 使用 Conventional Commits。
- 通过本机 SSH 配置中的专用别名 `github.com-personal` 推送；不要在仓库记录中写入私钥文件名、路径、公钥指纹或其他密钥标识。
- 远端 URL 固定为 `git@github.com-personal:xiaoslin9153/awesome-agent-harness-tutorial.git`。
- 不使用默认 `github.com` 别名，因为它会选择工作账号密钥。

## 当前状态：2026-08-24

B-004 教材深度与递进重构已完成：约 45 个公开章节按 v0.3 标准重写或新建，链接检查、本地构建和 GitHub Pages 部署均已通过。遗留批量 Implementation Review（逐条标注事实等级、补齐 evidence_version、修正偏差锚点）尚未执行。详细进度见 `docs/product/progress-tracker.md`。
