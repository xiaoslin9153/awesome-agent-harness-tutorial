---
date: 2026-08-22
topic: OpenRouter 402 阻塞 Polish
status: 已完成
---

# OpenRouter 402 阻塞 Polish

## 目标

记录 C-03 Polish Subagent 连续三次返回 `402 Payment Required` 的原因判断和处理策略。

## 现象

C-03 会话记录显示三次请求都要求最多 65536 个输出 token；可用额度分别约为 2712、1084 和 29833 token。三次都没有产生润色结果，Draft 保持不变。

## 判断

这不是普通 429 限流。OpenRouter 文档将 402 解释为账户或 API key 余额不足；若账户余额为负，即使调用免费模型也可能返回 402。当前错误文本同时说明“需要更多额度，或减少 max tokens”，因此请求中的 65536 输出上限被上游视为信用预留，超过当前可负担额度。

### 模型绑定排查

- 用户级 Codex 配置已设置全局模型 `stealth/ox-alpha`，provider 指向 OpenRouter。
- 本仓库没有项目级 `.codex/config.toml`，也没有把 Polish Agent 写死为其他模型的项目配置。
- Codex 子代理契约是：不传模型覆盖时继承当前模型；只有显式传入另一个模型才会切换。因此如果 Goal Agent 通过同一 Codex 运行且未覆盖模型，“没写死成 ox-alpha”不是根因。
- 如果 Goal Agent 使用独立执行器启动 Subagent，或在启动参数中显式选择了免费模型，则可能出现主代理与润色代理不同源的情况。
- 无论模型是哪个，三次错误的共同触发条件都是请求预留 65536 个输出 token，而账户当时无法负担该预留；所以直接根因应先按余额和输出预算处理。

证据：

- [OpenRouter Limits](https://openrouter.ai/docs/api_reference/limits)：负余额会导致免费模型也返回 402。
- [OpenRouter Errors](https://openrouter.ai/docs/api_reference/errors-and-debugging)：402 表示账户或 API key 余额不足。

## 处理策略

1. 不要继续重试 Polish。
2. 调用 `GET https://openrouter.ai/api/v1/key` 检查账户与 key 的余额、上限和剩余量；不要把响应中的敏感配置写入仓库。
3. 任选其一恢复：补充最低额度使余额大于零；把 Subagent `max_tokens` 降到低于当前可负担额度；改用付费模型变体或其他本地可用模型。
4. 恢复后从 C-03 Polish 继续，不重写 Draft。

## 变更

- 写作流水线新增 402 与 429 的区分规则。
- 写作流水线要求 Goal 启动时记录主代理和 Subagent 的模型来源、输出预算与覆盖关系。
- 总进度表新增 G25 记录该执行故障处理策略。
