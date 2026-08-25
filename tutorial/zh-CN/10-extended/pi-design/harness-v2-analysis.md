---
title: Pi Durable AgentHarness v2 深度解析
description: 从零理解 Pi AgentHarness v2 的记录日志模型——意图-结果对、恢复归约、效果边界和 Lane 变更线，每个机制都用具体例子走一遍。
lang: zh-CN
content_status: draft
source_version: 2026-08-25
source_url: https://github.com/earendil-works/pi/blob/harness-v2/j4/packages/agent/docs/harness-v2.md
---

# Pi Durable AgentHarness v2 深度解析

v2 是对 v1 的重新设计。核心变化：**从寄存器模型转向记录日志模型**。这篇文章从 v1 的问题出发，逐层拆解 v2 的每个机制。

## 1. v1 留下了什么问题

回顾 v1 的核心设计：`op.state` 寄存器保存操作的完整状态，每次转换覆盖。恢复读这一个寄存器。

这个设计有一个隐含假设：**寄存器里的状态是正确的**。如果写入有 bug——比如只写了部分字段、或者写了一个不合法的状态——恢复就会基于错误状态继续，可能做出错误的恢复决策。

v1 通过"完整覆盖"缓解了这个问题，但没有消除。因为状态和存储是两个东西：状态在内存中构造，然后写入存储。中间可能出错。

:::note
v2 的核心洞察：**消除状态和存储之间的间隙。** 状态不是存储的东西，而是从存储推导的东西。
:::

## 2. 核心概念：四种会话状态

v2 把会话的状态分为四种：

| 状态 | 性质 | 谁拥有 | 存什么 |
|---|---|---|---|
| **树** | 被动，共享 | 所有 Lane | 会话内容（消息、压缩、摘要、自定义） |
| **Lane** | 活跃，独立 | 每个 Lane | 叶子位置、操作日志、队列、配置 |
| **操作日志** | 活跃，独立 | 每个 Lane | 记录序列（持久性实现） |
| **全局事实** | 被动，共享 | 会话 | 最新写入获胜的键值对 |

关键区分：**树是被动的**（共享数据，任何 Lane 可读），**Lane 是活跃的**（拥有排他的操作状态）。两个 Lane 从不共享活跃状态。

### 2.1 树的规则

- 只增长，条目从不修改或删除
- 父链从不改变，分支共享前缀
- 不包含编排状态——删除所有操作日志，树仍然完整有效

### 2.2 Lane 的规则

- 每个 Lane 至多一个打开操作
- Lane 的叶子只通过追加或导航移动
- 两个 Lane 在同一叶子分叉，互不干扰
- Lane 名称是永久的应用键（如 Slack 线程 ID）

## 3. 持久性规则：一句话

v2 的核心规则只有一句话：

> **副作用之前：写意图记录。副作用之后：以 provisioned id 追加结果条目。**

没有多记录原子性，也不需要。每条记录和每个条目单独持久。崩溃在意图和结果之间时，恢复按意图类型决定：完成它、重试它，或用合成结果关闭它。

### 3.1 Provisioned ID

意图记录携带尚不存在的条目的 id：

```ts
type ProvisionedEntry<T> = Omit<T, "parentId" | "seq" | "timestamp">;
```

意图被满足**当且仅当**带该 id 的条目存在。存在但内容不同 = 损坏。

:::tip
这个设计的优雅之处：判断"一个副作用是否已经发生"不需要任何特殊标记——只需要检查"它的结果条目是否存在"。存在 = 已发生。不存在 = 未发生或不确定。
:::

## 4. 记录目录：九种记录

Lane 的操作日志包含九种记录。理解每种记录的用途和时机是理解 v2 的关键。

### 4.1 operation_started

操作接受时写入。这是操作的"出生证明"：

```ts
interface OperationStartedRecord {
  type: "operation_started";
  sourceLeafId: string;        // 接受时 Lane 的叶子
  intent: {
    kind: "run";
    originalPrompt: AgentMessage[];      // 规范化后的用户输入
    initialMessages: ProvisionedEntry[]; // 捕获的 nextRun + prompt + 钩子注入
    systemPromptOverride?: string;       // 钩子覆盖时固定
    resumeData?: Record<string, JsonValue>; // 钩子幂等键
  };
}
```

关键：**这条记录的 id 就是 runId**。该操作的所有后续记录都携带这个 runId。

### 4.2 step_attempt

每次可重试步骤尝试之前写入：

```ts
interface StepAttemptRecord {
  type: "step_attempt";
  runId: string;
  step: "assistant" | "compaction" | "branch_summary";
  attempt: number;           // 1 基，持久计数
  resultEntryId: string;     // 尝试成功时产生的条目 id
  compactionReason?: "manual" | "threshold" | "overflow"; // 仅压缩步骤
}
```

:::note
**步骤被记录因为它们是可重试的。** 持久计数限制跨重启的重试——崩溃重启循环不能重置计数。没有这条记录，一个反复崩溃的系统可能无限重试同一个请求。
:::

### 4.3 tool_started

工具放行后、执行前写入：

```ts
interface ToolStartedRecord {
  type: "tool_started";
  runId: string;
  assistantEntryId: string;   // 哪个助手消息请求了这个工具
  toolIndex: number;          // 在批次中的位置
  toolCallId: string;         // provider 的调用 id
  toolName: string;
  effectiveArgs: Record<string, unknown>; // before_tool 处理后的参数
  resultEntryId: string;      // provisioned 的结果 id
  replay: "never" | "safe";   // 执行时快照的重放声明
}
```

`replay` 是恢复的关键。崩溃后恢复读到 `tool_started` 但没有结果条目时：

- `replay: "safe"` **且** 当前工具声明也是 `"safe"` → 重新执行
- 否则 → 写合成 "interrupted" 结果

**两个声明都必须说 safe**。因为工具代码可能在崩溃后被更新——旧代码说安全但新代码不安全，就不能重放。

### 4.4 queue_enqueued / queue_cancelled

队列接受和撤回：

```ts
// 入队
interface QueueEnqueuedRecord {
  type: "queue_enqueued";
  queue: "steer" | "followUp" | "nextRun";
  runId?: string;             // nextRun 缺失
  target: ProvisionedEntry;   // 完整载荷 + provisioned id
}

// 撤回
interface QueueCancelledRecord {
  type: "queue_cancelled";
  entryId: string;            // 被撤回项的 provisioned id
}
```

`queue_cancelled` 的存在是为了防止崩溃复活已取消的项：恢复将"有 `queue_enqueued` 但没有条目"视为待处理。如果没有 `queue_cancelled`，一个已取消的项在崩溃后会被误认为待处理。

### 4.5 write_deferred

运行中的树写入延迟到检查点：

```ts
interface WriteDeferredRecord {
  type: "write_deferred";
  runId: string;
  target: ProvisionedEntry;
}
```

为什么延迟？因为直接追加到树会使 provider 的 KV 缓存失效（上下文在尾部之前插入了新条目）。检查点在尾部追加。

### 4.6 usage

成本记录。独立于编排：

```ts
type UsageRecord = RecordBase & { type: "usage"; usage: Usage } & (
  | { cause: "assistant" | "compaction"; runId: string; entryId: string;
      attempt: number; stopReason: TerminalStopReason }
  | { cause: "tool"; runId: string; entryId: string; toolCallId: string }
  | { cause: "hook"; runId: string; entryId: string }
  | { cause: "adjustment"; runId?: string; entryId?: string }  // 应用提供
);
```

:::danger
**成本持久性不依赖结果持久性。** 可重试步骤产生的响应可能从不成为条目——失败尝试、被丢弃的溢出响应。但它们的成本必须记录。每个 provider 请求在任何分类之前写 `usage` 记录。
:::

## 5. 走一遍完整的 Run

用 v2 的记录模型跟踪同样的例子：

```text
用户："删除旧迁移，然后跑测试"
```

**步骤 1：接受**

```text
H   before_run                       钩子可以注入消息
R   operation_started                runId = r_1
    intent.initialMessages = [user message "删除旧迁移..."]
E   user message                     provisioned id e_50
```

**步骤 2：助手生成——第一次尝试**

```text
R   step_attempt                     step=assistant, attempt=1, resultEntryId=e_51
    ...provider 请求（不确定窗口）...
E   assistant message [tool call]    e_51（满足 attempt 1 的 provisioned id）
```

注意：**没有单独的"意图提交"**。`step_attempt` 就是意图——它说"我要做第 1 次尝试，结果会写到 e_51"。条目 e_51 出现 = 尝试完成。

**步骤 3：工具放行和执行**

```text
H   before_tool                      可以更改参数或阻止
R   tool_started                     effectiveArgs, resultEntryId=e_52, replay="never"
    ...rm -rf 执行中...
H   after_tool                       可以修补结果
E   tool result                      e_52（满足 tool_started 的 provisioned id）
```

**步骤 4：继续循环**

```text
R   step_attempt                     step=assistant, attempt=1, resultEntryId=e_53
E   assistant message                e_53
```

**步骤 5：终态**

```text
H   before_run_end                   没有待处理
R   operation_finished               outcome=completed
```

对比 v1：v2 的每一步都是**追加一条记录**或**追加一个条目**，没有覆盖操作。

## 6. 崩溃恢复：归约

### 6.1 什么是归约

恢复不是读一个寄存器，而是从记录**推导**状态：

```text
输入：Lane 的操作日志（从打开的 operation_started 开始）
      Lane 自己的条目（从叶子到操作锚点）

输出：Lane 的当前状态
  - 正在中止？     → 存在 abort_requested
  - 已用尝试       → 最新 step_attempt（resultEntryId 无条目 = 未完成）
  - 工具批次状态   → 最新助手条目的调用 vs tool_started/结果
  - 延迟句柄       → 最新条目是 deferred 助手且无后继
  - 待处理队列     → queue_enqueued 无条目且未被取消
  - 待处理写入     → write_deferred 无条目
```

:::note
**状态被定义为记录的归约。** 活跃执行和恢复使用相同的归约函数。不存在"状态和存储不一致"的可能性，因为它们是同一个东西的两个视图。
:::

### 6.2 工具执行的五个崩溃点

```text
E   assistant message [calls c1, c2]
X1  ← before before_tool            c1 没有持久内容
H   before_tool(c1)
X2  ← 决策已做，没有写入              同 X1
R   tool_started(c1)
X3  ← 工具执行中                     副作用结果未知
H   after_tool(c1)
X4  ← 钩子被中断                      同 X3
E   tool result c1
X5  ← 结果持久                        c1 完成
```

| 崩溃点 | 恢复 |
|---|---|
| X1, X2 | 完整正常路径；`before_tool` 重新运行 |
| X3, X4 | 重放安全（记录和当前声明都说 safe）→ 重新执行；否则合成 interrupted |
| X5 | 跳过 c1；处理 c2 |

对账按源顺序处理批次的每个调用。每个调用独立恢复。

### 6.3 恢复的优先级

`resume()` 按以下顺序处理：

```text
1. 缺失初始消息     → 追加它们（被接受的输入从不丢失）
2. 正在中止         → 对账（合成结果、关闭消息、aborted）
3. 未解析工具批次   → 每调用：跳过/重执行/合成
4. 延迟句柄         → 兑换
5. 终端失败         → 排空输入，关闭为 failed
6. 未完成步骤       → 恢复该步骤（在消耗新检查点输入之前）
7. 否则             → 继续下一个检查点
```

:::tip
恢复追加有一条额外规则：**跳过任何已存在的 provisioned id**。恢复期间的崩溃留下更少的待恢复内容；重新运行恢复总是安全的。
:::

## 7. 效果边界：让崩溃点可测试

### 7.1 Effects 接口

每个副作用经过一个注入的 `Effects`（`fx`）句柄：

```ts
interface Effects {
  // 持久写入
  appendEntry(entry): Promise<Entry>;
  appendRecord(record): Promise<Record>;
  moveLane(to): Promise<void>;
  setFact(fact): Promise<void>;

  // 条件提交
  tryFinishRun(runId, outcome): Promise<"finished" | "continue">;
  consumeQueueItem(runId, queue, entryId): Promise<"consumed" | "skipped">;
  applyPendingWrite(runId, entryId): Promise<"applied" | "skipped">;

  // 外部副作用
  streamAssistant(request): Promise<SettledAssistantMessage>;
  executeTool(prepared): Promise<{ result, isError }>;
  fetchDeferred(model, handle): Promise<SettledAssistantMessage>;

  // 拦截和时间
  runHook(name, event): Promise<HookResult>;
  sleep(delayMs): Promise<"elapsed" | "aborted">;
}
```

:::tip
**`fx` 的方法列表就是完整的崩溃点目录。** 在任何调用前后停止，恰好对应一个已知的崩溃状态。没有隐藏的副作用路径。
:::

### 7.2 构造规则

过程只接收 `fx` 和遥测上下文。**从不**接收 `Session`、`Models`、工具注册表或钩子运行器。

这由构造和测试强制：手动模式驱动的操作在停靠时执行**零**存储写入和**零**外部调用。

### 7.3 手动驱动

`drive: "manual"` 让 Harness 在每个副作用前停靠：

```ts
const harness = await AgentHarness.create({ drive: "manual", ... });
const result = harness.prompt("do something");

// 停靠在第一个副作用前
while ((await harness.peekAction())?.kind !== "execute_tool") {
  await harness.executeAction();
}

// 现在停靠在工具执行前——这是崩溃点 X3
const started = await session.findRecords({ type: "tool_started" });
expect(await session.getEntry(started[0].resultEntryId)).toBeUndefined();
// ↑ 意图持久但结果不存在 = X3 状态

// 注入 steer，测试竞争
await harness.steer("focus on tests");
await harness.runToCompletion();
```

## 8. Lane 变更线：消灭竞争

### 8.1 问题的形状

每个竞争的形状相同：

```text
1. 从 Lane 状态做决策
2. await（异步操作）
3. 提交基于过期状态的决策
```

### 8.2 解决方案

每个 Lane 一个进程本地 FIFO——promise 链：

```ts
let tail: Promise<unknown> = Promise.resolve();

function mutateLane<T>(job: () => Promise<T>): Promise<T> {
  const result = tail.then(job);
  tail = result.then(() => undefined, () => undefined);
  return result;
}
```

每个作业：验证 → 至多一个持久写入 → 更新内存状态。

:::danger
Provider 请求、工具执行、钩子和退避**从不**在作业内运行。它们在作业之间运行——这正是每次提交在自己的作业内重新验证的原因。
:::

### 8.3 竞争的两种历史

```text
steer vs finish：

  steer 优先：                    finish 优先：
  queue_enqueued                  operation_finished
  tryFinishRun → "continue"       steer() → NoActiveRun
  运行消费 steer
  operation_finished
```

只有两种可能。没有第三种交错历史。这就是可测试性的关键。

## 9. 溢出检测：精确算法

v2 给出了比 v1 更精确的溢出分类：

```ts
function isRecoverableLength(message: AssistantMessage, desiredMaxOutput: number): boolean {
  if (message.stopReason !== "length") return false;
  // 达到调用者或模型的预期上限 = 真正的输出限制停止
  if (desiredMaxOutput > 0 && message.usage.output >= desiredMaxOutput) return false;
  // 低于预期上限停止 = 上下文压力或 provider 侧截断
  return true;
}
```

`desiredMaxOutput` 是**调用者意图的限制**（在任何上下文截断之前）。

为什么不能用实际发送的值？因为某些 provider 完全拒绝显式输出上限（OpenAI Codex 对 `max_output_tokens` 返回 HTTP 400），Pi 会将其他限制截断到剩余上下文。实际发送的值可能远小于调用者的意图。

### 每次输入一次恢复

溢出压缩只有在没有溢出原因的压缩步骤比此运行最新的已消耗会话消息更新时才可能。第二次溢出直接失败。

```text
用户消息 → 溢出 → 压缩 → 重试 → 又溢出 → 放弃（不再次压缩）
用户消息 → 溢出 → 压缩 → 重试 → 成功 → 继续
新用户消息 → 溢出 → 压缩 → 重试 → ...（计数器重置）
```

## 10. 测试策略

### Tier A：归约和恢复

用公共 API 预填充一个崩溃状态的记录和条目，打开 Harness，调用 `resume()`，断言持久结果：

```ts
// 构造 X3 状态
await session.appendRecord(opStarted("run", { initialMessages: [userEntry] }));
await session.appendEntry(userEntry, "main");
await session.appendRecord(stepAttempt("assistant", 1));
await session.appendEntry(assistantWithToolCall, "main");
await session.appendRecord(toolStarted({ replay: "safe", resultEntryId: "result-1" }));
// ↑ 意图持久但结果不存在 = X3

const { harness, suspended } = await AgentHarness.create(options);
expect(suspended).toHaveLength(1);
expect((await harness.resume()).ok).toBe(true);
// 断言工具被安全重放了
```

### Tier B：写者一致性

用插装 `Session` 记录每个条目（E）、记录（R）、Lane 移动（L）、事实（G）和钩子（H）。对照追踪断言精确顺序。

还断言追加式上下文不变量：运行内每次请求的消息列表是前一次请求的精确前缀扩展——除了压缩条目。

### Tier C：确定性交错 + 机械崩溃覆盖

崩溃模拟：在每个 `executeAction()` 后快照后端，然后重新打开每个快照并 `resume()`。

:::danger
崩溃点从追踪**机械派生**，不是手工挑选。新副作用添加到追踪后自动获得崩溃覆盖。每个快照运行恢复**两次**，证明半完成恢复安全。
:::

## 11. 与 v1 的核心对比

| 维度 | v1（寄存器） | v2（记录日志） |
|---|---|---|
| 状态存储 | `op.state` 覆盖 | 追加记录 |
| 恢复 | 五次点查找 | 归约记录 |
| 状态一致性 | 状态和存储分离 | 状态 = 记录的归约 |
| JSONL 压缩 | 需要快照压缩 | 天然追加 |
| 溢出检测 | 三种启发式 | 精确算法 |
| 崩溃点目录 | 隐含在状态机中 | `fx` 方法列表显式枚举 |
| 竞争处理 | 变更线 + CAS | 纯变更线 |
| 崩溃测试 | 手工枚举 | 机械派生 |
| Schema 演化 | 完备迁移 | 不做迁移 |

## 12. 什么时候选择哪种模型

| 考虑因素 | 偏向寄存器（v1） | 偏向记录日志（v2） |
|---|---|---|
| 恢复性能 | O(1) 点查找 | O(记录数) 归约 |
| 存储简单性 | 需要 upsert 后端 | 只需要 append 后端 |
| 状态一致性 | 依赖写入正确性 | 由定义保证 |
| 可测试性 | 状态可枚举 | 崩溃点可机械派生 |
| Schema 演化 | 需要迁移机制 | 旧记录自然过期 |
| 实现复杂度 | 状态机转换函数 | 归约函数 + 有效性检查 |

:::note
v2 的记录日志模型更适合**需要最高可靠性**的场景。归约保证状态和存储一致，机械崩溃覆盖保证所有崩溃路径都测试过。代价是恢复稍慢（需要扫描记录而不是读一个寄存器），但对于一个操作通常产生的 10-20 条记录来说，这个代价可以忽略。
:::
