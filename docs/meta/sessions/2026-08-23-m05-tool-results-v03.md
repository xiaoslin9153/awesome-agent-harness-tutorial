---
date: 2026-08-23
topic: M-05 Tool 结果处理与截断 v0.3 重写
status: 已完成
---

# M-05 Tool 结果处理与截断 v0.3 重写

## 目标

按 Goal 运行手册重写 M-05，把“结果如何保留证据又不撑爆上下文”落到三家固定快照的截断、输出契约、流式 accumulator 和取回引用实现。

## 范围

- 范围内：M-05 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：审批策略、沙箱机制、Context 级压缩质量和跨框架对比页。

## 旧稿审计

旧稿已有观察字段、分页引用和敏感信息分层，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix failure-aware truncation、DeepSeek Harness schema-before-render、Pi OutputAccumulator footer。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/agent.go:40-42,2758-2810`：32KiB provider Content 上限；bash/read/search 不同 snip geometry；error/panic/fatal 提升 tail；snapToRuneBoundary；marker 含 toolName/callID/resultRef/original size/kept size；三轮修剪。
   - `internal/agent/execute_one.go:692-758`：tool.after、post hook、receipts、recovery observation 后才截断；invalid JSON args 时附加 Schema；错误和成功路径都保留 rawOutput。
   - `internal/tool/tool.go:220-243`：SnipHint 几何属于工具，零值非法，contract test 强制声明。
   - `internal/tool/observation.go:7-43`：ModelTextObservation 行 hash、host-only、用于 stale-anchor 比较。
2. DeepSeek Harness `b150a55`：
   - `packages/core/tools/src/index.ts:1792-1823`：snapshot candidate、validateJsonSchemaValue、deep freeze value、render content、presentationMeta snapshot。
   - `index.ts:1609-1654,1656-1676`：post/cancellation/finalization 错误转 error result；notify observer 失败 contained。
   - `index.ts:1825-1862`：canonical WeakMap/token 区分 registry result 与 authored result；materializeFinalResult freeze presentation/value。
3. Pi `c49906e`：
   - `tools/output-accumulator.ts:28-118`：streaming UTF-8 decoder、rolling tail、temp file persistIfTruncated、total/output 行字节统计。
   - `tools/bash.ts:330-426`：description 声明截断协议、100ms onUpdate throttle、partial line/lines/bytes 三种 footer、Full output 路径、details metadata。
   - `tools/read.ts:286-296`、`tools/grep.ts:340-341`：read/grep 使用 truncateHead/TruncationResult。
   - `tools/truncate.ts:71-160`：truncateHead 完整行边界、首行超限返回空并 fail closed、total/output/max metadata。

## 决策

1. 核心不变量定为证据先行、有界投影、语义不变、省略可寻址、契约校验。
2. 明确 raw evidence、canonical value、host metadata、model content、presentation 五层。
3. 用 flowchart 表达保存证据→schema→render→budget→marker 的顺序，用 state diagram 表达 Unpersisted/OutputError 分支。
4. 新增反例覆盖 rune 切断、tail 丢错、无引用 marker、render 异常污染、图片 base64 截断、secret 进入模型、temp file 清理和成功空结果。
5. 完整因果链采用 18MB bash 日志的 streaming accumulator、footer、details、下一步读取和语义保持。

## Polish

1. 统一 raw evidence、bounded content、recovery marker、output contract、truncation footer 术语。
2. 快递类比只承担入门，随后给出保留面表、策略分类和字段契约。
3. 设计取舍表补充 temp file 与 Session RawContent 生命周期差异。
4. 把审批阻塞留给 M-06，把 checkpoint RawContent 恢复留给 M-10/M-11。

## Implementation Review

1. 用脚本核对新稿全部 11 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/tool-results.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix tool result paging capability 的完整交互留待实验或 M-05 进阶。
2. DeepSeek Harness ToolOutputError 的具体 UI 呈现未展开。
3. Pi fullOutputPath 清理策略依赖宿主环境，标记为宿主差异。
4. 敏感信息 redaction 规则与评测留待 M-07 或评测阶段。

## 下一步

处理 M-06《审批模型》。

## 部署检查

- 提交：`8c3bd3b docs: rewrite tool results`。
- 构建首次因 Front Matter 缺少闭合分隔线失败；修复后 `check:links` 与 build 通过，未触发连续两次失败停止条件。
- GitHub Actions：run `32597768098`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/02-harness-mechanics/tool-results/` 可访问，并包含标题、recovery marker 相关内容、`Full output` 和 `output schema`。
