---
date: 2026-08-23
topic: F-P2 Pi Run 生命周期 v0.3 重写
status: 已完成
---

# F-P2 Pi Run 生命周期 v0.3 重写

## 目标

按 Goal 运行手册重写 F-P2，把双层循环、流式分支、sticky length、prepareNextTurn 与 AgentSession 持久化桥绑定到固定快照锚点。

## 范围

- 范围内：F-P2 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：F-P3 工具沙箱细节、Lane reducer 实现、跨框架对比页。

## 旧稿审计

旧稿已有生命周期图与阶段描述，但缺少 learning_contract、核心不变量失效边界、8 个反例、完整因果链和第二张 Mermaid 图；pending_review 未关闭；未核对 continue 校验注释、length 全批失败的推理、willRetry 复制语义。

## 源码证据

1. `packages/agent/src/agent-loop.ts:95-118`：runAgentLoop 启动序列 agent_start/turn_start/prompt start-end。
2. `agent-loop.ts:60-76,120-143`：agentLoopContinue 校验最后一条非 assistant，同步异步双入口；注释解释 provider 拒绝原因。
3. `agent-loop.ts:155-275`：runLoop 双层循环——内圈 steering 注入/streaming/tool batch/turn_end/prepareNextTurn/shouldStop，外圈 followup 开新回合；最终 agent_end。
4. `agent-loop.ts:207-216,381-406`：length 时 failToolCallsFromTruncatedMessage 整批 isError 并建议 re-issue complete arguments。
5. `agent-loop.ts:226-245`：prepareNextTurn 返回 context/model/thinkingLevel 三覆盖。
6. `packages/agent/src/agent.ts:409-443`：runPromptMessages/runContinuation/createContextSnapshot/createLoopConfig（含 beforeToolCall 等回调）。
7. `packages/coding-agent/src/core/agent-session.ts:644-669`：processEvents 桥——扩展先分发、监听器通知、message_end 按 role append CustomMessageEntry 或 SessionMessageEntry。
8. `agent-session.ts:644-648`：agent_end 复制附 willRetry。

## 决策

1. 核心不变量定为 prompt 完整边界、continue 前置校验、length 全批失败、agent_end 收尾等订阅者、message_end 驱动持久化、willRetry 注入。
2. 用两圈轨道类比内外层循环；随后给出 turn() 骨架级序列与三支 stopReason 分支。
3. 用 state diagram 表达从 agent_start 到 agent_end 的全路径（含 steering 注入与 length 分支），用 flowchart 表达宿主调用链。
4. 新增反例覆盖 assistant 直接 continue、length 只丢尾 call、steering 无事件、agent_end 先于订阅者、prepareNextTurn 缺 context、shouldStop 后仍拉 followup、update 前写盘、willRetry 未透传。
5. 完整因果链采用评审任务中途 steer 加 max-tokens 截断：事件顺序即审计顺序。

## Polish

1. 统一双层循环、steering poll、sticky length failure、processEvents 桥接、willRetry 术语。
2. 强调 prompt 也发完整 start/end 使持久化桥无需特判。
3. 设计取舍表补充迁移顺序：先抽 config 回调再固定事件顺序最后拆双层循环。
4. 把工具执行细节留给 F-P3。

## Implementation Review

1. 用脚本核对新稿锚点均在文件范围内；补齐 agent.ts:173 与 agent-loop.ts:381-406 两处完整路径锚点。
2. 核对至少 8 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/03-frameworks/pi/run-lifecycle.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. runWithLifecycle 内部 abort 处理细节留待批量终审。
2. BlockAssembler 块合并规则未逐行展开。
3. shouldStopAfterTurn 的典型预算实现待评测阶段补充。

## 下一步

处理 F-P3《Pi 工具与沙箱》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
