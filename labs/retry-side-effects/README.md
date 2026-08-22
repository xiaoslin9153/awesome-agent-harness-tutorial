# Retry Side Effects Lab

这个实验用确定性假件研究工具重试的副作用，不需要网络或外部服务。

## 运行

```bash
cd labs/retry-side-effects
npm start
```

## 测试

```bash
cd labs/retry-side-effects
npm test
```

测试会验证三条路径：无键重试重复创建资源；相同幂等键只提交一次；状态未知时升级为人工确认并保留补偿线索。
