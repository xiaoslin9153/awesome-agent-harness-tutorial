---
date: 2026-08-23
topic: M-10 Checkpoint 与 Resume v0.3 重写
status: 已完成
---

# M-10 Checkpoint 与 Resume v0.3 重写

## 目标

按 Goal 运行手册重写 M-10，把“哪些状态可以作为恢复起点”落到三家固定快照的 Save/CAS、persistence seed、JSONL resume 和环境断言。

## 范围

- 范围内：M-10 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：WAL/fsync 底层细节（M-11）、observability replay（M-12）、补偿产品设计和跨框架对比页。

## 旧稿审计

旧稿已有字段表和五步 Resume，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；框架对照仍是目录级 pending_review；没有核对 Reasonix save intent/saveVerified、DeepSeek Harness persistence.prepare/end-seed、Pi invalid file fail-closed。

## 源码证据

1. Reasonix `aa82b2f`：
   - `internal/agent/save.go:190-198,200-218,221-245`：Save/Snapshot/Rewrite/RewriteCompact 区分；jsonl 兼容 checkpoint + event log authoritative；双层锁 bounded wait。
   - `save.go:50-75`：snapshot conflict、externally removed、file lock held、recovery branch。
   - `save.go:83-104`：digest/version/revisionKnown/saveVerified；meta lag 时禁用 fast path。
   - `session_events.go:45-48,711-783`：event log 安全预算与 append/replace 写入。
2. DeepSeek Harness `b150a55`：
   - `packages/core/agent-loop/src/index.ts:653-658,662-692,693-703`：resume 必须有 sessionPersistence；raceAbortCall 防 never-settling backend；setupAndPublish action='resume'。
   - `packages/core/session/src/types.ts:108-135,222-228,314-337`：seed/meta/RestoredSessionOptions；RequestHeaderReason resume；session/end-seed marker。
3. Pi `c49906e`：
   - `packages/coding-agent/src/core/agent-session-runtime.ts:203-223`：before-switch 可取消、assertSessionCwdExists、teardown 后 reason=resume。
   - `packages/coding-agent/src/core/session-manager.ts:890-928`：setSessionFile 打开 JSONL；空文件初始化；非法文件 throw 不修改；header id、migration、buildIndex。

## 决策

1. 核心不变量定为只存闭合事实、身份唯一、基线受保护、环境显式、pending 先对账、租约防双写。
2. 区分 snapshot、rewrite、compact rewrite 和 recovery branch 四种保存意图。
3. 用 flowchart 表达 discover→validate→reconcile→lease，用 state diagram 表达 MigrationNeeded/HumanGate。
4. 新增反例覆盖只存 step number、UI 快照当真源、无租约双开、meta 滞后、cwd 变化静默继续、旧日志混入新生命周期、外部 job 未对账和损坏日志静默截断。
5. 完整因果链采用强制关机后的 pending bash call：闭合 edit、local-only test、人工选择 rerun 并生成新 callId。

## Polish

1. 统一 closed boundary、durable log、derived projection、save-verified baseline、seed/end-seed、reconciliation 术语。
2. 登山路条类比只承担入门，随后给出三层状态、写入时机和崩溃窗口协议。
3. 设计取舍表补充 log+compatibility checkpoint 的双工件一致性代价。
4. 把 WAL/fsync 留给 M-11，把 trace/replay 留给 M-12。

## Implementation Review

1. 用脚本核对全部完整锚点和相对 shorthand 锚点起止行均在文件范围内，共 9 个有效区间。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/02-harness-mechanics/checkpoint-resume.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Reasonix recovery cascade 历史与 reconcileOverlongSessionFilenames 未逐行展开。
2. DeepSeek Harness SessionPreparation dispose 语义留待持久化专题。
3. Pi migrateToCurrentVersion 的具体版本差异未在本章展开。
4. workspace Git HEAD 指纹是否应纳入 resume 判断需产品决策。

## 下一步

处理 M-11《Persistence》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
