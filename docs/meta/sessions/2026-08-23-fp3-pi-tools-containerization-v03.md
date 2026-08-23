---
date: 2026-08-23
topic: F-P3 Pi 工具与容器化 v0.3 重写
status: 已完成
---

# F-P3 Pi 工具与容器化 v0.3 重写

## 目标

按 Goal 运行手册重写 F-P3，把 pluggable operations、mutation queue abort 安全模式、bash 进程树治理与三种部署隔离模式绑定到固定快照锚点。

## 范围

- 范围内：F-P3 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：X-01 起横向对比、Gondolin/OpenShell 部署实操验证。

## 旧稿审计

旧稿已有三种容器化模式和安全边界声明，但缺少 learning_contract、核心不变量失效边界、9 个反例、完整因果链和第二张 Mermaid 图；pending_review 未关闭；未核对 write/edit 的 throwIfAborted 注释推理和 mutation queue realpath keying 细节。

## 源码证据

1. `packages/coding-agent/src/core/tools/write.ts:31-46`：WriteOperations 接口（writeFile/mkdir）与默认 Node 实现。
2. `tools/write.ts:210-232`：withFileMutationQueue 包裹 + throwIfAborted per-await 模式及注释解释不用 listener reject 的原因（queue 泄漏）。
3. `tools/file-mutation-queue.ts:16-61`：realpath keying（存在用 realpath，ENOENT 用 resolvedPath）；同 key 串行不同 key 并行；finally release。
4. `tools/bash.ts:88-154`：detached spawn、trackDetachedChildPid/killProcessTree、timeout/abort 双触发杀树；waitForChildProcess 处理 inherited handles。
5. `tools/bash.ts:28-39`：resolveTimeoutMs 校验 MAX_TIMEOUT_MS 上限。
6. `tools/output-accumulator.ts:91-118`：snapshot persistIfTruncated 与 truncation metadata。
7. `packages/agent/src/harness/types.ts:303-315`：Shell exec/cleanup 契约与 ExecutionEnv 组合。

## 决策

1. 核心不变量定为 pluggable operations、同路径串行 mutation queue、abort 不释放 queue、resolveToCwd 先行、项目信任只是闸门、无内置沙箱诚实声明。
2. 用厨房厨师类比入门；随后给出 operations 接口、queue keying 和 abort 双层模式。
3. 用 flowchart 表达工具执行到 result 的全路径（含 abort 检查），用 flowchart 表达三种部署模式的隔离范围差异。
4. 新增反例覆盖同文件双写、listener 提前释放 queue、realpath TOCTOU、子进程存活、bind mount 当沙箱、Gondolin 未覆盖自定义工具、OpenShell 远端丢文件、信任通过即全权、timeout 秒转毫秒溢出。
5. 完整因果链采用三调用并行编辑：queue 串行 a.ts 两操作、b.ts 并行不受影响、abort 后 per-await 检查保持 queue 锁定直到 settle。

## Polish

1. 统一 pluggable operations、mutation queue、throwIfAborted per-await、整进程隔离和项目信任闸门术语。
2. 厨房厨师类比只承担入门；随后给出 operations 接口拆分和 bash 三件套细节。
3. 设计取舍表补充从"无 queue"到"OpenShell"的迁移顺序。
4. 明确 Pi 核心无内置沙箱是架构选择而非遗漏，文档诚实声明。

## Implementation Review

1. 用脚本核对新稿全部 7 个外部锚点起止行均在文件范围内。
2. 核对至少 9 个故障模式、一条触发到后续影响的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。
4. 未修改 `external/`；未引用测试注释作为生产行为。

## 变更文件

- 重写 `tutorial/zh-CN/03-frameworks/pi/tools-containerization.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 开放问题

1. Gondolin/OpenShell 部署实操验证留待安全专题。
2. trust-manager 具体实现未逐行展开。
3. Pi 是否计划内置 OS 级沙箱待上游跟踪。

## 下一步

Pi 三章完成，第三章收官。进入第四章 X-01《架构对比》。

## 部署检查

- 提交：`98884a7 docs: rewrite pi tools containerization`。
- GitHub Actions：run `32617686649`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/03-frameworks/pi/tools-containerization/` 可访问，并包含标题、mutation queue、Gondolin 和 OpenShell。
