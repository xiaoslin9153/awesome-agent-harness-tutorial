---
date: 2026-08-23
topic: M-16 Prompt Injection 与工具安全 v0.3 重写
status: 已完成
---

# M-16 Prompt Injection 与工具安全 v0.3 重写

## 目标

按 Goal 运行手册重写 M-16，把“数据通道指令不可信”落到 Reasonix 受信分类通道/子结果边界、DeepSeek Harness monotonic deny 和 Pi validated-args hook。

## 范围

- 范围内：M-16 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：第三章框架架构页、注入评测语料建设、网络代理产品和跨框架对比页。

## 旧稿审计

旧稿已有入口表和响应流程，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix ClassifierTaskText/SubagentHostDecisionBoundaryNotice、DeepSeek Harness monotonic guard 语义。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/run_loop.go:160-175`：ClassifierTaskText trusted host channel；host framing 动词曾导致 read-only subagent deadlock；拒绝剥离用户可控 markup，防止伪装 host framing 解除 delivery gates。
   - `internal/tool/subagentguard.go:5-28`：SubagentHostDecisionBoundaryNotice 防止父 Agent 把子措辞当宿主状态；共享最低依赖防漂移；精准追加且不重复。
   - `internal/permission/bash_readonly.go:10-35,43-80`：shellsafe 分类作为执行权限边界；danger patterns 明示 visual hint only，Policy 才是 authority。
2. DeepSeek Harness `b150a55`：
   - `packages/core/tools/src/index.ts:1100-1128`：guard monotonic——any may deny，no force-allow；global→scope chain 取第一个 denial。
3. Pi `c49906e`：
   - `packages/agent/src/types.ts:270-277`：beforeToolCall 在 validated args 后执行、可 block、接收 abort signal。
   - `packages/coding-agent/src/core/extensions/types.ts:914-918,1087-1095`：ToolCallEvent input 可 mutate 且不再验证；block/reason/terminate。

## 决策

1. 核心不变量定为信任分级、意图与资料分离、宿主决定不可伪造、deny 单调、警告非防线、失败关闭。
2. 强调“注入成功”的判定是获得未经批准的能力，而非模型读到文本。
3. 用 flowchart 表达 trust label → policy/guard → confine 的分层，用 flowchart 表达四类注入企图的兜底路径。
4. 新增反例覆盖 README 触发删除、网页要求外发、子结果伪造批准、host framing 干扰分类、strip markup 反被利用、glob 绕过、hook 收原始文本和 extension mutate 无再校验。
5. 完整因果链采用 README 注入 curl|sh：schema 过但 shellsafe 判非 reader → approval 拒绝 → 变体仍 deny → sandbox 显式放行路径 → 样本入库回归。

## Polish

1. 统一 intent channel、untrusted data、host decision boundary、monotonic deny、visual warning vs enforcement 术语。
2. 助理读信类比只承担入门；随后给出信任分级表和数据治理规则。
3. 设计取舍表明确 strip suspicious text 仅限显示层且谨慎使用。
4. 把第三章框架整体架构留给 F-R1 起。

## Implementation Review

1. 用脚本核对新稿全部 6 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/prompt-injection.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. 注入评测语料库建设属安全评测待办，不在本章自动激活。
2. DeepSeek Harness guard 的具体策略示例未展开。
3. Pi extension mutator 的签名/信任机制需部署评审。
4. Reasonix shellsafe 分类器完整规则集留待安全进阶。

## 下一步

第二章完成。按 Goal 顺序进入第三章 F-R1《Reasonix 架构总览》。

## 部署检查

- 提交：`cdea23d docs: rewrite prompt injection safety`。
- GitHub Actions：run `32612474900`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/02-harness-mechanics/prompt-injection/` 可访问，并包含标题、ClassifierTaskText、SubagentHostDecisionBoundary 和 monotonic。
