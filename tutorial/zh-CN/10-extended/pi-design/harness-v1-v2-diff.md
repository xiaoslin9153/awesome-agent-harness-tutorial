---
title: Pi AgentHarness v1 与 v2 设计差异对比
description: 对比 Pi AgentHarness v1（寄存器模型）和 v2（记录日志模型）的架构差异，理解为什么重新设计以及各自的取舍。
lang: zh-CN
content_status: draft
source_version: 2026-08-25
source_url_v1: https://github.com/earendil-works/pi/blob/main/packages/agent/docs/harness.md
source_url_v2: https://github.com/earendil-works/pi/blob/harness-v2/j4/packages/agent/docs/harness-v2.md
---

# Pi AgentHarness v1 与 v2 设计差异对比

Pi 的 AgentHarness 有两个版本的设计文档。v1（`main` 分支）约 2941 行，v2（`harness-v2` 分支）约 3446 行。两者解决同一个问题——**崩溃安全的持久化 Agent 运行时**——但用了截然不同的架构。

这篇文章逐维度对比两个版本，帮助你理解设计演化的逻辑。

## 1. 根本差异：状态存储模型

这是两个版本最核心的区别，所有其他差异都源于此。

### v1：寄存器模型

```
op.state/{operationId} = 完整操作状态（每次转换覆盖）
```

v1 把操作状态保存在一个可覆盖的寄存器中。每次状态转换原子地覆盖整个寄存器。恢复时读这一个寄存器就知道操作进行到哪。

类比：一个变量，每次赋值替换旧值。

### v2：记录日志模型

```
operation_started → step_attempt → tool_started → ...
```

v2 不保存"当前状态"。它在 Lane 的操作日志中追加记录，恢复时通过**归约**（reduction）从记录推导状态。

类比：一个事件溯源系统，状态是所有事件的函数。

:::note
关键洞察：v2 中**状态被定义为记录的归约**。活跃执行和恢复使用相同的归约函数。不存在"状态和存储不一致"的可能性。
:::

### 为什么换

v1 的寄存器模型有一个问题：**状态和存储是两个东西**。`op.state` 保存状态，但如果写入有 bug（比如只写了部分字段），恢复就会基于错误状态继续。v1 通过"完整覆盖"缓解这个问题，但不能消除。

v2 消除了这个间隙：状态不是存储的东西，而是从存储**推导**的东西。写入 bug 只会导致恢复失败（有效性检查拒绝），不会导致错误恢复。

## 2. 存储层对比

| 维度 | v1 | v2 |
|---|---|---|
| 持久形式 | entries + registers + usage ledger | entries + records + facts |
| 可变状态 | 寄存器（覆盖式） | 无（纯追加） |
| 操作状态 | `op.state` 寄存器 | 操作日志中的记录序列 |
| 待处理载荷 | `pending.entry` 寄存器 | 记录内嵌完整载荷 |
| 成本台账 | `UsageRow`（追加式） | `UsageRecord`（追加式） |

### v1 的三存储不变量

```
entries        写一次，追加式
registers      可覆盖的键值对
usage ledger   追加式
```

每个载荷恰好在一个地方。

### v2 的简化

v2 消除了寄存器。所有持久数据分为：

```
entries    会话树（追加式）
records    操作日志（追加式）
facts      全局事实（追加式历史，最新者胜）
```

:::tip
v2 的所有存储都是追加式的。这意味着 JSONL 后端天然工作——不需要快照压缩。SQLite 也不需要寄存器表。
:::

## 3. 恢复机制对比

### v1：五次点查找

```
lane.state/{lane}  → currentOperationId
op.meta/{opId}     → 操作元数据
op.state/{opId}    → 程序计数器（完整状态）
lane.leaf/{lane}   → 当前位置
lane.config/{lane} → 配置
```

然后验证状态命名的所有实体。恢复**从不**扫描历史。

### v2：归约

```
1. findOpenOperations(lane)  → 索引查询，零/一/二个打开操作
2. 该操作的记录              → 有界读取
3. 该 Lane 自己的条目        → 从叶子到锚点的路径

归约出：
  aborting / attempts / tool batch / deferred handle
  / pending queue / pending writes / ...
```

:::note
v1 恢复是 O(1) 的（常数次点查找）。v2 恢复是 O(操作记录数) 的，但记录数有界（一个操作通常产生 10-20 条记录），且索引使查找高效。
:::

### 恢复优先级

两者的恢复优先级类似但 v2 更精确：

| 优先级 | v1 | v2 |
|---|---|---|
| 1 | 缺失身份 | 缺失初始消息（追加，即使正在中止） |
| 2 | 正在中止 → 对账 | 正在中止 → 对账 |
| 3 | effect_pending → 恢复策略 | 未解析工具批次 → 每调用处理 |
| 4 | — | 延迟句柄 → 兑换 |
| 5 | — | 终端失败 → 排空并关闭 |
| 6 | — | 未完成步骤 → 恢复该步骤 |
| 7 | 检查点继续 | 检查点继续 |

## 4. 崩溃安全模型对比

### v1：副作用三明治

```
TX[ 意图 ]     ← "即将执行 X，输出用 id R 和 U"
   执行 X      ← 不确定窗口
TX[ 结算 ]     ← 输出 + 用量 + 下一状态
```

唯一的不确定区间：意图持久、结算缺失。三条策略覆盖。

### v2：意图-结果对

```
R  tool_started（意图：参数、结果 id、重放声明）
   执行工具
E  tool result（结果：以 provisioned id）
```

意图被满足当且仅当带 provisioned id 的条目存在。

两者的核心思想相同：**在副作用前留下持久的意图痕迹**。v2 的改进是把意图从寄存器变为记录，使它成为追加式日志的一部分。

### 工具崩溃点对比

| 崩溃点 | v1 恢复 | v2 恢复 |
|---|---|---|
| 意图前 | 正常路径 | 正常路径（`before_tool` 重新运行） |
| 意图后，执行前 | `effect_pending` → 恢复策略 | `tool_started` 无结果 → 重放策略 |
| 执行中 | 同上 | X3 → 重放安全则重执行，否则合成 |
| 钩子中断 | 同上 | X4 → 同 X3 |
| 结果持久后 | 继续，从不重新结算 | X5 → 跳过，处理下一个调用 |

语义相同，v2 的表述更精确。

## 5. 溢出检测对比

### v1：三种启发式（可靠性递减）

1. 适配器报告（`usage.input + usage.cacheRead > contextWindow`）
2. 错误消息字符串匹配
3. `length` 低于 `intendedOutputLimit`

### v2：精确算法

```ts
function isRecoverableLength(message, desiredMaxOutput) {
  if (message.stopReason !== "length") return false;
  if (desiredMaxOutput > 0 && message.usage.output >= desiredMaxOutput) return false;
  return true;
}
```

关键改进：`desiredMaxOutput` 是**调用者意图的限制**（在任何上下文截断之前）。v1 的 `intendedOutputLimit` 语义相同但文档没有强调"不能使用实际发送的值"这一点。

两者都有"每次输入一次溢出恢复"守卫。

## 6. 并发控制对比

### v1：Lane 变更线 + 条件 CAS

v1 引入 Lane 变更线（每 Lane 一个序列化点），同时使用寄存器 `seq` 作为 CAS token：

```text
条件转换识别它们扩展的状态通过寄存器 seq：
  op.state seq、lane.state seq、lane.config seq
```

### v2：纯 Lane 变更线

v2 保留 Lane 变更线但**消除了 CAS**：

```ts
function mutateLane<T>(job: () => Promise<T>): Promise<T> {
  const result = tail.then(job);
  tail = result.then(() => undefined, () => undefined);
  return result;
}
```

作业 = 验证 → 至多一个持久写入 → 更新内存。

:::tip
v2 不需要 CAS 因为存储层保证单写者。v1 的 CAS 是为了防御同一进程内的竞争，v2 用变更线完全序列化了这些竞争。
:::

两者都保证：每 Lane 的竞争恰好有两种可能历史。

## 7. 延迟请求（Deferred）对比

### v1：状态机中的 `deferred` 阶段

```
assistant effect_pending
  → stopReason "deferred"
  → deferred{suspended, sourceEntryId, poll: 0}
  → resume() → 轮询
  → effect_pending → fetch → pending/ready/error
```

轮询状态在 `op.state` 中维护。

### v2：持久化句柄 + 兑换

```
R  step_attempt（助手步骤）
E  assistant message（stopReason deferred，携带句柄）
   Lane 挂起
   ... 可能是不同进程 ...
   resume() → 最新条目是 deferred 且无后继 → 兑换
   fetchDeferred(model, handle)
E  assistant message（真实结果）
```

句柄保存在持久化的助手条目中。恢复通过归约发现它（最新条目是 deferred 且无后继）。

关键改进：v2 的挂起 Lane 在存储中与崩溃 Lane **不可区分**。不需要特殊的状态标记。恢复统一处理。

## 8. Schema 演化对比

### v1：storageVersion + 打开时迁移

```
version < current → 链式迁移（每步一个事务）
version > current → 拒绝打开
```

迁移必须是**完备的**——翻译每个寄存器值，包括打开操作的 `op.state`。

### v2：兼容性策略

> 旧的 coding-agent v3 JSONL 会话必须打开并恢复为空闲。这是唯一的向后兼容要求。所有其他格式和 API 可能破坏。我们不编写迁移。

v2 采用了更激进的策略：**不做迁移**。因为记录是追加式的，旧格式可以和新格式共存（旧记录被忽略），不需要转换。

:::caution
这是一个取舍：v1 的迁移机制更安全（不丢失数据），v2 的策略更简单（不需要维护迁移代码）。v2 赌的是格式变化不频繁，且旧数据可以通过 Fork 保留。
:::

## 9. 测试策略对比

两者都使用三层测试，但 v2 更精确：

| 层 | v1 | v2 |
|---|---|---|
| Tier A | 每个状态：构造→关闭→重开→断言 | 每个崩溃状态：预填充记录→打开→resume→断言 |
| Tier B | 插装存储装饰器记录写入顺序 | 插装 Session 记录 E/R/L/G/H 顺序 |
| Tier C | 每个竞争的两种顺序，手动驱动 | 同 v1 + 机械派生崩溃点 + 双重恢复 |

v2 的关键改进：**崩溃点从追踪机械派生**，不是手工挑选。新副作用添加到追踪后自动获得崩溃覆盖。每个快照运行恢复两次，证明半完成恢复安全。

## 10. 总结

### 保留不变的核心思想

两个版本共享这些设计原则：

1. **意图-结果对**：副作用前写意图，副作用后写结果
2. **追加式上下文**：provider 上下文只在尾部增长
3. **Lane 变更线**：每 Lane 的竞争恰好两种历史
4. **信号所有权**：只有 Harness 能拉取 AbortSignal
5. **成本独立于编排**：失败尝试的成本也记录
6. **三层测试**：状态、写者、竞争分别验证
7. **无回滚**：中止不是回滚，已发生的副作用保留

### v2 的核心改进

| 改进 | 从 | 到 |
|---|---|---|
| 状态模型 | 寄存器覆盖 | 记录日志归约 |
| 状态一致性 | 状态和存储分离 | 状态 = 记录的归约 |
| 存储层 | 三种（entries + registers + ledger） | 两种（entries + records） |
| JSONL 后端 | 需要快照压缩 | 天然追加 |
| 崩溃点目录 | 隐含在状态机中 | `fx` 方法列表显式枚举 |
| 溢出检测 | 三种启发式 | 精确算法 |
| 延迟请求 | 状态机阶段 | 持久化句柄 + 归约发现 |
| Schema 演化 | 完备迁移 | 不做迁移 |
| 崩溃测试覆盖 | 手工枚举 | 机械派生 |

### 什么时候读哪个版本

- **学习持久化 Agent 运行时的设计思想**：读 v1。它的寄存器模型更直观，"程序计数器"的比喻容易理解。
 - **理解 Pi 的最新实现方向**：读 v2。它是实际要实现的版本。
 - **对比两种持久化策略**：两个都读。寄存器 vs 记录日志是持久执行系统的两种经典范式。
