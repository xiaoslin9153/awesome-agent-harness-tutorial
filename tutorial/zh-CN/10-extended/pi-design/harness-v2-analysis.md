---
title: Pi Durable AgentHarness v2 深度解析
description: 逐层拆解 Pi Durable AgentHarness v2 的记录模型、恢复归约、效果边界和 Lane 变更线，理解它如何从 v1 的寄存器模型演进到记录日志模型。
lang: zh-CN
content_status: draft
source_version: 2026-08-25
source_url: https://github.com/earendil-works/pi/blob/harness-v2/j4/packages/agent/docs/harness-v2.md
---

# Pi Durable AgentHarness v2 深度解析

Pi AgentHarness v2 是 v1 的重新设计。核心变化：**从寄存器模型（覆盖式状态）转向记录日志模型（追加式操作日志）**。这篇文章逐层拆解新设计的每个机制。

## 1. 从 v1 到 v2：为什么换模型

v1 用寄存器保存操作状态——`op.state` 就是程序计数器，每次转换覆盖。恢复是五次点查找。

v2 换成了**追加式操作日志**。每个动作在 Lane 的操作日志中留下一条记录，恢复通过归约（reduction）从记录重建状态。

:::note
这不是倒退。v1 的寄存器模型要求每个后端实现 upsert 语义，JSONL 的快照压缩是额外负担。v2 的纯追加模型让 JSONL 天然工作，SQLite 也不需要寄存器表。
:::

## 2. 核心概念

### 2.1 四种会话状态

```
1. 树（tree）           — 会话内容，追加式，共享
2. Lane                 — 树上的命名位置，工作发生的地方
3. Lane 操作日志        — 每条 Lane 的记录序列，持久性实现
4. 全局事实             — 最新写入获胜的键值对
```

关键区分：**树是被动的**（共享数据），**Lane 是活跃的**（拥有叶子、日志、队列）。两个 Lane 从不共享活跃状态。

### 2.2 持久性规则

v2 的核心规则只有一句话：

> **副作用之前：写意图记录。副作用之后：以 provisioned id 追加结果条目。**

没有多记录原子性，也不需要。崩溃在意图和结果之间时，恢复按意图类型决定：完成它、重试它，或用合成结果关闭它。

### 2.3 Provisioned ID

意图记录携带尚不存在的条目的 id：

```ts
type ProvisionedEntry<T> = Omit<T, "parentId" | "seq" | "timestamp">;
```

意图被满足当且仅当带该 id 的条目存在。存在但内容不同 = 损坏。

## 3. 记录目录

Lane 的操作日志包含九种记录：

| 记录 | 何时写入 | 用途 |
|---|---|---|
| `operation_started` | 操作接受时 | 接受边界，携带意图和初始消息 |
| `step_attempt` | 每次可重试步骤尝试前 | 持久尝试计数，跨重启限制重试 |
| `tool_started` | 工具放行后、执行前 | 副作用意图，带有效参数和重放声明 |
| `queue_enqueued` | steer/followUp/nextRun 入队时 | 队列接受，载荷在此传输 |
| `queue_cancelled` | cancelQueued 时 | 持久撤回，防止崩溃复活 |
| `write_deferred` | 运行中树写入时 | 延迟写入接受，检查点应用 |
| `abort_requested` | abort() 解析时 | 请求标记，对账跟随 |
| `operation_finished` | 操作关闭时 | 终态：completed/failed/aborted/declined |
| `usage` | 每次请求结算时 | 成本台账，独立于编排 |

:::tip
关键洞察：**成本持久性不依赖结果持久性。** 可重试步骤产生的响应可能从不成为条目，但它们的成本必须记录。每个请求在任何分类之前写 `usage`。
:::

## 4. 崩溃点与恢复

### 4.1 工具执行的五个崩溃点

```text
E   assistant message [calls c1, c2]
X1  before before_tool              ← c1 没有持久内容
H   before_tool(c1)
X2  决策已做，没有写入               ← 同 X1
R   tool_started(c1)
X3  工具执行中                       ← 副作用结果未知
H   after_tool(c1)
X4  钩子被中断                       ← 同 X3
E   tool result c1
X5  结果持久                         ← c1 完成
```

| 崩溃点 | 恢复 |
|---|---|
| X1, X2 | 完整正常路径；`before_tool` 重新运行 |
| X3, X4 | 重放安全（记录和当前声明都说 safe）→ 重新执行；否则合成 interrupted |
| X5 | 跳过 c1；处理 c2 |

### 4.2 溢出的精确分类

v1 用三种启发式检测溢出。v2 给出精确算法：

```ts
function isRecoverableLength(message, desiredMaxOutput) {
  if (message.stopReason !== "length") return false;
  if (desiredMaxOutput > 0 && message.usage.output >= desiredMaxOutput) return false;
  return true;  // 低于预期上限停止 → 上下文压力
}
```

关键：`desiredMaxOutput` 是调用者意图的限制，**在任何上下文截断之前**。实际发送的值不能作参考。

### 4.3 每次输入一次溢出恢复

溢出压缩只有在没有溢出原因的压缩步骤比此运行最新的已消耗会话消息更新时才可能。第二次溢出直接失败。

## 5. 恢复：归约

v2 的恢复从记录**归约**出状态：

```text
从两次有界读取：
1. findOpenOperations(lane) → 打开操作（零=空闲，一=挂起，二=损坏）
2. 该操作的记录 + 该 Lane 自己的条目

归约出：
- 正在中止？     → abort_requested 存在
- 已用尝试       → 最新 step_attempt（resultEntryId 无条目 = 未完成）
- 工具批次状态   → 最新助手条目的调用 vs tool_started/结果
- 延迟句柄       → 最新自己条目是 deferred 助手且无后继
- 待处理队列项   → queue_enqueued 无条目且未被取消
- 待处理写入     → write_deferred 无条目
```

:::note
**状态被定义为记录的归约。** 活跃执行和恢复使用相同的归约规则，所以它们不能不一致。这是 v2 相对 v1 的根本改进：v1 的状态和存储是两个东西（寄存器 vs 状态），v2 只有一个。
:::

### 恢复的优先级

`resume()` 按以下顺序处理：

1. 缺失初始消息 → 追加（被接受的输入从不丢失）
2. 正在中止 → 对账（合成结果、关闭消息、aborted 终态）
3. 未解析工具批次 → 每调用：跳过/重执行/合成
4. 延迟句柄 → 兑换
5. 终端失败 → 排空输入，关闭为 failed
6. 未完成步骤 → 恢复该步骤（在消耗新检查点输入之前）
7. 否则 → 继续下一个检查点

## 6. 效果边界（Effects Boundary）

每个副作用经过一个注入的 `Effects`（`fx`）句柄：

```ts
interface Effects {
  // 持久写入
  appendEntry(entry, telemetry): Promise<Entry>;
  appendRecord(record, telemetry): Promise<Record>;
  moveLane(to, telemetry): Promise<void>;
  setFact(fact, telemetry): Promise<void>;

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
`fx` 的方法列表就是**完整的崩溃点目录**。在任何调用前后停止，恰好对应一个已知的崩溃状态。手动驱动模式在每个副作用前停靠，测试可以逐个驱动。
:::

构造规则：过程只接收 `fx` 和遥测上下文——从不接收 `Session`、`Models`、工具注册表或钩子运行器。这由构造和测试强制：手动模式驱动的操作在停靠时执行零存储写入和零外部调用。

## 7. Lane 变更线

每个竞争的形状：从 Lane 状态做决策 → await → 提交过期的决策。

修复：每个 Lane 一个进程本地 FIFO——promise 链：

```ts
let tail: Promise<unknown> = Promise.resolve();

function mutateLane<T>(job: () => Promise<T>): Promise<T> {
  const result = tail.then(job);
  tail = result.then(() => undefined, () => undefined);
  return result;
}
```

作业 = 验证 → 至多一个持久写入 → 更新内存状态。

:::danger
Provider 请求、工具执行、钩子和退避**从不**在作业内运行。它们在作业之间运行——这正是每次提交在自己的作业内重新验证的原因。
:::

因为作业一次运行一个，两个并发操作恰好有两种可能历史：`[A, B]` 或 `[B, A]`。不存在第三种交错历史。

## 8. 追加式上下文

与 v1 相同的不变量：

> 在一个 Lane 的请求之间，provider 上下文只在尾部增长。

回合中写入延迟到检查点的原因：检查点应用在尾部追加。直接追加 M 到 [.., U] 会产生 [.., U, M, A]，使 KV 缓存从 M 起失效。

压缩是唯一刻意的缓存失效。

## 9. 测试策略

三层测试，与 v1 相同结构但更精确：

### Tier A — 归约和恢复

用公共 `Session` API 预填充一个崩溃状态的记录和条目，打开 Harness，调用 `resume()`，断言持久结果。

覆盖：每个 X1-X5 工具状态、重放 safe/never/changed、批次中每个源顺序位置、截断批次证明不执行、每个持久点前后中止、终端失败标记、缺失初始消息、延迟写入、延迟句柄（pending/ready/terminal/rejected/不匹配/中止）、尝试上限跨重启、每个溢出崩溃点、半完成恢复（运行恢复两次）。

### Tier B — 写者一致性

用插装 `Session` 记录每个条目（E）、记录（R）、Lane 移动（L）、事实（G）和钩子（H）。对照第 6 节的追踪断言精确顺序。

还断言追加式上下文不变量可执行地：运行内每次请求的消息列表是前一次请求的精确前缀扩展——除了压缩条目。

### Tier C — 确定性交错

`drive: "manual"` 对真实 Harness、假 provider 和真实后端。

崩溃模拟：在每个 `executeAction()` 后快照后端，然后重新打开每个快照并 `resume()`——每个快照运行恢复两次，证明半完成恢复安全。

:::caution
崩溃点从追踪**机械派生**，不是手工挑选。新副作用添加到追踪后自动获得崩溃覆盖。
:::

## 10. 与 v1 的关键差异总结

| 维度 | v1（寄存器） | v2（记录日志） |
|---|---|---|
| 状态存储 | `op.state` 寄存器覆盖 | 追加式记录日志 |
| 恢复方式 | 五次点查找 | 归约记录 |
| JSONL 压缩 | 需要快照压缩 | 天然追加，无需压缩 |
| SQLite 寄存器表 | 需要 | 不需要 |
| 状态一致性 | 状态和存储是两个东西 | 状态 = 记录的归约 |
| 溢出检测 | 三种启发式 | 精确算法 |
| 崩溃点目录 | 隐含在状态机中 | `fx` 方法列表显式枚举 |
| 竞争处理 | 条件 CAS 提交 | Lane 变更线 |
| 延迟请求 | `deferred` 状态 + 轮询 | 持久化句柄 + 兑换 |
| 测试 | 三层 | 三层 + 机械派生崩溃点 |

## 11. 设计哲学

v2 的核心改进：**消除状态和存储之间的间隙。**

v1 中，`op.state` 寄存器保存状态，但恢复时需要信任寄存器内容是正确的——如果写入有 bug，恢复就会基于错误状态继续。

v2 中，状态**被定义为**记录的归约。活跃执行和恢复使用相同的归约函数。不存在"状态和存储不一致"的可能性，因为它们是同一个东西。

代价是恢复需要扫描记录而不是读一个寄存器。但扫描是有界的（只读当前操作的记录），且索引使它足够快。
