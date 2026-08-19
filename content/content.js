// Monitor SARP - Content Script
// Injetado na página web conforme regra do manifest.json

console.log( '[Monitor SARP] Content script ativo na página:', window.location.href );

chrome.storage.sync.get(['isActive'], (data) => {
  const isActive = data.isActive !== false;
  if (isActive) {
    injectMonitorHUD();
  }
});

// Somente a página principal de chamados recebe as alterações de interface.
const paginaChamados = window.location.pathname === '/ti/chamados';

// const paginaChamados = window.location.href.startsWith(
//   'https://sarp.saude.rn.gov.br/ti/chamados'
// );

if (paginaChamados) {
  // Espera a página terminar de carregar.
  window.addEventListener('load', () => {
    
    console.log( '[Monitor SARP] Página /ti/chamados carregada.' );

    // Espera o SARP terminar de montar
    chrome.storage.sync.get(['isActive'], (data) => {
      const isActive = data.isActive !== false;
      if (isActive) {
        personalizarPaginaChamados();

        atualizarContadoresPagina();
         
      }
    });
  });
}

// ESCUTA MENSAGENS DO BACKGROUND / POPUP
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {

    // Ativa / Desativa HUD
     if (request.action === 'TOGGLE_HUD') {
      if (request.isActive) {
        injectMonitorHUD();
      } else {
        removeMonitorHUD();
      }
      sendResponse({ success: true });
    }

    // Atualiza página
    if (request.action === 'ATT_PAG') {
      console.log( '[Monitor SARP] Atualizando página...' );
      sendResponse({ success: true });

      location.reload();
    }

    return true;
  }
);

// INJETA HUD
function injectMonitorHUD() {
  // Evita criar duas vezes
  if ( document.getElementById( 'monitor-sarp-hud' )) {
    return;
  }
  const hud = document.createElement('div');
  hud.id = 'monitor-sarp-hud';

  hud.innerHTML = `
    <div class="monitor-hud-content">
      <span class="monitor-pulse"></span>
      <span class="monitor-text">
        <b>Monitor SARP Ativo</b>
      </span>
    </div>
  `;

  document.body.appendChild(hud);
}

// REMOVE HUD
function removeMonitorHUD() {
  const hud = document.getElementById( 'monitor-sarp-hud' );
  if (hud) {
    hud.remove();
  }
}

// PERSONALIZAÇÃO DA PÁGINA DE CHAMADOS
function personalizarPaginaChamados() {

    const paginaChamados = window.location.pathname === '/ti/chamados';

    // const paginaChamados = window.location.href.startsWith(
    //   'https://sarp.saude.rn.gov.br/ti/chamados'
    // );

    if (!paginaChamados) {
        return;
    }

    console.log('[Monitor SARP] Personalizando página de chamados...');

    // Esconde os cards originais
    const cardsOriginais = document.querySelector(
        '.card-body > .row.g-4.mb-4'
    );

    if (cardsOriginais) {
        cardsOriginais.style.display = 'none';
    }

    // Localizao seletor "RESULTADOS POR PÁGINA"
    const seletorQuantidade = document.querySelector(
        '#DataTables_Table_0_length'
    );
    const informacoesTabela = document.querySelector(
        '#DataTables_Table_0_info'
    );

    if (!seletorQuantidade || !informacoesTabela) {
        console.log( '[Monitor SARP] Elementos do DataTables ainda não encontrados.' );
        return;
    }

    // Cria uma area para as informações inferiores
    let barraInferior = document.getElementById(
        'monitor-sarp-barra-tabela'
    );

    if (!barraInferior) {
        barraInferior = document.createElement('div');
        barraInferior.id = 'monitor-sarp-barra-tabela';

        // Coloca a barra dentro do DataTables
        const wrapper = document.querySelector(
            '#DataTables_Table_0_wrapper'
        );

        if (wrapper) {
            wrapper.appendChild(barraInferior);
        }
    }

    // Move "RESULTADOS POR PÁGINA"
    if (
        seletorQuantidade &&
        !barraInferior.contains(seletorQuantidade)
    ) {
        barraInferior.appendChild(seletorQuantidade);
    }

    // Mmove a informação "MOSTRANDO DE..."
    if (
        informacoesTabela &&
        !barraInferior.contains(informacoesTabela)
    ) {
        barraInferior.appendChild(informacoesTabela);
    }

    // Move a paginação para a barra inferior
    const paginacao = document.querySelector(
        '#DataTables_Table_0_paginate'
    );

    if (
        paginacao &&
        !barraInferior.contains(paginacao)
    ) {
        barraInferior.appendChild(paginacao);
    }

    console.log( '[Monitor SARP] Interface da página personalizada.' );
}

// ATUALIZA OS CONTADORES DO SARP NA PÁGINA
async function atualizarContadoresPagina() {

  // Segurança: só funciona na página de chamados
  if (window.location.pathname !== '/ti/chamados') {
      return;
    }
  // if (
  //   !window.location.href.startsWith(
  //     'https://sarp.saude.rn.gov.br/ti/chamados'
  //   )
  // ) {
  //   return;
  // }

  try {

    // Pega os números salvos pelo Background
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

    // Procura a área onde vamos inserir nosso painel
    let painel = document.getElementById(
      'monitor-sarp-painel-superior'
    );

    // Se ainda não existe, cria
    if (!painel) {
      painel = document.createElement('div');
      painel.id = 'monitor-sarp-painel-superior';
      painel.innerHTML = `

        <!-- ÁREA ESQUERDA -->
        <div class="monitor-sarp-area-info">

          <div class="monitor-sarp-info-titulo">
            <i class="bi bi-activity"></i>
            <span>Monitor SARP</span>
          </div>

          <div class="monitor-sarp-info-conteudo">
            <!--
              Futuramente podemos colocar aqui:
              - último chamado recebido
              - horário da última atualização
              - chamados novos
              - status do monitor
              - filtros rápidos
              etc.
            -->
          </div>

        </div>


        <!-- ÁREA DIREITA -->
        <div class="monitor-sarp-contadores">

          <!-- ABERTOS -->
          <div class="monitor-sarp-contador">

            <div class="monitor-sarp-contador-icone aberto">
              <i class="bi bi-ticket-perforated"></i>
            </div>

            <div class="monitor-sarp-contador-info">
              <span>Abertos</span>
              <strong id="monitor-sarp-abertos">0</strong>
            </div>

          </div>


          <!-- EM ATENDIMENTO -->
          <div class="monitor-sarp-contador">

            <div class="monitor-sarp-contador-icone atendimento">
              <i class="bi bi-headset"></i>
            </div>

            <div class="monitor-sarp-contador-info">
              <span>Em Atendimento</span>
              <strong id="monitor-sarp-atendimentos">0</strong>
            </div>

          </div>


          <!-- PENDENTES -->
          <div class="monitor-sarp-contador">

            <div class="monitor-sarp-contador-icone pendente">
              <i class="bi bi-ticket"></i>
            </div>

            <div class="monitor-sarp-contador-info">
              <span>Pendentes</span>
              <strong id="monitor-sarp-pendentes">0</strong>
            </div>

          </div>


          <!-- FECHADOS -->
          <div class="monitor-sarp-contador">

            <div class="monitor-sarp-contador-icone fechado">
              <i class="bi bi-ticket-detailed"></i>
            </div>

            <div class="monitor-sarp-contador-info">
              <span>Fechados</span>
              <strong id="monitor-sarp-fechados">0</strong>
            </div>

          </div>

        </div>
      `;

      const titulo = document.querySelector(
        '#main-content .card > .bg-primary'
      );

      if (titulo) {

        titulo.insertAdjacentElement(
          'afterend',
          painel
        );

      } else {

        console.warn( '[Monitor SARP] Título do painel não encontrado.' );
        return;
      }
    }

    // Atualiza os números
    const elementoAbertos = document.getElementById(
      'monitor-sarp-abertos'
    );

    const elementoAtendimentos = document.getElementById(
      'monitor-sarp-atendimentos'
    );

    const elementoPendentes = document.getElementById(
      'monitor-sarp-pendentes'
    );

    const elementoFechados = document.getElementById(
      'monitor-sarp-fechados'
    );

    if (elementoAbertos) {
      elementoAbertos.textContent = nAbertos;
    }

    if (elementoAtendimentos) {
      elementoAtendimentos.textContent = nAtendimentos;
    }

    if (elementoPendentes) {
      elementoPendentes.textContent = nPendentes;
    }

    if (elementoFechados) {
      elementoFechados.textContent = nFechados;
    }

    console.log( '[Monitor SARP] Contadores atualizados:',
      {
        nAbertos,
        nAtendimentos,
        nPendentes,
        nFechados
      }
    );

  } catch (erro) {

    console.warn( '[Monitor SARP] Erro ao atualizar os contadores:', erro );

  }
}

// OBSERVA ALTERAÇÕES NO STORAGE
chrome.storage.onChanged.addListener(
  (changes, areaName) => {

    // Só interessa o storage SYNC
    if ( areaName !== 'sync' ) {
      return;
    }

    // Só interessa a página /ti/chamados
    if (window.location.pathname !== '/ti/chamados') {
      return;
    }
      // if (
      // !window.location.href.startsWith(
      // 'https://sarp.saude.rn.gov.br/ti/chamados' )
      // ) {
      //   return;
      // }

    // Verifica se algum contador mudou
    const contadorAlterado =
      changes.nAbertos ||
      changes.nAtendimentos ||
      changes.nPendentes ||
      changes.nFechados;
      
    // Se mudou, atualiza a interface
    if (contadorAlterado) {
      atualizarContadoresPagina();
    }
  }
);