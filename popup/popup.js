// Minitor Sarp - Popup Controller
document.addEventListener('DOMContentLoaded', async () => {
  const toggleMonitoring = document.getElementById('toggleMonitoring');
  const statusText = document.getElementById('statusText');
  const currentDomain = document.getElementById('currentDomain');
  const statElements = document.getElementById('statElements');
  const statAlerts = document.getElementById('statAlerts');
  const statLatency = document.getElementById('statLatency');
  const btnScanPage = document.getElementById('btnScanPage');
  const btnSendPing = document.getElementById('btnSendPing');
  const btnClearData = document.getElementById('btnClearData');
  const btnOptions = document.getElementById('btnOptions');
  const logList = document.getElementById('logList');

  // Verifica se a aba atual é o SARP
  const unavailableMessage = document.getElementById('unavailableMessage');
  const mainContent = document.getElementById('mainContent');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const isSarp = tab?.url?.startsWith('https://sarp.saude.rn.gov.br/');

    if (!isSarp) {
      mainContent.style.display = 'none';
      unavailableMessage.style.display = 'flex';
      return;
    }
  } catch (err) {
    console.error('Erro ao verificar aba atual:', err);
    mainContent.style.display = 'none';
    unavailableMessage.style.display = 'flex';
    return;
  }

  // Helper para adicionar logs visuais no popup
  function appendLog(msg, type = 'info') {
    const time = new Date().toLocaleTimeString('pt-BR');
    const div = document.createElement('div');
    div.className = `log-item ${type}`;
    div.textContent = `[${time}] ${msg}`;
    logList.prepend(div);
  }

  // 1. Obter aba ativa atual
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      try {
        const urlObj = new URL(tab.url);
        currentDomain.textContent = urlObj.hostname || tab.url.substring(0, 25);
      } catch {
        currentDomain.textContent = tab.url.substring(0, 25);
      }
    }
  } catch (err) {
    console.error('Erro ao obter aba ativa:', err);
  }

  // 2. Carregar estado salvo via chrome.storage.sync
  chrome.storage.sync.get(['isActive', 'alertCount', 'targetSelector'], (data) => {
    const isActive = data.isActive !== false;
    toggleMonitoring.checked = isActive;
    updateStatusUI(isActive);
    if (data.alertCount !== undefined) {
      statAlerts.textContent = data.alertCount;
    }
  });

  // Atualizar indicador visual de status
  function updateStatusUI(isActive) {
    if (isActive) {
      statusText.textContent = 'Ativo e Escaneando';
      statusText.classList.remove('paused');
    } else {
      statusText.textContent = 'Monitor Pausado';
      statusText.classList.add('paused');
    }
  }

  // 3. Alternar monitoramento
  toggleMonitoring.addEventListener('change', (e) => {
    const isActive = e.target.checked;
    updateStatusUI(isActive);

    // Salva no storage do Chrome
    chrome.storage.sync.set({ isActive }, () => {
      appendLog(isActive ? 'Monitoramento ativado' : 'Monitoramento pausado', 'info');
    });

    // Notifica o Background Service Worker
    chrome.runtime.sendMessage({ action: 'TOGGLE_MONITORING', payload: { isActive } });
  });

  // 4. Ação: Inspecionar página agora (envia mensagem ao content script)
  btnScanPage.addEventListener('click', async () => {
    btnScanPage.disabled = true;
    appendLog('Inspecionando DOM da aba ativa...', 'info');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        appendLog('Nenhuma aba ativa identificada', 'warn');
        btnScanPage.disabled = false;
        return;
      }

      // Envia mensagem ao content script da página
      chrome.tabs.sendMessage(tab.id, { action: 'SCAN_PAGE' }, (response) => {
        btnScanPage.disabled = false;
        if (chrome.runtime.lastError) {
          appendLog('Content script não encontrado ou página restrita.', 'warn');
          return;
        }

        if (response && response.success) {
          statElements.textContent = response.elementCount || '0';
          statLatency.textContent = (response.durationMs || 10) + 'ms';
          appendLog(`Escaneamento concluído: ${response.elementCount} nós DOM encontrados`, 'success');
        }
      });
    } catch (err) {
      btnScanPage.disabled = false;
      appendLog('Falha ao comunicar com a página.', 'warn');
    }
  });

  // 5. Enviar Ping de teste ao Background Worker
  btnSendPing.addEventListener('click', () => {
    const start = performance.now();
    chrome.runtime.sendMessage({ action: 'PING', timestamp: Date.now() }, (response) => {
      const latency = Math.round(performance.now() - start);
      statLatency.textContent = `${latency}ms`;
      appendLog(`Resposta do Background: ${response?.message || 'PONG'}`, 'success');
    });
  });

  // 6. Limpar cache / dados salvos
  btnClearData.addEventListener('click', () => {
    chrome.storage.sync.set({ alertCount: 0 }, () => {
      statAlerts.textContent = '0';
      appendLog('Cache e contadores resetados com sucesso.', 'info');
    });
  });

  // 7. Abrir tela de Opções / Configurações da Extensão
  btnOptions.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });
});