---
date: 2026-08-22
topic: X-02 Context 策略对比初稿
status: 推送前检查进行中
---

# X-02 Context 策略对比初稿

## 目标

基于第三章和第二章 Context 机制，完成 X-02 的中文 Draft 和 Polish；保留批量 Implementation Review 清单，通过链接检查、最小提交和推送后同步目录、会话记录和总进度表。

## 范围

- 范围内：`tutorial/zh-CN/04-comparisons/context.md`、目录状态、本会话记录和总进度表。
- 范围外：工具协议、安全审批、持久化和实验验证。

## 记录与证据

- 已确认 X-01 已由 `70386c4` 推送，`main` 与 `origin/main` 同步且工作区干净。
- 已核对 Reasonix 的 compact 触发与投影摘要、DeepSeek Harness 的可选压缩服务和 surface replace、Pi 的阈值/溢出压缩与树状 cut point。
- 三家共同点是把权威历史与模型可见投影分开；差异在于压缩发生在消息重写、事件 surface 替换还是 JSONL 树边界。

## 成功标准

- 章节包含请求组装图、预算策略表、三家对照和设计取舍。
- 明确区分权威历史、派生投影、工具输出截断和会话级压缩。
- Polish 通过后语言清晰；字段级触发顺序和扩展行为保留在 `pending_review`。
- 两套链接检查通过。

## 进展

- 2026-08-22：建立会话检查点，确认 X-02 是 X-01 后的下一个横向对比章节。
- 2026-08-22：主 Agent 完成 X-02 Draft，覆盖请求投影、三家压缩机制、预算默认值和工具大输出。
- 2026-08-22：主 Agent 直接完成 Polish，统一权威历史、模型可见投影、surface replace 和树状切点术语。

## 自检证据

- 已核对 diff 只包含 X-02 章节、TOC、本会话记录和总进度表。

## 下一步

完成两套链接检查后提交推送；X-03 按 TOC 继续。
