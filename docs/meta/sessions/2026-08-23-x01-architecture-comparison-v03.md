---
date: 2026-08-23
topic: X-01 架构风格对比 v0.3 重写
status: 已完成
---

# X-01 架构风格对比 v0.3 重写

## 目标

按 Goal 运行手册重写 X-01，把第三章已核对的架构结论横向对齐到统一观察框架。

## 范围

- 范围内：X-01 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：X-02 到 X-06 后续对比页、新锚点核对（本章引用已有结论不引入新源码路径）。

## 旧稿审计

旧稿已有三种风格描述与扩展点表，但缺少 learning_contract、核心不变量失效边界、7 个反例、完整因果链和第二张 Mermaid 图；pending_review 未关闭；未覆盖生命周期归属行和工具安全对比维度。

## 决策

1. 核心不变量定为比较基于已核对源码锚点而非文档描述；每项结论可追溯到对应框架章节。
2. 用五个观察问题作为统一框架。
3. 新增控制面/状态所有权/工具安全/生命周期四个对比维度表。
4. 用 flowchart 表达三家状态所有权，用表格表达生命周期六阶段。
5. 完整因果链采用同一任务在三家中的路径差异。
6. 新增 7 个反例覆盖"只看 CLI 判断相似性"、事件粒度假设、AgentHarness restore 误用、planMode 当安全边界、guard force-allow、Pi 无沙箱当遗漏和绕过 BuildResult。

## Implementation Review

1. 本章不引入新外部锚点，所有事实来自 F-R1/F-D1/F-P1 及后续机制章节已核对的结论。
2. 核对至少 7 个故障模式、一条跨三家的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。

## 变更文件

- 重写 `tutorial/zh-CN/04-comparisons/architecture.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 下一步

处理 X-02《Context 组装与压缩对比》。

## 部署检查

- 待提交后填写 Actions run、站点入口和受影响页面结果。
