# Minimal Agent Run Lab

这个实验用确定性假件运行一个最小 Agent 循环，不需要网络、模型密钥或外部服务。

## 运行

```bash
cd labs/minimal-run
npm start
```

## 测试

```bash
cd labs/minimal-run
npm test
```

测试会检查三条路径：直接完成、工具成功和工具失败。每条路径都必须产生配对的 tool call 与 tool result，并以 `run_end` 结束。
