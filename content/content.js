// Monitor SARP - Content Script
// Injetado na página web conforme regra do manifest.json

console.log('[Monitor SARP] Content script ativo na página:', window.location.href);

// Escuta mensagens enviadas pelo Popup ou pelo Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // if (request.action === 'SCAN_PAGE') {
  //   const startTime = performance.now();
  //   const allElements = document.querySelectorAll('*');
  //   const images = document.querySelectorAll('img');
  //   const forms = document.querySelectorAll('form');
  //   const links = document.querySelectorAll('a');

  //   const duration = Math.round(performance.now() - startTime);

  //   // Responde ao popup com os dados coletados da página
  //   sendResponse({
  //     success: true,
  //     elementCount: allElements.length,
  //     imageCount: images.length,
  //     formCount: forms.length,
  //     linkCount: links.length,
  //     url: window.location.href,
  //     title: document.title,
  //     durationMs: duration
  //   });
  // }

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
      <span class="monitor-text">Monitor SARP Ativo</span>
    </div>
  `;
  document.body.appendChild(hud);
}

function removeMonitorHUD() {
  const hud = document.getElementById('minitor-sarp-hud');

  if (hud) {
    hud.remove();
  }
}