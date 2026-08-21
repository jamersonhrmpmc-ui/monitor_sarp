// Monitor SARP - Popup Controller
document.addEventListener('DOMContentLoaded', async () => {
  const toggleMonitoring = document.getElementById('toggleMonitoring');
  const statusText = document.getElementById('statusText');
  const currentDomain = document.getElementById('currentDomain');

  const helpNoticeLink = document.getElementById('helpNoticeLink');
  const optionsNoticeLink = document.getElementById('optionsNoticeLink');
  const testarntfy = document.getElementById('testarntfy');
  
  // Botões do Header
  const btnOptions = document.getElementById('btnOptions');
  const btnHelp = document.getElementById('btnHelp');

  // Carregar estado salvo via chrome.storage.sync
  chrome.storage.sync.get(
    ['isActive'],
    (data) => {

      const isActive = data.isActive !== false;
      toggleMonitoring.checked = isActive;
      updateStatusUI(isActive);

    }
  );

  // Atualizar indicador visual de status
  function updateStatusUI(isActive) {

    if (isActive) {

      statusText.textContent =
        'Ativo e Escaneando';

      statusText.classList.remove(
        'paused'
      );

    } else {

      statusText.textContent =
        'Monitor Parado';

      statusText.classList.add(
        'paused'
      );

    }
  }

  // Alternar monitoramento
  toggleMonitoring.addEventListener(
    'change',
    (e) => {

      const isActive =
        e.target.checked;

      updateStatusUI(isActive);

      // Salva no storage do Chrome
      chrome.storage.sync.set({
        isActive
      });

      // Notifica o Background Service Worker
      chrome.runtime.sendMessage({
        action: 'TOGGLE_MONITORING',
        payload: {
          isActive
        }
      });

    }
  );

  // Abrir tela de Opções / Configurações da Extensão
  btnOptions.addEventListener(
    'click',
    () => {

      if (chrome.runtime.openOptionsPage) {

        chrome.runtime.openOptionsPage();

      } else {

        window.open(
          chrome.runtime.getURL(
            'options/options.html'
          )
        );

      }

    }
  );

  // Abrir página de Ajuda
  btnHelp.addEventListener(
    'click',
    () => {

      chrome.tabs.create({
        url: chrome.runtime.getURL(
          'help/help.html'
        )
      });

    }
  );

  helpNoticeLink.addEventListener(
    'click',
    () => {
      btnHelp.click();
    }
  );

  optionsNoticeLink.addEventListener(
    'click',
    () => {
      btnOptions.click();
    }
  );

  testarntfy.addEventListener(
    'click',
    () => {
      testeNtfy();
    }
  );

  // FUNÇÃO DE TESTE SIMPLIFICADA
  async function testeNtfy() {
    console.log('[Monitor SARP] ===== INÍCIO DO TESTE =====');

    try {
      const { ntfyURL: ntfyUrl } = await chrome.storage.sync.get(['ntfyURL']);

      if (!ntfyUrl) {
        console.warn('[Monitor SARP] URL do ntfy não configurada');
        return;
      }

      const mensagem = '🧪 TESTE CONCLUIDO\n\nMonitor SARP funcionando corretamente.';

      const sucesso = await enviarParaNtfy(mensagem, ntfyUrl);

      if (sucesso) {
        console.log('[Monitor SARP] Teste enviado com sucesso para o ntfy');
      } else {
        console.warn('[Monitor SARP] Falha ao enviar o teste');
      }

    } catch (erro) {
      console.warn('[Monitor SARP] Erro durante o teste:', erro);
    }

    console.log('[Monitor SARP] ===== FIM DO TESTE =====');
  }

  // ENVIA A MENSAGEM PARA O ntfy
  async function enviarParaNtfy(mensagem, ntfyUrl) {
    try {

      const response = await fetch(ntfyUrl, {
        method: 'POST',
        headers: {
          'Title': 'Monitor SARP',
          'Priority': 'high'
        },
        body: mensagem
      });

      if (!response.ok) {
        const data = await response.text();
        console.error( '[Monitor SARP] Erro ntfy:', response.status, data );
        return false;
      }

      console.log( '[Monitor SARP] Mensagem enviada com sucesso para o ntfy' );
      return true;

    } catch (error) {

      console.warn( '[Monitor SARP] Falha ao enviar para o ntfy:',
        error
      );
      return false;

    }
  }

});