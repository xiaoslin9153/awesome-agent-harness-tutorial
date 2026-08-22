---
date: 2026-08-23
topic: M-04 Tool 执行与副作用 v0.3 重写
status: 已完成
---

# M-04 Tool 执行与副作用 v0.3 重写

## 目标

按 Goal 运行手册重写 M-04，把“放行后的调用如何约束真实世界副作用”绑定到三家固定快照的执行管线、边界检查、并发控制和取消语义。

## 范围

- 范围内：M-04 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：审批策略细节、沙箱内核机制、结果截断算法和跨框架对比页。

## 旧稿审计

旧稿已有副作用分级、并发顺序和取消原则，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix executeOne/confineWrite/ShellExecution、DeepSeek Harness scheduler 管线和 Pi process tree/file queue。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/execute_one.go:21-66,68-134,137-178,197-232`：parse→policy→prepare→finish、defer 释放租约、bash invocation-level read-only 分类、contextual gate、proxy resolve、delivery gates、mutation barrier。
   - `internal/tool/builtin/confine.go:191-246`：realpath confine、workspace first/session data second、managed config fresh human approval、preview 与 execute 差异。
   - `internal/tool/shell_execution.go:8-113`：host-only ShellExecution metadata、state/failure phase/mutation risk、合并 output tail、DetailedExecutor block 时 state=not_run。
   - `internal/agent/scheduler.go:199-226`：parent write reservation conflict fails immediately，release once。
2. DeepSeek Harness `b150a55`：
   - `packages/core/tools/src/index.ts:1329-1505`：frozen execution context、caller cancel、pre-execute waterfall/serviceAsk、monotonic guard denial。
   - `index.ts:1100-1128`：guard 可 deny 不可 force allow，global + scope chain。
   - `index.ts:1423-1444,1563-1599,1609-1645,1731-1781`：collapsed run_code 路由错误、body 失败仍 post-execute、caller cancellation normalization、post accept/block 限制与 failed value 不可替换。
3. Pi `c49906e`：
   - `agent-loop.ts:433-487,489-553,670-700,713-790`：sequential/parallel 执行、onUpdate settle 后关闭、afterToolCall 覆盖规则、toolResult 归一化。
   - `coding-agent/src/core/exec.ts:11-107`：signal/timeout/cwd、SIGTERM→SIGKILL、detached descendant 等待。
   - `tools/bash.ts:88-154,164-190`：cwd fsAccess、detached、track pid、killProcessTree、timeout 杀树、finally 清理；PI_* env 删除/按需暴露。
   - `tools/file-mutation-queue.ts:16-61`：realpath key、同路径串行、不同路径并行、finally release。

## 决策

1. 核心不变量定为入口唯一、执行时复查边界、并发显式、取消传播但不撒谎、观察结构化。
2. 把取消分为 dispatch 前、进程中、副作用后三段，强调 PartialRisk 是决策输入。
3. 用 flowchart 表达 pre/guard/concurrency/dispatch/post 全链路，用 state diagram 表达 PartialRisk 终态。
4. 新增反例覆盖 symlink TOCTOU、跨 agent 并行写、失败后继续测试、进程树残留、timeout 当普通失败、post-hook 反转失败、取消删日志和 cwd 漂移。
5. 完整因果链采用 edit/test/read 三调用 batch 在第 2 步被取消，证明配对结果保留 partial 事实。

## Polish

1. 统一 preflight、guard、lease、mutation barrier、around/body/post、structured observation 术语。
2. 工地监理类比只承担入门，随后给出管线顺序、平台差异和字段契约。
3. 设计取舍表补充 stdout/stderr 合并与分离等具体选择。
4. 把审批策略留给 M-06，沙箱机制留给 M-07，结果截断留给 M-05。

## Implementation Review

1. 用脚本核对新稿全部 10 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/tool-execution.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix approval ask 的 UI 阻塞语义留待 M-06。
2. Reasonix sandbox 与 landlock/native 隔离留待 M-07。
3. DeepSeek Harness timeout policy wrapper 的实现细节留待 M-09。
4. Pi OutputAccumulator 与 fullOutputPath 分页细节留待 M-05。

## 下一步

处理 M-05《Tool 结果处理与截断》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
