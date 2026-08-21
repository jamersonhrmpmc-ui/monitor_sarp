// Monitor SARP - Content Script
// Injetado na página web conforme regra do manifest.json
const DEBUG = false;

function log(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

log('[Monitor SARP] Content script ativo na página:', window.location.href);

chrome.storage.sync.get(['isActive'], (data) => {
  const isActive = data.isActive !== false;
  if (isActive) {
    injectMonitorHUD();
  }
});

// PÁGINA DE CHAMADOS
const paginaChamados = window.location.pathname === '/ti/chamados';

if (paginaChamados) {
  window.addEventListener('load', async () => {
    log('[Monitor SARP] Página /ti/chamados carregada.');

    chrome.storage.sync.get(['isActive'], async (data) => {
      const isActive = data.isActive !== false;

      if (!isActive) {
        return;
      }

      // Personaliza a página
      personalizarPaginaChamados();

      // Primeiro cria o painel e atualiza os contadores
      await atualizarContadoresPagina();

      // Depois busca as últimas notificações
      // através do Background.
      carregarUltimosChamados();

    });
  });
}

// OBTER_ULTIMOS_CHAMADOS.
function carregarUltimosChamados() {

  log('[Monitor SARP] Solicitando últimas notificações ao Background...');

  chrome.runtime.sendMessage(
    {
      action: 'OBTER_ULTIMOS_CHAMADOS'
    },
    (resposta) => {

      // Verifica erro de comunicação
      if (chrome.runtime.lastError) {

        console.warn( '[Monitor SARP] Erro ao consultar últimas notificações:', chrome.runtime.lastError.message );

        atualizarUltimosChamados([], null);
        return;
      }

      // Nenhuma resposta
      if (!resposta) {
        console.warn( '[Monitor SARP] Background não retornou dados das últimas notificações.' );

        atualizarUltimosChamados([], null);
        return;
      }

      log( '[Monitor SARP] Últimas notificações recebidas:', resposta );

      // Garante que sempre teremos um array
      const chamados =
        Array.isArray(resposta.ultimosChamados)
          ? resposta.ultimosChamados
          : [];

      // Data já vem pronta do Background/session
      const atualizadoEm = resposta.atualizadoEm || null;

      atualizarUltimosChamados(
        chamados,
        atualizadoEm
      );

    }
  );
}

// ESCUTA MENSAGENS DO BACKGROUND / POPUP
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {

    log( '[Monitor SARP] Mensagem recebida:', request.action );

    // ATIVA / DESATIVA HUD
    if (request.action === 'TOGGLE_HUD') {
      if (request.isActive) {
        injectMonitorHUD();
      } else {
        removeMonitorHUD();
      }

      sendResponse({
        success: true
      });

      return true;
    }

    // ATUALIZA PÁGINA
    if (request.action === 'ATT_PAG') {
      log('[Monitor SARP] Atualizando página...');
      sendResponse({
        success: true
      });

      location.reload();

      return true;
    }

    // ATUALIZA HUD DE CHAMADOS
    if (request.action === 'ATUALIZAR_HUD_CHAMADOS') {

      log('[Monitor SARP] Background avisou que existem novos chamados.');

      // Pedimos novamente os dados ao Background.
      carregarUltimosChamados();

      sendResponse({
        success: true
      });

      return true;
    }

    return true;
  }
);

// INJETA HUD PEQUENO "MONITOR SARP ATIVO"
function injectMonitorHUD() {

  // Evita criar duas vezes
  if (document.getElementById('monitor-sarp-hud')) {
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
  const hud = document.getElementById('monitor-sarp-hud');

  if (hud) {
    hud.remove();
  }
}

// PERSONALIZAÇÃO DA PÁGINA DE CHAMADOS
function personalizarPaginaChamados() {

  const paginaChamados = window.location.pathname === '/ti/chamados';

  if (!paginaChamados) {
    return;
  }

  log( '[Monitor SARP] Personalizando página de chamados...' );

  // Esconde os cards originais
  const cardsOriginais =
    document.querySelector(
      '.card-body > .row.g-4.mb-4'
    );

  if (cardsOriginais) {
    cardsOriginais.style.display = 'none';
  }

  // Localiza "RESULTADOS POR PÁGINA"
  const seletorQuantidade =
    document.querySelector(
      '#DataTables_Table_0_length'
    );

  const informacoesTabela =
    document.querySelector(
      '#DataTables_Table_0_info'
    );

  if (!seletorQuantidade || !informacoesTabela) {
    log( '[Monitor SARP] Elementos do DataTables ainda não encontrados.' );

    return;
  }

  // Cria área inferior
  let barraInferior =
    document.getElementById(
      'monitor-sarp-barra-tabela'
    );

  if (!barraInferior) {

    barraInferior = document.createElement('div');

    barraInferior.id = 'monitor-sarp-barra-tabela';

    const wrapper =
      document.querySelector(
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

    barraInferior.appendChild(
      seletorQuantidade
    );

  }

  // Move "MOSTRANDO DE..."
  if (
    informacoesTabela &&
    !barraInferior.contains(informacoesTabela)
  ) {

    barraInferior.appendChild(
      informacoesTabela
    );

  }

  // Move paginação
  const paginacao =
    document.querySelector(
      '#DataTables_Table_0_paginate'
    );


  if (
    paginacao &&
    !barraInferior.contains(paginacao)
  ) {

    barraInferior.appendChild(
      paginacao
    );

  }

  log( '[Monitor SARP] Interface da página personalizada.');
}

// ATUALIZA OS CONTADORES DO SARP
async function atualizarContadoresPagina() {
  // Segurança
  if ( window.location.pathname !== '/ti/chamados' ) {
    return;
  }

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

    // Procura o painel
    let painel =
      document.getElementById(
        'monitor-sarp-painel-superior'
      );

    // Cria o painel se não existir
    if (!painel) {

      painel = document.createElement('div');
      painel.id = 'monitor-sarp-painel-superior';

      painel.innerHTML = `
        
        <!-- ÁREA ESQUERDA -->
        <div class="monitor-sarp-area-info">

          <div class="monitor-sarp-info-titulo">
            <i class="bi bi-activity"></i>
            <span>
              Últimas notificações
            </span>
          </div>

          <div class="monitor-sarp-info-conteudo">
            <!--
              Conteúdo preenchido por
              atualizarUltimosChamados()
            -->
          </div>

        </div>

        <!--ÁREA DIREITA -->
        <div class="monitor-sarp-contadores">

          <!-- ABERTOS -->
          <div class="monitor-sarp-contador">
            <div class="monitor-sarp-contador-icone aberto">
              <i class="bi bi-ticket-perforated"></i>
            </div>

            <div class="monitor-sarp-contador-info">
              <span>
                Abertos
              </span>
              <strong id="monitor-sarp-abertos">
                0
              </strong>
            </div>
          </div>

          <!-- EM ATENDIMENTO -->
          <div class="monitor-sarp-contador">
            <div class="monitor-sarp-contador-icone atendimento">
              <i class="bi bi-headset"></i>
            </div>

            <div class="monitor-sarp-contador-info">
              <span>
                Em Atendimento
              </span>
              <strong id="monitor-sarp-atendimentos">
                0
              </strong>
            </div>
          </div>

          <!-- PENDENTES -->
          <div class="monitor-sarp-contador">
            <div class="monitor-sarp-contador-icone pendente" >
              <i class="bi bi-ticket"></i>
            </div>

            <div class="monitor-sarp-contador-info">
              <span>
                Pendentes
              </span>
              <strong id="monitor-sarp-pendentes">
                0
              </strong>
            </div>
          </div>

          <!-- FECHADOS -->
          <div class="monitor-sarp-contador">
            <div class="monitor-sarp-contador-icone fechado" >
              <i class="bi bi-ticket-detailed"></i>
            </div>

            <div class="monitor-sarp-contador-info">
              <span>
                Fechados
              </span>
              <strong id="monitor-sarp-fechados">
                0
              </strong>
            </div>
          </div>

        </div>

      `;

      // Insere o painel no SARP
      const titulo =
        document.querySelector(
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

    const elementoAbertos =
      document.getElementById(
        'monitor-sarp-abertos'
      );

    const elementoAtendimentos =
      document.getElementById(
        'monitor-sarp-atendimentos'
      );

    const elementoPendentes =
      document.getElementById(
        'monitor-sarp-pendentes'
      );

    const elementoFechados =
      document.getElementById(
        'monitor-sarp-fechados'
      );

    if (elementoAbertos) {
      elementoAbertos.textContent =
        nAbertos;
    }

    if (elementoAtendimentos) {
      elementoAtendimentos.textContent =
        nAtendimentos;
    }

    if (elementoPendentes) {
      elementoPendentes.textContent =
        nPendentes;
    }

    if (elementoFechados) {
      elementoFechados.textContent =
        nFechados;
    }

    log( '[Monitor SARP] Contadores atualizados:',
      {
        nAbertos,
        nAtendimentos,
        nPendentes,
        nFechados
      }
    );

  } catch (erro) {

    console.warn( '[Monitor SARP] Erro ao atualizar os contadores:', erro);

  }
}

// ATUALIZA AS ÚLTIMAS NOTIFICAÇÕES
function atualizarUltimosChamados( chamados = [], atualizadoEm = null ) {

  const area =
    document.querySelector(
      '.monitor-sarp-info-conteudo'
    );

  // Se o painel ainda não existe, simplesmente sai. Não gera erro.
  if (!area) {
    log( '[Monitor SARP] Área de últimas notificações ainda não existe.' );
    return;
  }

  // NÃO EXISTEM NOTIFICAÇÕES
  if (
    !Array.isArray(chamados) ||
    chamados.length === 0
  ) {

    area.innerHTML = `
      <div class="monitor-sarp-sem-chamados">
        Nenhuma notificação enviada recentemente. Configure o ntfy, faça um teste e receba notificações
      </div>
    `;

    return;
  }

  // EXISTEM NOTIFICAÇÕES A data vem pronta do Background/session. É mostrada UMA ÚNICA VEZ.
  const dataExibicao = atualizadoEm || '-';

  area.innerHTML = `

    <!-- DATA/HORA DA ÚLTIMA NOTIFICAÇÃO -->
    <div class="monitor-sarp-ultima-atualizacao">
      Última atualização:
      <strong>${dataExibicao}</strong>
    </div>

    <!-- LISTA DE CHAMADOS -->
    <div class="monitor-sarp-lista-chamados">
      ${chamados.map((chamado) => `
          <div class="monitor-sarp-chamado">
            <div class="monitor-sarp-chamado-principal">
              <strong>
                ${chamado.numero || '-'}
              </strong>
              <span>
                ${chamado.nome || 'Não informado'}
              </span>
            </div>

            <div class="monitor-sarp-chamado-detalhes">
              <span>
                ${chamado.servico || '-'}
              </span>
              <span>
                ${chamado.prioridade || '-'}
              </span>
              <span>
                ${chamado.tipo || '-'}
              </span>
            </div>
          </div>
        `).join('')
    }
    </div>
  `;
}

// OBSERVA ALTERAÇÕES NO STORAGE SYNC
chrome.storage.onChanged.addListener(
  (changes, areaName) => {

    // Só interessa o SYNC
    if (areaName !== 'sync') {
      return;
    }

    // Só interessa a página de chamados
    if ( window.location.pathname !== '/ti/chamados' ) {
      return;
    }

    // Verifica se algum contador mudou
    const contadorAlterado =
      changes.nAbertos ||
      changes.nAtendimentos ||
      changes.nPendentes ||
      changes.nFechados;

    // Se mudou, atualiza
    if (contadorAlterado) {
      atualizarContadoresPagina();
    }

  }
);