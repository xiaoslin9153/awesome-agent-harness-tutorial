# 会话：拉取三个框架仓库

## 元数据

- 日期：2026-08-22
- 状态：已完成
- 目标：为后续源码级拆解准备 Reasonix、DeepSeek Harness 和 Pi 的本地源码。

## 范围

### 范围内

- 确认三个框架的官方仓库。
- 浅克隆源码到 `external/`。
- 记录版本、commit 和目录规模。

### 范围外

- 完整源码拆解。
- 运行任何框架。
- 修改外部仓库。

## 初始假设

- `esengine/DeepSeek-Reasonix` 是 Reasonix 的官方仓库。
- `deepseek-ai/deepseek-harness` 是 DeepSeek Harness 的官方仓库。
- `earendil-works/pi` 是 Pi 的官方仓库。

## 工作记录

### 1. 决策

将三个项目浅克隆到 `external/`，便于直接检索源码和文档。第三方源码不提交进本仓库。

### 2. 克隆结果

执行三次 shallow clone：

```sh
git clone --depth 1 https://github.com/esengine/DeepSeek-Reasonix.git external/DeepSeek-Reasonix
git clone --depth 1 https://github.com/deepseek-ai/deepseek-harness.git external/deepseek-harness
git clone --depth 1 https://github.com/earendil-works/pi.git external/pi
```

### 3. 快照锚点

| 项目 | 分支 | Commit | 最近提交时间 |
| --- | --- | --- | --- |
| Reasonix | `main-v2` | `aa82b2f94f3dbfccad544ac858c482533e00327f` | 2026-08-22T03:11:34+00:00 |
| DeepSeek Harness | `master` | `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` | 2026-08-21T20:03:37+08:00 |
| Pi | `main` | `c49906ec77788625aacbdc53ebca6fbe65bd20f5` | 2026-08-22T01:19:25+02:00 |

### 4. 规模观察

| 项目 | 总文件数 | Markdown 数 | 主要源码文件数 |
| --- | ---: | ---: | ---: |
| Reasonix | 5,175 | 242 | 约 4,319 |
| DeepSeek Harness | 7,895 | 2,499 | 约 2,763 |
| Pi | 1,391 | 97 | 约 1,157 |

“主要源码文件”当前按 `.py`、`.ts`、`.tsx`、`.js`、`.rs`、`.go` 统计，只用于判断拆解工作量，不代表可构建源码规模。

### 5. 初步入口

- Reasonix：优先阅读根 README 中文版、`docs/SPEC.zh-CN.md`、`docs/SESSION_REFERENCE_ARCHITECTURE.md`、`docs/CHECKPOINTS.zh-CN.md`、`docs/RECOVERY.zh-CN.md`、`docs/TOOL_APPROVAL*` 和 `internal/`。
- DeepSeek Harness：优先阅读根 README 与中文 README、`packages/sdk/protocol`、`packages/session`、工具目录、`packages/sandbox`、`packages/hooks` 和示例。
- Pi：优先阅读根 README、`packages/agent`、`packages/ai`、`packages/protocol`、`packages/coding-agent`、`packages/client` 和相关文档。

## 结果

三个框架的本地分析环境已准备完成，版本和 commit 已固定。第三方源码通过 `.gitignore` 排除，不会进入本项目历史。

## 下一步

1. 为每个项目创建 C01-C25 的证据索引。
2. 先从 Run 生命周期（C03）和状态模型（C04）开始横向定位。
3. 每个结论标注文件路径和行号。
