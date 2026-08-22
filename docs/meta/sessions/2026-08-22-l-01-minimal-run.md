---
date: 2026-08-22
topic: L-01 最小 Agent Run 实验初稿
status: 已完成
---

# L-01 最小 Agent Run 实验初稿

## 目标

完成 L-01 的中文 Draft 和 Polish；建立可引用的 `labs/minimal-run` 规范与可执行基座，保留批量 Implementation Review 清单，通过链接检查、最小提交和推送后同步目录、会话记录和总进度表。

## 范围

- 范围内：`tutorial/zh-CN/05-labs/minimal-run.md`、`labs/minimal-run/`、目录状态、本会话记录和总进度表。
- 范围外：真实模型调用、外部服务、站点改造和框架集成。

## 记录与证据

- 已确认 X-06 已由 `3870614` 推送，`main` 与 `origin/main` 同步且工作区干净。
- 实验采用确定性 fake model 和 fake tool，不依赖网络或密钥。
- 实验目标是最小化 Run 循环不变量：输入闭合、assistant message 完成、tool call/result 配对、事件可审计。

## 成功标准

- `labs/minimal-run` 有 README、package.json 和可执行脚本。
- `npm test` 能输出稳定 JSONL 事件，并覆盖直接完成、工具完成和工具失败三条路径。
- 教材说明实验目的、目录、命令、事件解读和迁移到真实 Harness 的检查点。
- Polish 通过后语言清晰；实现审查保留待批量核验。
- 两套链接检查和实验测试通过。

## 进展

- 2026-08-22：建立会话检查点，确认 L-01 是第四章后的第一个实验章节。
- 2026-08-22：完成 `labs/minimal-run` 的 fake model、echo tool、Run 驱动器和三条路径测试。
- 2026-08-22：完成中文教材 Draft 与 Polish，补充事件时序、配对观察、确定性边界和迁移检查单。
- 2026-08-22：提交前自检发现 `npm start` 未输出事件流；为 Run 驱动器增加确定性 JSONL 示例入口，并用 `import.meta.filename` 判断直接执行。
- 2026-08-22：执行 `cd labs/minimal-run && npm start && npm test`，三条路径通过；执行 `node scripts/check-links.mjs` 与 `(cd site && npm run check:links)`，41 个 Markdown 文件链接全部通过。

## 决策

- 采用确定性假件而不是真实 Provider：优先隔离 Run 循环逻辑，避免网络、密钥和模型波动影响可重复性。
- 工具失败仍写入消息历史并发出 `tool_result`：保证 tool call/result 配对，为恢复和审计提供完整观察。
- 显式区分 `completed` 和 `max_turns`：让结束原因成为后续取消、暂停和恢复机制的基础契约。

## 自检

- 教材 Front Matter 记录 Polish 通过和 Implementation Review `pending`。
- 待批量审查项包括干净环境重放、JSONL 字段一致性、失败路径覆盖范围和迁移检查单对齐。
- 变更只包含 L-01 教材、对应实验、目录状态、会话记录和总进度表；未引入构建产物或无关格式化。
- 已验证 `npm start` 输出 JSONL 事件，`npm test` 覆盖三条路径。

## 开放问题

- Implementation Review 仍需在批量草稿完成后统一核验教材描述、脚本行为和输出字段。
- L-01 只建立最小基座，尚未覆盖流式事件、取消中断、持久化提交点和副作用记录。

## 下一步

1. 提交并推送 L-01 最小改动。
2. 按 TOC 顺序启动 L-02 Context 膨胀实验的 Draft。
3. 继续保持单主 Agent 串行流程，并维持 Implementation Review 批量待办。
