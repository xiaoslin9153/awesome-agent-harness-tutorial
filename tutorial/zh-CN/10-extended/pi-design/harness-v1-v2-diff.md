---
title: Pi AgentHarness v1 与 v2 设计差异对比
description: 通过同一个崩溃场景分别走一遍 v1 和 v2 的处理流程，逐维度对比两种持久化策略的设计取舍。
lang: zh-CN
content_status: draft
source_version: 2026-08-25
source_url_v1: https://github.com/earendil-works/pi/blob/main/packages/agent/docs/harness.md
source_url_v2: https://github.com/earendil-works/pi/blob/harness-v2/j4/packages/agent/docs/harness-v2.md
---

# Pi AgentHarness v1 与 v2 设计差异对比

两个版本解决同一个问题——崩溃安全的持久化 Agent 运行时——但用了截然不同的状态管理策略。这篇文章用同一个场景分别走一遍两个版本的处理流程，然后逐维度对比。

## 1. 用同一个场景对比

场景：用户说"删除旧迁移文件"，模型返回一个工具调用 `rm -rf src/old-migrations/`，工具执行到一半进程崩溃。

### v1 怎么处理

```text
TX[ insert e_50 (user message),
    upsert op.meta/op_9 = { intent: run },
    upsert op.state/op_9 = { phase: checkpoint, need_assistant } ]

TX[ upsert op.state/op_9 = { phase: assistant effect_pending,
    responseEntryId: e_51, usageId: u_7 } ]

TX[ insert e_51 (assistant with tool call),
    insert u_7 (usage),
    upsert op.state/op_9 = { phase: tools, call_0: planned } ]

TX[ upsert op.tool_args/op_9:s1:0 = { command: "rm -rf ..." },
    upsert op.state/op_9 = { call_0: effect_pending, replay: "never" } ]

    ...rm -rf 执行中... ← 崩溃！
```

恢复：

```text
读 lane.state → currentOperationId: op_9
读 op.meta    → intent: run
读 op.state   → call_0: effect_pending, replay: "never"
读 op.tool_args → { command: "rm -rf ..." }

replay = "never" → 不重新执行
→ 合成结果 e_52 "interrupted"
→ 继续下一个调用
```

v1 通过读 `op.state` 寄存器知道确切状态，通过 `op.tool_args` 知道参数，通过 `replay` 声明知道是否可以重试。

### v2 怎么处理

```text
H   before_run
R   operation_started (runId = r_1)
E   user message (e_50)
R   step_attempt (assistant, attempt=1, resultEntryId=e_51)
E   assistant message [tool call] (e_51)
H   before_tool
R   tool_started (effectiveArgs, resultEntryId=e_52, replay="never")
    ...rm -rf 执行中... ← 崩溃！
```

恢复：

```text
findOpenOperations(main) → r_1（一个打开操作）
读取 r_1 之后的记录：
  step_attempt (assistant, attempt=1, resultEntryId=e_51)
  → e_51 存在 → 步骤完成
  tool_started (resultEntryId=e_52, replay="never")
  → e_52 不存在 → 工具未完成

replay = "never" → 不重新执行
→ 合成结果 e_52 "interrupted"
→ 继续下一个调用
```

v2 通过归约记录知道状态：`step_attempt` 的 `resultEntryId` 存在 = 步骤完成；`tool_started` 的 `resultEntryId` 不存在 = 工具未完成。

### 结果相同，路径不同

两个版本最终做出相同的恢复决策。区别在于**怎么知道的**：

- v1：读一个寄存器（`op.state`），状态是显式存储的
- v2：归约记录（`tool_started` 无结果 = 未完成），状态是推导的

## 2. 状态存储模型对比

### v1：寄存器（覆盖式）

```text
op.state = { phase: tools, call_0: effect_pending, replay: "never", ... }
```

每次状态转换**覆盖**整个寄存器。30 轮运行覆盖约 30 次。恢复读最终值。

类比：一个变量，每次赋值替换旧值。

### v2：记录日志（追加式）

```text
operation_started → step_attempt → tool_started → ...
```

每个动作追加一条记录。恢复通过归约推导状态。

类比：事件溯源，状态是所有事件的函数。

### 为什么从 v1 换到 v2

v1 有一个问题：**状态和存储是两个东西**。

```text
内存中构造状态 → 序列化 → 写入 op.state 寄存器
                    ↑
                这里可能出错
```

如果序列化有 bug（比如丢了一个字段），寄存器里的状态就不完整。恢复会基于不完整的状态做决策。

v2 消除了这个间隙：

```text
状态 = 归约(记录)
```

状态**不是存储的东西**，而是从存储**推导**的东西。写入 bug 只会导致归约结果不符合有效性检查（恢复拒绝），不会导致错误恢复。

:::note
这是事件溯源的核心优势：状态和存储不可能不一致，因为它们是同一个东西的两个视图。
:::

## 3. 存储层对比

### v1 的三存储

```text
entries        写一次，追加式
registers      可覆盖的键值对（唯一的可变状态）
usage ledger   追加式
```

需要支持 upsert 的后端。JSONL 需要快照压缩（清理死掉的旧寄存器行）。SQLite 需要 registers 表。

### v2 的两存储

```text
entries    会话树（追加式）
records    操作日志（追加式）
facts      全局事实（追加式历史）
```

全部追加式。JSONL 天然工作——每条记录一行，不需要压缩。SQLite 不需要寄存器表。

| 维度 | v1 | v2 |
|---|---|---|
| JSONL 压缩 | 需要（清理死寄存器行） | 不需要 |
| SQLite 表 | entries + registers + usage + branch_index | entries + records + facts |
| 后端要求 | 必须支持原子 upsert | 只需要原子 append |
| 死数据 | 寄存器覆盖留下死值（JSONL 中为死字节） | 无死数据（全部是活记录） |

## 4. 恢复机制对比

### v1：五次点查找

```text
lane.state → op.meta → op.state → lane.leaf → lane.config

O(1)，常数次查找
从 op.state 直接读出完整状态
验证状态引用的实体
```

### v2：归约

```text
findOpenOperations(lane) → 打开操作
读取操作日志（从 operation_started 开始）
读取 Lane 自己的条目（从叶子到锚点）
归约出状态

O(记录数)，通常 10-20 条
从记录推导状态
有效性检查拒绝损坏
```

| 维度 | v1 | v2 |
|---|---|---|
| 恢复速度 | O(1) | O(记录数)，通常很快 |
| 状态来源 | 显式存储 | 推导 |
| 一致性保证 | 依赖写入正确性 | 由定义保证 |
| 损坏检测 | 验证状态引用 | 有效性检查拒绝 |

## 5. 崩溃安全模型对比

### 核心思想相同

两个版本都使用**意图-结果对**：

```text
副作用前 → 留下意图痕迹
副作用后 → 留下结果
崩溃在中间 → 恢复策略处理
```

### 表达方式不同

| 维度 | v1 | v2 |
|---|---|---|
| 意图存储 | `op.state` 中的 `effect_pending` | `step_attempt` 或 `tool_started` 记录 |
| 结果存储 | 条目（以保留 id） | 条目（以 provisioned id） |
| 判断"已发生" | `op.state` 中的状态字段 | 结果条目是否存在 |
| 重放声明 | `op.state` 中的 `replay` 字段 | `tool_started` 中的 `replay` 字段 |
| 参数持久化 | `op.tool_args` 寄存器 | `tool_started` 记录的 `effectiveArgs` |

### 工具崩溃点对比

```text
v1 的崩溃点（从 op.state 状态推断）：

effect_pending + replay=safe   → 重新执行
effect_pending + replay=never  → 合成 interrupted
completed                      → 跳过

v2 的崩溃点（从记录存在性推断）：

tool_started 存在，结果不存在，replay=safe  → 重新执行
tool_started 存在，结果不存在，replay=never → 合成 interrupted
tool_started 存在，结果存在                 → 跳过
tool_started 不存在                         → 正常路径（before_tool 重新运行）
```

语义相同。v2 的判断更简洁：只需要检查"条目是否存在"。

## 6. 溢出检测对比

### v1：三种启发式

```text
1. 适配器报告：usage.input + usage.cacheRead > contextWindow
2. 错误消息匹配：HTTP 错误消息包含上下文限制模式
3. length 低于 intendedOutputLimit
```

可靠性递减。错误消息匹配是字符串匹配，脆弱。

### v2：精确算法

```ts
function isRecoverableLength(message, desiredMaxOutput) {
  if (message.stopReason !== "length") return false;
  if (desiredMaxOutput > 0 && message.usage.output >= desiredMaxOutput) return false;
  return true;
}
```

一个函数，明确的判断条件。`desiredMaxOutput` 是调用者意图的限制（截断前）。

:::tip
v2 的改进不是算法更复杂，而是**把模糊的启发式变成了明确的规则**。这使测试可以直接覆盖每个分支。
:::

两者都有"每次输入一次溢出恢复"守卫。

## 7. 并发控制对比

### v1：变更线 + CAS

```text
Lane 变更线序列化状态依赖的变更
条件转换用寄存器 seq 做 CAS：
  "只有 op.state 的 seq 仍然是 X 时才提交"
```

CAS 是为了防御同一进程内的竞争——两个异步操作可能同时读到旧状态然后都尝试提交。

### v2：纯变更线

```ts
function mutateLane<T>(job: () => Promise<T>): Promise<T> {
  const result = tail.then(job);
  tail = result.then(() => undefined, () => undefined);
  return result;
}
```

不需要 CAS。因为：
1. 变更线保证一次只有一个作业运行
2. 存储层保证单写者
3. 每个作业在自己的内部重新验证

| 维度 | v1 | v2 |
|---|---|---|
| 序列化 | 变更线 | 变更线（相同） |
| 条件提交 | CAS（寄存器 seq） | 不需要 |
| 竞争历史 | 恰好两种 | 恰好两种 |
| 实现复杂度 | 变更线 + CAS 逻辑 | 纯 promise 链 |

## 8. 延迟请求对比

### v1：状态机中的 deferred 阶段

```text
op.state 的 phase 变为 deferred{suspended}
resume() → 轮询 → effect_pending → fetch → pending/ready/error
```

轮询状态在 `op.state` 中维护。有 `poll` 计数器。

### v2：持久化句柄 + 归约发现

```text
E  assistant message (stopReason=deferred，携带句柄)
   Lane 挂起
   resume() → 归约发现"最新条目是 deferred 且无后继" → 兑换
```

句柄保存在持久化的助手条目中。不需要特殊的状态标记。

关键改进：v2 的挂起 Lane 在存储中与崩溃 Lane **不可区分**。不需要特殊状态。恢复统一处理。

## 9. Schema 演化对比

### v1：完备迁移

```text
storageVersion 1 → 2 → 3

每次版本变更：
  转换所有寄存器值（包括打开操作的 op.state）
  每步一个事务
  迁移必须是完备的（翻译每个可达状态）
```

### v2：不做迁移

```text
兼容性策略：旧 v3 JSONL 必须打开并恢复为空闲。
所有其他格式和 API 可能破坏。
我们不编写迁移。
```

v2 的赌注：记录是追加式的，旧格式可以和新格式共存（旧记录被归约忽略），不需要转换。

| 维度 | v1 | v2 |
|---|---|---|
| 迁移需求 | 每次版本变更需要 | 不需要 |
| 数据安全 | 迁移保证不丢失 | 旧数据可能被忽略 |
| 实现成本 | 高（写迁移代码） | 零 |
| 适用场景 | 格式频繁变化 | 格式稳定或可丢弃旧数据 |

## 10. 测试策略对比

| 维度 | v1 | v2 |
|---|---|---|
| Tier A | 每个状态：构造→关闭→重开→断言 | 每个崩溃状态：预填充→打开→resume→断言 |
| Tier B | 插装 Storage.commit() | 插装 Session（记录 E/R/L/G/H） |
| Tier C | 手动驱动 + 手工枚举竞争 | 手动驱动 + 机械派生崩溃点 |

v2 的关键改进：

```text
崩溃点从追踪机械派生：
  对每个追踪，在每个 executeAction() 后快照后端
  → 重新打开每个快照并 resume()
  → 每个快照运行恢复两次（证明半完成恢复安全）

新副作用添加到追踪 → 自动获得崩溃覆盖
```

v1 需要手工枚举每个崩溃位置。v2 从追踪自动生成。

## 11. 什么时候选择哪种模型

### 偏向寄存器模型（v1 风格）

- 恢复性能至关重要（O(1) 点查找）
- 状态转换数量少且稳定
- 需要支持不支持追加语义的存储后端
- 团队更熟悉状态机编程

### 偏向记录日志模型（v2 风格）

- 状态一致性是最优先考虑
- 存储后端只支持追加（如纯 JSONL、事件存储）
- 需要机械化的崩溃测试覆盖
- 格式可能演化，不想维护迁移代码
- 团队熟悉事件溯源

### 实际建议

:::note
对于大多数 Agent Harness 项目，**v2 的记录日志模型是更好的选择**。原因：

1. 状态一致性由定义保证，不依赖写入正确性
2. 追加式存储更简单，更多后端支持
3. 机械崩溃覆盖比手工枚举更可靠
4. 恢复性能差异在实践中可忽略（一个操作的记录数通常 < 20）

只有当你有极端的恢复性能要求（比如每秒恢复数千个操作）时，寄存器模型的 O(1) 恢复才有意义。
:::

## 12. 总结：设计演化的逻辑

```text
v1 的洞察：
  "把操作状态存到一个寄存器里，恢复时读它"
  → 简单、快速、可理解

v1 的问题：
  "状态和存储是两个东西，写入可能出错"
  → 需要信任写入的正确性

v2 的洞察：
  "状态不是存储的东西，而是从存储推导的东西"
  → 状态和存储由定义一致

v2 的代价：
  "恢复需要扫描记录而不是读一个寄存器"
  → 但记录数有界，且索引使它足够快
```

这是一个从**命令式**（存储状态，覆盖更新）到**声明式**（存储事件，推导状态）的演化。和编程语言从命令式到函数式的演化类似——牺牲一点性能，换取正确性保证。
