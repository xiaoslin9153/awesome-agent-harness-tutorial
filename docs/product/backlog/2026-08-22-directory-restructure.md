# B-001：教材目录六部分重构

## 状态

- `待手动激活`
- 创建日期：2026-08-22
- 执行前提：暂停 Goal Agent，确认 Git 干净并与远端同步。

## 目标

把现有目录调整为更清晰的递进结构，避免初学者在框架章节过早接触专有协议，同时保留工程师需要的深度进阶路线。

## 目标结构

```text
第一部分：心智模型
第一章 核心概念

第二部分：通用机制
第二章 Harness 核心机制
第三章 最小实验

第三部分：真实实现
第四章 框架基础拆解

第四部分：框架特色进阶
第五章 框架高级机制

第五部分：归纳与迁移
第六章 横向对比与设计模式

第六部分：工程化与面试
第七章 案例研究
第八章 评测
第九章 面试题库
第十章 术语表
```

## 迁移映射

| 现路径 | 目标位置 | 说明 |
| --- | --- | --- |
| `01-core-concepts/` | `01-core-concepts/` | 保持不变。 |
| `02-harness-mechanics/` | `02-harness-mechanics/` | 保持不变。 |
| `05-labs/minimal-run.md` | `03-labs/minimal-run.md` | 最小实验前移，作为理论和源码之间的桥梁。 |
| Reasonix / DeepSeek Harness / Pi 基础节 | `04-framework-foundations/<framework>/` | 只保留架构、Run 生命周期和工具链路等基础拆解。 |
| 框架专有能力 | `05-framework-advanced/<framework>/` | 独立成进阶小节，标记「进阶选读」。 |
| `04-comparisons/` | `06-comparisons/` | 放到三家实现之后，负责机制归纳和模式提炼。 |
| `06-case-studies/` | `07-case-studies/` | 保持案例定位。 |
| `08-evaluation/` | `08-evaluation/` | 保持编号。 |
| `07-interview/` | `09-interview/` | 面试题库放在归纳和评测之后。 |
| `09-glossary/` | `10-glossary/` | 术语表保持在最后。 |

## 框架特色候选主题

### Reasonix

- Checkpoint / Rewind 与恢复边界。
- Desktop、CLI 和 Serve 多运行形态。
- Skill 与 Sub-agent Profile。
- Ask / Auto / Yolo 审批模式。
- ACP Session Inbox 扩展。

### DeepSeek Harness

- Cordis 插件、服务注册和热更新模型。
- Typert 协议生成。
- Bash / PowerShell 沙箱矩阵与持久 Shell。
- Context Provider 组合。
- Compaction 与输出保留。
- Schedule / Jobs。
- 实验性 Agent Team。

### Pi

- Extension 系统。
- Extension UI Protocol。
- RPC / Client 架构。
- Session Format 兼容策略。
- 自定义模型 Provider。
- Containerization。
- TUI 与跨平台运行。
- Telemetry 边界。

## 收录标准

1. 每个特色主题必须绑定固定快照 commit 和源码锚点。
2. 不写功能清单；必须解释数据流、状态归属、失败分支和设计取舍。
3. 每个特色回答「自己实现 Harness 时可以借鉴什么」。
4. 初学者可跳过；页面必须标记「进阶选读」。
5. 上游变化时只更新对应特色节，不影响通用章节。

## 执行清单

激活后按顺序执行：

1. 在产品设计中记录本次范围变更决策。
2. 先迁移最小实验目录，验证构建和部署。
3. 再拆分框架基础与进阶目录，逐框架提交。
4. 更新横向对比、案例、面试、评测和术语表路径。
5. 为所有旧 URL 提供重定向或别名，避免外链失效。
6. 全量更新 TOC、交叉链接、Front Matter、进度表和多语言接口。
7. 执行链接检查、站点构建、受影响页面检查和 GitHub Pages 部署检查。
8. 完成批量 Implementation Review 后才允许相关内容标记发布。

## 明确不做

1. 不在当前 Goal Agent 运行中自动执行。
2. 不删除旧章节来强行完成迁移。
3. 不把没有源码证据的特色主题写入公开教材。
