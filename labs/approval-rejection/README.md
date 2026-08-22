# Approval Rejection Lab

这个实验用确定性假件研究审批拒绝后的恢复，不需要真实用户界面或外部服务。

## 运行

```bash
cd labs/approval-rejection
npm start
```

## 测试

```bash
cd labs/approval-rejection
npm test
```

测试会验证批准执行、拒绝后替代申请、越权重复拒绝和无法决策失败关闭，并检查副作用与审批事件都在同一条审计序列中。
