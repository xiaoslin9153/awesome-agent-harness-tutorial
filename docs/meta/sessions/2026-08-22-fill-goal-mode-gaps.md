# 会话：补齐 Goal 模式基础设施缺口

## 元数据

- 日期：2026-08-22
- 状态：已完成
- 目标：补齐 Goal 模式递进写作所需的六个基础设施缺口。

## 范围

### 范围内

1. 完整章节目录与文件路径映射。
2. Deploy Subagent 角色定义。
3. C01-C25 证据索引模板。
4. 术语表骨架（中英对照）。
5. 总览页导航链接。
6. Markdown 链接检查脚本与 CI 集成。

### 范围外

- 撰写任何教材正文。
- 运行框架源码分析。

## 工作记录

### 1. 章节目录与路径映射

新增 `tutorial/zh-CN/TOC.md`，定义 9 章、50+ 小节的文件路径、依赖关系和推荐写作顺序。

### 2. Deploy Subagent

在 `tutorial/writing-pipeline.md` 中新增 Deploy Subagent 角色和三 Agent 协作模式。

### 3. C01-C25 证据索引模板

新增 `docs/comparisons/evidence/template.md`。

### 4. 术语表骨架

新增 `tutorial/zh-CN/09-glossary/glossary.md`，覆盖 30+ 术语中英对照。

### 5. 导航链接

在总览页添加了指向 TOC 和术语表的链接。

### 6. 链接检查

新增 `scripts/check-links.mjs`，已集成到 CI。本地验证通过。

## 结果

Goal 模式所需的六个基础设施缺口全部补齐。
