// Minitor SARP - Options Controller
document.addEventListener('DOMContentLoaded', () => {
  const monitoringInterval = document.getElementById('monitoringInterval');
  const targetSelector = document.getElementById('targetSelector');
 
  const btnSave = document.getElementById('btnSave');
  const saveStatus = document.getElementById('saveStatus');

  // Carregar preferências salvas
  chrome.storage.sync.get({
    monitoringInterval: 30,
    targetSelector: 'TODOS'
  }, (items) => {
    monitoringInterval.value = items.monitoringInterval;
    targetSelector.value = items.targetSelector;
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

    const config = {
      monitoringInterval: intervalValue,
      targetSelector: targetSelector.value || 'TODOS',
    };

    chrome.storage.sync.set(config, () => {
      saveStatus.textContent = 'Preferências salvas com sucesso!';
      saveStatus.style.opacity = '1';
      setTimeout(() => {
        saveStatus.style.opacity = '0';
      }, 2500);
    });
  });

});