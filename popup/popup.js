// Monitor SARP - Popup Controller
document.addEventListener('DOMContentLoaded', async () => {
  const toggleMonitoring = document.getElementById('toggleMonitoring');
  const statusText = document.getElementById('statusText');
  const currentDomain = document.getElementById('currentDomain');
  const btnClearData = document.getElementById('btnClearData');

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

  // Obter aba ativa atual
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

  // Carregar estado salvo via chrome.storage.sync
  chrome.storage.sync.get(['isActive'], (data) => {
    const isActive = data.isActive !== false;
    toggleMonitoring.checked = isActive;
    updateStatusUI(isActive);
    // if (data.alertCount !== undefined) {
    //   statAlerts.textContent = data.alertCount;
    // }
  });

  // Atualizar indicador visual de status
  function updateStatusUI(isActive) {
    if (isActive) {
      statusText.textContent = 'Ativo e Escaneando';
      statusText.classList.remove('paused');
    } else {
      statusText.textContent = 'Monitor Parado';
      statusText.classList.add('paused');
    }
  }

  // Limpar cache / dados salvos
  btnClearData.addEventListener('click', async () => {
    // await chrome.storage.sync.set({
    //   alertCount: 0
    // });

    toggleMonitoring.checked = false;
    toggleMonitoring.dispatchEvent(new Event('change'));
  });

  // Alternar monitoramento
  toggleMonitoring.addEventListener('change', (e) => {
    const isActive = e.target.checked;
    updateStatusUI(isActive);

    // Salva no storage do Chrome
    chrome.storage.sync.set({ isActive });

    // Notifica o Background Service Worker
    chrome.runtime.sendMessage({ action: 'TOGGLE_MONITORING', payload: { isActive } });
  });

  // Abrir tela de Opções / Configurações da Extensão
  btnOptions.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });

});