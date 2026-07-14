/**
 * Options 页面脚本
 * 管理代理、规则、PAC 配置
 */

document.addEventListener('DOMContentLoaded', init);

let currentConfig = null;
let currentRules = [];

async function init() {
  currentConfig = await sendMessage({ action: 'getConfig' });
  currentRules = [...(currentConfig.rules || [])];
  renderProxies();
  renderRules();
  renderPac();
  bindEvents();
}

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

// ==================== 标签切换 ====================

function bindEvents() {
  // 标签切换
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // CIDR 字段显示切换
  document.getElementById('rule-type').addEventListener('change', (e) => {
    const cidrFields = document.querySelector('.cidr-fields');
    if (e.target.value === 'cidr') {
      cidrFields.classList.remove('hidden');
    } else {
      cidrFields.classList.add('hidden');
    }
  });

  // 代理操作
  document.getElementById('btn-save-proxy').addEventListener('click', saveProxy);
  document.getElementById('btn-cancel-proxy').addEventListener('click', resetProxyForm);

  // 规则操作
  document.getElementById('btn-add-rule').addEventListener('click', addRule);
  document.getElementById('btn-save-rules').addEventListener('click', saveRules);

  // PAC 操作
  document.getElementById('btn-save-pac').addEventListener('click', savePac);

  // 导入导出
  document.getElementById('btn-export').addEventListener('click', exportConfig);
  document.getElementById('btn-import').addEventListener('click', importConfig);

  // 代理列表事件委托
  document.getElementById('proxy-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'edit') editProxy(id);
    else if (action === 'delete') deleteProxy(id);
  });

  // 规则列表事件委托
  document.getElementById('rule-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'delete-rule') {
      const index = parseInt(btn.dataset.index, 10);
      deleteRule(index);
    }
  });
}

// ==================== 代理管理 ====================

function renderProxies() {
  const list = document.getElementById('proxy-list');
  if (!currentConfig.proxies.length) {
    list.innerHTML = '<p class="empty-text">暂无代理配置</p>';
    return;
  }
  list.innerHTML = currentConfig.proxies.map(proxy => `
    <div class="proxy-item" data-id="${proxy.id}">
      <div class="proxy-info">
        <div class="proxy-name">${escapeHtml(proxy.name)}</div>
        <div class="proxy-detail">${proxy.scheme}://${escapeHtml(proxy.host)}:${proxy.port}${proxy.username ? ' (需认证)' : ''}</div>
      </div>
      <div class="proxy-actions">
        <button class="btn-edit" data-action="edit" data-id="${proxy.id}">编辑</button>
        <button class="btn-danger" data-action="delete" data-id="${proxy.id}">删除</button>
      </div>
    </div>
  `).join('');
}

async function saveProxy() {
  const id = document.getElementById('edit-proxy-id').value;
  const name = document.getElementById('opt-proxy-name').value.trim();
  const scheme = document.getElementById('opt-proxy-scheme').value;
  const host = document.getElementById('opt-proxy-host').value.trim();
  const port = document.getElementById('opt-proxy-port').value.trim();
  const username = document.getElementById('opt-proxy-user').value.trim();
  const password = document.getElementById('opt-proxy-pass').value.trim();
  const bypassText = document.getElementById('opt-proxy-bypass').value.trim();
  const bypassList = bypassText ? bypassText.split('\n').map(s => s.trim()).filter(Boolean) : ['<local>'];

  if (!name || !host || !port) {
    alert('请填写名称、地址和端口');
    return;
  }

  const proxy = { name, scheme, host, port: parseInt(port, 10), username, password, bypassList };

  if (id) {
    proxy.id = id;
    await sendMessage({ action: 'updateProxy', proxy });
  } else {
    await sendMessage({ action: 'addProxy', proxy });
  }

  currentConfig = await sendMessage({ action: 'getConfig' });
  renderProxies();
  resetProxyForm();
}

function editProxy(id) {
  const proxy = currentConfig.proxies.find(p => p.id === id);
  if (!proxy) return;

  document.getElementById('edit-proxy-id').value = proxy.id;
  document.getElementById('opt-proxy-name').value = proxy.name;
  document.getElementById('opt-proxy-scheme').value = proxy.scheme;
  document.getElementById('opt-proxy-host').value = proxy.host;
  document.getElementById('opt-proxy-port').value = proxy.port;
  document.getElementById('opt-proxy-user').value = proxy.username || '';
  document.getElementById('opt-proxy-pass').value = proxy.password || '';
  document.getElementById('opt-proxy-bypass').value = (proxy.bypassList || []).join('\n');
  document.getElementById('proxy-form-title').textContent = '编辑代理';
}

async function deleteProxy(id) {
  if (!confirm('确定删除此代理？')) return;
  await sendMessage({ action: 'deleteProxy', proxyId: id });
  currentConfig = await sendMessage({ action: 'getConfig' });
  renderProxies();
}

function deleteRule(index) {
  currentRules.splice(index, 1);
  renderRules();
}

function resetProxyForm() {
  document.getElementById('edit-proxy-id').value = '';
  document.getElementById('opt-proxy-name').value = '';
  document.getElementById('opt-proxy-host').value = '';
  document.getElementById('opt-proxy-port').value = '';
  document.getElementById('opt-proxy-user').value = '';
  document.getElementById('opt-proxy-pass').value = '';
  document.getElementById('opt-proxy-bypass').value = '';
  document.getElementById('proxy-form-title').textContent = '添加代理';
}

// ==================== 规则管理 ====================

function renderRules() {
  document.getElementById('rule-mode').value = currentConfig.ruleMode || 'blacklist';
  const list = document.getElementById('rule-list');
  if (!currentRules.length) {
    list.innerHTML = '<p class="empty-text">暂无规则</p>';
    return;
  }
  list.innerHTML = currentRules.map((rule, index) => {
    let display = '';
    if (rule.type === 'domain') display = `域名: ${escapeHtml(rule.value)}`;
    else if (rule.type === 'url') display = `URL: ${escapeHtml(rule.value)}`;
    else if (rule.type === 'cidr') display = `IP段: ${rule.network}/${rule.mask}`;
    return `
      <div class="rule-item">
        <div class="rule-info">${display}</div>
        <div class="rule-actions">
          <button class="btn-danger" data-action="delete-rule" data-index="${index}">删除</button>
        </div>
      </div>
    `;
  }).join('');
}

function addRule() {
  const type = document.getElementById('rule-type').value;
  const value = document.getElementById('rule-value').value.trim();

  if (type === 'cidr') {
    const network = document.getElementById('rule-network').value.trim();
    const mask = document.getElementById('rule-mask').value.trim();
    if (!network || !mask) {
      alert('请填写网络地址和子网掩码');
      return;
    }
    currentRules.push({ type, value: `${network}/${mask}`, network, mask });
  } else {
    if (!value) {
      alert('请填写规则值');
      return;
    }
    currentRules.push({ type, value });
  }

  document.getElementById('rule-value').value = '';
  document.getElementById('rule-network').value = '';
  document.getElementById('rule-mask').value = '';
  renderRules();
}

async function saveRules() {
  const ruleMode = document.getElementById('rule-mode').value;
  await sendMessage({ action: 'setRules', rules: currentRules, ruleMode });
  currentConfig = await sendMessage({ action: 'getConfig' });
  alert('规则已保存');
}

// ==================== PAC 设置 ====================

function renderPac() {
  document.getElementById('pac-url').value = currentConfig.pacUrl || '';
  document.getElementById('pac-script').value = currentConfig.pacScript || '';
}

async function savePac() {
  const pacUrl = document.getElementById('pac-url').value.trim();
  const pacScript = document.getElementById('pac-script').value.trim();
  await sendMessage({ action: 'setPac', pacUrl, pacScript });
  currentConfig = await sendMessage({ action: 'getConfig' });
  alert('PAC 设置已保存');
}

// ==================== 导入/导出 ====================

async function exportConfig() {
  const config = await sendMessage({ action: 'exportConfig' });
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'proxy-manager-config.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importConfig() {
  const fileInput = document.getElementById('file-import');
  const file = fileInput.files[0];
  if (!file) {
    alert('请先选择文件');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const config = JSON.parse(e.target.result);
      if (!config.mode || !Array.isArray(config.proxies)) {
        alert('配置文件格式无效');
        return;
      }
      await sendMessage({ action: 'importConfig', config });
      currentConfig = await sendMessage({ action: 'getConfig' });
      currentRules = [...(currentConfig.rules || [])];
      renderProxies();
      renderRules();
      renderPac();
      alert('配置导入成功');
    } catch (err) {
      alert('导入失败：' + err.message);
    }
  };
  reader.readAsText(file);
}

// ==================== 工具函数 ====================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
