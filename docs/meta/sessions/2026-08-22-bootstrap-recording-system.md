# 会话：初始化记录体系

## 元数据

- 日期：2026-08-22
- 状态：已完成
- 目标：建立产品、对比、Agent 约定和会话记录体系。

## 范围

### 范围内

- 产品设计 v0.1。
- 框架对比账本 v0.1。
- Agent 工作约定。
- 会话钩子和检查清单。
- 首次会话记录。

### 范围外

- 框架源码分析。
- 可运行实验。
- 面试题库。
- 静态网站实现。

## 工作记录

### 1. 仓库盘点

- 检查工作区。
- 发现没有既有文件。
- 决策：采用文档优先架构。

### 2. 产品设计 v0.1

- 创建产品设计。
- 把原始四个目标扩展为七条学习轨道。
- 增加框架拆解问题、阶段、成功标准和开放问题。

### 3. 框架对比账本 v0.1

- 创建对比账本。
- 定义 25 个稳定对比维度 C01-C25。
- 要求先确定标准版本和 commit，再形成框架结论。

### 4. Agent 工作约定

- 创建 `AGENTS.md`。
- 把会话钩子设为强制会话入口。
- 要求用持久 Markdown 保存可恢复的会话上下文。

### 5. 会话记录系统

- 创建会话钩子、检查清单和本记录。

### 6. Git 设置补充记录

- 在 `main` 分支初始化 Git。
- 添加 `.gitignore`。
- 在 `AGENTS.md` 记录 Git 和远端策略。
- 初始文档提交为 `7a80f06 docs: bootstrap product and session records`。
- 配置 `origin` 为 `git@github.com-personal:xiaoslin9153/awesome-agent-harness-tutorial.git`。

### 7. 密钥验证

- 匹配私钥：`~/.ssh/[removed-key-identifier]`。
- 公钥指纹：`[removed-public-fingerprint]`。
- SSH 别名：`github.com-personal`。
- SSH 认证结果：GitHub 账号 `xiaoslin9153`。

### 8. 首次推送

- GitHub 远端仓库创建后，`git push -u origin main` 成功。
- `main` 已跟踪 `origin/main`。

### 9. 内容分层与语言接口修订

- 明确内部治理、产品记录、对比账本和会话修订只保留中文。
- 明确 `tutorial/` 是公开教材唯一入口。
- 新增 `tutorial/language-interface.md`，定义中文优先的多语言目录、Front Matter、翻译状态和站点路由接口。

## 结果

仓库已具备文档优先记录体系、Git 历史和公开教材多语言接口。产品范围、对比标准、Agent 约定和会话协议均已建立。

## 修改文件

- `AGENTS.md`
- `docs/product/product-design.md`
- `docs/comparisons/framework-comparison-ledger.md`
- `docs/meta/session-hook.md`
- `docs/meta/session-checklist.md`
- `docs/meta/sessions/2026-08-22-bootstrap-recording-system.md`
- `tutorial/language-interface.md`

## 决策

| 决策 | 理由 |
| --- | --- |
| 使用 Markdown 作为持久格式。 | 便于学习内容迁移和网站化。 |
| 建立 25 个对比维度。 | 保证框架分析机制级、可重复。 |
| 要求记录版本和 commit。 | 避免混合不兼容的框架行为。 |
| 每个有意义步骤都更新会话记录。 | 支持长周期项目的可恢复协作。 |
| 内部记录只保留中文。 | 降低维护成本，服务决策和修订场景。 |
| 公开教材放入 `tutorial/` 并中文优先。 | 分离维护者记录与外部读者内容，避免翻译阻塞学习。 |

## 开放问题

1. 确定 Reasonix 的标准对象和版本。
2. 确定 DeepSeek Harness 的标准对象和版本。
3. 确定 Pi 的标准对象和版本。
4. 决定实验是否统一语言和 Runtime。

## 下一步

确定 Reasonix、DeepSeek Harness 和 Pi 的标准仓库或产品来源、版本和 commit。然后创建第一篇中文教材《一次 Agent Run 的完整生命周期》，并应用 `tutorial/language-interface.md` 的 Front Matter 规范。
