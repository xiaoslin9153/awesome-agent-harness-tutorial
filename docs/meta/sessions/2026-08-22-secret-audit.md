# 会话：密钥信息审计

## 元数据

- 日期：2026-08-22
- 状态：阻塞
- 目标：确认是否有密钥相关信息进入本项目 Git 历史，并移除不必要的密钥标识。

## 审计范围

1. 当前跟踪文件。
2. `git rev-list --all` 覆盖的全部提交。
3. 私钥块、私钥关键词、常见 token 格式、SSH 密钥文件名、`.ssh` 路径、指纹和密钥相关词汇。

## 已验证结果

1. 没有任何 OpenSSH / RSA / EC / DSA 私钥内容被跟踪或提交。
2. 没有 GitHub token、`ghp_` 值、`github_pat_` 值或 API secret 被提交。
3. 当前和历史记录中存在本机私钥文件名与路径引用。
4. 早期英文会话快照中曾提交过一次公钥指纹。
5. 这些引用不等于密钥泄露，但不符合本项目后续的最低暴露原则。

## 处理决策

1. 当前文档不再记录私钥文件名、路径和指纹。
2. 只保留“使用本机 SSH 配置中的专用别名”这一运行所需事实。
3. 提交前 Review 增加对密钥文件名、路径和指纹的检查。
4. 维护者已明确批准重写 Git 历史，以消除历史中的旧引用。

## 历史重写阻塞

1. 计划使用 `git filter-repo --replace-text` 替换：
   - `[removed-key-identifier]`
   - `~/.ssh/[removed-key-identifier]`
   - 公钥指纹 `[removed-public-fingerprint]`
2. 本机未安装 `git-filter-repo`。
3. 安装命令需要写入 Homebrew 前缀，当前无法继续执行。

## 解阻条件

维护者手动执行 `brew install git-filter-repo` 后，Agent 可以继续执行已批准的历史重写。
