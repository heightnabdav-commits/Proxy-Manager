# Proxy Manager

A Chrome extension for HTTP/HTTPS/SOCKS5 proxy management. Supports multiple proxy configurations, rule-based routing, PAC scripts, and proxy authentication.

## Features

- **Multiple Proxy Modes** — Direct, Global Proxy, Rule-based Routing, PAC Script
- **Multi-Proxy Management** — Add, edit, delete multiple proxy servers with quick switching
- **Proxy Authentication** — Automatically handles username/password authentication
- **Rule-based Routing** — Route traffic by domain, URL pattern, or IP range (CIDR)
  - Blacklist mode: matched traffic goes through proxy, rest direct
  - Whitelist mode: matched traffic goes direct, rest through proxy
- **PAC Script Support** — Online PAC URL or custom PAC script editor
- **Import/Export** — Backup and restore all configurations as JSON
- **Protocol Support** — HTTP, HTTPS, SOCKS5

## Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/proxy-manager-extension.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the cloned repository folder

## Usage

### Quick Start

1. Click the extension icon in the toolbar
2. Add a proxy server (name, protocol, host, port)
3. Select a proxy mode:
   - 🔗 **Direct** — No proxy, connect directly
   - 🌐 **Global** — All traffic through the selected proxy
   - 📋 **Rules** — Route traffic based on configured rules
   - 📜 **PAC** — Use a PAC script for routing decisions

### Badge Indicators

The extension icon shows a badge letter indicating the current mode:
- No badge = Direct
- **G** = Global proxy
- **R** = Rule-based routing
- **P** = PAC script mode

### Advanced Settings

Click "高级设置" (Advanced Settings) in the popup to access:
- Full proxy management (edit, delete, bypass lists)
- Rule configuration (domain, URL, CIDR matching)
- PAC script editor
- Configuration import/export

## Project Structure

```
├── manifest.json           # Extension manifest (Manifest V3)
├── background.js           # Service Worker (proxy logic + auth)
├── lib/
│   └── pac-generator.js    # PAC script generator
├── popup/
│   ├── popup.html          # Popup UI
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic
├── options/
│   ├── options.html        # Options page
│   ├── options.css         # Options styles
│   └── options.js          # Options logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Permissions

- `proxy` — Configure Chrome proxy settings
- `storage` — Persist proxy configurations
- `webRequest` — Intercept requests for authentication
- `webRequestAuthProvider` — Provide proxy credentials automatically

## License

MIT

---

[中文文档](./README.zh-CN.md)
