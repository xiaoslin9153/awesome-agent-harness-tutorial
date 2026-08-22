# Goal 模式深度与验证策略会话

## 状态

已完成。

## 目标

调整 Goal Agent 的写作节奏：每小节不再等待完整事实审查；同时提高 Reasonix、DeepSeek Harness 和 Pi 章节的技术深度。

## 决策

1. 采用「批量草稿模式」。Polish 仍逐节执行；Implementation Review 延后到全部初稿完成后执行。章节必须标记 `pending` 并维护待核对清单。
2. 只有完整事实审查通过后，公开章节才能改成 `published`。该策略降低写作节奏成本，不取消发布门禁。
3. Deploy Subagent 在草稿阶段只检查构建、推送和页面可达，不承担内容质量审查。
4. 框架章节新增九段必备结构和技术解释要求，覆盖架构、核心类型、调用链、状态、工具、扩展点、取舍和可迁移模式。

## 变更

- `tutorial/writing-pipeline.md` 更新 Goal 流程、批量草稿模式和框架深拆标准。
- `docs/meta/session-checklist.md` 同步延后审查的最低记录要求。
- `docs/product/progress-tracker.md` 新增 G20 和 G21。

## 风险与控制

风险是多篇草稿积累事实偏差。控制方式是每节保留源码锚点和待验证清单，最终发布前统一清零；未通过完整审查的内容不得标记发布。

## 下一步

Goal Agent 恢复后，后续框架章节按新的九段深拆结构撰写；每节保留 `pending_review` 清单，全部初稿完成后统一执行 Implementation Review。

## 自 Review 与部署

- 变更只包含写作节奏、发布门槛、框架深拆标准、检查清单和进度记录。
- `node scripts/check-links.mjs`、`cd site && npm run check:links && npm run build` 通过。
- diff 无凭证、密钥路径、指纹或构建产物。
- Commit 推送后 GitHub Actions 部署成功，站点入口返回 HTTP 200。
