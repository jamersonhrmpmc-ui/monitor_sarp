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
      atualizarContadoresPagina();
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


// ATUALIZA OS CONTADORES DO SARP NA PÁGINA
async function atualizarContadoresPagina() {
  try {

    const {
      nAbertos = 0,
      nAtendimentos = 0,
      nPendentes = 0,
      nFechados = 0
    } = await chrome.storage.sync.get([
      'nAbertos',
      'nAtendimentos',
      'nPendentes',
      'nFechados'
    ]);

    // Pega todos os elementos .count da área dos cards
    const contadores = document.querySelectorAll('.count');

    if (contadores.length < 4) {
      console.log('[Monitor SARP] Cards de contadores ainda não encontrados.');
      return;
    }

    // Ordem dos cards na página:
    // 0 = Abertos
    // 1 = Em Atendimento
    // 2 = Pendentes
    // 3 = Fechados

    const valores = [
      nAbertos,
      nAtendimentos,
      nPendentes,
      nFechados
    ];

    contadores.forEach((elemento, index) => {

      if (index >= valores.length) {
        return;
      }

      const valor = valores[index];

      elemento.textContent = valor;
      elemento.dataset.count = valor;

    });

    console.log('[Monitor SARP] Contadores atualizados na página:', {
      nAbertos,
      nAtendimentos,
      nPendentes,
      nFechados
    });

  } catch (erro) {

    console.warn(
      '[Monitor SARP] Erro ao atualizar contadores da página:',
      erro
    );

  }
}


// ATUALIZA AO CARREGAR O CONTENT SCRIPT
atualizarContadoresPagina();


// OBSERVA ALTERAÇÕES NO STORAGE
chrome.storage.onChanged.addListener(
  (changes, areaName) => {

    if (areaName !== 'sync') {
      return;
    }

    const contadorAlterado =
      changes.nAbertos ||
      changes.nAtendimentos ||
      changes.nPendentes ||
      changes.nFechados;

    if (contadorAlterado) {
      atualizarContadoresPagina();
    }

  }
);