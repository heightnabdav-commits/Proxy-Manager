/**
 * Popup 脚本
 * 处理模式切换、代理选择和快速添加
 */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const config = await sendMessage({ action: 'getConfig' });
  renderMode(config.mode);
  renderProxyList(config.proxies, config.activeProxyId);
  bindEvents(config);
}

/**
 * 发送消息到 background
 */
function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

/**
 * 渲染当前模式
 */
function renderMode(mode) {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

/**
 * 渲染代理列表
 */
function renderProxyList(proxies, activeProxyId) {
  const select = document.getElementById('proxy-select');
  select.innerHTML = '<option value="">-- 无代理 --</option>';
  proxies.forEach(proxy => {
    const option = document.createElement('option');
    option.value = proxy.id;
    option.textContent = `${proxy.name} (${proxy.scheme}://${proxy.host}:${proxy.port})`;
    if (proxy.id === activeProxyId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 模式切换
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mode = btn.dataset.mode;
      await sendMessage({ action: 'setMode', mode });
      renderMode(mode);
    });
  });

  // 代理选择
  document.getElementById('proxy-select').addEventListener('change', async (e) => {
    const proxyId = e.target.value;
    await sendMessage({ action: 'setActiveProxy', proxyId });
  });

  // 快速添加代理
  document.getElementById('btn-add-proxy').addEventListener('click', async () => {
    const name = document.getElementById('proxy-name').value.trim();
    const scheme = document.getElementById('proxy-scheme').value;
    const host = document.getElementById('proxy-host').value.trim();
    const port = document.getElementById('proxy-port').value.trim();
    const username = document.getElementById('proxy-user').value.trim();
    const password = document.getElementById('proxy-pass').value.trim();

    if (!name || !host || !port) {
      alert('请填写名称、地址和端口');
      return;
    }

    const proxy = { name, scheme, host, port: parseInt(port, 10), username, password };
    const result = await sendMessage({ action: 'addProxy', proxy });

    if (result.success) {
      // 刷新列表
      const config = await sendMessage({ action: 'getConfig' });
      renderProxyList(config.proxies, config.activeProxyId);
      // 清空表单
      document.getElementById('proxy-name').value = '';
      document.getElementById('proxy-host').value = '';
      document.getElementById('proxy-port').value = '';
      document.getElementById('proxy-user').value = '';
      document.getElementById('proxy-pass').value = '';
    }
  });

  // 打开高级设置
  document.getElementById('btn-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}
