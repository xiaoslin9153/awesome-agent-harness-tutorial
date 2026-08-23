---
date: 2026-08-23
topic: F-R3 Reasonix 工具与审批 v0.3 重写
status: 已完成
---

# F-R3 Reasonix 工具与审批 v0.3 重写

## 目标

按 Goal 运行手册重写 F-R3，把“工具调用经过哪些门、权限按什么优先级裁决”落到 permission 纯函数 Policy、executeOne 门控序列和 sandbox Escape 接口的固定快照实现。

## 范围

- 范围内：F-R3 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：F-D1 起 DeepSeek Harness 架构页、shellsafe 分类器完整规则表、注入评测语料建设。

## 旧稿审计

旧稿已有执行链路图与权限优先级概述，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；pending_review 未关闭；未核对 Policy.DecideSubject 的 bash approval class/segment 合成、ExplicitlyDenies 与 fallback 分离、EscapeApprover nil fail closed。

## 源码证据

1. `internal/permission/permission.go:1-5,17-53,55-72`：纯函数 Policy 定位；Decision 三态；ParseDecision unknown→Ask；Rule literal/glob/legacy 解析。
2. `permission.go:186-191`：DecideSubjects 多 subject 合取与优先级总纲。
3. `permission.go:196-210`：ExplicitlyDenies 只看配置 deny，保护 MCP 安装这一最终人类决定。
4. `permission.go:212-269`：bash 分支 classifyBashApproval/requiresExact/requiresHuman、SessionAllow exact 限制、segment decomposition 合成、fallback reader=Allow/writer=Mode。
5. `permission.go:280-320`：decideBashSegments 任一 Deny 即 Deny，存在 Ask 则整体至少 Ask。
6. `internal/agent/execute_one.go:137-138,152-155,165-178`：权限先于写租约；proxy resolve 后重查 mutation barrier；contextual gate 双查 canonical/exec tool。
7. `internal/sandbox/escape.go:8-37`：EscapeRequest one-shot 审计粒度；Approver nil fail closed；SessionChecker 免重复询问；WithEscapeApprover nil 即不注册。

## 决策

1. 核心不变量定为 Decision 三态、优先级固定（deny>sessionAllow(exact)>ask>allow(fallback)）、多 subject 合取、权限先于租约、屏障复查、逃逸显式。
2. 用机场安检类比入门，随后给出 bash 三类审批与 SessionAllow 卡位的精确语义。
3. 用 flowchart 表达 executeOne 门控序列，用 state diagram 表达 Parsed→Deciding→AwaitingUser→LeaseHeld。
4. 新增反例覆盖通配 allow 放行动态 bash、SessionAllow 绕 Deny、proxy ReadOnly 绕屏障、nil approver 误判拒绝、多 subject 漏查、先租约后权限、沙箱失败裸跑、glob 当黑名单。
5. 完整因果链采用 force push 命令：分解两段、requireHuman、UI danger 标签辅助、用户拒绝、配对 denied result 与审计。

## Polish

1. 统一 Decision、rule precedence、approval class、literal rule、escape approver 术语。
2. 强调 ExplicitlyDenies 与 fallback 分离保护 MCP 安装决定这一非显然设计。
3. 设计取舍表补充 pure function vs interactive gate 的测试收益。
4. 把 DeepSeek Harness scoped guard 对照留给 F-D1/F-D2。

## Implementation Review

1. 用脚本核对新稿全部 9 个外部锚点起止行均在文件范围内。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/03-frameworks/reasonix/tools-approval.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. shellsafe.ClassifyBash 的内部规则全集未逐条展开。
2. Approver nil→Allow 取舍的产品文档位置未核对。
3. EscapeSessionChecker 的会话作用域定义留待安全专题。
4. Gate.Check 与 Policy.DecideSubjects 的组合层细节未逐行展开。

## 下一步

Reasonix 三章完成。处理 F-D1《DeepSeek Harness 架构总览》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
