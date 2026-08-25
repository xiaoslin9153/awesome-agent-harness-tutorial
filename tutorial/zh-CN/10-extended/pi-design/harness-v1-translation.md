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

---

# Part 3 — 操作状态机

## 3.1 操作

```ts
interface Operation {
  operationId: string;
  lane: string;
  sourceLeafId: string | null;
  startedAt: number;
  intent:
    | { kind: "run"; promptEntryIds: string[];
        systemPromptOverride?: string; resumeData?: Record<string, JsonValue> }
    | { kind: "compaction"; customInstructions?: string }
    | { kind: "navigation"; targetId: string | null; summarize: boolean;
        label?: string; customInstructions?: string };
}
```

接受数据保存在 `op.meta/{operationId}` 寄存器中：接受时写入一次，从不覆盖，由终态事务删除（§3.13）。`sourceLeafId` 是操作*之前*的 Lane 叶子；操作自身追加的条目在它之后。`promptEntryIds` 命名调用者规范化的 prompt 条目，在接受事务中出生即放置（§3.6）。

## 3.2 操作状态 — 程序计数器

`op.state/{operationId}` 直接保存一个完整 `OperationState`。每次转换覆盖整个寄存器；终态事务删除它（§3.13）。联合中没有 finished 成员 — 已结束的操作完全没有状态，其结果保存在 `lane.lastResult` 中。

```ts
type OperationState = RunState | CompactionState | NavigationState;

type Control =
  | { status: "running" }
  | { status: "cancel_requested"; requestedAt: number;
      /** 已排空的队列 id。它们的 pending.entry 寄存器在排空后
          存活，只由终态事务删除 (§3.11, §3.13)。 */
      drainedSteer: string[]; drainedFollowUp: string[] };

interface RunState {
  kind: "run";
  control: Control;
  /** 接受时原子捕获；设置器影响后续操作。 */
  settings: {
    compaction: CompactionSettings;
    steeringMode: QueueMode;
    followUpMode: QueueMode;
    toolExecution: "sequential" | "parallel";
  };
  phase: RunPhase;
  inbox: Inbox;
  /** 此操作中最新持久助手生成/获取响应。 */
  latestAssistantEntryId: string | null;
}

interface CheckpointPhase {
  kind: "checkpoint";
  continuation: Continuation;
  /** 下一个生成步骤的持久关联源。 */
  triggerEntryId: string;
  /** 阈值压缩每个触发边界至多尝试一次。 */
  thresholdCheckedTriggerEntryId?: string;
  /** 一次一个排空后，在排空另一个排队输入之前先生成。 */
  skipInboxOnce?: boolean;
}

type RunPhase =
  | CheckpointPhase
  | { kind: "assistant"; generation: Generation }
  | { kind: "tools"; batch: ToolBatch }
  | { kind: "compaction"; reason: "threshold" | "overflow";
      structural: StructuralDecision; resumeAfter: CheckpointPhase }
  | { kind: "deferred"; deferred: Deferred }
  | { kind: "failure_drain"; error: OperationError; provenance:
      | { kind: "response"; entryId: string }
      | { kind: "structural"; taskId: string } };

type Continuation =
  | { kind: "need_assistant"; overflowRecoveryUsed: boolean }
  | { kind: "may_finish"; includeFinalAssistant: boolean };

interface Inbox {
  /** 保留的条目 id。载荷 — 以及写入的条目类型和
      customType — 保存在每个 id 的 pending.entry 寄存器中 (§1.3, §2.2)。 */
  steer: string[];
  followUp: string[];
  writes: string[];
}

interface OperationError { code: string; message: string; details?: JsonValue }
```

一个队列项是一个条目 id；其他一切 — 载荷、写入类型、`customType` — 从其 `pending.entry` 寄存器解引用。

`latestAssistantEntryId` 在与每个助手生成或延迟获取响应相同的结算事务中更新。它让完成和恢复无需分支扫描即可构建结果/事件。工具批次在工具工作保持活跃时保留其产生回合的 id。

任何追加会话输入或工具结果且需要另一个助手的转换，写入一个 `need_assistant(false)` 的检查点，追加的条目作为 `triggerEntryId`。`may_finish` 检查点将 `triggerEntryId` 设置为引起边界的条目：`stop`/真正 `length` 结算的已结算响应（§3.7），全部终止的工具批次的最新结果条目（§3.8）— 所以阈值去重（§3.12）和恢复验证（§3.3）总是命名一个现有条目。未投影的自定义写入保留当前检查点，包括触发和溢出标志。进入阈值压缩首先将检查点复制到 `resumeAfter`，设置 `thresholdCheckedTriggerEntryId = triggerEntryId`；因此拒绝、空准备、成功和崩溃不能重新检查同一边界。

### 生成

```ts
interface NormalizedRetryPolicy { maxAttempts: number; baseDelayMs: number }

interface GenerationContext {
  stepId: string;
  triggerEntryId: string;
  /** 步骤开始时 Lane 配置的内联快照。 */
  configuration: LaneConfiguration;
  streamOptions: AgentHarnessStreamOptions;
  retryPolicy: NormalizedRetryPolicy;
  /** 从产生检查点的 need_assistant continuation 复制，
      使崩溃恢复后分类的结算仍知道溢出恢复是否已用掉 (§3.7, §3.9)。 */
  overflowRecoveryUsed: boolean;
}

type Generation =
  | { status: "ready"; context: GenerationContext; nextAttempt: number }
  | { status: "effect_pending"; context: GenerationContext; attempt: number;
      responseEntryId: string; usageId: string;
      intendedOutputLimit: number; contextWindow: number }
  | { status: "retry_wait"; context: GenerationContext; nextAttempt: number;
      notBefore: number; errorMessage: string };
```

上下文**内联**快照配置、流选项和重试策略；`LaneConfiguration` 很小。因此恢复可以精确报告缺少什么而无需解析任何东西（§4.4）。对于每次尝试，`before_request` 钩子聚合在意图提交之前运行；`before_payload` 和 `after_response` 挂载在 provider 流上。意图保留响应条目 id 和用量行 id（§1.2 的 follower id）；结算写入在恰好这些 id 之下。有效参数以 `operationId` 加 `sourceIndex` 为键；大的有效参数在 `op.tool_args/{operationId}:{stepId}:{sourceIndex}` 寄存器中保存一次 — 产生生成的 `stepId` 消除跨回合批次的歧义 — 在放行时写入（§3.8）并通过该确定性键定位 — 状态不携带每次调用的参数引用。无条件持久化它们，因为 `prepareArguments` 而不仅是 `before_tool` 可能更改它们。并行调用可以一起处于 effect-pending；结果条目按源顺序提交。

### 延迟

```ts
type Deferred =
  | { status: "suspended"; stepId: string; sourceEntryId: string; poll: number;
      configuration: LaneConfiguration; streamOptions: AgentHarnessStreamOptions }
  | { status: "effect_pending"; stepId: string; sourceEntryId: string; poll: number;
      responseEntryId: string; usageId: string;
      configuration: LaneConfiguration; streamOptions: AgentHarnessStreamOptions };
```

一次 `resume()` 至多执行一次 `fetchDeferred(handle, { wait: 0 })`。Suspended 的 `poll` 是已完成的轮询数；新意图使用 `poll + 1`，该 1 基值是 `before_request.attempt` 和轮询回合 id 后缀。轮询从原始生成复制的基准流选项开始，强制 `deferred:false`，运行 `before_request`，挂载 `before_payload`/`after_response`，然后提交其新意图并像助手生成一样分发。当前全局流设置不影响它。没有轮询重试上限、退避或内部循环。pending 响应必须具有完全相等的句柄并成为下一个源。不匹配的 pending 句柄被规范化为解释不匹配的持久 `error` 响应；响应、用量、`latestAssistantEntryId` 和响应来源 `failure_drain` 原子提交。

完整转换表 — 每行是一个 `commit()`；分类顺序（§3.7）适用于每次轮询结算，取消优先：

| 从 | 触发 | 事务 | 到 |
|---|---|---|---|
| assistant `effect_pending` | 结算分类为 `deferred` 且句柄有效 | §3.7 的 deferred 行 | suspended, `poll: 0`, `sourceEntryId: R` |
| suspended, poll *k* | `resume()`：轮询的 `before_request` 结算提交其意图，消耗调用的单个轮询许可 | 生成新 R′ 和 U′，然后 `TX[ S(deferred{effect_pending, poll k+1, responseEntryId R′, usageId U′}) ]` | effect_pending, poll *k*+1 |
| effect_pending, poll *k*+1 | fetch 返回**pending**且句柄完全相等 | `TX[ insert response entry R′, upsert lane.leaf = R′, insert usage U′, S(latestAssistantEntryId=R′, deferred{suspended, sourceEntryId R′, poll k+1}) ]` — pending 响应成为下一个源，操作重新挂起；本次调用不再轮询 | suspended, poll *k*+1 |
| effect_pending | fetch 返回**pending**且句柄不匹配 | 规范化为解释不匹配的持久 `error` 响应：`TX[ insert normalized response R′, upsert lane.leaf = R′, insert usage U′, S(latestAssistantEntryId=R′, failure_drain{error, provenance:response R′}) ]` | failure_drain |
| effect_pending | fetch 返回**ready**且有工具调用 | `TX[ insert response R′, upsert lane.leaf = R′, insert usage U′, S(latestAssistantEntryId=R′, tools{plan with reserved result ids}) ]` — 结果 id 作为 R′ 的 follower 生成（§1.2） | tools |
| effect_pending | fetch 返回**ready**且无工具调用 | `TX[ insert response R′, upsert lane.leaf = R′, insert usage U′, S(latestAssistantEntryId=R′, checkpoint{may_finish, includeFinalAssistant:true}) ]` | checkpoint |
| effect_pending | fetch 以 provider `error` 结算 | `TX[ insert response R′, upsert lane.leaf = R′, insert usage U′, S(latestAssistantEntryId=R′, failure_drain{error, provenance:response R′}) ]` — 轮询没有重试路径 | failure_drain |
| effect_pending, restored, running control | 崩溃使轮询结果未知；下一次 `resume()` 替换它 | 生成新 R″/U″ 并在**相同**轮询号提交新意图 — 未知结果的轮询从未完成，所以 `poll` 不递增；旧的保留 id 字符串被放弃，从未物化 | effect_pending, poll *k*+1 |
| effect_pending, cancelled control | 对账，活跃或恢复（§4.5, §4.6） | 在**现有**保留 id 下的合成结算：`TX[ insert synthetic aborted response R′, upsert lane.leaf = R′, insert zero usage U′, S(latestAssistantEntryId=R′, cancelled checkpoint{may_finish}) ]` | cancelled checkpoint → aborted finish |
| suspended, cancelled control | 对账 | 不开始 fetch；尽力 `cancel_deferred` 目标最新源（§4.6），操作通过 aborted 终态事务结束 | terminal |

### 结构工作

```ts
type StructuralDecision = { taskId: string } & (
  | { status: "deciding" }
  | { status: "generating"; generation: SummaryGeneration }
);

type SummaryGeneration =
  | { status: "ready"; context: SummaryContext; nextAttempt: number }
  | { status: "effect_pending"; context: SummaryContext; attempt: number;
      request?: { index: 0 | 1; usageId: string } }
  | { status: "retry_wait"; context: SummaryContext; nextAttempt: number;
      notBefore: number; errorMessage: string };

interface CompactionState {
  kind: "compaction";
  control: Control;
  customInstructions?: string;
  structural: StructuralDecision;
}

type NavigationState =
  | { kind: "navigation"; control: Control; targetId: string | null; label?: string;
      summarize: false; phase: { kind: "ready_to_commit" } }
  | { kind: "navigation"; control: Control; targetId: string; label?: string;
      customInstructions?: string; summarize: true;
      phase: { kind: "summary"; structural: StructuralDecision } };
```

结构准备从保留的源叶子和设置快照构建，规范化（`Set<string>` 文件操作字段变为排序数组），并在决策钩子之前与 `deciding` 状态在同一个事务中写入一次到 `op.preparation/{operationId}:{taskId}` 寄存器（§3.9）。状态只携带 `taskId`；确定性键定位寄存器，钩子/生成器将数组水合回源准备类型。重新打开从不从当前设置重建它，所以 provider 看到钩子批准的相同摘要输入。

一次结构尝试可能使用现有压缩实现发出一个或两个 provider 请求。其请求回调先提交 `request:{index,usageId}`，然后通过嵌套的 Effects 动作执行该 provider 请求，然后原子写入用量并清除/推进请求字段。中间内容保持进程本地；任何恢复的 `effect_pending` 尝试被视为完全不确定，在捕获的策略下开始更晚的尝试，而不是继续请求二。持久的 `generating` 决策阻止其决策钩子重新运行。

## 3.3 Lane 状态与当前状态有效性

```ts
interface LaneState {
  currentOperationId: string | null;
  /** 保留的条目 id；载荷在 pending.entry 寄存器中 (§2.2)。 */
  pendingNextRun: string[];
}
```

恢复只验证当前 Lane 和操作寄存器以及它们直接命名的条目/寄存器；没有历史可审计，也不存在历史。必需检查：

- `lane.state/{lane}` 保存一个 `LaneState`；当它命名操作 O 时，`op.meta/O` 保存该 Lane 的一个 `Operation`，`op.state/O` 保存与 O 的意图种类兼容的 `OperationState`；
- 当前状态或 `op.meta` 命名的每个条目 id — 触发、最新助手、批次助手、延迟源、已完成结果、prompt 条目、非空 `sourceLeafId`、导航意图的非空 `targetId`、Lane 叶子 — 解析为预期类型的现有条目；
- 保留的响应/结果/用量 id（如果已物化）包含预期的种类和身份；未物化的保留 id 解析为空，这是预期的结算前条件，从不是错误；
- `inbox.*`、`control.drained*` 和 `pendingNextRun` 中的每个 id 有一个带有效载荷的 `pending.entry` 寄存器；每个 effect-pending 调用有其 `op.tool_args` 寄存器；每个结构决策有其 `op.preparation` 寄存器；
- 工具源索引完整、有序、唯一、在范围内，并使用唯一的结果 id；已完成的结果条目匹配其源调用；
- 取消、导航源/目标和结构源组合满足状态判别。

运行时 schema 在发布前验证每个解码的寄存器值。`lane.lastResult` 在其公共读取路径上验证 — outcome/error/`runCompletion` 组合对操作种类必须合法，已完成的 run 只在 `runCompletion: "terminated_tools"` 时省略其最终助手 — 但它从不是恢复输入（§3.13）。这些有界检查拒绝 TypeScript 转换函数不可能产生的损坏/导入状态。

## 3.4 原子转换规则

> 在内存中计算下一个完整状态，然后原子提交使该状态为真的每个条目插入、用量插入和寄存器写入。

写入完整 `LaneState` 的事务在 Lane 变更线内重读最新寄存器值，只更改该转换拥有的字段。特别是，终态事务清除 `currentOperationId` 同时保留并发接受的 `pendingNextRun`。条件转换通过寄存器 `seq` 识别它们扩展的状态 — `op.state` seq、`lane.state` seq，以及转换快照配置时预期的 `lane.config` seq（§4.1）— 从不通过值 id；CAS token 变了，线性化没有。下面的每条边恰好是一个 `commit()`。

## 3.5 状态图

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> checkpoint : prompt() 接受

    checkpoint --> assistant : continuation = need_assistant
    checkpoint --> compaction : 上下文阈值
    checkpoint --> checkpoint : 应用写入 / 消费 steer / 消费 follow-up
    checkpoint --> terminal : may_finish + 收件箱为空

    assistant --> assistant : 可重试错误 (retry_wait)
    assistant --> tools : toolUse
    assistant --> compaction : 溢出（第一次）
    assistant --> deferred : stopReason deferred
    assistant --> checkpoint : stop / 真正的 length
    assistant --> failure_drain : 终端错误 / 重试耗尽 / 第 2 次溢出

    tools --> tools : 每调用意图 + 结算
    tools --> checkpoint : 批次完成

    compaction --> checkpoint : resumeAfter 恢复
    compaction --> failure_drain : 溢出被拒绝；阈值/溢出生成失败

    deferred --> deferred : 轮询返回 pending
    deferred --> tools : ready 响应有调用
    deferred --> checkpoint : ready 响应无调用
    deferred --> failure_drain : provider 错误

    failure_drain --> checkpoint : 应用了新的用户上下文输入
    failure_drain --> terminal : 收件箱排空（失败）

    checkpoint --> terminal : 中止对账（aborted）
    compaction --> terminal : 结构提交前中止（aborted）
    failure_drain --> terminal : 写入排空后中止对账（aborted）
    terminal --> [*]
```

`terminal` 不是一个状态。它是终态事务（§3.13）：提交后，操作完全没有 `op.state` 寄存器。

独立操作：

```
compaction:  deciding ──钩子拒绝────────────→ 终态 TX（declined）
                      ──钩子提供结果────────→ 终态 TX（completed）
                      ──钩子选择生成───────→ generating ──→ 终态 TX（completed|failed）

navigation:  ready_to_commit ────────────────→ 终态 TX（completed）
             summary.deciding ──钩子拒绝────→ 终态 TX（declined；不移动）
                              ──→ generating ──→ 终态 TX（completed|failed）
```

被拒绝的带摘要导航不移动任何东西：叶子保持在源，终态事务记录结果 `declined`。在任何结构提交之前中止以 `aborted` 结束，同样不移动（§4.6）。

## 3.6 接受

| 从 | 触发 | 事务 |
|---|---|---|
| 空闲 Lane | `before_run` 之后的 `prompt()` | `TX[ 按顺序插入捕获的 nextRun 项的条目（载荷来自其 pending.entry 寄存器）和新消息（调用者 prompt、钩子注入），删除捕获的 pending.entry 寄存器，upsert lane.leaf = 最新条目，upsert op.meta/O，S(run{捕获的设置, checkpoint need_assistant(false), trigger = 最新条目, skipInboxOnce, 空 inbox})，L({currentOperationId: O, 捕获的 id 从 pendingNextRun 移除}) ]` |
| 保留的空闲 Lane | 带非空准备的 `compact()` | `TX[ upsert op.preparation/O:{taskId} = P, upsert op.meta/O, S(compaction{deciding, taskId}), L({currentOperationId: O}) ]` |
| 空闲 Lane | 验证后无摘要的 `navigateTree()` | `TX[ upsert op.meta/O, S(navigation{ready_to_commit}), L ]` |
| 保留的空闲 Lane | 带准备的带摘要 `navigateTree()` | `TX[ upsert op.preparation/O:{taskId} = P, upsert op.meta/O, S(navigation{summary.deciding, taskId}), L ]` |

捕获的 `nextRun` 项已有其载荷在 `pending.entry` 寄存器中；接受从那些载荷插入它们的条目，删除寄存器，并从 `pendingNextRun` 中移除 id — 唯一刻意双重写入的放置一半（§1.8）。晚捕获的项保持其入队生成的 id（§1.2）。

手动压缩首先分配其操作 id 并获取进程本地 Lane 准入保留，然后读取准备。带摘要的导航在收集/构建分支准备时使用相同的保留；无摘要的导航不需要，因为验证和接受共享一个 Lane 线作业。保留期间，竞争操作收到命名该临时 id/种类的 `LaneBusy`，空闲树写入等待；`nextRun` 和配置更改仍然可以提交，因为它们不移动叶子。空压缩准备释放保留并返回 `NothingToCompact`，无操作写入。非空准备只对未更改的保留源叶子接受。进程死亡丢弃保留并使 Lane 空闲。

接受前拒绝**不写任何东西**：`LaneBusy`、`NothingToCompact`、`InvalidNavigation`（目标是当前叶子、根目标上的标签、从根摘要、或带摘要的空目标）、`UnknownTarget`（非空目标缺失）、`MissingIdentities`（模型、provider 或活跃工具名无法解析），以及当接受将追加零条目时的 `InvalidMessage` — 没有钩子注入和捕获 `nextRun` 项的空规范化 prompt 没有最新条目来锚定检查点的触发。Prompt 在 `before_run` 之前分配其操作 id，使钩子幂等键稳定。钩子仍在接受之前运行；如果并发调用者赢得 Lane，其输出和临时 id 被丢弃，操作不存在。

**接受必须观察到 `currentOperationId === null`。** 因为接受在 Lane 变更线上，这是验证，不是比较并交换。

## 3.7 助手生成

| 从 | 触发 | 事务 | 到 |
|---|---|---|---|
| checkpoint `need_assistant` | drive | 条件性地将当前 Lane 配置、流选项和规范化重试策略内联快照到上下文中，在 `TX[ S(assistant{ready, nextAttempt:1}) ]` | ready |
| assistant `ready` | `before_request` 聚合完成 | 生成 R 和 U，然后 `TX[ S(assistant{effect_pending, attempt=nextAttempt, responseEntryId R, usageId U, intendedOutputLimit, contextWindow}) ]` | effect_pending |
| effect_pending | 以工具调用结算 | `TX[ insert response entry R, upsert lane.leaf = R, insert usage U, S(latestAssistantEntryId=R, tools{plan with reserved result ids}) ]` | tools |
| effect_pending | 可重试错误，尝试次数未用完 | `TX[ insert response entry R, upsert lane.leaf = R, insert usage U, S(latestAssistantEntryId=R, assistant{retry_wait, nextAttempt k+1, notBefore}) ]` | retry_wait |
| effect_pending | 第一次溢出，准备非空 | `TX[ insert response entry R **规范化为 error**, upsert lane.leaf = R, insert usage U, upsert op.preparation/O:{taskId} = P, S(latestAssistantEntryId=R, compaction{reason:overflow, structural:{deciding, taskId}, resumeAfter:{checkpoint, prior trigger, need_assistant(true)}}) ]` | compaction |
| effect_pending | 第一次溢出，准备为空 | `TX[ insert normalized response entry R, upsert lane.leaf = R, insert usage U, S(latestAssistantEntryId=R, failure_drain{error, provenance:response R}) ]` | failure_drain |
| effect_pending | `stopReason: "deferred"` | `TX[ insert response entry R, upsert lane.leaf = R, insert usage U, S(latestAssistantEntryId=R, deferred{suspended, sourceEntryId R, poll 0, configuration/options copied}) ]` | deferred |
| effect_pending | `stop` 或真正的 `length` | `TX[ insert response entry R, upsert lane.leaf = R, insert usage U, S(latestAssistantEntryId=R, checkpoint{may_finish, includeFinalAssistant:true}) ]` | checkpoint |
| effect_pending | 终端错误、重试耗尽或第 2 次溢出 | `TX[ insert response entry R, upsert lane.leaf = R, insert usage U, S(latestAssistantEntryId=R, failure_drain{error, provenance:response R}) ]` | failure_drain |
| retry_wait | `notBefore` 已过 | `TX[ S(assistant{ready, nextAttempt:k+1}) ]` | ready |

**永远不存在"没有用量的响应"或"没有决策的响应和用量"。** 三者一起落地或都不落地。`R` 和 `U` 在意图时生成，在结算插入完整行之前只作为状态中的字符串存在（§2.2）。计划工具的结算将每个 `resultEntryId` 生成为 `R` 的 follower，继承其 48 位时间戳（§1.2），所以助手及其结果在构造上形成一个 id 连贯的组。

### 分类顺序

纯函数，在结算事务之前在内存中计算。首次匹配获胜。

| 条件 | 结果 |
|---|---|
| `control.status === "cancel_requested"` | 将停止原因规范化为 `aborted`；在 cancelled 控制下提交 `checkpoint{may_finish, includeFinalAssistant:true}`，然后对账写入/完成 |
| 溢出：适配器报告的，或消息匹配上下文限制模式的 `error`，或输出低于 `intendedOutputLimit` 的 `length` | **将停止原因规范化为 `error`**；压缩（第一次）或 `failure_drain`（第二次） |
| 带有效句柄的 `deferred` | deferred suspended |
| 可重试 `error`，尝试未用完 / 否则 | retry_wait / failure_drain |
| `toolUse`，或带调用的已接受响应 | tools |
| `stop` 或真正的输出限制 `length` | checkpoint `may_finish` |

两种规范化发生在提交时，都是刻意的。已取消的响应以 `aborted` 提交。溢出分类的响应以 `error` 提交。两种情况下原始停止原因被覆盖，原因以人类可读形式保存在 `errorMessage` 中。

因为已提交的响应是 `error`，§2.5 规则 3 自动将它从上下文中丢弃 — 压缩和操作状态不携带对它的引用，也不存在专门的省略规则。响应作为持久历史留在树中，因为 provider 请求发生了并被计费。

**溢出检测是启发式的，必须标记为启发式。** 三个来源，可靠性递减：

1. **适配器报告。** 能在结算时计算 `usage.input + usage.cacheRead > contextWindow` 的 provider 适配器设置 `stopReason: "error"`，消息匹配上下文限制模式。这不需要新的停止原因，也不需要更改任何适配器的停止原因映射，这很重要因为这些映射通常在未知值上抛出异常。这样做的适配器还应该要求输出可忽略不计，所以仅仅触发计数器的实质性答案不会被丢弃。
2. **错误消息匹配。** Provider 通常以 HTTP 错误返回上下文限制失败，以带消息的 `error` 到达。匹配它是字符串匹配，无论放在哪里都很脆弱。
3. **低于 `intendedOutputLimit` 的 `length`。** 输出限制是调用者意图的 `maxTokens`，或模型的最大值 — 在任何上下文截断*之前*。实际发送的值永远不能作为参考：某些 provider 完全拒绝显式输出上限，而 Pi 将其他限制截断到剩余上下文。这覆盖了上下文截断的请求返回 16 个推理 token 而意图是 128k（恢复）、小米/Qwen 风格的零输出 `length`（恢复）以及完全用尽的显式 1,024 上限（真正停止）— 没有上下文百分比启发式。

可恢复的响应被**丢弃**：像可重试错误一样，它从不成为条目，所以重试时不需要从上下文中清除任何东西，无论是活跃还是崩溃后。其保留的结果 id 保持未满足；其成本已经在请求结算时写入的 `usage` 行中持久化。

**每次会话输入一次溢出恢复。** 只有当没有溢出原因的压缩比此运行的最新已消耗会话消息更新时，溢出压缩才可能开始。该窗口内的第二次可恢复响应追加放弃错误条目并通过排空路径失败运行 — `length` 响应从不重置守卫；只有已消耗的会话输入会重置。这将压缩并重试循环限制在每次用户操作一次尝试。`before_compaction` 拒绝或空压缩准备对原因 `overflow` 同样是终端的：没有压缩请求就无法容纳。钩子提供的溢出压缩在条目之前写入其压缩尝试，所以守卫计算它 — 这是写入尝试记录的唯一钩子提供的摘要。

## 3.8 工具

| 从 | 触发 | 事务 | 到 |
|---|---|---|---|
| 调用 *i* `planned` | 放行通过（`before_tool`、查找、参数验证） | `TX[ upsert op.tool_args/O:{stepId}:{i} = 有效参数, S(call i = effect_pending, replay) ]` | dispatch |
| 调用 *i* `effect_pending` | 副作用已结算，`after_tool` 已应用 | `TX[ insert result entry, upsert lane.leaf, insert tool usage row (如果报告了), S(call i = completed, terminate) ]` | tools 或 checkpoint |
| 调用 *i* `planned` | 未知工具 / 无效参数 / `before_tool` 阻止或抛出 / 控制已取消 | `TX[ insert synthetic error result entry, upsert lane.leaf, S(call i = completed, terminate 来自有意阻止，否则 false) ]` | tools |
| 所有调用完成 | — | 折叠进最后一个结算，它还删除批次的 `op.tool_args/{O}:{stepId}:*` 寄存器 | checkpoint |

批次的完成转换是：

- **每个**已完成的调用设置 `terminate: true` → `checkpoint{may_finish, includeFinalAssistant: false}`
- 否则 → `checkpoint{need_assistant(overflowRecoveryUsed: false)}`

`terminate` 的存在使工具可以在没有另一个 provider 回合的情况下结束运行。动机案例是替代结构化输出的"提交最终结果"工具：模型调用它，Harness 提交结果，运行以那些工具结果作为最终条目完成 — `run_end` 然后不携带 `finalMessage`。没有这个，每个这样的运行都要为另一个模型回合付费，其唯一工作就是停止。

模式：

- **Sequential**（选项，或任何被调用工具声明 `executionMode: "sequential"`）：放行 → 意图 → 执行 → 终结 → 提交，一次一个调用。
- **Parallel**（默认）：放行和意图提交按源顺序发生；分发不等待较早的调用；副作用并发结算；阶段 3、结果消息生命周期和结果提交按源顺序等待和终结。

被阻止和无效的调用跳过意图提交和副作用，但仍在其源位置提交结果。它们的 `op.tool_args` 寄存器从不写入。

调用内部通过 `sourceIndex` 跟踪。钩子、事件和工具上下文看到 provider 的 `toolCallId` 和工具名称 — 从不看到索引。

## 3.9 摘要生成 — 压缩与导航摘要

两种操作通过相同的 `deciding → generating → result` 机制生成摘要，这就是它们一起规范的原因。各轴：

| | compaction | navigation |
|---|---|---|
| **独立操作** | `lane.compact()` — 原因 `manual` | `lane.navigateTree(target)` |
| **运行内的阶段** | 原因 `threshold`、`overflow` | — |
| **准备** | 压缩准备：要摘要的消息、保留尾部、拆分回合标志、token 统计、文件操作 | 分支准备：要摘要的分支消息、token 统计、文件操作 |
| **决策钩子** | `before_compaction` | `before_navigation` |
| **结果条目** | `compaction`（parent = 源叶子） | `branch_summary`（parent = 目标；fromId = 源叶子） |

| 从 | 触发 | 事务 | 到 |
|---|---|---|---|
| `deciding` | 钩子拒绝 | 独立：终态事务，结果 `declined` · 运行内：`TX[ S(failure_drain{provenance:structural taskId}) ]` | terminal / failure_drain |
| `deciding` | 钩子提供结果 | 独立：终态事务，结果 `completed` · 运行内：结果发布写入加 `S(resumeAfter)` | terminal / checkpoint |
| `deciding` | 钩子选择生成 | 条件性内联快照当前配置/策略在 `TX[ S(generating{ready}) ]` — **决策钩子将永远不会再次运行** | generating ready |
| generating ready / 重试已过 | drive | `TX[ S(effect_pending, attempt k) ]` | effect_pending |
| generating effect_pending | 一个嵌套请求返回 | `TX[ insert usage row under request.usageId, S(effect_pending, request cleared, usageIds += id) ]`；在请求二之前提交另一个请求意图 | effect_pending |
| generating effect_pending | 可重试尝试结果 | 用量已持久；`TX[ S(retry_wait) ]` | retry_wait |
| generating effect_pending | 终端或尝试耗尽 | 独立：结果 `failed` 的终态事务（§3.13） · 运行内：`TX[ S(failure_drain{provenance:structural taskId}) ]` | terminal / failure_drain |
| generating effect_pending | 压缩成功 | 独立：`TX[ insert result entry, upsert lane.leaf, terminal writes (§3.13) ]` · 运行内：结果发布写入加 `S(resumeAfter)` | terminal / checkpoint |

结构 provider 流是内部的：它们**不**发出公共助手消息生命周期。现有摘要生成器保留，但其一/两请求回调使用 §3.2 和 §4.2 的嵌套请求意图/副作用/用量边界。中间内容不持久化；最终事务之前的崩溃使整个尝试未知，更晚编号的尝试只在捕获的重试策略下开始。失败尝试的用量无论如何留在台账中 — 终态清理删除寄存器，从不删除台账行（§1.6）。

### 实例演练 — 溢出

`e_40` 是一个等待助手回合的工具结果。请求不适合。

```
… e_38 ── e_39 ── e_40                     phase: assistant, effect_pending
                                           continuation 是 need_assistant(false)
```

**1. 结算。** 分类说是溢出。准备针对将来的分支构建；因为已知响应规范化为 `error`，普通投影排除它。响应和准备然后一起提交：

```
TX[ insert e_41 = { …助手响应, stopReason: "error",
                    errorMessage: "context window exceeded: …" },
    upsert lane.leaf/main = "e_41", insert usage u_41,
    upsert op.preparation/op_9:t_1 = <结构准备>,
    S(compaction{ reason: overflow,
                  structural: { deciding, taskId: "t_1" },
                  resumeAfter: { checkpoint, triggerEntryId: "e_40",
                                 continuation: need_assistant(true) } }) ]

… e_38 ── e_39 ── e_40 ── e_41
```

**2. 压缩。** 持久准备由 §2.5 的普通规则构建。`e_41` 是 `error` 响应，所以规则 3 丢弃它 — 从摘要输入和 `retainedTail` 中都一样，没有特殊情况：

```
… e_40 ── e_41 ── e_42 (压缩)
                  retainedTail: [e_39, e_40]        ← e_41 按规则 3 缺失
```

尾部结束在 `e_40`，一个工具结果，这是即将请求助手回合的请求的正确形状。

**3. 恢复。** `resumeAfter` 恢复 `need_assistant(overflowRecoveryUsed: true)`。上下文现在是摘要 + 尾部 + `e_42` 之后的任何内容，很小：

```
… e_41 ── e_42 ── e_43        对 e_40 的回答
   ✗ (error, out of context)
```

`e_41` 作为持久历史永远留在树中 — 一个请求发生了并被计费。如果重试*再次*溢出，`overflowRecoveryUsed` 已经是 `true`，运行进入 `failure_drain` 而不是循环压缩。消耗新的用户输入追加到树并将标志重置为 `false`。

## 3.10 导航

无摘要和带摘要都在**一个**事务中完成 — 导航的终态事务（§3.13）内联其结果发布写入：

```
TX[ insert 钩子报告的用量行（仅钩子提供的摘要）,
    upsert lane.leaf = 目标,
    insert 摘要条目带其显示用量快照（当 summarize 时；
      parent 是目标；fromId = 操作的 sourceLeafId —
      导航前源叶子）,
    upsert lane.leaf = 摘要条目（当 summarize 时）,
    upsert fact.label（当有标签时）,
    delete 操作的 op.* 寄存器,
    upsert lane.lastResult = { kind: "navigation", outcome: "completed", leafId },
    L({ currentOperationId: null }) ]
```

写入在事务内按顺序应用。生成的 provider 用量已在 §3.9 中按请求写入，这里不再写入；摘要载荷只快照其产生尝试的用量。摘要条目显式命名目标为父节点，后续寄存器写入使该摘要成为已完成的 Lane 叶子。崩溃看到的是仍在源处的未触及导航，或完全完成的导航。**不存在准备好的摘要状态和移动后恢复状态。** 此事务之前的中止以无条目追加的 aborted 终态事务结束；之后的中止意味着操作已完成。

## 3.11 收件箱、队列、延迟写入

每个排队的准入生成该项的条目 id（§1.2）并将其载荷一次写入 `pending.entry/{id}`；队列列表只携带 id。

| 公共输入 | 何时准入 | 事务 |
|---|---|---|
| `nextRun(msg)` | 任何状态，包括空闲 | `TX[ upsert pending.entry/{id} = payload, L(pendingNextRun += id) ]` — 从不开始运行 |
| `steer(msg)` | 打开的运行且控制为 running — 包括延迟挂起；在 `cancel_requested` 下 → `NoActiveRun` | `TX[ upsert pending.entry/{id} = payload, S(inbox.steer += id) ]` |
| `followUp(msg)` | 打开的运行且控制为 running — 包括延迟挂起；在 `cancel_requested` 下 → `NoActiveRun` | `TX[ upsert pending.entry/{id} = payload, S(inbox.followUp += id) ]` |
| 树写入，运行活跃 | 包括挂起和取消中 | `TX[ upsert pending.entry/{id} = payload, S(inbox.writes += id) ]` — 在中止中存活 |
| 树写入，Lane 空闲 | 空闲 | `TX[ insert entry, upsert lane.leaf ]` |
| 树写入，结构操作打开 | — | 等待操作结束，然后重新评估 |
| `cancelQueued(id)` | 项仍待处理 | `TX[ S 或 L 移除该 id, delete pending.entry/{id} ]` |
| 检查点消耗输入 | 符合条件 | `TX[ 从寄存器载荷插入条目, 删除其 pending.entry 寄存器, upsert lane.leaf, S(ids 移除, continuation → need_assistant(false), triggerEntryId = 最新条目, skipInboxOnce = true) ]` |
| 第一次 `abort()` | 运行活跃 | `TX[ S(control = cancel_requested, requestedAt, drainedSteer, drainedFollowUp, steer/followUp 清空) ]` — 已排空的 pending.entry 寄存器**不**删除 |
| 完成 | 收件箱为空，无必需 continuation | 终态事务（§3.13） |

`cancelQueued` 分类，按顺序：id 仍在队列列表中待处理 → 移除它并在一个事务中删除其 `pending.entry` 寄存器；内容消失，从未触及树，调用返回 `cancelled`。该 id 下存在条目 → `already_consumed`。都不是 → `not_found` — 之前已取消、被中止清除、或从未存在。重试丢失取消的客户端将 `not_found` 视为成功。没有处置寄存器，这里没有任何东西是恢复输入。

第一次 `abort()` 将 steer/follow-up id 移入 `control.drainedSteer`/`control.drainedFollowUp` 但不删除它们的任何 `pending.entry` 寄存器：`AbortResult` 和崩溃后的 `SuspendedOperation.aborting` 从那些寄存器解引用已排空的载荷。它们在终态事务中死亡（§3.13），从不更早。延迟写入留在 `inbox.writes` 中并在对账期间应用。

因为接受、取消、消耗、中止和完成都在 Lane 变更线上序列化，每个竞争恰好有两种可能的历史，并且**没有任何项在持久状态中既是待处理又是已应用**：在每个提交边界，排队的 id 有其寄存器（待处理或已排空）、其条目（已消耗）或两者都没有（已取消）— 从不两者都有。

## 3.12 检查点过程

顺序很重要。在每个队列排空点，`"all"` 按接受顺序消耗每个当前符合条件的项；`"one-at-a-time"` 只消耗最旧的并保留其余。任何投影性排空设置持久的 `skipInboxOnce`；在那次下一遍中，规划器跳过步骤 1–2，开始生成，并在就绪状态转换中清除该标志。因此崩溃不能把一次一个变成全部排空。

1. 除非 `skipInboxOnce`，原子应用已接受的延迟写入。
2. 除非 `skipInboxOnce`，按 steering 模式原子消耗符合条件的 steering。
3. 只在 `thresholdCheckedTriggerEntryId !== triggerEntryId` 时运行阈值压缩，将标记的检查点保留在 `resumeAfter` 中。
4. 如果 continuation 是 `need_assistant`，开始生成并清除 `skipInboxOnce`。
5. 一旦助手和工具 continuation 耗尽，原子消耗符合条件的 follow-up。
6. 如果 continuation 是 `may_finish` 且收件箱为空，调用 `before_run_end`。
7. 条件性完成 — 终态事务（§3.13）。

已消耗的 steer/follow-up 和投影性消息写入进入 `need_assistant(false)`，设置 `triggerEntryId` 为最新追加的条目，并设置 `skipInboxOnce`。工具结果做同样的事，除非每个结果都终止。未投影的自定义写入被追加并从收件箱移除，但保留先前的 continuation、失败来源和溢出标志。在 cancelled 控制下，每个延迟写入被追加并移除，不更改阶段/continuation 或开始工作；对账在写入排空后以 aborted 终态事务结束。

`before_run_end` 可能返回一个 follow-up。它**只在**控制仍在运行且操作仍在同一完成边界时提交；否则过期的钩子结果被丢弃。Follow-up 出生即放置 — 其条目和 `need_assistant` 状态一起提交，没有待处理寄存器。

`failure_drain` 应用已接受的延迟写入并消耗符合条件的会话输入；如果没有任何消耗开始新工作，它进入终端失败。如果消耗的输入开始新工作，它进入 `checkpoint{need_assistant}`，失败成为树中的持久历史但不再驱动编排。

## 3.13 终态事务

终态事务删除操作拥有的每个寄存器，将结果记录在 `lane.lastResult` 中，并清除 Lane 的 `currentOperationId`。提交后，操作唯一的持久足迹是它产生的会话条目和台账行。

结果在内存中、提交前、从最终操作状态计算 — 与调用者的 promise 解析相同的值。持久化的是其寄存器形式：

```ts
type LaneLastResult = {
  operationId: string;
  kind: "run" | "compaction" | "navigation";
  leafId: string | null;
  /** 最新已结算助手（当结果包含时，仅 runs）。 */
  finalAssistantEntryId?: string;
} & (
  | { outcome: "failed"; error: OperationError; runCompletion?: never }
  | { outcome: "completed"; error?: never;
      runCompletion?: "assistant" | "terminated_tools" }
  | { outcome: "declined" | "aborted"; error?: never; runCompletion?: never }
);
```

正常运行的完成复制 `RunState.latestAssistantEntryId` 并在 `may_finish.includeFinalAssistant` 为 true 时记录 `runCompletion: "assistant"`。全部终止的工具批次记录 `runCompletion: "terminated_tools"` 并省略最终助手。失败和中止的运行结果在非空时包含最新已结算助手，否则省略该字段。结构操作省略 `runCompletion` 和最终助手。只有终端转换构造 `LaneLastResult`。

每个终态事务，对每个操作种类和结果，有一个形状：

```
TX[ <结果发布写入，当终端转换也发布内容时：
     §3.9 的独立摘要条目和叶子移动，§3.10 的导航写入>,
    delete op.meta/{O},
    delete op.state/{O},
    delete op.tool_args/{O}:*        防御性前缀扫描 — 用 keyPrefix 的
                                     listRegisters (§1.5)；批次完成已经
                                     原子删除这些 (§3.8)，
    delete op.preparation/{O}:*      前缀扫描；运行内压缩在恢复后
                                     留下其准备，
    delete pending.entry/{id}        每个操作拥有的待处理 id，
    upsert lane.lastResult/{lane} = <计算的结果>,
    L({ currentOperationId: null }) ]
```

操作拥有的待处理 id 是剩余的 `inbox.steer ∪ inbox.followUp ∪ inbox.writes` 加 `control.drainedSteer ∪ control.drainedFollowUp` — 在中止排空中存活的寄存器在这里死亡（§3.11）。**从不 `lane.state.pendingNextRun`**：那些寄存器是 Lane 拥有的，比操作存活更久，只在消费或取消时死亡。台账行从不删除（§1.6）。`L` 写入在 Lane 变更线上重读最新 `LaneState` 并只清除 `currentOperationId`，保留并发接受的 `pendingNextRun`（§3.4）。

对于 §0.4 形状的已完成运行 — prompt `e_50`，工具调用 `e_51`/`e_52`，最终答案 `e_53`：

```
TX[ delete op.meta/op_9,
    delete op.state/op_9,
    delete op.tool_args/op_9:s_1:0,   ← 通常在批次完成时已消失
    upsert lane.lastResult/main = { operationId: "op_9", kind: "run",
                                    outcome: "completed", leafId: "e_53",
                                    finalAssistantEntryId: "e_53",
                                    runCompletion: "assistant" },
    upsert lane.state/main = { currentOperationId: null, pendingNextRun: [] } ]
```

之后，会话精确保存会话条目、台账行和 Lane 的寄存器（`lane.leaf`、`lane.config`、`lane.state`、`lane.lastResult`）。运行的约 10 个 `op.state` 修订、其工具参数寄存器和任何待处理载荷只作为寄存器覆盖存在，然后消失 — 没有需要收集的东西（§1.8）。

**观察契约。** 终端结果通过活跃调用者的 promise（和对应的 `run_end`/`compaction_end`/`navigation_end` 事件）观察一次，它携带完整的内存结果；之后通过 `lane.lastResult` 观察，直到同一 Lane 上的下一个终态事务覆盖它。`lane.lastResult` 只由终态事务写入 — 每个 Lane 一个有界寄存器，永远。恢复从不读取它：恢复将 `currentOperationId: null` 的 Lane 视为空闲，不管寄存器的内容。它的存在是为了让接受了一个操作、丢失了进程并重新打开的应用仍然可以回答"`op_9` 发生了什么？" — 包括树单独无法重建的结果：结构失败的错误、`declined`，以及叶子移动的 `aborted` 与 `completed` 歧义。

本节携带的不变量（Part 9 中重述）：`op.*` 寄存器和操作拥有的 `pending.entry` 寄存器存在**当且仅当**其操作打开，因为终态事务在清除 `currentOperationId` 的同时原子删除它们。不存在需要观察或修复的部分清理状态。

---

# Part 4 — 执行、恢复、中止、关闭

## 4.1 解释器

运行时从完整持久状态加一个小型进程本地调度器进行规划。状态命名的条目和稳定寄存器值在规划前批量加载。驱动还将当前设置修订快照到 `RuntimeSnapshot` 中；这不执行 provider 请求。Provider 和工具在**分发时**从其注册表中按状态捕获的持久身份解析 — 缺失或被替换的条目带内失败该分发（合成错误结算），与未知工具完全一样。当工具批次首次变为当前时，驱动解析一次 `toolContext` 并将其保留在 `DriveState.toolBatches` 中供该批次中的每个顺序/并行调用使用。`nextAction` 然后在这些输入上是纯函数。

```ts
interface CurrentOperation {
  operation: Operation;
  state: OperationState;
  /** 加载时的寄存器 seq；条件提交比较这些 (§3.4)。 */
  operationStateSeq: number;
  laneState: LaneState;
  laneStateSeq: number;
  leafId: string | null;
  configuration: LaneConfiguration;
  configurationSeq: number;
}

type EffectKey = string; // 从持久步骤/尝试或 assistant/sourceIndex 确定性派生

interface LiveEffect { plan: EffectPlan; promise: Promise<EffectOutput> }

interface DriveState {
  deferredPollsRemaining: 0 | 1;
  running: Map<EffectKey, LiveEffect>;
  /** 每个活跃或恢复批次的一个上下文/工具定义快照。 */
  /** toolContext 每批次解析一次；键：assistantEntryId。 */
  toolBatches: Map<string, unknown>;
  /** 进程本地尽力尝试；重新打开可能再次尝试。 */
  deferredCancellations: Set<string>;
}

type EffectPlan = { telemetryContext: TelemetryContext } & (
  | { kind: "assistant"; key: EffectKey;
      generation: Extract<Generation, { status: "effect_pending" }>;
      streamOptions: AgentHarnessStreamOptions }
  | { kind: "summary"; key: EffectKey;
      generation: Extract<SummaryGeneration, { status: "effect_pending" }> }
  | { kind: "tool"; key: EffectKey; assistantEntryId: string;
      sourceIndex: number;
      /** 完整 op.tool_args 寄存器键：{opId}:{stepId}:{sourceIndex} (§3.8)。 */
      argsKey: string }
  | { kind: "deferred"; key: EffectKey;
      deferred: Extract<Deferred, { status: "effect_pending" }>;
      streamOptions: AgentHarnessStreamOptions }
  | { kind: "cancel_deferred"; key: EffectKey; sourceEntryId: string;
      handle: DeferredHandle }
  | { kind: "hook"; key: EffectKey; name: keyof HookMap; event: unknown }
);

type SummaryAttemptOutcome =
  | { kind: "success"; result: CompactResult | BranchSummaryResult }
  | { kind: "retry" | "failure"; error: OperationError };

type EffectOutput =
  | { kind: "not_started"; key: EffectKey }
  | { kind: "assistant" | "deferred"; key: EffectKey;
      message: SettledAssistantMessage }
  | { kind: "summary"; key: EffectKey; outcome: SummaryAttemptOutcome }
  | { kind: "tool_raw"; key: EffectKey;
      result: AgentToolResult<unknown>; isError: boolean }
  | { kind: "hook"; key: EffectKey; result: unknown }
  | { kind: "cancel_deferred"; key: EffectKey };

type SettlementOutput = Exclude<EffectOutput, { kind: "tool_raw" }> |
  { kind: "tool"; key: EffectKey; result: AgentToolResult<unknown>;
    isError: boolean; terminate: boolean };

interface SettlementResult {
  current: CurrentOperation;
  /** 成功的前置意图钩子准备的立即活跃分发。 */
  dispatch?: EffectPlan;
  /** 持久状态仍可安全分发时身份解析失败。 */
  suspend?: OperationResult;
  /** 轮询意图已提交；消耗此恢复调用的唯一许可。 */
  consumeDeferredPoll?: true;
}

interface RuntimeSnapshot {
  settingsRevision: number;
  streamOptions: AgentHarnessStreamOptions;
  retryPolicy: NormalizedRetryPolicy;
}

type PlannerInputs = {
  /** 精确的进程本地计划；从持久 id 重建活跃计划。 */
  running: ReadonlyMap<EffectKey, EffectPlan>;
  deferredPollsRemaining: 0 | 1;
  deferredCancellations: ReadonlySet<string>;
  /** 条目加上已加载的 op.tool_args/op.preparation/pending.entry 寄存器
      值 — 每键写入一次或消费前稳定，所以作为不可变规划器输入是安全的。
      以条目 id 或寄存器键为键。 */
  loaded: ReadonlyMap<string, Entry | Register>;
  runtime: RuntimeSnapshot;
  context?: AgentMessage[];
  now: number;
};

type OperationResult = RunOutcome | CompactionOutcome | NavigationOutcome;

type Action =
  | { kind: "transition"; next: OperationState; telemetryContext: TelemetryContext;
      /** 此转换快照当前可变请求状态时必需。 */
      expectedConfigurationSeq?: number;
      expectedSettingsRevision?: number }
  | { kind: "dispatch"; intent?: OperationState; effect: EffectPlan;
      consumeDeferredPoll?: true }
  | { kind: "await_effect"; key: EffectKey }
  | { kind: "wait"; until: number; telemetryContext: TelemetryContext }
  | { kind: "suspend"; result: OperationResult }
  | { kind: "finish"; result: OperationResult };
```

解释器主循环（简化）：

```ts
while (true) {
  const action = nextAction(plannerInputs());
  switch (action.kind) {
    case "transition":
      current = await fx.commitTransition(current, action.next,
        action.telemetryContext, action.expectedConfigurationSeq,
        action.expectedSettingsRevision);
      if (!current) return; // 外部终结
      break;

    case "dispatch": {
      if (action.intent) {
        current = await fx.commitTransition(current, action.intent,
          action.telemetryContext, action.expectedConfigurationSeq,
          action.expectedSettingsRevision);
        if (!current) return;
      }
      const liveEffect = { plan: action.effect, promise: fx.run(action.effect) };
      live.running.set(action.effect.key, liveEffect);
      break;
    }

    case "await_effect": {
      const liveEffect = live.running.get(action.key)!;
      const { plan } = liveEffect;
      const output = await liveEffect.promise;
      live.running.delete(action.key);
      if (plan.kind === "cancel_deferred") {
        current = await reloadCurrent(current.operation.operationId); // 无持久写入
        break;
      }
      let settlement: SettlementOutput;
      if (output.kind === "tool_raw") {
        if (plan.kind !== "tool") throw new Error("tool output/plan mismatch");
        settlement = await fx.finalizeTool(plan, output); // 源顺序的 after_tool
      } else {
        settlement = output; // not_started 无钩子地合成结算
      }
      const settled = await commitEffectSettlement(
        current, plan, settlement, plan.telemetryContext);
      current = settled.current;
      if (settled.suspend) return settled.suspend;
      if (settled.consumeDeferredPoll) live.deferredPollsRemaining = 0;
      if (settled.dispatch)
        live.running.set(settled.dispatch.key,
          { plan: settled.dispatch, promise: fx.run(settled.dispatch) });
      break;
    }

    case "wait":
      await fx.sleep(
        Math.max(0, action.until - Date.now()), action.telemetryContext);
      current = await reloadCurrent(current.operation.operationId);
      break;

    case "finish":
      current = await fx.commitTerminal(current, action.result) ?? current;
      return action.result;

    case "suspend":
      return action.result;
  }
}
```

意图/普通转换要求 `op.state` 寄存器仍携带其预期的 `operationStateSeq`；否则返回 `undefined`，循环重新规划而不分发。如果条件提交或 `reloadCurrent` 发现操作的寄存器消失 — 它不再是 Lane 的当前操作 — 驱动通过外部终结停止（§4.9）。成功的 `before_request`/`before_tool` 钩子结算原子提交副作用意图（和有效 `op.tool_args` 寄存器）并返回完整的进程本地分发计划；驱动立即安装该 promise。剩余仅进程间隙中的崩溃保守地是普通未知副作用情况。创建 generation/summary `ready` 状态的转换还提供它读取的 `lane.config` 寄存器 seq 和 harness 设置修订；设置/Lane 提交要求两者仍然匹配，给出设置器优先或步骤开始优先排序。产生的上下文持久捕获内联配置、规范化重试策略和基准流选项。在普通外部执行之前，`fx.run` 再一次进入 Lane 变更线：取消优先返回 `not_started`，而开始优先注册活跃副作用/控制器使后来的中止可以信号它。分发按捕获的持久身份从注册表解析 provider 或工具；解析失败带内结算。因此没有副作用在意图之后的间隙中开始而不属于两个序列化顺序之一。结算重载最新的完整状态，验证同一副作用键仍待处理，将输出合并到该状态，并应用当前取消控制。因此 steer/write 接受、中止和其他并行工具意图不能擦除活跃结果或覆盖更新的收件箱/控制状态。

并行工具调用按源顺序将阶段二分发到 `DriveState.running`。规划器可以在较早的 promise 运行时分发后面的调用，但它只为第一个未完成的源位置发出 `await_effect`。该原始结果然后经过源顺序的 `fx.finalizeTool`/`after_tool` 再结算。后来结算的原始 promise 保持进程本地直到轮到它。重启后 `running` 为空，所以持久 `effect_pending` 遵循恢复策略而不是被误认为活跃副作用。

恢复规则：

- cancelled 控制下的 `not_started` 将助手/获取在保留 id 下结算为 `aborted`，用计划的 aborted 结果结算工具而不 `after_tool`，丢弃未提交的钩子决策，在完成 aborted 之前丢弃结构工作，丢弃过期的延迟取消动作而不结算；
- ready generation/summary 和已清除工具在 `dispatch` 之前提交 `effect_pending`；
- 恢复的没有活跃键的 generation/summary pending 在捕获的重试策略下推进或在上限处合成结算；
- 恢复的工具只在持久化和当前声明都是 `safe` 时重放，否则结算为 interrupted；
- 恢复的 deferred pending 正常挂起直到应用的 `resume()` 用一个新鲜轮询意图替换它；cancelled 控制改为在完成前将现有保留的响应/用量 id 合成结算为 `aborted`；
- 通过其 `before_request` 结算提交延迟意图返回 `consumeDeferredPoll:true`；驱动在安装分发之前清除调用的唯一许可，所以 pending 响应重新挂起而不是再次轮询。

## 4.2 副作用边界

每个操作过程提交、provider 请求、工具调用、钩子调用和计时器恰好经过一个注入的 `Effects`（`fx`）方法。过程接收 `fx`、其遥测上下文和只读运行时视图 — 从不直接接收 `Session`、`Models`、工具注册表或钩子运行器。非门控的 Lane 表面提交 — 接受、队列/配置调用、事实、Lane 创建和空闲写入 — 直接使用相同的 Lane 变更线和类型化 `Session` 事务 API。

```ts
type SummaryRequestOutput =
  | { kind: "response"; message: SettledAssistantMessage }
  | { kind: "not_started" };

interface Effects {
  commitTransition(current: CurrentOperation, next: OperationState,
                   telemetry: TelemetryContext,
                   expectedConfigurationSeq?: number,
                   expectedSettingsRevision?: number):
    Promise<CurrentOperation | undefined>;
  commitEffectSettlement(current: CurrentOperation, plan: EffectPlan,
                         output: SettlementOutput, telemetry: TelemetryContext):
    Promise<SettlementResult>;
  /** 终态事务 (§3.13)：寄存器删除、lane.lastResult、
      lane.state 清除 — 加结果携带的任何最终条目/标签写入
      (§3.10)。条件是 op.state 在其预期 seq 仍存在；
      undefined = 先被外部终结 (§4.9)。转换提交以相同方式
      从状态差异派生其条目/用量写入。 */
  commitTerminal(current: CurrentOperation, result: OperationResult):
    Promise<CurrentOperation | undefined>;
  /** 按源顺序为选定的原始阶段二结果运行 after_tool。 */
  finalizeTool(plan: Extract<EffectPlan, { kind: "tool" }>,
               output: Extract<EffectOutput, { kind: "tool_raw" }>):
    Promise<Extract<SettlementOutput, { kind: "tool" }>>;
  /** 复合摘要计划对每个 provider 请求可重入地使用它。 */
  runSummaryRequest(plan: { taskId: string; attempt: number; requestIndex: number;
                            usageId: string; configuration: LaneConfiguration;
                            messages: AgentMessage[];
                            telemetryContext: TelemetryContext }):
    Promise<SummaryRequestOutput>;
  settleSummaryRequest(current: CurrentOperation,
                       plan: { taskId: string; attempt: number; requestIndex: number;
                               usageId: string },
                       response: SettledAssistantMessage,
                       telemetry: TelemetryContext): Promise<CurrentOperation>;
  /** 执行前在 Lane 变更线上重新验证/注册副作用开始。 */
  run(plan: EffectPlan): Promise<EffectOutput>;
  sleep(delayMs: number, telemetry: TelemetryContext): Promise<void>;
}
```

§4.1 中展示的提交辅助方法委托给这些方法。预期的 provider、工具、结构和延迟取消失败返回带内 `EffectOutput` 变体；`run` 只对关闭、harness 故障或不变量缺陷拒绝。`cancel_deferred` 是普通开始/结算的显式例外：其开始检查要求相同的打开已取消操作和 `abort()` 注册的进程本地源目标（持久阶段可能已经推进），使用仅关闭信号而不是已拉取的操作信号，其等待的输出绕过 `commitEffectSettlement` 且无持久写入。自动副作用直接执行；手动副作用门控相同的调用。被动事件监听器传递是观察，不是解释器副作用：它在发布后被隔离并遥测包装，但从不被手动驱动停靠。`sleep` 在 harness 信号被拉取时提前解析，之后循环重载取消控制。对于拆分回合摘要工作，请求意图 `commitTransition`、`runSummaryRequest` 和用量/状态 `settleSummaryRequest` 是三个不同的嵌套门控动作。`runSummaryRequest` 执行与 `run` 相同的序列化开始检查；中止优先返回 `not_started`，不留下用量，并使外层摘要计划返回其自己的 `not_started` 结算，在 cancelled 控制下丢弃结构工作。外层摘要编排动作只是进程本地组合；手动驱动和崩溃测试仍在每个嵌套边界之间停止。这些方法是完整的过程崩溃点目录；非门控的公共变更是 Part 9 中的竞争边界。

**Provider 信号是 Harness 拥有的。** `fx` 提供传递给每个 provider 请求的 `AbortSignal`。没有调用者可以提供一个：`signal` 在每个公共表面的选项类型中缺失（§5.2），Harness 在分发之前从 `streamOptions` 补丁中剥离任何信号。只有 `abort()` 和 `close()` 可以拉取它。这就是使 §4.6 的保证成立的原因。

**手动驱动。** 使用 `drive: "manual"` 时，Harness 在每个副作用之前停靠并一次暴露一个 JSON 安全动作：

```ts
peekAction(): Promise<ActionInfo | undefined>;      // 稳定，无副作用
executeAction(): Promise<ActionInfo | undefined>;   // 精确释放一个
runToCompletion(): Promise<void>;
```

Lane 表面调用 — 包括操作接受、`steer`、`abort`、配置设置器和树写入 — 保持**非门控**，使测试可以驱动任何竞争的两种顺序。手动模式下，`before_run` 处理器在接受之前停靠；没有处理器时，接受立即提交，第一个停靠动作是运行的第一个过程转换。门是可重入的：嵌套 `fx` 调用（特别是流内的请求钩子）独立停靠，驱动在其父级继续之前释放它们。停靠动作时关闭会拒绝它未执行；持久状态恰好是已提交前缀。

由构造和测试强制：手动模式驱动的操作在停靠时执行零存储写入和零 provider 或工具调用。

## 4.3 Lane 变更线

Lane 上每个依赖状态的变更是线性化的：验证、至多一个原子提交，以及内存中更新在下一个变更开始之前完成。Provider、工具、钩子和重试工作从不占用该线。

在这里序列化的：操作接受、队列入队和取消、队列消耗、延迟写入接受和应用、中止、Lane 配置设置器、完成、Lane 创建。Harness 全局流/重试/压缩/队列设置使用第二条变更线，带单调递增的进程修订。操作接受和生成/摘要开始通过在 Lane 线之前获取设置线并条件性提交两个预期 token 来快照设置；全局设置器只获取设置线。没有代码以相反顺序获取它们。

后果：两个公共调用之间的每个竞争恰好有**两种**可能的持久历史，两者都必须测试（Part 9）。

## 4.4 恢复

恢复是对寄存器的点查找。没有历史、没有折叠、没有日志重放、没有树遍历。每个 Lane：

```ts
async function restore(lane: string): Promise<
  { kind: "idle"; lane: string } | { kind: "suspended"; current: CurrentOperation }
> {
  const config = await storage.getRegister("lane.config", lane);
  const state  = await storage.getRegister("lane.state", lane);
  const leaf   = await storage.getRegister("lane.leaf", lane);

  const opId = state.value.currentOperationId;
  const meta    = opId ? await storage.getRegister("op.meta", opId) : undefined;
  const opState = opId ? await storage.getRegister("op.state", opId) : undefined;

  // 空闲 Lane 也被验证：叶子存在性和每个 pendingNextRun
  // id 的 pending.entry 寄存器 (§3.3)。只有操作检查
  // 以打开的操作为条件。
  const entryIds     = directEntryIds(opState?.value, meta?.value, state.value, leaf.value);
  const registerKeys = directRegisterKeys(opState?.value, state.value);
  const [entries, registers] = await Promise.all([
    storage.getEntries(entryIds), getRegisters(registerKeys),
  ]);
  validateCurrent({ config, state, leaf, meta, opState }, entries, registers); // §3.3
  // …构建 CurrentOperation 或返回 idle…
}
```

五次寄存器点查找：三个 Lane 寄存器，然后 — 只在操作打开时 — `op.meta` 和 `op.state`。`op.state` **就是**程序计数器：解释器选择下一个动作所需的一切要么在其中，要么可以通过精确条目 id 或确定性寄存器键从它到达。

**有界水合和验证。** 从加载的状态，收集它直接命名的内容并在一个批次中获取：

- **条目：** `triggerEntryId`、`latestAssistantEntryId`、`batch.assistantEntryId`、延迟 `sourceEntryId`、已完成 `resultEntryId`、Lane 叶子，以及来自 `op.meta` 的 — `meta.value` 是水合输入，不仅仅是存在检查 — `promptEntryIds`、非空 `sourceLeafId`、导航意图的非空 `targetId`；
- **寄存器：** effect-pending 调用的 `op.tool_args/…`、结构工作的 `op.preparation/…`、每个 `inbox.*`、`control.drained*` 和 `pendingNextRun` id 的 `pending.entry/…`。

然后是 §3.3 对恰好该集合的有界验证：每个命名的东西存在且具有正确的形状；*已*物化的保留 id 包含意图承诺的内容；工具调用索引完整且唯一。配置、流选项和重试策略完全不需要查找 — 它们内联在状态本身中。

恢复从不做的事：读取寄存器历史（不存在）、折叠任何东西、扫描表、构建 provider 上下文、探测缺失的计划条目、审计已完成的操作、或从缺失的内容推断状态。

恢复已经为验证获取了直接命名的条目和寄存器。驱动重用/缓存它们并延迟构建下一个动作需要的派生 provider 上下文或额外分支投影；`nextAction` 本身切换标量和提供的已加载映射（§4.1）。

### 实例演练 — 不确定窗口中的崩溃

进程在助手意图之后的流中途死亡（§3.7 的 `effect_pending` 行；§0.4 的运行）。重新打开：

```
lane.state/main -> { currentOperationId: "op_9" }
op.meta/op_9    -> { intent: run, sourceLeafId: "e_41" }
op.state/op_9   -> { phase: assistant effect_pending, attempt: 1,
                     responseEntryId: "e_51", usageId: "u_7",
                     context: { configuration: { model: {...}, ... },
                                retryPolicy: { maxAttempts: 3, ... } } }

getEntries(["e_50"]) -> 存在 ✓        已放置的 prompt
getEntries(["e_51"]) -> 缺失          已保留，未结算 — 预期的
```

Harness 不开始任何副作用地恢复，并将操作报告为挂起。当应用调用 `resume()` 时，解释器看到没有活跃键的 `effect_pending`（进程本地 `running` 映射随进程死亡）并应用 §4.5 的不确定窗口策略 — 从捕获的状态本身：

- attempt 1 < `maxAttempts` 3 → 在**捕获的**配置和策略下开始新的 attempt 2，即使用户昨天更改了模型；
- 在上限处 → 合成错误响应：插入条目 `e_51` `{ stopReason: "error", … }`，插入零用量 `u_7`，进入失败排空 — 使用意图中保留的精确 id；
- 控制是 `cancel_requested` → 改为在 `e_51` 下合成 `aborted`，从不重试。

工具的相同形状（只有捕获**和**当前声明都说 `safe` 时重放，否则在保留结果 id 下合成 interrupted 结果）和延迟（等待应用的下次 `resume()`；每次轮询保留新 id）。

### 按后端

- **Memory：** 映射就是状态；无需做什么。
- **JSONL：** 将文件重放到条目/寄存器/用量映射中 — 这是*解码*，不是恢复逻辑（§1.7）；损坏的最后一行被整体丢弃。解码后，恢复是相同的寄存器读取。
- **SQLite**（和未来的 Postgres）：字面上的上述点查找。

### 缺失身份

准入解析配置的身份并在写入之前任何缺失时返回 `Err(MissingIdentities)`。之后，分发信任环境：provider 和工具在使用时按其捕获的持久身份查找，失败的查找带内结算为错误 — 与未知工具相同的契约。如果解析在状态仍可安全分发时失败（`ready`、`planned` 或摘要请求之间），接受的调用解析 `Ok({kind:"suspended", reason:"missing_identities", ...})` 而不是消耗一次尝试；状态不变，操作保持打开。后来的 `resume()` 预检查在相同条件下返回 `Err(MissingIdentities)`。注册缺失的部分不会自动驱动。因为捕获的配置是内联的，恢复精确报告缺少什么而无需解析任何东西。恢复的 `effect_pending` 遵循未知副作用恢复而不是声称副作用从未开始。合成结算、用量修复、队列应用、完成和非重放对账不需要身份。

## 4.5 崩溃位置与恢复策略

原子事务没有内部前缀，所以对任何重复敏感的副作用恰好有这些持久位置：

| 崩溃点 | 持久的内容 | 恢复 |
|---|---|---|
| 意图提交之前 | 先前的状态 | 正常计划该副作用，好像什么都没发生 |
| 意图之后，分发之前 | `effect_pending`；副作用没有运行，或无法判断 | 应用下面的策略 |
| 副作用期间或之后，结算之前 | `effect_pending`；结果未知 | 相同 |
| 结算提交之后 | 输出 + 用量 + 下一个状态 | 继续；从不重新结算 |
| 队列应用提交之前/之后 | 该项完全待处理 / 条目存在且其寄存器消失 | 稍后应用 / 从不应用两次 |
| 最终结构提交之前 | 源叶子完整，生成的工作未提交 | 按当前状态和策略重新计算 |
| 最终结构提交之后 | 移动 + 摘要条目 + 标签 + 用量 + 终态清理 | 完成 |
| 第一次中止提交之后 | 取消和已排空 id 持久；已排空载荷仍在其待处理寄存器中 | 不开始新的普通副作用；对账 |
| 终态提交之后 | op 寄存器已删除，`lane.lastResult` 已写入，`currentOperationId` 为 null | Lane 空闲 |

**整个系统中唯一的不确定区间是：意图持久，结算缺失。** 三条策略覆盖它：

| 恢复的状态 | 策略 |
|---|---|
| generation `effect_pending` | 只有当**捕获的**重试策略允许时才开始更晚编号的尝试。否则在已保留的响应 id 下持久化合成错误。如果取消是持久的，改为在该 id 下持久化合成 `aborted`，从不重试。 |
| tool `effect_pending` | 只有当存储的声明**和**当前工具声明都说 `safe` 时才重新执行持久化的 `op.tool_args` 参数。否则在保留的结果 id 下追加合成 `interrupted` 错误。 |
| deferred `effect_pending` | running 控制，等待应用的下次 `resume()`，它保留新的轮询/响应/用量 id；cancelled 控制，将现有保留的响应/用量 id 合成结算为 `aborted`。无上限。 |

## 4.6 中止

中止不是一个阶段。它是 `control`。

- **第一次 `abort()`**：一个提交设置 `control = cancel_requested`，记录 `requestedAt`，将确切的已排空 steer 和 follow-up id 移入 `control.drained*`，保持 `phase` 不变。已排空项的 `pending.entry` 寄存器**不**删除：`AbortResult` 和崩溃后的 `SuspendedOperation.aborting` 从它们解引用确切载荷，它们存活到终态事务（§3.11、§3.13）。提交后，Harness 拉取信号并取消未释放的门控副作用。标记持久后调用解析；对账在后台运行（自动驱动）或在其下一个动作处停靠（手动驱动）。
- **后来的 `abort()`** 操作打开时：不追加任何东西，不信号任何东西，返回相同的已排空载荷。终态之后：`NoActiveOperation`。
- **取消后仍然允许**：结算已经意图的副作用、写入其用量、应用已接受的延迟写入、提交配置更改、完成取消。
- **禁止**：开始任何新的 provider 请求、工具、决策钩子或重试。
- **副作用后钩子**：中止和尚未开始的 `after_response`/`after_tool` 在副作用开始检查上序列化。中止优先跳过钩子；助手/获取结算使用原始响应然后规范化为 `aborted`，而活跃工具保持其原始结果带 `terminate:false`。钩子优先让它完成并使用其转换后的值。已经在运行的钩子不被强制中断。
- **按输出对账**：计划的工具调用得到 aborted 错误结果；恢复的已开始调用得到 `interrupted`；活跃的已开始调用按上述保持其终结或原始结果；取消后的助手或获取结算以停止原因 `aborted` 存储在保留的响应 id 下并移动到 cancelled 检查点状态。

**信号所有权使 `aborted` 无歧义。** Provider 实现必须当且仅当给它们的信号被拉取时设置 `stopReason: "aborted"`，且 Harness 独占拥有该信号（§4.2）。由于 `abort()` 在拉取之前提交 `control`，已结算的 `aborted` 响应总是已有持久的取消。超时、传输失败、格式错误的流和 provider 侧拒绝都以 `error` 结算并走普通重试路径 — 这是正确的，因为那些应该重试而用户中止不应该。带 `control.status === "running"` 的 `aborted` 响应不可达；如果存在一个，会话是损坏的（Part 9）。

在延迟源上，`abort()` Lane 作业将最新持久句柄注册为进程本地取消目标并立即安装 `Effects` 动作；取消是尽力而为的，从不重试。缺失 provider 身份跳过取消但不跳过持久对账。

没有通用的助手关闭。Harness 从不为了制造一个而开始请求或追加助手消息。步骤之间、工具工作期间或挂起时的中止因此可能完全不产生中止特定的助手事件。

对结构操作，提交点决定竞争：先提交的标记丢弃内存中生成的工作并以 `aborted` 完成；如果结构提交赢了，过程完成那个已提交的压缩或导航并以 `completed` 完成。

## 4.7 关闭 — 受控崩溃

**关闭不是中止。** 关闭不写任何东西：没有取消、没有终态、没有结算。

```
close()
  → 停止准入新工作
  → 拉取信号，使进行中的 provider 请求和协作工具停止
  → 拒绝停靠的手动动作和未解析的本地 promise
  → 让存储已接受的提交排空
  → 关闭存储，释放写者租约 (§1.7)
```

Harness 级别的准入屏障将关闭与每个操作和表面提交线性化。先获取准入的提交允许完成，关闭等待它；先封闭准入的关闭阻止提交进入存储。封闭后切断的流在本地以 `aborted` 结算，但其结算事务从不被准入。持久状态因此停止在 `effect_pending`，与进程死亡后完全一样。

所以关闭不需要自己的恢复机制：重新打开发现 `effect_pending` 并应用 §4.5 策略 — 捕获的重试策略下更晚编号的尝试，或上限处的合成错误。打开的操作保持打开且可恢复。

这也保持 aborted 蕴含 cancelled 的不变量（Part 9）为真。关闭拉取与中止相同的信号，但封闭的准入屏障阻止那个本地中止的响应以 running 控制提交。

## 4.8 故障

失败的存储提交使整个 Harness 故障。故障的 Harness 停止所有副作用并以 `HarnessFault` 拒绝待处理和未来的调用；它从不是 `Err` 结果。故障关闭观察之前获得的快照中出现 `faulted: true`。原因修复后，重新打开从其寄存器恢复每个 Lane。关闭同样以 `HarnessClosed` 拒绝已接受的本地操作 promise；尚未接受的调用返回 `Err(Closed)`。没有 `Result` 通道的表面 — 返回 `Promise<void>` 的配置和事实设置器、返回 id 字符串的 `SessionTree` 追加 — 在关闭时和之后以 `HarnessClosed` 拒绝。Provider、工具和隔离的钩子失败保持每 Lane 和带内。受信任的确定性应用计算（`systemPrompt`、`toolContext`、`toProviderMessages` 或 `entryProjector`）的抛出/拒绝是应用缺陷并使 Harness 故障；它从不会作为未声明的操作错误逃逸。`AgentTool.prepareArguments` 是由工具管线作为合成工具错误处理的刻意例外。

## 4.9 外部终结

操作可以从其自己的驱动之外结束：管理性强杀工具 — 或任何未来的修复器（Part 6）— 可以提交终态事务（§3.13），带或不带保留 id 下的合成结算，而活跃驱动仍在内存中持有该操作。驱动以恰好一种方式发现这一点：条件提交或 `reloadCurrent` 发现操作不再是 Lane 的当前操作 — 其寄存器缺失。

规则：**驱动停止。** 它拉取操作信号使进行中的副作用取消，不写入地丢弃每个内存结果 — 没有寄存器留下拥有结算 — 发出操作的结束事件，并从 `lane.lastResult`（终结事务写入的）解析活跃调用者的 promise（当存在时解引用 `finalAssistantEntryId` 重建 `finalMessage`）。

在发布的后端上，终结器要么在进程内 — 像任何其他作业一样在 Lane 变更线上提交的管理表面 — 要么是在关闭/崩溃后首先接管写者租约的独立进程。每个终态事务，包括驱动自己的，都以 `op.state` 在其预期 seq 仍存在为条件，这就是使不变量 21（每个操作至多一个终态事务）在竞争中成立的原因。它从不重新创建寄存器，从不提交竞争的终态事务，也从不把缺失视为损坏：缺失的 `op.*` 寄存器带已清除的 `currentOperationId` 是普通的终态后形状（§3.13）。

挂起的操作不需要驱动停止。终结器的终态事务使 Lane 空闲；后来的 `resume()` 发现 `currentOperationId: null` 并返回 `NothingToResume`，应用从 `getLastResult()` 读取结果（§5.1）— 与任何崩溃后结果相同的对账路径。
