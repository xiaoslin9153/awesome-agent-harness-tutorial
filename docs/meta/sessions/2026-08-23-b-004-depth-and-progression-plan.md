---
date: 2026-08-23
topic: B-004 教材深度与递进重构规划
status: 已完成
---

# B-004 教材深度与递进重构规划

## 目标

响应维护者反馈：现有教材过于简单、缺少原理 / 原因 / 反例、小节递进关系不足。调研成熟技术书组织方式，量化仓库缺口，并把解决方案固化为待手动激活的产品待办 `B-004`。

## 范围

- 范围内：外部技术写作参照、仓库章节规模与证据密度统计、B-004 待办、Backlog 索引和本次会话记录。
- 范围外：立即修改 `tutorial/writing-pipeline.md`、写作 Skill、TOC 或任何公开教材；这些属于 B-004 激活后的执行内容。

## 证据

### 外部参照

成熟科技书和技术写作材料的共性是：问题先行、先定义不变量再讲机制、用真实系统验证抽象设计、显式展示失败模式和边界条件、渐进披露、多视角架构表达、用练习强化记忆、把源码解释绑定到版本和行为。本次参考：

1. [Designing Data-Intensive Applications](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/)
2. [Google Technical Writing Courses](https://developers.google.com/tech-writing)
3. [The Learning Scientists: Six Effective Learning Strategies](https://www.learningscientists.org/blog/2016/6/23-1)
4. [C4 Model](https://c4model.com/)
5. [Anthropic: Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
6. [Simon Willison: Claude Code anatomy](https://simonwillison.net/2025/Sep/8/claude-code-anatomy/)

### 仓库量化检查

执行 `find tutorial/zh-CN -type f -name '*.md' ! -name 'TOC.md' ! -name 'language-interface.md' -print0 | xargs -0 wc -l | sort -n` 后确认：

- 16 篇机制章节集中在 112-122 行。
- Reasonix / DeepSeek Harness / Pi 的基础拆解集中在 124-173 行。
- 页面长度高度接近，呈现并列词条形态。

对框架页执行 `rg` 统计 `path:`、`.go`、`.ts` 和 `.tsx` 锚点，以及语言代码块数量后确认：

- 9 个框架页中 5 个没有源码锚点匹配。
- 9 个框架页中 8 个没有语言代码片段匹配。

这些结果支持判断：问题不是单次文笔波动，而是写作流水线缺少深度契约、递进契约和源码证据门禁。

## 决策

1. 新增 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`，编号为 `B-004`。
2. 状态保持 `待手动激活`，防止仍在运行的 Goal Agent 自动扩大范围。
3. 采用「机制章给理论与横向摘要，框架专题给源码级深拆」的双层结构。
4. 用 Chapter Depth Contract 强制上一章遗留问题、本章矛盾、核心不变量、故障分支和下一章问题。
5. 用框架 × 主题簇矩阵承接 C01-C25，避免现在三类框架页过粗。
6. 设定最低反例数量、因果链、图示、commit / path 锚点和代码片段门禁。
7. 首批以四个核心概念章加一个 Reasonix 样本建立基准，用户确认后再批量推广。

考虑过的替代方案：

1. 只加强润色 Skill：能改善语言，但不能解决缺源码证据、反例和小节递进的根因。
2. 直接全量重写：风险是样板未确认前造成大面积返工。
3. 把所有源码细节塞进机制章：会让通用理论章过载，且三家细节重复膨胀。

## 变更文件

- 新增 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 更新 `docs/product/backlog/README.md`
- 新增本会话记录

## 自检

- 本次变更只记录新议题，不改公开教材。
- 未提交 `external/`、构建产物、密钥或 `.DS_Store`。
- 内部记录保持中文。
- 所有外部链接仅用于技术写作方法参照，不作为框架行为证据。
- B-004 明确要求固定 commit、`path:line`、事实标记和理想设计与真实实现分离。

## 开放问题

1. 激活时是否同时执行 B-001 目录六部分重构，还是先在现目录建立深度样板？
2. 每个框架 × 主题簇是一页还是多页，需在站点改造前根据导航成本决定。
3. 现有三家框架页中已有结论的事实可信度仍待批量 Implementation Review。

## 下一步

1. 维护者确认 B-004 方向后手动激活。
2. 激活前暂停 Goal Agent，确保工作区干净且远端同步。
3. 第一步修订写作流水线，第二步修订写作 Skill，第三步更新 TOC。
4. 再按最小提交纪律重写首批基准章节。
