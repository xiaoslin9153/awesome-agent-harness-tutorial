# 会话：教材写作流水线与配图基础设施

## 元数据

- 日期：2026-08-22
- 状态：已完成
- 目标：为公开教材建立润色 Agent、实现 Review Agent、双读者写作标准和流程图渲染能力。

## 范围

### 范围内

- 定义 Polish Agent 和 Implementation Review Agent 的职责、输入、输出和验收标准。
- 定义初学者和有经验程序员的双层阅读结构。
- 定义理论模型、Mermaid 图和“理想设计 vs 框架实现”规范。
- 让最小站点渲染 Mermaid。

### 范围外

- 撰写《一次 Agent Run 的完整生命周期》正文。
- 拆解三个框架源码。
- 更换站点生成器。

## 初始决策

公开教材必须经过 Draft、Polish、Implementation Review 三个阶段。Polish Agent 只负责语言清晰度；Implementation Review Agent 只负责事实、源码证据和行为偏差。

## 工作记录

1. 更新 `AGENTS.md`，把 Draft → Polish → Implementation Review 设为公开教材强制流程。
2. 新增 `tutorial/writing-pipeline.md`，定义两个 Agent 的输入、任务、输出、验收标准和 Front Matter 接口。
3. 更新会话检查清单，要求公开教材记录双 Agent 审查结果。
4. 站点构建器识别 `mermaid` fenced block，并复制本地 Mermaid UMD bundle。
5. 在中文总览页加入学习路线流程图。

## 构建验证

- 本地构建成功：`Built 2 pages.`。
- 产物包含根重定向、中文总览、样式和 Mermaid 脚本。
- 总览页包含 `<div class="mermaid">` 和 `flowchart TD` 源码。

## 结果

双 Agent 写作流水线、双读者结构、配图标准、理想设计与真实实现分离规则已经建立。站点可以渲染 Mermaid 图。下一步撰写 K03 生命周期章节，并用该流程执行润色和实现审查。

## 下一步

1. 提交并推送本基础设施变更。
2. 检查 GitHub Pages 部署。
3. 开始 K03 生命周期章节的 Draft。

## 修改文件

- `AGENTS.md`
- `docs/meta/session-checklist.md`
- `docs/product/progress-tracker.md`
- `docs/meta/sessions/2026-08-22-tutorial-writing-pipeline.md`
- `tutorial/writing-pipeline.md`
- `tutorial/zh-CN/00-overview.md`
- `site/build.mjs`
- `site/public/styles.css`
- `site/package.json`
- `site/package-lock.json`
