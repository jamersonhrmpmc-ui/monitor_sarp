// Monitor SARP - Content Script
// Injetado na página web conforme regra do manifest.json
console.log('[Monitor SARP] Content script ativo na página:', window.location.href);

// Inicia Monitor HUD se estiver ativo
chrome.storage.sync.get(['isActive'], (data) => {
    const isActive = data.isActive !== false;

    if (isActive) {
        injectMonitorHUD();
    }
});

// Escuta mensagens enviadas pelo Popup ou pelo Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'TOGGLE_HUD') {
    if (request.isActive) {
      injectMonitorHUD();
    } else {
      removeMonitorHUD();
    }
    sendResponse({ success: true });
  }

  return true;
});

// Injeta uma pequena tag discreta no centro no topo para indicar o monitoramento
function injectMonitorHUD() {
  if (document.getElementById('monitor-sarp-hud')) return;

  const hud = document.createElement('div');
  hud.id = 'monitor-sarp-hud';
  hud.innerHTML = `
    <div class="monitor-hud-content">
      <span class="monitor-pulse"></span>
      <span class="monitor-text"><b>Monitor SARP Ativo</b></span>
    </div>
  `;
  document.body.appendChild(hud);
}

function removeMonitorHUD() {
  const hud = document.getElementById('monitor-sarp-hud');

  if (hud) {
    hud.remove();
  }
}