---
date: 2026-08-23
topic: X-02 Context 策略对比 v0.3 重写
status: 已完成
---

# X-02 Context 策略对比 v0.3 重写

## 目标

按 Goal 运行手册重写 X-02，把 M-01/M-02 已核对的机制差异横向对齐到统一比较框架。

## 范围

- 范围内：X-02 公开章节、TOC 状态、B-004 执行进度和本会话记录。
- 范围外：X-03 到 X-06 后续对比页、新锚点核对（本章引用已有结论不引入新源码路径）。

## 旧稿审计

旧稿已有三种风格描述与扩展点表，但缺少 learning_contract、核心不变量失效边界、7 个反例、完整因果链和第二张 Mermaid 图；pending_review 未关闭；未覆盖工具结果分页对比维度和 stale usage 保护。

## 决策

1. 核心不变量定为比较基于 M-01/M-02 已核对源码锚点；每项差异可追溯到对应机制章节。
2. 用统一生命周期 flowchart 和组装预算对比表。
3. 新增反例覆盖 unpriced 当免费、pruner 破坏配对、切在 toolResult 上、cache 全失效无归因、摘要美化失败、stale usage 循环压缩和 fixed prefix 本身超窗。
4. 完整因果链采用同一 120 轮会话在三家中的压缩路径差异。

## Implementation Review

1. 本章不引入新外部锚点，所有事实来自 M-01/M-02 及框架章节已核对的结论。
2. 核对至少 7 个故障模式、一条跨三家的完整因果链、2 张用途明确的 Mermaid 图。
3. Front Matter learning_contract 与 TOC 一致；Polish 与 Implementation Review 由主 Agent 完成。

## 变更文件

- 重写 `tutorial/zh-CN/04-comparisons/context.md`
- 更新 `tutorial/zh-CN/TOC.md`
- 更新 `docs/product/backlog/2026-08-23-tutorial-depth-and-progression.md`
- 新增本会话记录

## 验证

1. `cd site && npm run check:links` 通过。
2. `cd site && npm run build` 成功。
3. `git diff --check` 通过。
4. 推送后检查 GitHub Actions 和线上页面，结果写入部署检查。

## 下一步

处理 X-03《工具协议与安全对比》。

## 部署检查

- 提交：`75b083e docs: rewrite context comparison`。
- GitHub Actions：run `32626314360`（Deploy Pages）为 `completed success`。
- 站点入口 `https://xiaoslin9153.github.io/awesome-agent-harness-tutorial/` 返回 HTTP 200。
- 受影响页面 `/zh-CN/04-comparisons/context/` 可访问，并包含标题、surface replace、compaction entry 和 unpriced。
