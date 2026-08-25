---
title: Pi AgentHarness v1 实现规范（完整翻译）
description: Pi AgentHarness v1 实现规范的完整中文翻译，涵盖存储模型、会话树、操作状态机、执行恢复和公共 API。
lang: zh-CN
content_status: draft
source_version: 2026-08-25
source_url: https://github.com/earendil-works/pi/blob/main/packages/agent/docs/harness.md
source_commit: main
---

# AgentHarness — 实现规范

> 本文档是 Pi AgentHarness v1（`main` 分支 `packages/agent/docs/harness.md`）的完整中文翻译。原文约 2941 行，涵盖 9 个 Part 和 3 个附录。

## 目录

- [Part 0 — 概述](#part-0--概述)
  - [0.1 这是什么](#01-这是什么)
  - [0.2 系统模型](#02-系统模型)
  - [0.3 三个存储](#03-三个存储)
  - [0.4 实例演练 — Slack 线程](#04-实例演练--slack-线程)
  - [0.5 实例演练 — 工具执行中崩溃](#05-实例演练--工具执行中崩溃)
  - [0.6 非目标](#06-非目标)
  - [0.7 记号与源码类型](#07-记号与源码类型)
- [Part 1 — 存储](#part-1--存储)
  - [1.1 模型](#11-模型)
  - [1.2 身份](#12-身份)
  - [1.3 寄存器命名空间](#13-寄存器命名空间)
  - [1.4 事务](#14-事务)
  - [1.5 查询](#15-查询)
  - [1.6 用量台账](#16-用量台账)
  - [1.7 后端](#17-后端)
  - [1.8 为什么是写一次加寄存器](#18-为什么是写一次加寄存器)
- [Part 2 — 会话树](#part-2--会话树)
  - [2.1 条目](#21-条目)
  - [2.2 放置](#22-放置)
  - [2.3 Lane](#23-lane)
  - [2.4 事实](#24-事实)
  - [2.5 分支查询与上下文](#25-分支查询与上下文)
  - [2.6 分支索引](#26-分支索引)
  - [2.7 Fork](#27-fork)
  - [2.8 会话与仓库边界](#28-会话与仓库边界)
  - [2.9 精确重写](#29-精确重写)
- [Part 3 — 操作状态机](#part-3--操作状态机)
  - [3.1 操作](#31-操作)
  - [3.2 操作状态 — 程序计数器](#32-操作状态--程序计数器)
  - [3.3 Lane 状态与当前状态有效性](#33-lane-状态与当前状态有效性)
  - [3.4 原子转换规则](#34-原子转换规则)
  - [3.5 状态图](#35-状态图)
  - [3.6 接受](#36-接受)
  - [3.7 助手生成](#37-助手生成)
  - [3.8 工具](#38-工具)
  - [3.9 摘要生成 — 压缩与导航摘要](#39-摘要生成--压缩与导航摘要)
  - [3.10 导航](#310-导航)
  - [3.11 收件箱、队列、延迟写入](#311-收件箱队列延迟写入)
  - [3.12 检查点过程](#312-检查点过程)
  - [3.13 终态事务](#313-终态事务)
- [Part 4 — 执行、恢复、中止、关闭](#part-4--执行恢复中止关闭)
  - [4.1 解释器](#41-解释器)
  - [4.2 副作用边界](#42-副作用边界)
  - [4.3 Lane 变更线](#43-lane-变更线)
  - [4.4 恢复](#44-恢复)
  - [4.5 崩溃位置与恢复策略](#45-崩溃位置与恢复策略)
  - [4.6 中止](#46-中止)
  - [4.7 关闭 — 受控崩溃](#47-关闭--受控崩溃)
  - [4.8 故障](#48-故障)
  - [4.9 外部终结](#49-外部终结)
- [Part 5 — 公共表面](#part-5--公共表面)
  - [5.1 Lane 表面](#51-lane-表面)
  - [5.2 Harness](#52-harness)
  - [5.3 SessionTree](#53-sessiontree)
  - [5.4 快照与订阅](#54-快照与订阅)
  - [5.5 事件](#55-事件)
  - [5.6 钩子](#56-钩子)
  - [5.7 Agent 循环构建块](#57-agent-循环构建块)
  - [5.8 遥测](#58-遥测)
- [Part 6 — 未来：分区保留（Postgres）](#part-6--未来分区保留postgres)
- [Part 7 — Schema 演化](#part-7--schema-演化)
- [Part 8 — 构建顺序](#part-8--构建顺序)
- [Part 9 — 不变量与测试](#part-9--不变量与测试)
- [附录 A — 术语表](#附录-a--术语表)
- [附录 B — Coding-agent v3 格式兼容](#附录-b--coding-agent-v3-格式兼容)
- [附录 C — 开放问题](#附录-c--开放问题)

# Part 0 — 概述

## 0.1 这是什么

一个面向 Agent 对话的持久运行时。它持久化会话和操作状态，使被中断的工作可以在不重复已确定副作用的情况下恢复。

## 0.2 系统模型

### 会话（Session）

会话将相关的工作组织在一起，由四个部分组成：

- **条目树（Entry tree）。** 条目是一条消息、一次压缩、一个分支摘要或应用定义的自定义条目。条目不可变。每个分支是一个对话线程；共享树支持分支、压缩、Fork 和并行工作，同时保留历史。

  ```text
  a ── b ── c ── d
        └── e ── f
  ```

- **事实（Facts）。** 可变的、带命名空间的键值状态。内置包括会话名称和条目标签；应用可以存储自定义事实。
- **Lane。** 树上的命名游标。每个会话都有 `main`。一个 Lane 拥有自己的叶子、模型配置、队列和至多一个操作。额外的 Lane 支持 Slack 线程、子 Agent 和其他基于共享历史的并行工作。
- **用量台账（Usage ledger）。** 会话的追加式 token 和成本事件。

### Harness 与操作

会话层管理持久数据并暴露类型化的树视图。Harness 驱动 Lane：接受 prompt、执行模型和工具步骤、管理队列、压缩或导航树、恢复被中断的工作。它还拥有 harness 级别的可用工具和 prompt 资源注册表、拦截和转换执行的钩子、报告活动和持久变化的被动事件，以及运行时配置。

一个**操作（Operation）**是一个被接受的 Lane 工作单元：一次运行（run）、压缩（compaction）或导航（navigation）。它的不可变元数据记录其身份、意图和起始点；它的完整当前状态记录其阶段、控制、队列和恢复数据。每次持久转换替换当前状态。完成时删除操作状态并记录 Lane 的结果。

### 存储

在会话和 Harness 之下，`Storage` 暴露原子事务和查询，覆盖三种持久形式：不可变条目、可变寄存器和追加式用量行。寄存器构成一个可变的、带命名空间的键值存储。事实存放在那里；内部 harness 命名空间持久存储崩溃恢复所需的待放置内容和 Lane 及操作状态。特别是，`op.meta` 在操作元数据时写入一次，而 `op.state` 在每次转换后被替换为完整当前状态。终态事务删除两者并写入 `lane.lastResult`。不会看到部分事务。

## 0.3 三个存储

第 1–5 部分的一切都源于此。

**1. 三个存储，一个不变量。** 一切持久的东西都是以下之一：

```text
entries        会话树 — 写一次，追加式
registers      当前可变状态 — 带命名空间的类型化单元，覆盖或删除
usage ledger   成本历史 — 追加式行
```

*每个载荷都在一个条目、一个寄存器或台账中；没有第三个地方。* 条目是完整的会话记录 — 放置和载荷在一行中。寄存器直接保存其当前类型化值；覆盖丢弃旧值，删除移除键。在树中有位置之前持久存在的内容（排队输入、延迟写入）等待在 `pending.entry` 寄存器中，并在放置它的事务中成为条目。每个后端的投影 — 分支索引、全文搜索、统计 — 都可以从三个存储重建，不具有权威性。

**2. 原子事务。** 事务是一组条目插入、用量插入和寄存器写入（设置或删除），以全有或全无的方式提交，序列号严格递增。事务内部不存在崩溃状态。这是唯一的写原语。

**3. 持久程序计数器。** 每一步之后，Harness 用操作的*完整*当前状态覆盖一个寄存器 — `op.state/{operationId}`。恢复不重放日志，也不从缺失的内容推断位置；它读取该寄存器并据此切换。状态是*完备的* — 它从不依赖先前的状态。小的捕获值（配置、流选项、重试策略）内联；大的稳定载荷存在于同级的 `op.*` 寄存器中或通过 id 命名。操作结束时，终态事务删除其寄存器：一个已完成的会话恰好保存会话、台账和少数 Lane 与事实寄存器。没有死状态需要收集。

**4. 副作用三明治。** Provider 请求和真实工具调用被两次提交包裹：

```
commit:  "即将执行 X；其输出将使用 id R 和 U"     ← 意图
         执行 X                                   ← 不确定的部分
commit:  输出 + 用量 + 下一个状态                  ← 结算
```

钩子遵循其重放契约：结果在消费它的事务中变为持久，在该事务之前的崩溃可能重新运行钩子。因此每个外部副作用仍然可能在没有持久结算的情况下发生。Provider/工具意图在重放策略依赖的地方明确这种不确定性；幂等钩子将其接受为非目标。

## 0.4 实例演练 — Slack 线程

用户在一个已有 400 条历史条目的频道中发帖。应用为该线程创建一个 Lane，锚定在频道的当前叶子。条目 id 是 UUIDv7（§1.2）；示例缩写它们。

```
harness.createLane("slack:1719432.0021", at: "0195c8d1-4a2e-7b31-…")
lane.prompt("上周 auth 有什么变化？")
```

按顺序发生的事情：

1. **接受。** Harness 验证、运行 `before_run` 钩子并提交一个事务：用户消息条目、操作的 `op.meta` 寄存器及其第一个 `op.state` — *"我在一个检查点，我需要一个助手响应。"*
2. **意图。** 内部就绪状态提交后，提交请求意图：*"我即将发出 provider 请求。响应将是条目 `0195c8d1-53a0-7c44-…`，用量行将是 `0195c8d1-53a0-7d18-…`。"* 两个 id 现在就已生成；尚未发送任何内容。
3. **请求。** 流式传输发生。这是唯一不持久的部分。
4. **结算。** 一个事务提交响应条目、其用量行和下一个状态：*"响应包含工具调用；这是批次计划，结果 id 已分配。"*
5. 工具调用遵循相同的意图 → 副作用 → 结算形态，每对一个提交对。
6. 当模型在没有工具调用时停止，终态事务删除操作的寄存器，在 `lane.lastResult` 中记录结果，Lane 进入空闲。

作为追踪（id 缩写；每个 `TX[...]` 是一个原子提交）：

```text
TX[ insert entry n1 (user msg), upsert op.meta/O, upsert op.state/O = checkpoint,
    upsert lane.leaf = n1, upsert lane.state = { currentOperationId: O } ]
TX[ upsert op.state/O = assistant ready (config snapshot) ]
TX[ upsert op.state/O = effect_pending (reserves response n2, usage u1) ]
… provider 流式传输 …                                ← 不确定窗口
TX[ insert entry n2, insert usage u1, upsert lane.leaf = n2,
    upsert op.state/O = tools (result id n3 reserved) ]
TX[ upsert op.tool_args/O:s1:0, upsert op.state/O = call 0 effect_pending ]
… 工具运行 …
TX[ insert entry n3, upsert lane.leaf = n3, upsert op.state/O = checkpoint ]
… 第二轮：ready · intent · stream · settle (n4, u2) …
TX[ delete op.meta/O, op.state/O, op.tool_args/O:*,
    upsert lane.lastResult = { O, completed, n4 },
    upsert lane.state = { currentOperationId: null } ]
```

在这些事务之间的任意两点杀死进程并重启。Harness 读取 Lane 的寄存器，确切看到哪些句子是最后一个已提交的，然后继续。如果它在第 3 步死亡，它知道一个请求可能已被计费且可能产生也可能没有产生输出 — 这是整个系统中唯一真正不确定的窗口，并且有明确的策略处理它。

同时，同一频道中的第二个线程在相同的 400 条共享历史之上运行自己的 Lane，两者之间没有协调。

## 0.5 实例演练 — 工具执行中崩溃

```
lane.prompt("删除过时的迁移并运行测试套件")
```

模型返回两个工具调用。Harness 提交批次计划，然后提交 `call 0 即将执行，使用这些确切参数，且它声明自身不可安全重放`。工具开始删除文件。进程被杀死。

```text
TX[ insert entry n2 (assistant, 2 calls), insert usage u1, upsert lane.leaf = n2,
    upsert op.state/O = tools (result ids n3, n4 reserved) ]
TX[ upsert op.tool_args/O:s1:0, upsert op.state/O = call 0 effect_pending,
                                                    replay: "never" ]
… 工具删除文件 …  ← 崩溃
```

重启后 Harness 读取一个寄存器，发现 `calls[0].status = "effect_pending", replay = "never"`。它不会重新运行删除。它在副作用开始前保留的结果 id 下追加一个合成错误结果，标记调用完成，继续调用 1：

```text
TX[ insert entry n3 (synthetic "interrupted" result), upsert lane.leaf = n3,
    upsert op.state/O = call 0 completed ]
```

会话保持连贯 — 每个工具调用都有结果 — 并且没有运行两次。

如果工具声明了 `replay: "safe"`（读取、查询），Harness 会用持久化的参数重新执行它。

## 0.6 非目标

- **恰好一次的外部副作用。** 见上文。有自己副作用的钩子必须幂等，以操作 id 为键。
- **Provider 流恢复。** 部分流是进程本地的，从不持久化。已结算的响应在任何分类之前*完整地*持久化。
- **多写者。** 每个会话一个进程。服务层相应路由，SQLite 后端用围栏租约强制执行（§1.7）。Lane 覆盖看起来像多写者的工作负载。
- **复制。** 会话只存在于一处。
- **持久写历史。** 寄存器只保存当前值：被覆盖的寄存器消失，没有 API 或表暴露写历史。测试中的写顺序断言使用 `commit()` 周围的插装存储装饰器（Part 9）；生产审计属于遥测层（§5.8）。
- **删除作为运行时特性。** 条目和用量行从不删除：压缩改变 provider 上下文，不改变存储，终态清理只删除寄存器。注意 `retainedTail` 将旧消息向前复制到较新的压缩条目中，摘要从旧内容派生，所以压缩也不是擦除。合规级的"删除这个"是管理性的精确重写（§2.9），是唯一被批准的例外。

## 0.7 记号与源码类型

- `TX[ a, b, c ]` — 一个包含写入 `a`、`b`、`c`（按此顺序）的原子提交。写入词汇是 `insert entry`、`insert usage`、`upsert namespace/key = value` 和 `delete namespace/key`。
- id 是 UUIDv7（§1.2）。示例缩写它们：短标签 — `e_*` 条目 id、`u_*` 用量 id、`op_*` 操作 id — 在时间前缀无关时替代完整 id；前缀重要时，示例显示它（`0195c8d1-4a2e-7b31-…`）。
- `S(next)` — 用下一个完整操作状态覆盖 `op.state/{operationId}` 寄存器。`L(next)` — 对 `lane.state/{lane}` 同理。
- **must / must not** 是规范性的。其余都是解释。

源码类型出处：

- `AgentMessage`、`AgentTool`、`AgentToolResult`、`QueueMode` 和 `ThinkingLevel`：`packages/agent/src/types.ts`。
- `AgentEventSink`：`packages/agent/src/agent-loop.ts`。
- `Skill`、`PromptTemplate`、`AgentHarnessResources`（下文 `Resources`）、`AgentHarnessTool`、`AgentHarnessStreamOptions` 和 `AgentHarnessStreamOptionsPatch`：`packages/agent/src/harness/types.ts`。
- `Model`、`Models`、`Usage`、`RetryPolicy`、`StopReason`、`AssistantMessage`、`ImageContent`、provider 消息、流选项和延迟句柄：`packages/ai`。
- `CompactionSettings`、`CompactionPreparation`、`CompactResult`、`BranchPreparation` 和 `BranchSummaryResult`：`packages/agent/src/harness/compaction/`。现有的准备和拆分回合算法仍是实现的起点，除非本文档明确更改它们。
- `TelemetryContext` 和类型化 schema 辅助：`packages/telemetry`；Agent 拥有的 schema 保留在 `packages/agent/src/harness/telemetry.ts` 中。
- 持久自定义消息注册的 `TSchema`：typebox。

公共 `QueueMode` 保持 `"all" | "one-at-a-time"`。公共 `RetryPolicy` 保持 pi-ai 形状 `{ enabled, maxRetries, baseDelayMs }`；操作状态存储其规范化后的 `{ maxAttempts, baseDelayMs }` 等价物。`maxRetries` 和 `baseDelayMs` 必须是有限非负安全整数，且 `maxRetries + 1` 必须保持安全；禁用重试规范化为一次尝试。指数延迟和 `notBefore` 算术在 `Number.MAX_SAFE_INTEGER` 处饱和。公共 `CompactionSettings` 保持 `{ enabled, reserveTokens, keepRecentTokens }`；两个 token 计数必须是有限非负安全整数。构造函数和设置器在发布前拒绝无效设置。本设计在 `AgentHarnessStreamOptions` 及其补丁类型中添加 `deferred?: boolean | { window?: "15m" | "1h" | "24h" }`；结构请求始终强制其为 false。

```ts
type SettledAssistantMessage = AssistantMessage & {
  stopReason: Exclude<StopReason, "pending">;
};

// Provider 分发在请求时通过 Models 解析持久的 { provider, modelId } 身份，
// 同时应用认证。缺失或被替换的注册表条目像未知工具一样带内失败该请求。
```

---

# Part 1 — 存储

存储对 Agent、Lane 或会话一无所知。它存储条目和用量行，更新寄存器，并回答一小组固定查询。第 2–4 部分完全建立在此之上。

## 1.1 模型

```ts
type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

/** 写一次。完整的会话记录：放置和载荷在一行中。
    在恰好一个事务中创建，从不修改或删除。扩展此基类的
    四个具体条目类型在 §2.1 中定义。 */
interface EntryBase {
  id: string;                // UUIDv7 (§1.2)
  parentId: string | null;
  seq: number;               // 提交时由存储分配
  timestamp: number;         // Unix 毫秒，提交时由存储分配
  type: EntryType;
  customType?: string;       // 当 type === "custom" 时
  // ...每个条目类型的载荷字段 (§2.1)
}

type EntryType = "message" | "compaction" | "branch_summary" | "custom";

/** 唯一的可变存储。一个带命名空间的键，直接保存其当前类型化值。
    覆盖替换值；删除移除键。 */
interface Register<N extends RegisterNamespace = RegisterNamespace> {
  namespace: N;
  key: string;
  value: RegisterValues[N];
  seq: number;               // 最后设置此寄存器的写入的 seq
}

/** 追加式成本台账行。从不修改，从不删除 (§1.6)。 */
interface UsageRow {
  id: string;                // UUIDv7 (§1.2)
  seq: number;               // 提交时由存储分配
  usage: Usage;
  entryId?: string;          // 此成本所属的条目（如果有）
  adjustment: boolean;       // true = 调用者提供的对账，不是 provider 报告
  details?: JsonValue;
}
```

## 1.2 身份

每个 id — 条目、用量和每个保留的 id — 都是来自会话 id 生成器的 **UUIDv7**（§2.8）；遗留导入重新生成以符合规范（附录 B）。前 48 位是生成时间，所以每个引用都是自描述的且按时间可排序。接受的成本：id 泄露创建时间。（未来的分区 Postgres 后端将建立在此前缀上 — 信息性 Part 6。）

生成规则：

1. id 在**保留时**用 `now()` 生成。直接追加在同一事务中放置；助手/工具 id 的放置比请求时长至多多一个尾随。
2. **工具结果 id 继承其助手 id 的时间戳**（`idGenerator.next(timestampMs?)`，新的随机尾部），所以调用和结果组在 id 顺序下是时间连贯的，甚至跨午夜边界。
3. 合成结算在已保留的 id 下写入（§4.5）— 没有特殊情况。

**不透明载荷** — 自定义条目 `data`、`details`、`fact.custom` 值、消息文本、钩子 `resumeData` — 可以嵌入条目 id。Harness 从不跟踪这些引用，它们可能过期；复制内容，不要引用它。

**绝对规则。** 在会话内，条目和用量行从不删除 — 精确重写（§2.9）是唯一例外。缺失的父节点总是损坏。

## 1.3 寄存器命名空间

```ts
interface RegisterValues {
  "lane.leaf":       string | null;                // 条目 id；null = Lane 在根
  "lane.config":     LaneConfiguration;            // §2.3
  "lane.state":      LaneState;                    // §3.3
  "lane.lastResult": LaneLastResult;               // §3.13
  "op.meta":         Operation;                    // §3.1
  "op.state":        OperationState;               // §3.2 — 程序计数器
  "op.tool_args":    Record<string, JsonValue>;    // 有效工具参数 (§3.8)
  "op.preparation":  DurableStructuralPreparation; // §3.9
  "pending.entry":   PendingEntry;                 // §2.2
  "fact.name":       string;
  "fact.label":      string;
  "fact.custom":     JsonValue;                    // JSON null 是合法值
}
type RegisterNamespace = keyof RegisterValues;

/** 未放置的内容：当前可变状态，直到放置事务写入完整条目
    并删除此寄存器 (§2.2)。 */
interface PendingEntry {
  type: "message" | "custom";
  customType?: string;
  payload?: JsonValue;       // 变成条目载荷的内容；
                             // 缺失 = 没有数据的自定义条目
}

interface DurableFileOperations {
  read: string[]; written: string[]; edited: string[];
}
type DurableStructuralPreparation =
  | { kind: "compaction"; messagesToSummarize: AgentMessage[];
      turnPrefixMessages: AgentMessage[]; retainedTail: AgentMessage[];
      isSplitTurn: boolean; tokensBefore: number; previousSummary?: string;
      fileOps: DurableFileOperations; settings: CompactionSettings }
  | { kind: "branch_summary"; messages: AgentMessage[];
      fileOps: DurableFileOperations; totalTokens: number };
```

| 命名空间 | 键 | 值 | 含义 |
|---|---|---|---|
| `lane.leaf` | lane 名称 | 条目 id 或 `null` | 此 Lane 下次追加的位置 |
| `lane.config` | lane 名称 | `LaneConfiguration` | 完整 Lane 配置 |
| `lane.state` | lane 名称 | `LaneState` (§3.3) | `currentOperationId`、`pendingNextRun` |
| `lane.lastResult` | lane 名称 | `LaneLastResult` (§3.13) | Lane 最近操作的终态结果 |
| `op.meta` | 操作 id | `Operation` (§3.1) | 接受数据；写入一次，从不覆盖 |
| `op.state` | 操作 id | `OperationState` (§3.2) | 完整操作状态 — **程序计数器** |
| `op.tool_args` | `{opId}:{stepId}:{sourceIndex}` | 有效参数 | 工具放行时写入一次 (§3.8) |
| `op.preparation` | `{opId}:{taskId}` | `DurableStructuralPreparation` | 决策钩子之前写入一次 (§3.9) |
| `pending.entry` | 保留的条目 id | `PendingEntry` | 等待放置的排队内容 (§2.2) |
| `fact.name` | `""` | string | 会话名称 |
| `fact.label` | 条目 id | string | 条目标签 |
| `fact.custom` | 应用键 | `JsonValue` | 应用状态 |

这就是完整的集合。键形状中可见两种生命周期：

```text
lane.*  fact.*     会话生命周期；事实只通过显式应用操作删除
op.*               操作生命周期；由终态事务删除 (§3.13)
pending.entry      存活到其内容被放置或取消
```

- `op.meta` 和 `op.preparation` 键恰好写入一次；`op.tool_args` 键每个键写入一次，以产生它的步骤为键，所以批次从不冲突。所有这些最迟在终态事务中删除；只有 `op.state` 在操作期间被覆盖。
- 操作拥有的 `pending.entry` 寄存器在结束时仍未消费的（剩余收件箱项和中止排空项）由终态事务删除 — 已消费项的寄存器在其放置事务中死亡；Lane 拥有的（`pendingNextRun`）比操作存活更久，在消费或取消时死亡（§3.11）。
- `lane.lastResult` 只由终态事务写入，并被其 Lane 上的下一个终态事务覆盖 — 每个 Lane 一个有界寄存器，永远。恢复从不读取它；它的存在是为了让接受了一个操作、崩溃并重新打开的应用仍然可以了解其结果（§3.13）。
- 删除事实移除其寄存器。在 `fact.custom` 中存储 JSON `null` 是一个不同的、合法的状态；没有墓碑。
- 取消不留下痕迹：`cancelQueued` 分类为 pending → `cancelled`，条目存在 → `already_consumed`，否则 → `not_found`（§3.11）。重试丢失取消的客户端将 `not_found` 视为成功。

## 1.4 事务

```ts
/** 映射判别联合：命名空间强制值类型。 */
type RegisterSetWrite = {
  [N in RegisterNamespace]: { kind: "register"; op: "set"; namespace: N;
                              key: string; value: RegisterValues[N] }
}[RegisterNamespace];

type Write =
  | { kind: "entry"; entry: Omit<Entry, "seq" | "timestamp"> }
  | { kind: "usage"; row: Omit<UsageRow, "seq"> }
  | RegisterSetWrite
  | { kind: "register"; op: "delete"; namespace: RegisterNamespace; key: string };

interface Transaction { writes: Write[] }

interface CommitResult { firstSeq: number; seqs: number[]; timestamp: number }
```

规则：

1. 事务**全有或全无**提交。不存在其中某些写入存在而其他不存在的可观察状态。
2. 写入按给定顺序获得**严格递增**的 `seq` 值；间隙是合法的，事务内和事务间都是。`seq` 在所有 Lane 和所有写入类型中是会话级单调的。寄存器 `set` 用其分配的 `seq` 标记寄存器。
3. 在事务内，写入按顺序应用：条目可以命名在同一事务中较早创建的父节点；寄存器值可以引用同一事务中较早创建的条目或用量 id。放置事务插入完整条目并删除其 `pending.entry` 寄存器（§2.2）— 从不存在两者同时存在的时刻。
4. 条目和用量 id 共享一个会话级 id 命名空间。在任何现有 id 下写入任一类型都是**损坏**，不是更新。
5. 具有相同 `(namespace, key)` 的寄存器 `set` 替换当前值；`delete` 移除键；后来的 `set` 重新创建它。不保留历史。命名不存在键的 `delete` 是无操作，所以清除未设置标签等公共删除保持合法。
6. 一个会话上的事务是**序列化的**。有一个写者和一个队列。

会话在存储准入之前验证完整事务，包括 JSON 序列化和运行时 schema。已准入提交的失败**使 Harness 故障**：所有副作用停止，所有调用拒绝，进程必须重启。不容忍部分应用的事务。

## 1.5 查询

一个 `Storage` 实例服务一个会话。仓库发现和生命周期在此接口之外（§2.8）。

```ts
interface Storage {
  commit(tx: Transaction): Promise<CommitResult>;

  getEntries(ids: string[]): Promise<ReadonlyMap<string, Entry>>;

  getRegister<N extends RegisterNamespace>(namespace: N, key: string):
    Promise<Register<N> | undefined>;
  /** keyPrefix 是 (namespace, key) 上的索引前缀列表；终态
      清理的 op.* 前缀扫描使用它 (§3.13)。 */
  listRegisters<N extends RegisterNamespace>(namespace: N, keyPrefix?: string):
    Promise<Register<N>[]>;

  scanBranch(q: BranchScan): Promise<Entry[]>;            // §2.5
  scanBranchStructure(q: BranchScan): Promise<EntryStructure[]>;
  scanEntries(q: EntryScan): Promise<Entry[]>;            // 会话级树清单
  scanUsage(q: UsageScan): Promise<UsageRow[]>;           // seq 范围台账读取 (§1.6)
  getStats(): Promise<SessionStats>;                      // 维护的投影 (§1.6)

  close(): Promise<void>;
}

/** 没有载荷字段的放置元数据。 */
type EntryStructure = Pick<Entry, "id" | "parentId" | "seq" | "timestamp" | "type" | "customType">;

interface EntryScan {
  type?: EntryType; customType?: string;
  fromSeq?: number; toSeq?: number;
  order?: "asc" | "desc"; limit?: number;
}

interface UsageScan {
  fromSeq?: number; toSeq?: number;
  order?: "asc" | "desc"; limit?: number;
}
```

刻意没有跨命名空间的寄存器扫描，也没有持久写日志。恢复、事实、Fork 和执行跟随精确的 id 和键；条目清单使用 `scanEntries`；台账读取使用 `scanUsage`；总计使用统计投影（§1.6）；测试顺序断言用插装存储装饰器包装 `commit()`（Part 9）；生产审计属于遥测（§5.8）。

恢复和执行读取必须是索引驱动且有界的。它们不得从缺失值推断状态，也没有寄存器历史可折叠。允许精确解引用：一个当前状态可以命名一组有界的条目和寄存器，在一次批次中获取，无需依赖顺序的归约。公共清单和调试 API 可能有意读取比热路径更多的内容；它们的 `limit`/分页行为在 `SessionTree` 层是显式的。

`close()` 是幂等的。它封闭准入，拒绝该实例上的后续读取/提交，排空封闭前准入的提交，然后释放资源和写者声明。持久数据通过仓库重新打开。

## 1.6 用量台账

每次已结算的 provider 尝试写入一个 `UsageRow` — 成功、失败、重试和合成尝试都一样，包括其操作后来中止的尝试。结算事务一起写入响应条目及其用量行（§3.7）；合成结算在保留的用量 id 下写入零用量。行是追加式的：终态清理删除操作的寄存器但从不删除其台账行，所以计费在编排状态可能发生的一切中存活。

```jsonc
{ "id": "u_7", "seq": 815, "entryId": "e_51", "adjustment": false,
  "usage": { "input": 12000, "output": 431, "cost": { ... } } }
```

- `entryId` 命名成本所属的条目（如果有）。在产生条目之前失败的结构（摘要）尝试和独立对账没有。
- `adjustment: true` 标记调用者提供的对账（`recordUsage`，§5.1），而不是 provider 报告。格式 3 导入写一行聚合调整行（附录 B）。
- Provider 尝试用量 id 是在意图提交中保留的 UUIDv7（§1.2），所以结算在恰好其意图承诺的 id 下写入。调整行、工具报告的用量行、钩子提供的压缩/导航用量行（§3.9、§3.10）和导入聚合在提交时生成 id；没有保留。
- `getStats()` 是对台账和消息条目计数的维护投影 — `messageCount` 只计算 `message` 条目，不计算压缩、摘要或自定义条目。每次提交后它等于台账总和；一致性套件断言这一点（Part 9）。单行在提交时通过 `usage` 事件到达应用（§5.5），`scanUsage`（§1.5）按 seq 范围读回 — 持久化其已应用的最大事件 `seq` 的消费者在停机后用 `scanUsage({ fromSeq })` 追上。恢复从不读取台账。

## 1.7 后端

一个模型的三种编码现在发布 — Memory、JSONL、SQLite — 三者都通过相同的一致性套件（Part 9）。每个后端记录会话的 `storageVersion`（Part 7）：JSONL 头字段、SQLite 目录列。Memory 会话始终是当前的。可能的第四个后端 — 分区 Postgres — 在 Part 6 中信息性勾勒；这里没有东西依赖它。

### Memory

```ts
entries:   Map<string, Entry>
registers: Map<string, Register>       // 键：`${namespace}\u0000${key}`
usage:     Map<string, UsageRow>
children:  Map<string, string[]>       // parentId → 条目 id，用于树遍历
```

一个队列序列化提交。提交验证并将写入应用到临时事务状态，然后一起发布映射。寄存器删除是映射删除。读取是映射查找；`scanBranch` 遍历 `parentId` 并在 RAM 中过滤。没有日志：Memory 精确保存活跃状态，别无其他。

### JSONL

文件不是状态；它是上述 Memory 映射的**重放配方**。每个 `commit()` 一条物理行。存储先分配序列/时间戳字段，然后将一个已提交的写入编码为一条 JSON 对象行，或多个写入作为一条**数组行**。

```jsonl
{"v":4,"kind":"header","id":"s_1","storageVersion":1,"createdAt":1700000000000,"cwd":"..."}
[{"kind":"entry","seq":101,"timestamp":1700000000000,"id":"e_50","parentId":"e_41","type":"message","message":{"role":"user","content":[...]}},
 {"kind":"register","op":"set","seq":102,"namespace":"op.meta","key":"op_9","value":{...}},
 {"kind":"register","op":"set","seq":103,"namespace":"op.state","key":"op_9","value":{...}},
 {"kind":"register","op":"set","seq":104,"namespace":"lane.leaf","key":"main","value":"e_50"},
 {"kind":"register","op":"set","seq":105,"namespace":"lane.state","key":"main","value":{...}}]
{"kind":"usage","seq":110,"id":"u_7","entryId":"e_51","adjustment":false,"usage":{...}}
{"kind":"register","op":"delete","seq":131,"namespace":"op.state","key":"op_9"}
```

- 这是格式 4。源码树中当前不兼容的格式 4 代码未完成并被就地替换；不需要为它迁移。Coding-agent 格式 3 保持支持（附录 B）。
- 打开按顺序将行重放到 Memory 映射中：条目和用量行累积；后来的寄存器 `set` 覆盖键，`delete` 移除它。这是*解码*，不是恢复逻辑。打开验证持久化的序列单调性 — 严格递增，间隙合法（§1.4）— 和时间戳，从不重新生成已提交的时间戳。所有查询然后在 RAM 中运行。
- **损坏的最后一行被整体丢弃**，包括数组的每个元素，并在新写入准入前截断。这就是"事务内没有崩溃前缀"在这里为真的原因。
- 损坏的*内部*行或完整但无效的事务是损坏。一个例外：schema 迁移之前被取代的旧形状寄存器行在重放期间作为键控原始 JSON 宽松解码（Part 7）；压缩淘汰它们。
- 持久性是进程崩溃级别：已解析的 `commit()` 在进程死亡后存活。不承诺 fsync。
- 可选：每个条目保留 `(offset, length)` 并延迟加载载荷，只保持结构和寄存器驻留。只在性能分析需要时才这样做。

**快照压缩。** 在 SQLite 中寄存器 `set` 是就地 upsert — 30 轮运行留下一个 `op.state` 行然后零个。在 JSONL 中每次 `set` 都追加，所以同样的运行追加约 10 条完整 `op.state` 行，在终态 `delete` 行落地时全部死亡：文件随*写历史*增长，即使逻辑状态不会。修复方法是将文件重写为 `header + 当前条目 + 当前寄存器 + 用量行`，通过临时文件 + 原子重命名；存活的行保持其原始 `seq` 值，被丢弃行留下的间隙是合法的（§1.4），所以压缩不需要重新编号机制。对于一次四条目的运行：

```text
压缩前：  ~10 条事务行，~27 次写入 — op.state 修订、
          工具参数、待处理载荷，全部在终态行之后死亡
压缩后：  header + 4 条条目行 + 2 条用量行 + 4 条 lane 寄存器行
```

何时压缩：打开时死字节比例超过阈值时；可选地在终态事务之后；总是在 schema 迁移之后（Part 7）。压缩之间，正常操作是追加式的，每次提交 O(1)。值得陈述的一个后果：已删除的待处理载荷和被取代的状态修订**作为字节存留**直到压缩 — 逻辑删除是立即的，物理删除是延迟的。需要及时物理移除敏感已取消内容的部署在终态边界积极压缩。

### SQLite

**每个会话一个数据库文件。** 文件就是会话，正如 JSONL 文件一样。损坏被限制在一个会话内，删除就是 unlink 一个文件，SQLite 的每文件单写者规则与设计的每会话单写者规则在构造上一致。

```sql
entries(id TEXT PRIMARY KEY, parent_id TEXT, seq INTEGER, type TEXT,
        custom_type TEXT, timestamp INTEGER, payload TEXT) WITHOUT ROWID;
CREATE INDEX ix_entry_parent ON entries(parent_id);
CREATE INDEX ix_entry_seq ON entries(seq, type);

registers(namespace TEXT, key TEXT, seq INTEGER, value TEXT,
          PRIMARY KEY (namespace, key));

usage_ledger(id TEXT PRIMARY KEY, seq INTEGER, entry_id TEXT, adjustment INTEGER,
             usage TEXT, details TEXT) WITHOUT ROWID;
CREATE INDEX ix_usage_seq ON usage_ledger(seq);

-- 私有分支索引 (§2.6)。不是寄存器；其他后端没有等价物。
branch_entries(branch_id TEXT, entry_id TEXT, entry_seq INTEGER, entry_type TEXT,
               PRIMARY KEY (branch_id, entry_id)) WITHOUT ROWID;
-- 有序扫描。entry_seq 必须紧跟 branch_id 否则 ORDER BY 需要
-- 临时 b-tree；entry_id 和 entry_type 尾随以便索引覆盖纯 id 读取。
CREATE INDEX ix_be_seq  ON branch_entries(branch_id, entry_seq, entry_id, entry_type);
-- 类型过滤扫描。
CREATE INDEX ix_be_type ON branch_entries(branch_id, entry_type, entry_seq, entry_id);
CREATE INDEX ix_be_entry ON branch_entries(entry_id);
branch_meta(branch_id TEXT PRIMARY KEY, tip_entry_id TEXT, tip_seq INTEGER,
            base_branch_id TEXT, base_seq INTEGER);
CREATE UNIQUE INDEX ix_bm_tip ON branch_meta(tip_entry_id);

-- 各一行：文件就是会话。
session(created_at, parent_session_id, storage_version, metadata,
        message_count, usage_payload, next_seq);
writer_lease(owner_id TEXT, fence INTEGER, expires_at_ms INTEGER);
```

一个 `commit()` 是一个 SQL 事务：插入条目、插入台账行、upsert 或删除寄存器、维护分支索引、更新 `session_stats`。从不对条目或台账行执行 UPDATE 或 DELETE；可变性局限于寄存器、分支索引（`branch_meta` 的 tips 和 bases）、统计、序列、会话目录行和租约。

**每个事务必须以 `BEGIN IMMEDIATE` 打开。** 在写入之前先读取的延迟 `BEGIN` 获取读快照，之后必须升级到写锁；如果另一个写者在中间提交，SQLite 使该升级失败 — 而 `busy_timeout` **不能**拯救它，因为等待无法刷新过期快照。唯一的恢复是回滚并完全重试。

每个提交都有这个形状，不只是少数几个。分配序列范围读取会话行的 `next_seq` 然后写入它，所以系统执行的每个事务中读取先于写入。分支创建（§2.6）添加第二个实例，在插入之前读取最新压缩。`BEGIN IMMEDIATE` 预先获取写锁并避免不可恢复的过期快照升级，所以这里不存在延迟 `BEGIN` 是正确选择的情况。

**`writer_lease` 强制单写者规则。** WAL 很乐意让两个进程交替写入一个文件，这正是设计禁止的交错 — 所以每会话文件并不能消除对租约的需求。过期的围栏所有权：`open()` 获取声明，存储在追加时和空闲时续约它，关闭在队列排空后停止续约并只删除其匹配的 `(owner_id, fence)` 对 — 所以过期所有者不能释放成功替代它的那个。这就是"一个进程拥有一个会话"成为强制属性而不是信任服务层维护的约定的原因。Memory 和 JSONL 没有等价物，依赖进程所有权；被打开两次的 JSONL 会话是损坏的且未被检测。

原子性本身不需要特殊处理。多写事务按文件格式是全有或全无的：WAL 帧只在提交记录落地时可见，所以并发读者要么看到事务的所有写入，要么看不到任何写入。

`scanBranch` 的每个物理段使用一个 JOIN；§2.6 组合段范围：

```sql
SELECT e.id, e.parent_id, e.seq, e.type, e.custom_type, e.timestamp, e.payload
FROM branch_entries b
CROSS JOIN entries e ON e.id = b.entry_id
WHERE b.branch_id = ? AND b.entry_seq > ? AND b.entry_seq <= ?
ORDER BY b.entry_seq;
```

`CROSS JOIN` 是承重的：它强制 `branch_entries` 作为外层循环。放任不管的话规划器可能从 `entries` 驱动、扫描表并通过临时 b-tree 排序。在测试中断言计划：

```
SEARCH b USING COVERING INDEX ix_be_seq (branch_id=? AND entry_seq>?)
SEARCH e USING PRIMARY KEY (id=?)
```

任何包含 `USE TEMP B-TREE FOR ORDER BY` 或扫描 `entries` 的计划都是回归。

`scanBranchStructure` 是不带载荷列的同一查询。`getEntries` 是以 `e.id IN (...)` 为键的主键查找。

因为文件就是会话，精确重写（§2.9）和 Fork 是文件操作：构建一个新数据库（`VACUUM INTO` 或在一个读快照上行复制）并且，对于重写，原子地将它交换到旧路径上 — 与 JSONL 使用的形状相同。

## 1.8 为什么是写一次加寄存器

- **恢复是读取。** 每个 Lane 五次寄存器点查找，然后精确 id 解引用（§4.4）。不存在可能有 bug 的归约器。
- **崩溃状态可枚举。** 在事务之间，从不在事务内部。
- **清理是删除，不是收集。** 30 轮运行覆盖一个 `op.state` 寄存器约 30 次然后删除它。剩下的恰好是会话、台账和少数 Lane 与事实寄存器 — 没有死状态值、没有历史行、没有需要垃圾回收的东西。（JSONL 将*物理*回收延迟到快照压缩；逻辑状态相同。）
- **没有通过重写的修复。** 恢复追加条目并只覆盖它拥有的寄存器，使用正常执行会提交的相同转换；中断它并重新运行会得到相同的结果。
- **并发是平凡的。** 读者从不看到部分状态；没有什么需要锁。
- **唯一刻意双重写入。** 排队内容被序列化两次：入队时进入其 `pending.entry` 寄存器，放置时进入其条目。只有排队项支付它 — 助手和工具结算（热路径）只写入一次条目。作为交换，每个队列项是一个 id，取消直接删除内容，任何载荷从不存在没有所有者的情况。

---

# Part 2 — 会话树

## 2.1 条目

**条目**是完整的存储行（§1.1）：放置字段和载荷在一起。`getEntries` 和扫描返回的恰好是已提交的内容 — 没有物化步骤也没有 join。

```ts
interface MessageEntry       extends EntryBase { type: "message"; message: AgentMessage;
                                                 terminate?: true }
interface CompactionEntry    extends EntryBase { type: "compaction"; summary: string;
                                                 retainedTail: AgentMessage[]; tokensBefore: number;
                                                 details?: JsonValue; usage?: Usage; fromHook: boolean }
/** fromId 是被摘要分支的导航前叶子：产生它的
    操作的 sourceLeafId (§3.10)。 */
interface BranchSummaryEntry extends EntryBase { type: "branch_summary"; fromId: string;
                                                 summary: string; details?: JsonValue;
                                                 usage?: Usage; fromHook: boolean }
interface CustomEntry        extends EntryBase { type: "custom"; customType: string; data?: JsonValue }

type Entry = MessageEntry | CompactionEntry | BranchSummaryEntry | CustomEntry;
```

规则：

- `type` 和 `customType` 是结构字段：分支查询在它们上过滤，分支索引对它们反规范化（§2.6）。`customType` 恰好在自定义条目上设置；载荷字段从不驱动结构。
- 助手条目始终包含 `SettledAssistantMessage`。写入前拒绝 `pending`。
- 工具结果条目携带 `terminate?: true`。这是 `ToolResultMessage` 没有字段的编排状态。
- 每个压缩和分支摘要携带 `fromHook`：钩子输出为 `true`，生成为 `false`。
- 每个压缩存储完整的 `retainedTail`（为空时 `[]`）。**上下文从不越过压缩读取。** 这使压缩成为自包含的检查点而不是指向历史的指针。
- 自定义条目可以不携带 `data`。条目要么按其类型的运行时 schema 解码，要么是损坏。
- 载荷是内联的，所以两个条目从不共享存储内容；没有去重层。

## 2.2 放置

树的中心规则：

> **条目**在放置发生时被创建、完整。在放置*之前*持久的内容是当前可变状态，等待在 `pending.entry` 寄存器中；放置事务写入条目并删除寄存器。之后两者都不会被修改。

三种情况，都是机械的：

**出生即放置** — 助手响应、工具结果、对空闲 Lane 的直接追加。内容和放置一起到达；一个事务：

```
TX[ insert e_a4 = { parent: e_q1, type: "message", message: <助手响应> },
    upsert lane.leaf/main = "e_a4" ]
```

**内容先行，放置在后** — 排队输入（`steer`、`followUp`、`nextRun`）和延迟树写入。条目 id 在入队时生成并兼任寄存器键；队列状态通过这一个 id 引用内容。两个事务，可能相距很远：

```
t0  TX[ upsert pending.entry/e_q1 = { type: "message", payload: <200KB 消息> },
        S(next){ ...inbox.steer += "e_q1" } ]

t1  TX[ insert e_q1 = { parent: e_a3, type: "message", message: <来自寄存器> },
        delete pending.entry/e_q1,
        upsert lane.leaf/main = "e_q1",
        S(next){ ...inbox.steer -= "e_q1" } ]
```

寄存器在放置条目的事务中死亡。`t1` 之前崩溃：该项仍在排队。之后崩溃：它已放置且寄存器消失。**没有第三种状态** — 直到放置或取消，在每个提交边界恰好存在寄存器和条目之一，从不同时存在也从不都不存在。取消是另一个出口：`cancelQueued` 删除寄存器，内容直接消失，从未触及树（§3.11）。

**内容存在之前 id 已保留** — 助手响应和工具结果。保留的 id 是 `op.state` 内的一个普通生成的字符串；在结算插入完整条目之前没有寄存器也没有行。保留不花任何成本。

这些是**两种保留机制**：结算族 id（响应、工具结果、用量行）是操作状态中的字符串；排队内容 id 是 `pending.entry` 寄存器。"保留的 id 只是一个字符串"只对第一族为真。

可以依赖的后果：

- 待处理项**对树查询不可见**（没有条目）但**在快照中可见**：拥有状态列出其 id，载荷从其寄存器解引用。
- "这已被放置了吗？"由拥有队列列表和寄存器的存在来回答 — 从不由条目的缺失来回答。
- 双重写入是模型唯一刻意的冗余（§1.8）。SQLite 和 Postgres 可以在放置事务内实现从寄存器行 `INSERT … SELECT` 的放置；在 JSONL 中两个副本作为字节持久存在直到快照压缩（§1.7）。只有排队项支付它；结算从不支付。

## 2.3 Lane

一个已配置的 Lane 是三个寄存器 — 加上其第一个操作结束后（§3.13）的 `lane.lastResult`。新鲜或规范化 v3 的 `main` 可能暂时缺少 `lane.config`，直到第一次 Harness 附着：

```
lane.leaf/{name}    = 条目 id 或 null
lane.config/{name}  = LaneConfiguration      // 仅未配置的 main 缺失
lane.state/{name}   = LaneState
```

```ts
interface LaneConfiguration {
  model: { provider: string; modelId: string };
  thinkingLevel: ThinkingLevel;
  activeToolNames: string[];
}
```

- Lane 的叶子以恰好两种方式移动：Lane 追加一个条目（叶子变成该条目），或 Lane 导航（叶子跳到现有条目）。
- `LaneConfiguration` 是**完备的**。设置器覆盖整个寄存器；它从不是补丁，也从不是树条目。
- 创建 Lane 不复制任何树内容、历史或来自其锚点的配置：

```
TX[ upsert lane.config/{name} = <种子配置>,
    upsert lane.leaf/{name}   = anchorEntryId,
    upsert lane.state/{name}  = { currentOperationId: null, pendingNextRun: [] } ]
```

- Lane 从不删除或重命名。名称是永久的应用键。
- 每个会话都有 `main`。
- 同一叶子上的两个 Lane 只是在下一次追加时分叉。

## 2.4 事实

会话范围、最新者胜、不属于树。

```
fact.name/""          = string
fact.label/{entryId}  = string
fact.custom/{key}     = JsonValue
```

将事实设置为 `undefined` 删除其寄存器 — 真正的删除，不是墓碑；删除未设置的事实是无操作（§1.4）。JSON `null` 是合法的自定义值，直接存储，并且因为寄存器本身存在或不存在而与删除可区分。内置和自定义命名空间从不重叠。事实写入立即提交且从不移动叶子。

## 2.5 分支查询与上下文

```ts
interface BranchScan {
  start?: string;               // 在 Storage 层必填；Session
                                // 树视图默认为视图的 Lane 叶子
  stopAtType?: EntryType;       // 扫描在第一个匹配后结束，包含
  stopAtId?: string;
  type?: EntryType;
  customType?: string;
  order?: "newestFirst" | "oldestFirst";   // 默认 newestFirst
  limit?: number;
  cursor?: EntryCursor;
}
type EntryCursor = { seq: number };
```

语义：取从 `start` 到根的路径，排序（默认 `newestFirst`），在第一个 `stopAt` 匹配处**包含性地**停止，按 `type`/`customType` 过滤，应用排他游标，然后应用 `limit`。对于 `newestFirst`，游标保留 `seq < cursor.seq`；对于 `oldestFirst`，保留 `seq > cursor.seq`。只有 `stopAt` 条目也通过过滤时才返回。

**上下文投影** — provider 请求如何构建：

1. `scanBranch({ start: leaf, order: "newestFirst", stopAtType: "compaction" })`。
2. 反转为最旧优先。如果压缩终止了扫描，上下文是：其 `summary`，然后其 `retainedTail`，然后其后的每个条目。**不读取更早的内容。**
3. 丢弃停止原因为 `error`、`aborted` 或 `deferred` 的助手响应。保留真正的输出限制 `length`。
4. 通过 `entryProjectors` 运行自定义条目。未投影的自定义条目从不进入上下文。
5. 运行 `transform_context`，然后 `toProviderMessages`。

溢出响应不需要专门的省略规则：它以停止原因 `error` 提交（§3.7），因此像任何其他错误一样被规则 3 丢弃，也被任何以相同方式过滤的下游 `transformMessages` 丢弃。

**追加式上下文不变量。** 在一个 Lane 的请求之间，provider 上下文必须只在尾部增长。在先前请求尾部之前的插入会使 provider 的 KV 缓存失效并倍增成本。这就是*为什么*运行中写入延迟到检查点，在那里它们在尾部追加。压缩是唯一刻意的缓存失效，用它交换更小的上下文。

## 2.6 分支索引

Memory 和 JSONL 在 RAM 中遍历父指针。SQLite 维护一个私有的分段分支缓存，使分歧追加不复制无界的根前缀。

`branch_entries` 存储一个段中物理存在的条目。`branch_meta` 存储其 tip 和可选的 `{ baseBranchId, baseSeq }`。一个段逻辑上包含其在 `baseSeq` 之上的自身行加上通过 `baseSeq` 引用的基础前缀。

追加：

1. 如果分支 tip 等于 Lane 叶子，追加一行并移动该 tip。
2. 否则解析实际覆盖叶子的分支，通过完整段链找到叶子处或之下的最新压缩，只复制该压缩之后到叶子的行，并将较旧的前缀设置为新段的 base。
3. 追加新条目并使其成为新段 tip。

先读最新段。如果请求范围跨越 `baseSeq`，通过基础链继续，上限封顶在该边界。在过滤/限制之前将段结果合并为请求的顺序。

两条正确性规则是强制性的：

- 基础分支必须自身在其逻辑范围内覆盖叶子；仅在祖先中包含叶子不够。
- 最新压缩搜索必须遍历基础链；只检查最新物理段可能错过它。

缓存必须保持：

- 跟随段链产生精确的根路径，没有间隙或重复；
- 包含一个条目的所有链在它之下一致；
- 运行时读取从不退化为表扫描或父遍历；
- 过期分支保持有效的缓存历史；
- 只有显式修复操作从条目重建缓存。

测试断言这些不变量和所需的查询计划。没有墙钟阈值是规范性的。

## 2.7 Fork

Fork 是对一致源会话快照的仓库操作。它复制选定的条目、最新事实、Lane 叶子和完整配置；它从不复制 `op.*`、`pending.entry` 或 `lane.lastResult` 寄存器或台账行 — 目标 Lane 以新鲜的空 `LaneState` 开始。

```ts
type ForkOptions =
  | { scope?: "branch"; entryId?: string; position?: "before" | "at" }
  | { scope: "tree" };
```

- Memory 和 JSONL 在源存储队列上将快照作为一个作业获取。SQLite 使用一个读事务。
- 分支范围复制一条路径并只创建目标 `main`。树范围复制整棵树和每个 Lane 叶子/配置。
- 目标是空闲的，其 token/成本台账从零开始。条目本地显示用量保留在复制的条目上。
- 事实跟随选定范围：名称/自定义事实总是复制；标签只在目标被复制时复制，除非树范围复制所有目标。
- 任何消息可以是 Fork 点。请求构建治愈孤立的工具调用。
- 复制的条目保留其 id。
- 目标元数据记录 `parentSessionId`。

只有新鲜/未配置 `main` 的源 — 新格式 4 或只读规范化 v3 — 可能没有配置。任一 Fork 范围然后创建一个未配置的目标 `main`，第一次 Harness 附着正常播种。Fork 复制的每个已配置格式 4 Lane 保持其当前的完整配置。

## 2.8 会话与仓库边界

`Storage` 刻意只服务一个会话。`Session` 提供类型化验证、Lane 绑定视图和类型化条目/寄存器解码。`SessionRepo` 拥有发现和存储实例生命周期：

```ts
interface SessionMetadata {
  id: string;
  createdAt: number;
  /** 当前存储 schema 版本 (Part 7)。 */
  storageVersion: number;      // 新格式 4 会话从 1 开始
  cwd?: string;                // 工作目录，当应用记录时
  parentSessionId?: string;
  /** 仅当 v3 父路径无法解析为可用的 header id 时。 */
  legacyParentSessionPath?: string;
}

interface SessionCodecOptions {
  /** 内置 provider 消息角色默认注册。 */
  customMessageSchemas?: Record<string, TSchema>;  // 以自定义 `role` 为键
}

interface SessionRepo<M extends SessionMetadata = SessionMetadata,
                      C extends { id?: string; parentSessionId?: string } =
                        { id?: string; parentSessionId?: string },
                      L = void> {
  create(options: C): Promise<Session<M>>;
  open(metadata: M): Promise<Session<M>>;
  list(options?: L): Promise<M[]>;
  delete(metadata: M): Promise<void>;
  fork(source: M, options: ForkOptions & C): Promise<Session<M>>;
}

interface Session<M extends SessionMetadata = SessionMetadata> extends SessionTree {
  readonly metadata: M;
  /** 生成 UUIDv7 id；提供时间戳生成 follower id (§1.2)。 */
  readonly idGenerator: { next(timestampMs?: number): string };
  view(lane: string): SessionTree;

  /** 包内部 harness 存储表面；在委托给 Storage 之前验证。 */
  commit(tx: Transaction): Promise<CommitResult>;
  getEntries(ids: string[]): Promise<ReadonlyMap<string, Entry>>;
  getRegister<N extends RegisterNamespace>(namespace: N, key: string):
    Promise<Register<N> | undefined>;
  listRegisters<N extends RegisterNamespace>(namespace: N, keyPrefix?: string):
    Promise<Register<N>[]>;

  close(): Promise<void>;
}
```

仓库构造函数接受 `SessionCodecOptions`。每个声明合并的自定义 `AgentMessage` 必须有字符串 `role` 和注册的运行时 schema；未知自定义角色在持久化之前和解码时被拒绝。新的仓库会话创建 `main`，叶子为 null，`LaneState` 为空，但没有配置；第一次 Harness 附着写入其种子配置。

`open()` 将存储的 `storageVersion` 与二进制的比较：相等则继续；更旧则在写者租约下运行链式迁移后返回（Part 7）；更新则拒绝打开。旧的 coding-agent v3 JSONL 会话通过同一仓库打开并在加载时规范化（附录 B — 那里的"v3"命名遗留 JSONL 会话格式，不是本文档）。

仓库实现将 `fork(source, ...)` 解析为源的序列化快照边界：活跃的 Memory/JSONL 存储将快照与提交排队；非活跃的 JSONL 文件作为一个不可变前缀读取；SQLite 使用会话文件的一个读快照。仓库可以为此目的按会话 id 保留活跃存储注册表。这是仓库协调，不是单会话 `Storage` 契约的一部分。

仓库如何组织其会话是它自己的选择，只受存储后端约束：JSONL 和 SQLite 存储是每会话一个文件，所以它们的仓库基于文件；Postgres 存储可以在一个数据库中保存每个会话。

### 搜索

搜索是**仓库之上的独立服务**，有自己的存储。依赖单向：服务消费 `repo.list()` 和只读会话打开；仓库对搜索一无所知，不暴露搜索方法，也没有一致性测试覆盖这些。想要搜索的应用构造服务并直接查询它：

```ts
const search = createSqliteSearchService({ repo, dbPath });    // 参考实现
await search.sync();                                           // 追上游标
events.on("entry_added", (e) => search.notify(e.sessionId));   // 可选的新鲜度

const hits = await search.searchSessions({ text: "auth migration", limit: 10 });
```

```ts
interface SessionSearchService {
  /** 按最佳匹配排名的会话。必填。 */
  searchSessions(query: SearchQuery): Promise<SessionSearchHit[]>;
  /** 按匹配排名的条目。可选能力。 */
  searchEntries?(query: SearchQuery): Promise<EntrySearchHit[]>;

  sync(): Promise<void>;              // 枚举会话，追上所有游标
  notify(sessionId: string): void;    // 新鲜度提示；去抖的单会话拉取
  remove(sessionId: string): Promise<void>;
  close(): Promise<void>;
}

interface SearchQuery { text: string; limit?: number }  // limit 计算方法的单位

interface SessionSearchHit {
  sessionId: string;
  score?: number;
  top?: { entryId: string; snippet?: string; timestamp: number };  // 最佳匹配，用于显示
}

interface EntrySearchHit {
  sessionId: string; entryId: string; timestamp: number;
  snippet?: string; score?: number;
}
```

应用拥有生命周期：启动或按计划 `sync()`，想要新鲜度时将 `notify()` 接到其事件流，`remove()` 与 `repo.delete()` 并行（或留给下一个 `sync()`，它对照 `repo.list()` 对账）。命中携带 `sessionId`；调用者通过它们已持有的仓库 join 元数据。

**索引是基于拉的；事件只是提示。** 服务为每个会话保持一个持久游标 — 它已索引的最高条目 `seq`。`sync()` 通过仓库枚举会话（旧的、新的、通过复制到达的文件都一样），对每个读取 `scanEntries({ fromSeq: cursor + 1 })`，按 `(sessionId, entryId)` 幂等地索引消息条目文本，并推进游标。批次中途崩溃将几行重新索引到相同状态；针对多年现有会话部署的服务从空开始并用同一循环追上。`notify()` 从不携带内容 — 它是一个触发单会话去抖拉取的戳；丢失的戳被下一次扫描捕获。索引是零权威的可重建投影：索引失败从不影响 Harness 或提交。

两个机械说明。读取另一个进程正在写的会话是合法的 — 写者租约限制写者，WAL 提供跨进程快照读取 — 但扫描可以跳过持有租约的会话作为优化，因为 `notify()` 覆盖热会话。精确重写（§2.9）交换会话的存储并可能重新编号 seq，所以游标以 `(sessionId, storeGeneration)` 为键；重写在元数据中递增代计数器，不匹配触发该会话的完整重新索引。

参考实现是一个独立 SQLite 数据库 — 一个覆盖 `(session_id, entry_id, text)` 的 FTS5 表加游标表 — 并且在 JSONL 会话文件上不变工作。多个进程可以在常规纪律下共享它（WAL、`busy_timeout`、`BEGIN IMMEDIATE`、幂等行、单调游标更新）；写者序列化。

**开放问题 — 元数据过滤。** Coding-agent 的恢复流程按 `cwd` 过滤会话；其他仓库根本没有 cwd 概念。仓库已经通过其 `L` options 泛型（`list(options?: L)`）建模实现特定的列表，但 `SearchQuery` 刻意通用 — 仓库特定的过滤器如何到达索引？候选方案，由将要为此争论的人决定：

```ts
// (a) 类型化过滤器透传 — 服务对过滤器类型泛型化
await search.searchSessions({ text: "auth", filter: { cwd: "/repo" } });

// (b) 通过仓库自己的列表预限制；传入候选 id 集合
const local = await repo.list({ cwd: "/repo" });
await search.searchSessions({ text: "auth", within: local.map((m) => m.id) });

// (c) 应用内后过滤 — 如下所示不健全：limit 在过滤之前应用
const all = await search.searchSessions({ text: "auth", limit: 10 });
const hits = all.filter((h) => byId.get(h.sessionId)?.cwd === "/repo");

// (d) sync 时索引选定的元数据字段；在索引中原生过滤
createSqliteSearchService({ repo, dbPath, metadataFields: ["cwd"] });
await search.searchSessions({ text: "auth", where: { cwd: "/repo" } });
```

(a) 保持一次往返但使服务对每个仓库的过滤词汇泛型化；(b) 与任何仓库组合不变但可能将巨大的 id 集合送入查询；(c) 如上所示不健全 — 在 `limit` 之后过滤丢弃结果；(d) 是索引最擅长的但将服务耦合到 sync 时选定的元数据字段，并且它们更改时需要重新 `sync`。

## 2.9 精确重写

条目和用量行从不删除（§1.2）。唯一被批准的例外是**精确重写**：一个管理性的仓库操作，将保留集合 — 条目、用量行、事实、Lane 寄存器 — 复制到一个一致快照之上的新鲜会话存储中，与 Fork 完全一样（§2.8），然后原子地将它替换旧存储。它的保留谓词可以表达任何运行时机制都不允许表达的：合规级擦除（包括被向前复制到 `retainedTail` 和摘要中的内容）、修剪废弃分支、重新生成遗留格式 id（附录 B）。它是 Harness 之上的工具 — 没有 Harness 表面暴露它，也没有核心规则依赖它。
