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

   if (request.action === 'MONITOR_OFFLINE') {
      mostrarAvisoOffline();
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'MONITOR_ONLINE') {
      // Só fecha o aviso se estiver na tela
      // (o reload da aba já é feito pelo background)
      fecharAvisoOffline(false);
      sendResponse({ success: true });
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

// =====================================================
// AVISO DE OFFLINE (consulta falhou) — SEM RELOAD
// =====================================================
const OFFLINE_ID = 'monitor-sarp-offline-overlay';

function mostrarAvisoOffline() {
  // Já existe? Não cria outro
  if (document.getElementById(OFFLINE_ID)) {
    return;
  }

  // Injeta o CSS do overlay (só uma vez)
  if (!document.getElementById('monitor-sarp-offline-style')) {
    const style = document.createElement('style');
    style.id = 'monitor-sarp-offline-style';
    style.textContent = `
#monitor-sarp-offline-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
  font-family: inherit;
}

.monitor-sarp-offline-box {
  width: min(480px, 92vw);
  padding: 32px 28px;
  border-radius: 16px;
  background: var(--monitor-bg, #1e293b);
  color: var(--monitor-text, #e2e8f0);
  border: 1px solid var(--monitor-border, #334155);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  text-align: center;
}

.monitor-sarp-offline-icon {
  font-size: 48px;
  color: #f59e0b;
  margin-bottom: 12px;
}

.monitor-sarp-offline-box h2 {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
  color: var(--monitor-text-strong, #f8fafc);
}

.monitor-sarp-offline-box p {
  margin: 0 0 10px;
  font-size: 15px;
  line-height: 1.45;
  color: var(--monitor-text, #cbd5e1);
}

.monitor-sarp-offline-sub {
  font-size: 13px !important;
  opacity: 0.85;
  margin-bottom: 22px !important;
}

#monitor-sarp-offline-fechar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 22px;
  border: none;
  border-radius: 8px;
  background: #f59e0b;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}

#monitor-sarp-offline-fechar:hover {
  background: #fbbf24;
  transform: translateY(-1px);
}

[data-bs-theme="light"] .monitor-sarp-offline-box,
html:not([data-bs-theme="dark"]) .monitor-sarp-offline-box {
  background: var(--monitor-bg, #ffffff);
  color: var(--monitor-text, #1e293b);
  border-color: var(--monitor-border, #e2e8f0);
}
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.id = OFFLINE_ID;
  overlay.innerHTML = `
    <div class="monitor-sarp-offline-box">
      <div class="monitor-sarp-offline-icon">
        <i class="bi bi-wifi-off"></i>
      </div>
      <h2>Monitor SARP — OFFLINE</h2>
      <p>
        Não foi possível consultar o SARP.<br>
        A conexão caiu ou o servidor está indisponível.
      </p>
      <p class="monitor-sarp-offline-sub">
        O monitor tentará novamente em breve.<br>
        Você pode fechar este aviso, mas ele reaparecerá se a falha continuar.
      </p>
      <button type="button" id="monitor-sarp-offline-fechar">
        Fechar aviso
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Botão de fechar manual — só fecha, NÃO recarrega
  document.getElementById('monitor-sarp-offline-fechar')
    .addEventListener('click', () => {
      fecharAvisoOffline(false);
    });
}

function fecharAvisoOffline(recarregar = false) {
  const overlay = document.getElementById(OFFLINE_ID);
  if (overlay) {
    overlay.remove();
  }

  // Neste fluxo o reload é feito pelo background.
  // Mantemos o parâmetro só por segurança, mas não usamos mais.
  if (recarregar) {
    location.reload();
  }
}

//ADICIONA UM MENU ACIMA DO TITULO
(function () {
    'use strict';

    const MENU_ID = 'monitor-sarp-menu-superior';
    const STYLE_ID = 'monitor-sarp-menu-style';

    function iniciarMenuSarp() {
        if (document.getElementById(MENU_ID)) {
            return true;
        }

        const sidebar = document.querySelector('#sidebar');
        if (!sidebar) {
            return false;
        }

        const ancora = encontrarCabecalhoPagina();
        if (!ancora) {
            return false;
        }

        const menus = lerSidebar();
        if (!menus.length) {
            return false;
        }

        adicionarCSS();

        const menu = criarMenu(menus);

        ancora.parentNode.insertBefore(menu, ancora);

        configurarFechamentoMenus(menu);
        configurarTema(menu);

        log(
            '[Monitor SARP] Menu superior criado acima de:',
            ancora.querySelector('strong')?.textContent.trim()
        );

        return true;
    }

    function encontrarCabecalhoPagina() {
        const cabecalhos = document.querySelectorAll('div.p-3.text-white.bg-primary');

        for (const cabecalho of cabecalhos) {
            if (cabecalho.closest('#sidebar')) {
                continue;
            }

            const titulo = cabecalho.querySelector('h5 strong');
            if (!titulo) {
                continue;
            }

            return cabecalho;
        }

        return null;
    }

    function lerSidebar() {
        const sidebar = document.querySelector('#sidebar');
        if (!sidebar) {
            return [];
        }

        const menus = [];

        sidebar
            .querySelectorAll('.sidebar-menu > .menu')
            .forEach(menu => {
                menu
                    .querySelectorAll(':scope > .sidebar-item')
                    .forEach(item => {
                        const principal = item.querySelector(':scope > .sidebar-link');
                        if (!principal) {
                            return;
                        }

                        const span = principal.querySelector('span');
                        const icone = principal.querySelector('i');
                        const texto = span
                            ? span.textContent.trim()
                            : principal.textContent.trim();

                        const submenu = item.querySelector(':scope > .submenu');

                        if (!submenu) {
                            const href = principal.getAttribute('href');
                            if (href && href !== '#') {
                                menus.push({
                                    tipo: 'link',
                                    texto: texto,
                                    href: href,
                                    icone: icone ? icone.className : ''
                                });
                            }
                            return;
                        }

                        const filhos = [];

                        submenu
                            .querySelectorAll(':scope > .submenu-item')
                            .forEach(subItem => {
                                const subLink = subItem.querySelector(':scope > .submenu-link');
                                if (!subLink) {
                                    return;
                                }

                                const href = subLink.getAttribute('href');
                                if (!href || href === '#') {
                                    return;
                                }

                                const subSpan = subLink.querySelector('span');
                                const subIcon = subLink.querySelector('i');

                                filhos.push({
                                    texto: subSpan
                                        ? subSpan.textContent.trim()
                                        : subLink.textContent.trim(),
                                    href: href,
                                    icone: subIcon ? subIcon.className : ''
                                });
                            });

                        if (filhos.length) {
                            menus.push({
                                tipo: 'grupo',
                                texto: texto,
                                icone: icone ? icone.className : '',
                                filhos: filhos
                            });
                        }
                    });
            });

        return menus;
    }

    function criarMenu(menus) {
        const nav = document.createElement('nav');
        nav.id = MENU_ID;
        nav.className = 'monitor-sarp-menu-superior';
        nav.setAttribute('aria-label', 'Menu Monitor SARP');

        const inner = document.createElement('div');
        inner.className = 'monitor-sarp-menu-inner';
        nav.appendChild(inner);

        menus.forEach(item => {
            if (item.tipo === 'link') {
                criarLinkPrincipal(inner, item);
                return;
            }

            if (item.tipo === 'grupo') {
                criarGrupo(inner, item);
            }
        });

        const espaco = document.createElement('div');
        espaco.className = 'monitor-sarp-menu-espaco';
        inner.appendChild(espaco);

        const tema = document.createElement('button');
        tema.type = 'button';
        tema.className = 'monitor-sarp-theme-toggle';
        tema.title = 'Alternar tema';
        tema.innerHTML = `
            <span class="monitor-sarp-theme-track">
                <span class="monitor-sarp-theme-thumb">
                    <i class="bi bi-moon-stars-fill"></i>
                </span>
            </span>
        `;
        inner.appendChild(tema);

        return nav;
    }

    function criarLinkPrincipal(container, item) {
        const wrapper = document.createElement('div');
        wrapper.className = 'monitor-sarp-menu-item';

        const link = document.createElement('a');
        link.className = 'monitor-sarp-menu-button';
        link.href = item.href;
        link.innerHTML = `
            <i class="${item.icone}"></i>
            <span>${item.texto}</span>
        `;

        wrapper.appendChild(link);
        container.appendChild(wrapper);
    }

    function criarGrupo(container, item) {
        const wrapper = document.createElement('div');
        wrapper.className = 'monitor-sarp-menu-item monitor-sarp-menu-grupo';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'monitor-sarp-menu-button';
        button.innerHTML = `
            <i class="${item.icone}"></i>
            <span>${item.texto}</span>
            <i class="bi bi-chevron-down monitor-sarp-seta"></i>
        `;

        const submenu = document.createElement('div');
        submenu.className = 'monitor-sarp-submenu';

        item.filhos.forEach(filho => {
            const link = document.createElement('a');
            link.className = 'monitor-sarp-submenu-link';
            link.href = filho.href;
            link.innerHTML = `
                <i class="${filho.icone}"></i>
                <span>${filho.texto}</span>
            `;
            submenu.appendChild(link);
        });

        wrapper.appendChild(button);
        wrapper.appendChild(submenu);
        container.appendChild(wrapper);

        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();

            const estavaAberto = wrapper.classList.contains('aberto');

            container
                .querySelectorAll('.monitor-sarp-menu-grupo.aberto')
                .forEach(outro => {
                    outro.classList.remove('aberto');
                    outro
                        .querySelector(':scope > .monitor-sarp-menu-button')
                        ?.classList.remove('ativo');
                });

            if (!estavaAberto) {
                wrapper.classList.add('aberto');
                button.classList.add('ativo');
            }
        });
    }

    function configurarFechamentoMenus(menu) {
        document.addEventListener('click', function (event) {
            if (!menu.contains(event.target)) {
                menu
                    .querySelectorAll('.monitor-sarp-menu-grupo.aberto')
                    .forEach(item => {
                        item.classList.remove('aberto');
                        item
                            .querySelector(':scope > .monitor-sarp-menu-button')
                            ?.classList.remove('ativo');
                    });
            }
        });
    }

    function configurarTema(menu) {
        const botao = menu.querySelector('.monitor-sarp-theme-toggle');
        if (!botao) {
            console.warn('[Monitor SARP] Botão de tema não encontrado.');
            return;
        }

        atualizarIconeTema(botao);

        botao.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();

            const original = document.querySelector('#toggle-dark');
            if (original) {
                original.click();
                return;
            }

            const html = document.documentElement;
            const atual = html.getAttribute('data-bs-theme');
            const novo = atual === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-bs-theme', novo);
            atualizarIconeTema(botao);
        });

        const observadorTema = new MutationObserver(function () {
            atualizarIconeTema(botao);
        });

        observadorTema.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme']
        });

        botao._monitorSarpThemeObserver = observadorTema;
    }

    function atualizarIconeTema(botao) {
        const tema = document.documentElement.getAttribute('data-bs-theme');
        const thumb = botao.querySelector('.monitor-sarp-theme-thumb');
        const icone = thumb?.querySelector('i');

        if (!thumb || !icone) {
            return;
        }

        if (tema === 'dark') {
            botao.classList.add('dark');
            icone.className = 'bi bi-sun-fill';
            botao.title = 'Mudar para tema claro';
        } else {
            botao.classList.remove('dark');
            icone.className = 'bi bi-moon-stars-fill';
            botao.title = 'Mudar para tema escuro';
        }
    }

    function adicionarCSS() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
#${MENU_ID} {
    width: 100%;
    margin: 0;
    padding: 0;
    background: var(--monitor-hud-bg);
    color: var(--monitor-hud-text);
    border: 1px solid var(--monitor-hud-border);
    border-radius: 16px 16px 0 0;
    box-shadow: none;
    position: relative;
    z-index: 900;
    font-family: inherit;
    box-sizing: border-box;
}

#${MENU_ID} .monitor-sarp-menu-inner {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    min-height: 42px;
    height: 42px;
    padding: 2px 6px;
    gap: 2px;
    box-sizing: border-box;
}

#${MENU_ID} .monitor-sarp-menu-item {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
}

#${MENU_ID} .monitor-sarp-menu-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    gap: 6px;
    height: 34px;
    min-height: 34px;
    padding: 0 11px;
    margin: 0;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--monitor-hud-text);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    text-decoration: none;
    cursor: pointer;
    box-sizing: border-box;
    transition: background .15s ease, border-color .15s ease, color .15s ease;
}

#${MENU_ID} .monitor-sarp-menu-button:hover {
    background: var(--monitor-bg-hover);
    border-color: var(--monitor-border);
    color: var(--monitor-text-strong);
}

#${MENU_ID} .monitor-sarp-menu-button.ativo {
    background: var(--monitor-bg-item);
    border-color: var(--monitor-border);
}

#${MENU_ID} .monitor-sarp-menu-button > i {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 17px;
    min-width: 17px;
    height: 17px;
    line-height: 1;
    margin: 0;
    padding: 0;
    font-size: 15px;
}

#${MENU_ID} .monitor-sarp-menu-button > i:first-child {
    transform: translateY(0);
}

#${MENU_ID} .monitor-sarp-menu-button .monitor-sarp-seta {
    width: auto;
    min-width: auto;
    height: auto;
    margin-left: 1px;
    font-size: 9px;
    transition: transform .2s ease;
}

#${MENU_ID} .monitor-sarp-menu-grupo.aberto .monitor-sarp-seta {
    transform: rotate(180deg);
}

#${MENU_ID} .monitor-sarp-submenu {
    position: absolute;
    top: calc(100% + 3px);
    left: 0;
    min-width: 250px;
    max-width: 330px;
    padding: 5px;
    background: var(--monitor-bg);
    border: 1px solid var(--monitor-border);
    border-radius: 8px;
    box-shadow: var(--monitor-shadow);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-4px);
    transition: opacity .15s ease, transform .15s ease, visibility .15s ease;
}

#${MENU_ID} .monitor-sarp-menu-grupo.aberto .monitor-sarp-submenu {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
}

#${MENU_ID} .monitor-sarp-submenu-link {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 34px;
    height: 34px;
    padding: 5px 9px;
    margin: 0;
    border-radius: 6px;
    color: var(--monitor-text);
    text-decoration: none;
    font-size: 13px;
    line-height: 1;
    box-sizing: border-box;
    transition: background .15s ease, color .15s ease;
}

#${MENU_ID} .monitor-sarp-submenu-link:hover {
    background: var(--monitor-bg-hover);
    color: var(--monitor-text-strong);
    text-decoration: none;
}

#${MENU_ID} .monitor-sarp-submenu-link i {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    min-width: 22px;
    height: 18px;
    margin: 0 5px 0 0;
    padding: 0;
    color: var(--monitor-primary);
    font-size: 14px;
    line-height: 1;
}

#${MENU_ID} .monitor-sarp-menu-espaco {
    flex: 1;
}

#${MENU_ID} .monitor-sarp-theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 47px;
    height: 30px;
    padding: 0;
    margin: 0 3px 0 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    box-sizing: border-box;
}

#${MENU_ID} .monitor-sarp-theme-track {
    position: relative;
    display: flex;
    align-items: center;
    width: 42px;
    height: 22px;
    padding: 2px;
    border: 1px solid var(--monitor-border);
    border-radius: 20px;
    background: var(--monitor-bg-item);
    box-sizing: border-box;
    transition: background .2s ease, border-color .2s ease;
}

#${MENU_ID} .monitor-sarp-theme-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--monitor-text-strong);
    color: var(--monitor-bg);
    box-shadow: 0 1px 3px rgba(0,0,0,.25);
    transition: transform .2s ease, background .2s ease, color .2s ease;
}

#${MENU_ID} .monitor-sarp-theme-thumb i {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    font-size: 9px;
    line-height: 1;
}

#${MENU_ID} .monitor-sarp-theme-toggle.dark .monitor-sarp-theme-thumb {
    transform: translateX(20px);
    background: var(--monitor-primary);
    color: #ffffff;
}

#${MENU_ID} .monitor-sarp-theme-toggle:hover .monitor-sarp-theme-track {
    border-color: var(--monitor-border-hover);
}

@media (max-width: 768px) {
    #${MENU_ID} .monitor-sarp-menu-inner {
        overflow-x: auto;
        scrollbar-width: thin;
    }

    #${MENU_ID} .monitor-sarp-menu-button {
        white-space: nowrap;
    }

    #${MENU_ID} .monitor-sarp-menu-espaco {
        display: none;
    }

    #${MENU_ID} .monitor-sarp-submenu {
        position: fixed;
        left: 10px;
        right: 10px;
        top: auto;
        min-width: auto;
        max-width: none;
    }
}
        `;

        document.head.appendChild(style);
    }

    function observarPagina() {
        const observer = new MutationObserver(function () {
            if (!document.getElementById(MENU_ID)) {
                iniciarMenuSarp();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function iniciar() {
        if (iniciarMenuSarp()) {
            observarPagina();
            return;
        }

        let tentativas = 0;

        const timer = setInterval(function () {
            tentativas++;

            if (iniciarMenuSarp() || tentativas >= 30) {
                clearInterval(timer);

                if (document.getElementById(MENU_ID)) {
                    observarPagina();
                }
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();