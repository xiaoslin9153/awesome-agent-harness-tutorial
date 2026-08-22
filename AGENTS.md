# Agent 工作约定

## 项目目标

构建一个可长期维护、可发布的 Agent Harness 学习仓库。仓库必须以 Markdown 持久保存产品设计决策、框架拆解、实验、踩坑记录和面试准备材料。

## 必读文件

- 开始实质性工作前，必须阅读 `docs/meta/session-hook.md`。
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

## 文档规则

- 持久项目知识优先使用 Markdown。
- 尽量让一份文档聚焦一个主题。
- 使用稳定文件名和相对链接。
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
- 通过 SSH 别名 `github.com-personal` 推送，该别名绑定 GitHub 账号 `xiaoslin9153` 和私钥 `~/.ssh/[removed-key-identifier]`。
- 远端 URL 固定为 `git@github.com-personal:xiaoslin9153/awesome-agent-harness-tutorial.git`。
- 不使用默认 `github.com` 别名，因为它会选择工作账号密钥。

## 当前状态

仓库处于产品设计、知识架构和公开教材接口设计阶段。尚无框架源码级拆解结论。
