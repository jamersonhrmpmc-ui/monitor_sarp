// Monitor SARP - Options Controller
document.addEventListener('DOMContentLoaded', () => {
  const monitoringInterval = document.getElementById('monitoringInterval');
  const targetSelector = document.getElementById('targetSelector');
  const ntfyURL = document.getElementById('ntfyurl');
 
  const btnSave = document.getElementById('btnSave');
  const saveStatus = document.getElementById('saveStatus');

  // Carregar preferências salvas
  chrome.storage.sync.get({
    targetSelector: 'TODOS',
    ntfyURL: '',
  }, (items) => {
    targetSelector.value = items.targetSelector;
    ntfyURL.value = items.tokentel;
  });

  // Salvar preferências
  btnSave.addEventListener('click', () => {

    const ntfyUrl = ntfyURL.value.trim();

    // Validação
    if (!ntfyUrl){
      saveStatus.textContent = 'Preencha a URL!';
      saveStatus.style.color = '#e74c3c';
      saveStatus.style.opacity = '1';
      setTimeout(() => {
        saveStatus.style.opacity = '0';
        saveStatus.style.color = ''; // volta a cor original
      }, 3000);
      return;
    }

    const config = {
      targetSelector: targetSelector.value || 'TODOS',
      ntfyURL: ntfyUrl,
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