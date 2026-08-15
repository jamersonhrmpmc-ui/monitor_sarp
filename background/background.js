// Monitor SARP - Background Service Worker (Manifest V3)
console.log('[Monitor SARP] Background Service Worker inicializado.');

// Evento disparado na instalação ou atualização da extensão
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Monitor SARP] Extensão instalada/atualizada:', details.reason);

  // Inicializa o armazenamento padrão
  chrome.storage.sync.set({
    isActive: false,
    monitoringInterval: 30,
    targetSelector: 'TODOS'
  });

  // Define o badge inicial no ícone da extensão
  chrome.action.setBadgeText({ text: 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#64748b' });

  // Cria um alarme de pulso periódico para checagem em segundo plano
  chrome.alarms.create('monitorSarpPulse', { periodInMinutes: 0.5 });
});

// Listener para alarmes periódicos do Chrome
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'monitorSarpPulse') {
    chrome.storage.sync.get(['isActive'], (data) => {
      if (data.isActive !== false) {
        console.log('[Monitor SARP] Pulso de monitoramento executado com sucesso.');
      }

      // Comandos executados a cada 30 segundos.






    });
  }
});

// Listener central de mensagens (comunicação entre Popup, Content Scripts e Background)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Monitor SARP] Mensagem recebida:', request.action, request);

  switch (request.action) {
    // case 'PING':
    //   sendResponse({ message: 'PONG_FROM_BACKGROUND', timestamp: Date.now() });
    //   break;

    case 'TOGGLE_MONITORING':
      const isActive = request.payload?.isActive;
      chrome.action.setBadgeText({ text: isActive ? 'ON' : 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: isActive ? '#0284c7' : '#64748b' });
      //Envia o estado para o Content Script da aba ativa
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'TOGGLE_HUD',
            isActive
          });
        }
      });

      sendResponse({ success: true, isActive });
    break;

    // case 'LOG_EVENT':
    //   // Incrementa o contador de alertas
    //   chrome.storage.sync.get(['alertCount', 'autoNotify'], (data) => {
    //     const newCount = (data.alertCount || 0) + 1;
    //     chrome.storage.sync.set({ alertCount: newCount });

    //     if (data.autoNotify) {
    //       chrome.notifications.create({
    //         type: 'basic',
    //         iconUrl: '../icons/icon48.png',
    //         title: 'Minitor Sarp - Alerta',
    //         message: request.payload?.message || 'Evento detectado na página!'
    //       });
    //     }
    //   });
    //   sendResponse({ received: true });
    //   break;

    default:
      sendResponse({ status: 'unknown_action' });
  }

  return true; // Permite resposta assíncrona
});