# Context Bloat Lab

这个实验用确定性消息比较无界追加和预算内投影，不需要网络、模型密钥或外部服务。

## 运行

```bash
cd labs/context-bloat
npm start
```

## 测试

```bash
cd labs/context-bloat
npm test
```

测试会验证无界历史超过预算，而预算投影保留系统约束、关键纠正和最近消息，并为移出内容留下丢弃记录。
