# Proxy Manager

一个 Chrome 代理管理扩展，支持 HTTP/HTTPS/SOCKS5 代理。提供多代理配置、规则分流、PAC 脚本和代理认证功能。

## 功能特性

- **多种代理模式** — 直连、全局代理、规则分流、PAC 脚本
- **多代理管理** — 添加、编辑、删除多个代理服务器，快速切换
- **代理认证** — 自动处理用户名/密码认证
- **规则分流** — 按域名、URL 模式、IP 段 (CIDR) 路由流量
  - 黑名单模式：匹配的流量走代理，其余直连
  - 白名单模式：匹配的流量直连，其余走代理
- **PAC 脚本支持** — 在线 PAC URL 或自定义 PAC 脚本编辑器
- **导入/导出** — 将所有配置备份为 JSON 文件并可恢复
- **协议支持** — HTTP、HTTPS、SOCKS5

## 安装

### 从源码安装（开发者模式）

1. 克隆仓库：
   ```bash
   git clone https://github.com/heightnabdav-commits/Proxy-Manager.git
   ```
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 右上角开启 **开发者模式**
4. 点击 **加载已解压的扩展程序**
5. 选择克隆的仓库文件夹

## 使用方法

### 快速开始

1. 点击工具栏中的扩展图标
2. 添加代理服务器（名称、协议、地址、端口）
3. 选择代理模式：
   - 🔗 **直连** — 不使用代理，直接连接
   - 🌐 **全局** — 所有流量通过选定的代理
   - 📋 **规则** — 根据配置的规则路由流量
   - 📜 **PAC** — 使用 PAC 脚本决定路由

### 图标徽章

扩展图标上的字母表示当前模式：
- 无徽章 = 直连
- **G** = 全局代理
- **R** = 规则分流
- **P** = PAC 脚本模式

### 高级设置

在弹出窗口中点击「高级设置」可以访问：
- 完整的代理管理（编辑、删除、绕过列表）
- 规则配置（域名、URL、CIDR 匹配）
- PAC 脚本编辑器
- 配置导入/导出

## 项目结构

```
├── manifest.json           # 扩展清单（Manifest V3）
├── background.js           # Service Worker（代理逻辑 + 认证）
├── lib/
│   └── pac-generator.js    # PAC 脚本生成器
├── popup/
│   ├── popup.html          # 弹出窗口界面
│   ├── popup.css           # 弹出窗口样式
│   └── popup.js            # 弹出窗口逻辑
├── options/
│   ├── options.html        # 选项页面
│   ├── options.css         # 选项页样式
│   └── options.js          # 选项页逻辑
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 权限说明

- `proxy` — 配置 Chrome 代理设置
- `storage` — 持久化存储代理配置
- `webRequest` — 拦截请求以处理认证
- `webRequestAuthProvider` — 自动提供代理凭据

## 许可证

MIT

---

[English Documentation](./README.md)
