# 教材多语言接口

## 状态

- 版本：v0.1
- 日期：2026-08-22
- 适用范围：仅适用于 `tutorial/` 下的公开教材内容
- 默认语言：简体中文（`zh-CN`）

## 设计原则

1. 中文优先：先写 `zh-CN`，不因等待翻译阻塞知识沉淀。
2. 路径即语言：每个公开教材页面必须位于语言目录下。
3. 结构对齐：不同语言版本的目录和文件名必须一致。
4. 默认可读：网站根路径应服务中文读者，或重定向到 `zh-CN`。
5. 翻译不阻塞发布：允许某些页面只存在 `zh-CN`。
6. 语言接口先于站点实现：后续更换 Astro、Docusaurus 或其他生成器时不改变内容路径。

## 目录接口

```text
tutorial/
  language-interface.md
  zh-CN/
    00-overview.md
    01-core-concepts/
    02-harness-mechanics/
    03-frameworks/
    04-comparisons/
    05-labs/
    06-case-studies/
    07-interview/
    08-evaluation/
    09-glossary/
  en/
    00-overview.md
    01-core-concepts/
    02-harness-mechanics/
    03-frameworks/
    04-comparisons/
    05-labs/
    06-case-studies/
    07-interview/
    08-evaluation/
    09-glossary/
```

`language-interface.md` 是语言规范，不是公开教材章节。新增语言时只创建新的语言目录，不复制本规范。

## 支持语言

| 语言代码 | 目录 | 状态 | 说明 |
| --- | --- | --- | --- |
| `zh-CN` | `tutorial/zh-CN/` | 默认语言 | 所有新教材先写在这里。 |
| `en` | `tutorial/en/` | 预留 | 后续发布英文版时启用。 |

新增语言必须使用 IETF BCP 47 语言代码，例如 `zh-CN`、`en`、`ja`、`ko`。

## 页面路径映射

| 内容 | 中文路径 | 英文路径 |
| --- | --- | --- |
| 总览 | `tutorial/zh-CN/00-overview.md` | `tutorial/en/00-overview.md` |
| 核心概念 | `tutorial/zh-CN/01-core-concepts/` | `tutorial/en/01-core-concepts/` |
| 核心机制 | `tutorial/zh-CN/02-harness-mechanics/` | `tutorial/en/02-harness-mechanics/` |
| 框架拆解 | `tutorial/zh-CN/03-frameworks/` | `tutorial/en/03-frameworks/` |
| 横向对比 | `tutorial/zh-CN/04-comparisons/` | `tutorial/en/04-comparisons/` |
| 实验 | `tutorial/zh-CN/05-labs/` | `tutorial/en/05-labs/` |
| 案例研究 | `tutorial/zh-CN/06-case-studies/` | `tutorial/en/06-case-studies/` |
| 面试题库 | `tutorial/zh-CN/07-interview/` | `tutorial/en/07-interview/` |
| 评测 | `tutorial/zh-CN/08-evaluation/` | `tutorial/en/08-evaluation/` |
| 术语表 | `tutorial/zh-CN/09-glossary.md` | `tutorial/en/09-glossary.md` |

同一逻辑页面在不同语言中必须保持除语言目录外的相同相对路径。

## Front Matter 接口

每个公开教材 Markdown 页面必须包含以下字段：

```markdown
---
title: 页面标题
description: 一句话说明
lang: zh-CN
content_status: draft
source_version: 2026-08-22
translations:
  en: null
---
```

### 字段定义

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 页面标题。 |
| `description` | 是 | 用于列表页、搜索结果和社交分享的一句话说明。 |
| `lang` | 是 | BCP 47 语言代码，必须与所在目录一致。 |
| `content_status` | 是 | `draft`、`review`、`published` 之一。 |
| `source_version` | 是 | 内容修订日期，格式为 `YYYY-MM-DD`。 |
| `translations` | 是 | 其他语言映射；未翻译时使用 `null`。 |

### 示例

中文源页面：

```yaml
---
title: 一次 Agent Run 的完整生命周期
description: 用一条主线解释输入、上下文、工具、审批、持久化和恢复。
lang: zh-CN
content_status: draft
source_version: 2026-08-22
translations:
  en: null
---
```

英文翻译页面：

```yaml
translations:
  zh-CN: /zh-CN/02-harness-mechanics/agent-run-lifecycle.md
```

英文页面的 `translations` 必须指向中文源页面的公开 URL 或仓库相对路径。站点生成器可以把仓库路径转换成最终路由。

## 同步规则

1. 中文页面是内容源。
2. 英文页面必须记录它翻译的中文 `source_version`。
3. 中文源更新后，旧翻译不删除，但必须在页面顶部加入过期提示。
4. 结构性变更必须同步调整所有已存在语言目录。
5. 站点构建时应检测缺失翻译，而不是要求所有语言完整。
6. 禁止在非对应语言目录中放置内容。

## 站点路由接口

| 内容类型 | 仓库路径 | 建议站点路由 |
| --- | --- | --- |
| 教材首页 | `tutorial/zh-CN/00-overview.md` | `/zh-CN/` |
| 章节页 | `tutorial/zh-CN/01-core-concepts/agent-vs-harness.md` | `/zh-CN/01-core-concepts/agent-vs-harness/` |
| 英文页 | `tutorial/en/01-core-concepts/agent-vs-harness.md` | `/en/01-core-concepts/agent-vs-harness/` |

站点根路径可以渲染语言选择页，或重定向到 `/zh-CN/`。

## 非目标

1. 不要求所有页面同时发布所有语言。
2. 不把内部治理、产品设计、对比账本或会话记录翻译成英文。
3. 不在当前阶段选择最终站点生成器。
4. 不用机器翻译直接标记为 `published`。
