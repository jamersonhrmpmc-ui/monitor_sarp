// Monitor SARP - Options Controller
document.addEventListener('DOMContentLoaded', () => {
  const monitoringInterval = document.getElementById('monitoringInterval');
  const targetSelector = document.getElementById('targetSelector');
  const tokentel = document.getElementById('tokentel');
  // const chatidtel = document.getElementById('chatidtel');
 
  const btnSave = document.getElementById('btnSave');
  const saveStatus = document.getElementById('saveStatus');

  // Carregar preferências salvas
  chrome.storage.sync.get({
    monitoringInterval: 30,
    targetSelector: 'TODOS',
    tokentel: '',
  }, (items) => {
    monitoringInterval.value = items.monitoringInterval;
    targetSelector.value = items.targetSelector;
    tokentel.value = items.tokentel;
  });

  // Salvar preferências
  btnSave.addEventListener('click', () => {
    // Pega o valor digitado ou usa 30 como padrão se estiver vazio
    let intervalValue = parseInt(monitoringInterval.value, 10) || 30;

    // Aplica os limites de fato (mínimo 30 e máximo 300)
    if (intervalValue < 30) intervalValue = 30;
    if (intervalValue > 300) intervalValue = 300;

    // Atualiza o campo na tela para o usuário ver a correção
    monitoringInterval.value = intervalValue;

    const token = tokentel.value.trim();
    // const chatId = chatidtel.value.trim();

    // Validação: Token e Chat ID não podem estar vazios
    if (!token){ // || !chatId) {
      saveStatus.textContent = 'Preencha o Token e o Chat ID do Telegram!';
      saveStatus.style.color = '#e74c3c';
      saveStatus.style.opacity = '1';
      setTimeout(() => {
        saveStatus.style.opacity = '0';
        saveStatus.style.color = ''; // volta a cor original
      }, 3000);
      return;
    }

    const config = {
      monitoringInterval: intervalValue,
      targetSelector: targetSelector.value || 'TODOS',
      tokentel: token,
      // chatidtel: chatId
    };

    chrome.storage.sync.set(config, () => {
      saveStatus.textContent = 'Preferências salvas com sucesso!';
      saveStatus.style.color = '#2ecc71'; // verde (opcional)
      saveStatus.style.opacity = '1';
      setTimeout(() => {
        saveStatus.style.opacity = '0';
        saveStatus.style.color = '';
      }, 2500);
    });
  });
});