/**
 * Background Service Worker
 * 处理代理设置、认证和模式切换
 */

importScripts('lib/pac-generator.js');

// 默认配置
const DEFAULT_CONFIG = {
  mode: 'direct', // direct | global | rules | pac
  activeProxyId: null,
  proxies: [],
  rules: [],
  ruleMode: 'blacklist', // blacklist: 匹配走代理; whitelist: 匹配直连
  pacUrl: '',
  pacScript: ''
};

/**
 * 加载配置
 */
async function loadConfig() {
  const result = await chrome.storage.local.get('proxyConfig');
  return result.proxyConfig || DEFAULT_CONFIG;
}

/**
 * 保存配置
 */
async function saveConfig(config) {
  await chrome.storage.local.set({ proxyConfig: config });
}

/**
 * 获取当前活跃的代理配置
 */
function getActiveProxy(config) {
  if (!config.activeProxyId || !config.proxies.length) return null;
  return config.proxies.find(p => p.id === config.activeProxyId) || null;
}

/**
 * 应用代理设置
 */
async function applyProxy(config) {
  const proxy = getActiveProxy(config);

  switch (config.mode) {
    case 'direct':
      await chrome.proxy.settings.set({
        value: { mode: 'direct' },
        scope: 'regular'
      });
      break;

    case 'global':
      if (!proxy) {
        await chrome.proxy.settings.set({
          value: { mode: 'direct' },
          scope: 'regular'
        });
        break;
      }
      await chrome.proxy.settings.set({
        value: {
          mode: 'fixed_servers',
          rules: {
            singleProxy: {
              scheme: proxy.scheme || 'http',
              host: proxy.host,
              port: parseInt(proxy.port, 10)
            },
            bypassList: proxy.bypassList || ['<local>']
          }
        },
        scope: 'regular'
      });
      break;

    case 'rules':
      if (!proxy) {
        await chrome.proxy.settings.set({
          value: { mode: 'direct' },
          scope: 'regular'
        });
        break;
      }
      const proxyString = PacGenerator.proxyToString(proxy);
      const pacScript = PacGenerator.generatePacScript({
        proxyString,
        rules: config.rules,
        ruleMode: config.ruleMode
      });
      await chrome.proxy.settings.set({
        value: {
          mode: 'pac_script',
          pacScript: { data: pacScript }
        },
        scope: 'regular'
      });
      break;

    case 'pac':
      if (config.pacUrl) {
        await chrome.proxy.settings.set({
          value: {
            mode: 'pac_script',
            pacScript: { url: config.pacUrl }
          },
          scope: 'regular'
        });
      } else if (config.pacScript) {
        await chrome.proxy.settings.set({
          value: {
            mode: 'pac_script',
            pacScript: { data: config.pacScript }
          },
          scope: 'regular'
        });
      } else {
        await chrome.proxy.settings.set({
          value: { mode: 'direct' },
          scope: 'regular'
        });
      }
      break;

    default:
      await chrome.proxy.settings.set({
        value: { mode: 'direct' },
        scope: 'regular'
      });
  }

  // 更新图标徽章
  updateBadge(config.mode);
}

/**
 * 更新扩展图标徽章
 */
function updateBadge(mode) {
  const badges = {
    direct: { text: '', color: '#4CAF50' },
    global: { text: 'G', color: '#2196F3' },
    rules: { text: 'R', color: '#FF9800' },
    pac: { text: 'P', color: '#9C27B0' }
  };
  const badge = badges[mode] || badges.direct;
  chrome.action.setBadgeText({ text: badge.text });
  chrome.action.setBadgeBackgroundColor({ color: badge.color });
}

/**
 * 处理代理认证
 */
chrome.webRequest.onAuthRequired.addListener(
  async (details) => {
    if (!details.isProxy) return {};
    const config = await loadConfig();
    const proxy = getActiveProxy(config);
    if (proxy && proxy.username && proxy.password) {
      return {
        authCredentials: {
          username: proxy.username,
          password: proxy.password
        }
      };
    }
    return {};
  },
  { urls: ['<all_urls>'] },
  ['asyncBlocking']
);

/**
 * 监听来自 popup 和 options 的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // 保持消息通道打开
});

async function handleMessage(message) {
  const config = await loadConfig();

  switch (message.action) {
    case 'getConfig':
      return config;

    case 'setMode':
      config.mode = message.mode;
      await saveConfig(config);
      await applyProxy(config);
      return { success: true };

    case 'setActiveProxy':
      config.activeProxyId = message.proxyId;
      await saveConfig(config);
      await applyProxy(config);
      return { success: true };

    case 'addProxy':
      message.proxy.id = Date.now().toString();
      config.proxies.push(message.proxy);
      if (!config.activeProxyId) {
        config.activeProxyId = message.proxy.id;
      }
      await saveConfig(config);
      return { success: true, id: message.proxy.id };

    case 'updateProxy':
      const idx = config.proxies.findIndex(p => p.id === message.proxy.id);
      if (idx !== -1) {
        config.proxies[idx] = message.proxy;
        await saveConfig(config);
        await applyProxy(config);
      }
      return { success: true };

    case 'deleteProxy':
      config.proxies = config.proxies.filter(p => p.id !== message.proxyId);
      if (config.activeProxyId === message.proxyId) {
        config.activeProxyId = config.proxies.length ? config.proxies[0].id : null;
      }
      await saveConfig(config);
      await applyProxy(config);
      return { success: true };

    case 'setRules':
      config.rules = message.rules;
      config.ruleMode = message.ruleMode || config.ruleMode;
      await saveConfig(config);
      if (config.mode === 'rules') await applyProxy(config);
      return { success: true };

    case 'setPac':
      config.pacUrl = message.pacUrl || '';
      config.pacScript = message.pacScript || '';
      await saveConfig(config);
      if (config.mode === 'pac') await applyProxy(config);
      return { success: true };

    case 'exportConfig':
      return config;

    case 'importConfig':
      await saveConfig(message.config);
      await applyProxy(message.config);
      return { success: true };

    default:
      return { error: 'Unknown action' };
  }
}

// 初始化：启动时应用已保存的配置
chrome.runtime.onInstalled.addListener(async () => {
  const config = await loadConfig();
  await applyProxy(config);
});

chrome.runtime.onStartup.addListener(async () => {
  const config = await loadConfig();
  await applyProxy(config);
});
