// Minitor Sarp - Options Controller
document.addEventListener('DOMContentLoaded', () => {
  const monitoringInterval = document.getElementById('monitoringInterval');
  const targetSelector = document.getElementById('targetSelector');
  const autoNotify = document.getElementById('autoNotify');
  const soundEnabled = document.getElementById('soundEnabled');
  const btnSave = document.getElementById('btnSave');
  const saveStatus = document.getElementById('saveStatus');

  // Carregar preferências salvas
  chrome.storage.sync.get({
    monitoringInterval: 30,
    targetSelector: 'body',
    autoNotify: true,
    soundEnabled: false
  }, (items) => {
    monitoringInterval.value = items.monitoringInterval;
    targetSelector.value = items.targetSelector;
    autoNotify.checked = items.autoNotify;
    soundEnabled.checked = items.soundEnabled;
  });

  // Salvar preferências
  btnSave.addEventListener('click', () => {
    const config = {
      monitoringInterval: parseInt(monitoringInterval.value, 10) || 30,
      targetSelector: targetSelector.value || 'body',
      autoNotify: autoNotify.checked,
      soundEnabled: soundEnabled.checked
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