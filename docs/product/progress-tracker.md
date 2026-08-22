# 总进度表

## 状态

- 版本：v0.1
- 最近更新：2026-08-22
- 用途：本文件是项目整体进度的唯一总览。详细决策看 `docs/product/product-design.md`，框架证据看 `docs/comparisons/framework-comparison-ledger.md`，过程细节看 `docs/meta/sessions/`。

## 状态定义

| 状态 | 含义 |
| --- | --- |
| `已完成` | 交付物存在，验收标准满足，证据可链接。 |
| `进行中` | 已开始且有可见产物，但尚未满足验收标准。 |
| `未开始` | 已列入计划，但还没有实质交付物。 |
| `阻塞` | 无法继续；必须记录原因和解阻条件。 |
| `持续` | 不是一次性交付物，需要按会话维护。 |

## 阶段总览

| 阶段 | 名称 | 目标 | 状态 | 完成标准 |
| --- | --- | --- | --- | --- |
| P0 | 基础设施与治理 | 建立 Git、推送、记录、对比和语言接口。 | `进行中` | 核心治理完成；剩余外部仓库同步策略。 |
| P1 | 知识基础 | 建立概念总纲、术语表和第一篇核心教材。 | `进行中` | 总览、两篇核心概念与 C03 已成稿；C03 事实审查延后。继续补齐 C04。 |
| P2 | Harness 机制教材 | 完成核心机制章节和实验引用。 | `未开始` | 每个机制有中文章节和至少一个实验或不可运行说明。 |
| P3 | 框架源码拆解 | 完成 Reasonix、DeepSeek Harness、Pi 的机制级拆解。 | `进行中` | 三家 C01-C25 有证据索引和结论。 |
| P4 | 横向对比 | 输出机制级对比和设计模式。 | `未开始` | 对比账本填完并提炼出模式与反模式。 |
| P5 | 实验与面试题库 | 建设可运行实验和分类题库。 | `未开始` | 实验可复现；每道题有答案链。 |
| P6 | GitHub Pages 发布 | 建立并验证最小静态站点发布链路。 | `进行中` | 本地构建通过；线上页面与新增章节需持续验证。 |

## P0：基础设施与治理

| ID | 任务 | 状态 | 交付物 / 证据 | 最近更新 |
| --- | --- | --- | --- | --- |
| G01 | 初始化 Git 和远端推送链路 | `已完成` | `github.com-personal` 绑定 `xiaoslin9153`；`main` 已同步。 | 2026-08-22 |
| G02 | 建立内部中文记录体系 | `已完成` | `AGENTS.md`、产品设计、对比账本、会话钩子。 | 2026-08-22 |
| G03 | 固定三家框架分析快照 | `已完成` | Reasonix `aa82b2f`、dsh `b150a55`、Pi `c49906e`。 | 2026-08-22 |
| G04 | 定义教材多语言接口 | `已完成` | `tutorial/language-interface.md`。 | 2026-08-22 |
| G05 | 决策发布平台 | `已完成` | GitHub Pages；不用 GitBook。 | 2026-08-22 |
| G06 | 固化最小提交与提交前 Review | `已完成` | `AGENTS.md` 和会话检查清单。 | 2026-08-22 |
| G07 | 固化部署检查协议 | `已完成` | 当前状态为“尚未部署”。 | 2026-08-22 |
| G08 | 建立 Markdown 结构与链接检查 | `未开始` | 需要 CI 或本地脚本。 | 2026-08-22 |
| G09 | 建立外部仓库同步策略 | `未开始` | 需要决定何时更新 shallow clone 和重新锚定版本。 | 2026-08-22 |
| G10 | 完成密钥信息审计与历史清理 | `已完成` | 全历史无原始密钥标识；详见密钥审计会话。 | 2026-08-22 |
| G13 | 修复项目 Pages 基础路径 | `已完成` | 构建支持 `SITE_BASE_URL`；Actions 注入仓库名前缀。 | 2026-08-22 |
| G11 | 建立教材双 Agent 写作流水线 | `进行中` | Polish 与 Implementation Review 规范和站点 Mermaid 渲染已建立；批量草稿门禁待执行。 | 2026-08-22 |
| G12 | 建立教材配图与双读者标准 | `进行中` | 配图与理想设计规范已生效；后续按章节持续检查。 | 2026-08-22 |
| G14 | 建立完整章节目录与路径映射 | `已完成` | `tutorial/zh-CN/TOC.md` 定义 9 章 50+ 小节。 | 2026-08-22 |
| G15 | 添加 Deploy Subagent 角色 | `已完成` | `tutorial/writing-pipeline.md` 定义职责和输出接口。 | 2026-08-22 |
| G16 | 建立 C01-C25 证据索引模板 | `已完成` | `docs/comparisons/evidence/template.md`。 | 2026-08-22 |
| G17 | 建立 Markdown 链接检查 | `已完成` | `scripts/check-links.mjs`；CI 集成；本地验证通过。 | 2026-08-22 |
| G18 | 支持 Markdown 表格渲染与 TOC 可点击链接 | `已完成` | 构建器解析表格、内联链接、行内代码。 | 2026-08-22 |
| G19 | 升级 Polish 中文写作标准与密度检查 | `已完成` | 六条中文规则 + 信息密度检查写入 writing-pipeline.md。 | 2026-08-22 |
| G20 | 引入项目级科技写作 Skill | `已完成` | `docs/skills/tutorial-tech-writing/SKILL.md` 统一出版级润色规则。 | 2026-08-22 |
| G21 | 调整 Goal 写作节奏与框架深拆标准 | `已完成` | Implementation Review 延后到批量发布门禁；新增三家框架技术深拆标准。 | 2026-08-22 |
| G22 | 建立产品未来待办入口 | `已完成` | `docs/product/backlog/README.md` 保存 B-001 目录六部分重构计划。 | 2026-08-22 |
| G23 | 记录电子书站点改造方案 | `已完成` | B-002 推荐 Astro Starlight，保存对比结论、验收标准和分阶段迁移计划。 | 2026-08-22 |
| G24 | 固化 Goal 串行执行与限流恢复 | `已废弃` | 已被 G26 单执行者模式取代；历史记录保留 429 背景。 | 2026-08-22 |
| G25 | 固化 402 支付失败处理 | `已废弃` | 已被 G26 单执行者模式取代；历史记录保留 402 背景。 | 2026-08-22 |
| G26 | 简化为主 Agent 单执行者模式 | `已完成` | Draft、Polish、Implementation Review 和部署检查均由主 Agent 串行完成；不创建 Subagent。 | 2026-08-22 |
| G27 | 记录学习系统产品待办 | `已完成` | B-003 保存 Run 模拟器、Failure Museum、Policy Playground、Trace Explorer 和 Harness Atlas 等候选方向。 | 2026-08-22 |

## P1：知识基础

| ID | 任务 | 状态 | 验收标准 | 最近更新 |
| --- | --- | --- | --- | --- |
| K01 | 创建中文教材总览 | `已完成` | `tutorial/zh-CN/00-overview.md` 符合 Front Matter 规范。 | 2026-08-22 |
| K02 | 定义读者路径和学习地图 | `已完成` | 总览已提供学习路线和目标。 | 2026-08-22 |
| K06 | 撰写 Agent、Harness 与 Runtime 边界 | `已完成` | `tutorial/zh-CN/01-core-concepts/agent-vs-harness.md` 已通过双 Agent 审查、链接检查和构建。 | 2026-08-22 |
| K03 | 撰写 Agent Run 生命周期 | `已完成` | `tutorial/zh-CN/01-core-concepts/agent-run-lifecycle.md` 覆盖输入、流式推理、工具分支、终止和恢复主线，已通过双 Agent 审查。 | 2026-08-22 |
| K04/K05 | 建立术语表骨架（含中英对照） | `已完成` | `tutorial/zh-CN/09-glossary/glossary.md` 覆盖核心概念、工具执行、安全、状态和架构模式。 | 2026-08-22 |
| K07 | 撰写 Session、Turn 与状态模型 | `进行中` | `tutorial/zh-CN/01-core-concepts/session-and-state.md` 已完成 Polish 和链接检查；Implementation Review 待批量执行。 | 2026-08-22 |
| K08 | 撰写事件模型与流式输出 | `进行中` | `tutorial/zh-CN/01-core-concepts/events-and-streaming.md` 已完成 Draft 与 Polish，并保留框架事实待审清单。 | 2026-08-22 |
| K09 | 撰写 Context 组装与分层 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/context-assembly.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K10 | 撰写 Context 压缩与截断 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/context-compression.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K11 | 撰写 Tool Schema 与调用协议 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/tool-schema.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K12 | 撰写 Tool 执行与副作用 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/tool-execution.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K13 | 撰写 Tool 结果处理与截断 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/tool-results.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K14 | 撰写审批模型 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/approval.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K15 | 撰写 Sandbox 与权限 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/sandbox.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K16 | 撰写 Retry 与幂等 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/retry-idempotency.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K17 | 撰写 Timeout 与取消 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/timeout-cancellation.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K18 | 撰写 Checkpoint 与 Resume | `进行中` | `tutorial/zh-CN/02-harness-mechanics/checkpoint-resume.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K19 | 撰写 Persistence | `进行中` | `tutorial/zh-CN/02-harness-mechanics/persistence.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K20 | 撰写 Observability 与 Replay | `进行中` | `tutorial/zh-CN/02-harness-mechanics/observability.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K21 | 撰写 Memory 与工作区 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/memory-workspace.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K22 | 撰写 Sub-agent 与并发 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/subagent-concurrency.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K23 | 撰写成本与延迟 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/cost-latency.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K24 | 撰写 Prompt Injection 与工具安全 | `进行中` | `tutorial/zh-CN/02-harness-mechanics/prompt-injection.md` 已完成 Draft 与 Polish，并保留三家框架待审锚点。 | 2026-08-22 |
| K25 | 撰写 Reasonix 架构总览 | `进行中` | `tutorial/zh-CN/03-frameworks/reasonix/overview.md` 已完成 Draft 与 Polish，覆盖框架深拆必备结构。 | 2026-08-22 |
| K26 | 撰写 Reasonix Run 生命周期 | `进行中` | `tutorial/zh-CN/03-frameworks/reasonix/run-lifecycle.md` 已完成 Draft 与 Polish，覆盖采样提交边界与恢复语义。 | 2026-08-22 |
| K27 | 撰写 Reasonix 工具与审批 | `进行中` | `tutorial/zh-CN/03-frameworks/reasonix/tools-approval.md` 已完成 Draft 与 Polish，覆盖工具治理与沙箱审批链路。 | 2026-08-22 |
| K28 | 撰写 DeepSeek Harness 架构总览 | `进行中` | `tutorial/zh-CN/03-frameworks/deepseek-harness/overview.md` 已完成 Draft 与 Polish，覆盖框架深拆必备结构。 | 2026-08-22 |
| K29 | 撰写 DeepSeek Harness Run 生命周期 | `进行中` | `tutorial/zh-CN/03-frameworks/deepseek-harness/run-lifecycle.md` 已完成 Draft 与 Polish，覆盖 Turn/Step 与流式事件语义。 | 2026-08-22 |
| K30 | 撰写 DeepSeek Harness 工具与沙箱 | `进行中` | `tutorial/zh-CN/03-frameworks/deepseek-harness/tools-sandbox.md` 已完成 Draft 与 Polish，覆盖工具治理和 Landlock 边界。 | 2026-08-22 |
| K31 | 撰写 Pi 架构总览 | `进行中` | `tutorial/zh-CN/03-frameworks/pi/overview.md` 已完成 Draft 与 Polish，覆盖框架深拆必备结构。 | 2026-08-22 |
| K32 | 撰写 Pi Run 生命周期 | `进行中` | `tutorial/zh-CN/03-frameworks/pi/run-lifecycle.md` 已完成 Draft 与 Polish，覆盖事件流与工具批语义。 | 2026-08-22 |
| K33 | 撰写 Pi 工具与容器化 | `进行中` | `tutorial/zh-CN/03-frameworks/pi/tools-containerization.md` 已完成 Draft 与 Polish，覆盖执行环境、工具链路和三种容器化边界。 | 2026-08-22 |
| K34 | 撰写架构风格对比 | `进行中` | `tutorial/zh-CN/04-comparisons/architecture.md` 已完成 Draft 与 Polish，覆盖三家控制面、状态所有权、装配入口和扩展点。 | 2026-08-22 |
| K35 | 撰写 Context 策略对比 | `进行中` | `tutorial/zh-CN/04-comparisons/context.md` 已完成 Draft 与 Polish，覆盖组装、预算、压缩和大结果边界。 | 2026-08-22 |
| K36 | 撰写工具协议对比 | `进行中` | `tutorial/zh-CN/04-comparisons/tools.md` 已完成 Draft 与 Polish，覆盖定义面、校验治理、并发取消和结果投影。 | 2026-08-22 |
| K37 | 撰写安全与审批对比 | `进行中` | `tutorial/zh-CN/04-comparisons/security.md` 已完成 Draft 与 Polish，覆盖权限策略、审批语义、隔离边界和注入兜底。 | 2026-08-22 |
| K38 | 撰写持久化与恢复对比 | `进行中` | `tutorial/zh-CN/04-comparisons/persistence.md` 已完成 Draft 与 Polish，覆盖提交点、投影、分支、取消和崩溃修复。 | 2026-08-22 |
| K39 | 撰写设计模式与反模式 | `进行中` | `tutorial/zh-CN/04-comparisons/patterns.md` 已完成 Draft 与 Polish，覆盖决策规则、可迁移模式、反模式和迁移检查单。 | 2026-08-22 |
| K40 | 撰写最小 Agent Run 实验 | `进行中` | `tutorial/zh-CN/05-labs/minimal-run.md` 已完成 Draft 与 Polish；`labs/minimal-run` 三条路径测试通过，两套链接检查通过。Implementation Review 待批量审查。 | 2026-08-22 |
| K41 | 撰写 Context 膨胀实验 | `进行中` | `tutorial/zh-CN/05-labs/context-bloat.md` 已完成 Draft 与 Polish；`labs/context-bloat` 比较 naive 与 bounded 投影，测试通过且两套链接检查通过。Implementation Review 待批量审查。 | 2026-08-23 |
| K42 | 撰写 Tool 重试副作用实验 | `进行中` | `tutorial/zh-CN/05-labs/retry-side-effects.md` 已完成 Draft 与 Polish；`labs/retry-side-effects` 覆盖无键重试、幂等重放和状态未知升级，测试通过。Implementation Review 待批量审查。 | 2026-08-23 |

## P2：Harness 机制教材

| ID | 机制 | 状态 | 教材章节 | 实验 | 最近更新 |
| --- | --- | --- | --- | --- | --- |
| M01 | Run Loop | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M02 | 状态模型 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M03 | Context 组装 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M04 | Context 压缩与截断 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M05 | Prompt 分层 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M06 | Tool Schema 与调用 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M07 | Tool 结果处理 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M08 | 流式事件 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M09 | Approval | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M10 | Sandbox 与权限 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M11 | Retry 与幂等 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M12 | Timeout 与取消 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M13 | Checkpoint 与 Resume | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M14 | Persistence | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M15 | Observability 与 Replay | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M16 | Memory 与工作区 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M17 | Sub-agent 与并发 | `未开始` | 缺失 | 缺失 | 2026-08-22 |
| M18 | 成本与延迟 | `未开始` | 缺失 | 缺失 | 2026-08-22 |

## P3：框架源码拆解

### 通用任务

| ID | 任务 | 状态 | 说明 | 最近更新 |
| --- | --- | --- | --- | --- |
| F00 | 建立 C01-C25 证据索引模板 | `进行中` | 模板已建立；C01/C02 各有部分索引，C03-C25 待补齐。 | 2026-08-22 |

### Reasonix

| ID | 任务 | 状态 | 锚点 | 最近更新 |
| --- | --- | --- | --- | --- |
| FR01 | 架构与入口盘点 | `进行中` | `docs/comparisons/evidence/C01-reasonix.md` 覆盖定位证据。 | 2026-08-22 |
| FR02 | Run 生命周期定位 | `进行中` | `docs/comparisons/evidence/C02-reasonix.md` 覆盖 Run 主线证据。 | 2026-08-22 |
| FR03 | 状态模型定位 | `未开始` | `aa82b2f` | 2026-08-22 |
| FR04 | Context 与工具链路 | `未开始` | `aa82b2f` | 2026-08-22 |
| FR05 | Approval / Sandbox / Recovery | `未开始` | `aa82b2f` | 2026-08-22 |
| FR06 | 可借鉴点与坑 | `未开始` | `aa82b2f` | 2026-08-22 |

### DeepSeek Harness

| ID | 任务 | 状态 | 锚点 | 最近更新 |
| --- | --- | --- | --- | --- |
| FD01 | Monorepo 与协议盘点 | `进行中` | `docs/comparisons/evidence/C01-deepseek-harness.md` 覆盖定位证据。 | 2026-08-22 |
| FD02 | Server 与 Run 生命周期定位 | `进行中` | `docs/comparisons/evidence/C02-deepseek-harness.md` 覆盖 Run 主线证据。 | 2026-08-22 |
| FD03 | Session 与状态模型定位 | `未开始` | `b150a55` | 2026-08-22 |
| FD04 | Tools / Sandbox / Hooks 链路 | `未开始` | `b150a55` | 2026-08-22 |
| FD05 | MCP / Jobs / 多 Agent 能力 | `未开始` | `b150a55` | 2026-08-22 |
| FD06 | 可借鉴点与坑 | `未开始` | `b150a55` | 2026-08-22 |

### Pi

| ID | 任务 | 状态 | 锚点 | 最近更新 |
| --- | --- | --- | --- | --- |
| FP01 | Agent / AI / Protocol 盘点 | `进行中` | `docs/comparisons/evidence/C01-pi.md` 覆盖定位证据。 | 2026-08-22 |
| FP02 | Coding Agent 入口与生命周期 | `进行中` | `docs/comparisons/evidence/C02-pi.md` 覆盖 CLI 主路径生命周期证据。 | 2026-08-22 |
| FP03 | Session 与事件模型定位 | `未开始` | `c49906e` | 2026-08-22 |
| FP04 | 工具执行与容器化边界 | `未开始` | `c49906e` | 2026-08-22 |
| FP05 | Telemetry / Evals / Client | `未开始` | `c49906e` | 2026-08-22 |
| FP06 | 可借鉴点与坑 | `未开始` | `c49906e` | 2026-08-22 |

## P4：横向对比

| ID | 任务 | 状态 | 验收标准 | 最近更新 |
| --- | --- | --- | --- | --- |
| X01 | C01-C05 对比 | `进行中` | `architecture.md` 先完成 C01/C02/C17 架构视角对比；其余维度待后续章节补齐。 | 2026-08-22 |
| X02 | C06-C10 对比 | `进行中` | `context.md` 完成 C05/C06/C10 对照；`tools.md` 补齐 C08-C10 工具协议视角。 | 2026-08-22 |
| X03 | C11-C16 对比 | `进行中` | `tools.md` 覆盖并发；`security.md` 补齐审批、安全和注入视角；事件与多 Agent 待后续章节补齐。 | 2026-08-22 |
| X04 | C17-C20 对比 | `进行中` | `security.md` 覆盖失败处理安全视角；`persistence.md` 补齐持久化与恢复；观测待后续章节补齐。 | 2026-08-22 |
| X05 | C21-C25 对比 | `未开始` | 扩展、测试、成本、评测和部署可比。 | 2026-08-22 |
| X06 | 设计模式与反模式 | `进行中` | `patterns.md` 已提炼六个模式、十个反模式和迁移检查单；待统一事实审查。 | 2026-08-22 |

## P5：实验与面试题库

| ID | 任务 | 状态 | 验收标准 | 最近更新 |
| --- | --- | --- | --- | --- |
| L01 | 建立 `labs/` 目录规范 | `进行中` | L-01 至 L-03 教材已建立目录、命令、依赖、输出和测试说明。 | 2026-08-23 |
| L02 | Mock model / fake tool 基座 | `进行中` | fake model、echo tool、确定性 Context 历史和工单服务可离线重复运行。 | 2026-08-23 |
| Q01 | 概念与架构题库 | `未开始` | 每题有考察点、参考答案、追问和常见错误。 | 2026-08-22 |
| Q02 | 实现与调试题库 | `未开始` | 覆盖工具、流式、取消、重试和状态恢复。 | 2026-08-22 |
| Q03 | 安全与系统设计题库 | `未开始` | 覆盖沙箱、审批、注入、成本和多 Agent。 | 2026-08-22 |

## P6：GitHub Pages 发布

| ID | 任务 | 状态 | 验收标准 | 最近更新 |
| --- | --- | --- | --- | --- |
| S01 | Astro Starlight / Docusaurus 选型 | `未开始` | 按多语言路由、搜索、维护成本和 Actions 支持打分。 | 2026-08-22 |
| S02 | 初始化最小站点工程 | `已完成` | Node 构建器读取 `tutorial/`，本地构建生成 6 个页面。 | 2026-08-22 |
| S03 | GitHub Actions 构建 | `已完成` | Pages workflow 已配置构建、链接检查和 artifact 上传；远端历史已有部署记录。 | 2026-08-22 |
| S04 | GitHub Pages 部署 | `进行中` | Workflow 对最新提交执行成功；继续按每次推送验证。 | 2026-08-22 |
| S05 | 部署后页面检查 | `进行中` | 入口和总览可访问；`/zh-CN/` 语言索引仍返回 HTTP 404，需在站点改造中修复。 | 2026-08-22 |
| S06 | 自定义域名（可选） | `未开始` | 如启用，需验证 HTTPS 和回退行为。 | 2026-08-22 |

## 当前优先级队列

1. 按 TOC 顺序逐节完成 C03/C04，再进入 M-01 及后续机制章节。
2. 每节由主 Agent 串行执行 Draft → Polish → 自检 → 提交推送 → 部署检查 → 进度同步；不创建 Subagent 或并行子任务。
3. 补齐 C01-C25 证据索引后，再按同一节奏完成三家框架深拆。
4. 全部初稿完成后由主 Agent 统一 Implementation Review，最后进入发布检查。

## 维护规则

1. 本文件只保存状态、交付物和验收标准的总览；不要把长篇分析写进来。
2. 每次完成、修改范围或发现阻塞时，更新对应行和 `最近更新`。
3. 状态变化必须在当天会话记录中有依据。
4. 不允许只改本文件却不留会话或 Git 记录。
5. 新任务必须有唯一 ID；废弃任务不删除，改为 `已废弃` 并说明原因。
