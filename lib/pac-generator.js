/**
 * PAC 脚本生成器
 * 根据规则配置生成 PAC (Proxy Auto-Config) 脚本
 */

/**
 * 将通配符模式转换为正则表达式
 * @param {string} pattern - 通配符模式，如 *.google.com
 * @returns {string} 正则表达式字符串
 */
function wildcardToRegex(pattern) {
  return pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
}

/**
 * 生成 PAC 脚本
 * @param {object} config - 配置对象
 * @param {string} config.proxyString - 代理字符串，如 "PROXY 127.0.0.1:8080"
 * @param {Array} config.rules - 规则列表
 * @param {string} config.ruleMode - 规则模式: "blacklist"(匹配走代理) 或 "whitelist"(匹配直连)
 * @returns {string} PAC 脚本内容
 */
function generatePacScript(config) {
  const { proxyString, rules, ruleMode } = config;

  const conditions = rules.map(rule => {
    if (rule.type === 'domain') {
      const regex = wildcardToRegex(rule.value);
      return `    if (/${regex}/.test(host)) return ${ruleMode === 'blacklist' ? 'proxy' : 'direct'};`;
    } else if (rule.type === 'url') {
      const regex = wildcardToRegex(rule.value);
      return `    if (/${regex}/.test(url)) return ${ruleMode === 'blacklist' ? 'proxy' : 'direct'};`;
    } else if (rule.type === 'cidr') {
      return `    if (isInNet(host, "${rule.network}", "${rule.mask}")) return ${ruleMode === 'blacklist' ? 'proxy' : 'direct'};`;
    }
    return '';
  }).filter(Boolean).join('\n');

  const defaultAction = ruleMode === 'blacklist' ? 'direct' : 'proxy';

  return `function FindProxyForURL(url, host) {
    var proxy = "${proxyString}";
    var direct = "DIRECT";

${conditions}

    return ${defaultAction};
}`;
}

/**
 * 将代理配置转换为 PAC 代理字符串
 * @param {object} proxy - 代理配置
 * @returns {string} PAC 格式代理字符串
 */
function proxyToString(proxy) {
  const scheme = (proxy.scheme || 'http').toUpperCase();
  if (scheme === 'SOCKS5' || scheme === 'SOCKS4') {
    return `SOCKS5 ${proxy.host}:${proxy.port}`;
  }
  if (scheme === 'HTTPS') {
    return `HTTPS ${proxy.host}:${proxy.port}`;
  }
  return `PROXY ${proxy.host}:${proxy.port}`;
}

// 导出供 background.js 使用
if (typeof globalThis !== 'undefined') {
  globalThis.PacGenerator = { generatePacScript, proxyToString, wildcardToRegex };
}
