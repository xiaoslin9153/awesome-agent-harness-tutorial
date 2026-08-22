# Long Task Recovery Lab

这个实验用确定性步骤和检查点研究长任务中断恢复，不需要真实进程或外部服务。

## 运行

```bash
cd labs/long-task-recovery
npm start
```

## 测试

```bash
cd labs/long-task-recovery
npm test
```

测试会比较无状态重跑与检查点恢复，验证闭合事件、租约、环境指纹和未决副作用对账；环境漂移时必须拒绝自动续跑。
