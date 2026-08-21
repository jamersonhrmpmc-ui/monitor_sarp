// Monitor SARP - Background Service Worker (Manifest V3)
const DEBUG = false;
function log(...args) {
  if (DEBUG) console.log(...args);
}

log('[Monitor SARP] Background Service Worker inicializado.');

const ENDPOINT = 'https://sarp.saude.rn.gov.br/ti/chamados/getChamados';
const ALARM_NAME = 'monitorSarpPulse';

// RESTAURAR BADGE (TAG ON / OFF)
async function restoreBadge() {
  const { isActive = false } = await chrome.storage.sync.get('isActive');

  chrome.action.setBadgeText({ text: isActive ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: isActive ? '#0284c7' : '#64748b' });
}
restoreBadge();

// EXTENSÃO INSTALADA ou ATUALIZADA
chrome.runtime.onInstalled.addListener( (details) => {
    log( '[Monitor SARP] Extensão instalada/atualizada:', details.reason );

    // Sempre começa OFF.
    chrome.storage.sync.set({
      isActive: false,
      targetSelector: 'TODOS',
      nAbertos: 0,
      nFechados: 0,
      nAtendimentos: 0,
      nPendentes: 0,
      nSuporte: 0,
      ntfyURL: '',
    });

    // Limpa referência anterior do sessionStorage
    chrome.storage.session.remove('sarpMonitor');

    // Badge inicial.
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#64748b' });

    // Cria o alarme de 30 segundos.
    // chrome.alarms.create( ALARM_NAME, { periodInMinutes: 0.5 } );
    // log( '[Monitor SARP] Alarme criado.' );
  }
);

// FUNÇÃO PRINCIPAL DO MONITOR
async function executarMonitoramento() {
  log( '[Monitor SARP] Executando monitoramento...' );

  // Verifica se o monitor está ativo
  const config = await chrome.storage.sync.get([ 'isActive' ]);

  if ( config.isActive !== true ) {
    log( '[Monitor SARP] Monitor está OFF.' );
    return;
  }

  // Procura qualquer aba do SARP aberta
  const abas = await chrome.tabs.query({
    url: 'https://sarp.saude.rn.gov.br/*'
  });
  const abaSarp = abas[0];

  // Verifica se não existe aba do SARP
  if (!abaSarp?.id) {
    log( '[Monitor SARP] Nenhuma aba do SARP encontrada.' );
    return;
  }

  log( '[Monitor SARP] Aba SARP encontrada:', abaSarp.id, abaSarp.url );

  // Se existir verifica autenticação pelo getChamados()
  try {

    const resultado = await consultarChamados();

    // Verifica se o usuário está logado no SARP
    if ( !resultado.logado ) {
      log( '[Monitor SARP] Usuário não está logado no SARP.', resultado.motivo || '' );

      chrome.action.setBadgeText({ text: 'Auth' });
      chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
      return;
    }

    // Se estiver logado atualiza a badge
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#0284c7' });

    // Processa os chamados recebidos no JSON
    await processarChamados( resultado.json );

    await salvarContadores();

  } catch (erro) {

    console.warn( '[Monitor SARP] Erro durante monitoramento:', erro );

    chrome.action.setBadgeText({ text: 'ERRO' });
    chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
  }
}

// CONSULTA AO GETCHAMADOS DO SARP
async function consultarChamados() {
  const urlTodos = ENDPOINT +
    '?draw=1' +
    '&start=0' +
    '&length=20' +
    
    // Coluna 0: Número
    '&columns[0][data]=' +
    '&columns[0][name]=numero' +
    '&columns[0][searchable]=true' +
    '&columns[0][orderable]=false' +
    '&columns[0][search][value]=' +
    '&columns[0][search][regex]=false' +
    
    // Coluna 1: Status (ABERTO)
    '&columns[1][data]=' +
    '&columns[1][name]=status' +
    '&columns[1][searchable]=true' +
    '&columns[1][orderable]=false' +
    '&columns[1][search][value]=ABERTO' +
    '&columns[1][search][regex]=false' +
    
    // Busca geral e timestamp
    '&search[value]=' +
    '&search[regex]=false' +
    '&_=' +
  Date.now();
  
  const urlSuporte = ENDPOINT +
    '?draw=1' +
    '&start=0' +
    '&length=20' +
    
    // Coluna 0: Número
    '&columns[0][data]=' +
    '&columns[0][name]=numero' +
    '&columns[0][searchable]=true' +
    '&columns[0][orderable]=false' +
    '&columns[0][search][value]=' +
    '&columns[0][search][regex]=false' +
    
    // Coluna 1: Status (ABERTO)
    '&columns[1][data]=' +
    '&columns[1][name]=status' +
    '&columns[1][searchable]=true' +
    '&columns[1][orderable]=false' +
    '&columns[1][search][value]=ABERTO' +
    '&columns[1][search][regex]=false' +
    
    // Coluna 4: Tipo (SUPORTE)
    '&columns[4][data]=' +
    '&columns[4][name]=tipo' +
    '&columns[4][searchable]=true' +
    '&columns[4][orderable]=false' +
    '&columns[4][search][value]=SUPORTE' +
    '&columns[4][search][regex]=false' +
    
    // Busca geral e timestamp
    '&search[value]=' +
    '&search[regex]=false' +
    '&_=' +
    Date.now();
  
  const { targetSelector = 'TODOS' } = await chrome.storage.sync.get('targetSelector');
  let url;

  switch (targetSelector) {
    case 'TODOS':
      url = urlTodos;
      log( '[Monitor SARP] Consultando: TODOS: ', url );
      break;
          
    case 'SUPORTE':
      url = urlSuporte;
      log( '[Monitor SARP] Consultando: SUPORTE: ', url );
      break;
          
    default:
      url = urlTodos;
      log( '[Monitor SARP] Consultando: TODOS: ', url );
      break;
  }

  const response = await fetch( url,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }
  );

  // HTTP 401
  if ( response.status === 401 ) {
    log( '[Monitor SARP] HTTP 401: sessão do SARP não autenticada.' );
    return {
      logado: false,
      json: null,
      motivo: '401'
    };
  }

  // HTTP 403
  if ( response.status === 403 ) {
    log( '[Monitor SARP] HTTP 403: acesso negado pelo SARP.' );
    return {
      logado: false,
      json: null,
      motivo: '403'
    };
  }

  // Outros erros HTTP
  if ( !response.ok ) {
    // Joga o erro para o bloco de catch do monitoramento.
    throw new Error( `HTTP ${response.status}` );
  }

  // Lê a resposta
  const contentType = response.headers.get( 'content-type' ) || '';
  const texto = await response.text();

  // Teste se retornou HTML. Pode acontecer quando o SARP manda para a tela de login.
  if (
    contentType.includes( 'text/html' )  ||
    texto .trim() .startsWith( '<!DOCTYPE' ) ||
    texto .trim() .startsWith( '<html' )
  ) {
    log( '[Monitor SARP] Servidor retornou HTML. Provavelmente não autenticado.' );
    return {
      logado: false,
      json: null,
      motivo: 'html'
    };
  }

  // Tenta converter resposta para JSON
  let json;
  try {

    json = JSON.parse( texto );

  } catch (erro) {

    console.error( '[Monitor SARP] Resposta não é JSON:', texto.substring( 0, 300 ) );
    return {
      logado: false,
      json: null,
      motivo: 'json_invalido'
    };
  }

  // Confirma se é a estrutura esperada do JSON
  if ( !json || !Array.isArray( json.data ) ) {
    log( '[Monitor SARP] JSON recebido não possui data[].' );
    return {
      logado: false,
      json: null,
      motivo: 'estrutura_invalida'
    };
  }

  // Login confirmado e JSON válido
  log( '[Monitor SARP] Sessão autenticada. JSON recebido corretamente.' );
  return {
    logado: true,
    json,
    motivo: null
  };
}

// PROCESSAMENTO DOS CHAMADOS
async function processarChamados(json) {
  const registros = Array.isArray( json.data ) ? json.data : [];

  // Extrai somente os chamados ABERTOS. Filtro de garantia.
  const chamadosAbertos = registros.filter( chamado => {
    return String(
      chamado?.status?.name || ''
    )
      .trim()
      .toUpperCase() === 'ABERTO';
  });

  log( `[Monitor SARP] ${chamadosAbertos.length} chamados abertos encontrados.` );

  // Converte para o formato organizado.
  const chamados = chamadosAbertos.map( extrairDadosChamado );

  // IDs da consulta atual.
  const idsAtuais = chamados.map( chamado => chamado.id );

  // Recupera referência anterior.
  const storage = await chrome.storage.session.get(['sarpMonitor']);

  const monitorAnterior = storage.sarpMonitor;

  // Primeira consulta sem referencia anterior.
  if ( !monitorAnterior ) {
    log( '[Monitor SARP] Primeira consulta.' );
    log( '[Monitor SARP] Criando referência inicial.' );
    await salvarMonitor(
      json,
      chamados,
      idsAtuais,
      []
    );
    return;
  }

  // Comparação com a referencia anterior
  const idsAnteriores = Array.isArray( monitorAnterior.idsAbertos ) ? monitorAnterior.idsAbertos : [];

  const novosChamados = chamados.filter( chamado => {
    return !idsAnteriores.includes( chamado.id ); });

  // Mostra resultado da comparação.
  if ( novosChamados.length > 0 ) {
    log( `[Monitor SARP] ${novosChamados.length} NOVO(S) CHAMADO(S)!` );

    await notificarNovosChamados(novosChamados);

    novosChamados.forEach( chamado => { log( '[NOVO CHAMADO]', chamado );});

  } else {

    log( '[Monitor SARP] Nenhum chamado novo.' );
  }

  // Salva consulta atual.
  await salvarMonitor(
    json,
    chamados,
    idsAtuais,
    novosChamados
  );
}

// Formata a data de forma legível
function formatarData(dataISO) {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dataISO;
  }
}

// EXTRAÇÃO DOS DADOS IMPORTANTES
function extrairDadosChamado(c) {
  const dados = {
    // Identificação
    id: c?.id ?? null,
    numero: c?.numero ?? null,

    // Status
    statusId: c?.status_id ?? null,
    status: c?.status?.name ?? null,

    // Datas
    criadoEm: c?.created_at ?? null,
    atualizadoEm: c?.updated_at ?? null,
    fechadoEm: c?.data_fechamento ?? null,

    // Tipo
    tipoId: c?.tipo_id ?? null,
    tipo: c?.tipo?.name ?? null,

    // Serviço
    servicoId: c?.servico_id ?? null,
    servico: c?.servico?.name ?? null,
    tipoSolicitacao: c?.servico?.tipo_solicitacao ?? null,
    tag_identificador: c?.servico?.categoria?.instancia?.name ?? null,

    // Categoria / Instância
    categoriaId: c?.servico?.categoria_id ?? null,
    categoria: c?.servico?.categoria?.name ?? null,
    instanciaId: c?.servico?.categoria?.instancia_id ?? null,
    instancia: c?.servico?.categoria?.instancia?.name ?? null,

    // Sistema
    nomeSistema: c?.nome_sistema ?? null,

    // Local
    localId: c?.local_id ?? null,
    setorId: c?.local?.setor_id ?? null,
    setorSigla: c?.local?.setor?.sigla ?? null,
    setor: c?.local?.setor?.name ?? null,

    // Coordenação
    coordenacaoId: c?.local?.setor?.coordenacao?.id ?? null,
    coordenacao: c?.local?.setor?.coordenacao?.name ?? null,
    coordenacaoSigla: c?.local?.setor?.coordenacao?.sigla ?? null,

    // Unidade
    unidadeId: c?.local?.setor?.coordenacao?.unidade?.id ?? null,
    unidade: c?.local?.setor?.coordenacao?.unidade?.name ?? null,
    unidadeSigla: c?.local?.setor?.coordenacao?.unidade?.sigla ?? null,
    cidade: c?.local?.setor?.coordenacao?.unidade?.cidade ?? null,

    // Prioridade + SLA
    prioridadeId: c?.sla?.prioridade_id ?? null,
    prioridade: c?.sla?.prioridade?.name ?? null,
    slaId: c?.sla?.id ?? null,
    slaNivel: c?.sla?.nivel_id ?? null,
    slaTempoResposta: c?.sla?.tempo_resposta ?? null,
    slaPrazoSolucao: c?.sla?.prazo_solucao ?? null,
    slaDataLimiteResposta: c?.sla?.data_limite_resposta ?? null,
    slaDataLimiteSolucao: c?.sla?.data_limite_solucao ?? null,

    // Descrição bruta (do JSON)
    descricao: c?.descricao ?? null,

    // Novos campos (preenchidos depois)
    solicitanteNome: null,
    solicitanteTelefone: null,
    descricaoFinal: null   // será "Olhar no SARP" ou a descrição real
  };

  return dados;
}

// ENVIA AS NOVAS NOTIFICAÇÕES PARA O ntfy
async function notificarNovosChamados(chamados) {
  if (!chamados || chamados.length === 0) return;

  const loteParaSalvar = [];

  for (const chamado of chamados) {
    log('[Monitor SARP] Processando notificação:', chamado.numero);

    const isSuporte = String(chamado.tag_identificador || '').toUpperCase().includes('SUPORTE');

    // Busca nome + telefone + descrição
    const { nome, telefone, descricaoReal } = await buscarDadosSolicitante(chamado.id, isSuporte);

    const descricaoFinal = (isSuporte && descricaoReal) 
      ? descricaoReal 
      : 'Olhar no SARP';

    // Monta a mensagem do ntfy
    const mensagem = `
🚨 NOVO CHAMADO NO SARP
📋 Chamado: ${chamado.numero}

👤 Solicitante: ${nome || 'Não informado'}
📞 Telefone: ${telefone || 'Não informado'}
🏢 Setor: ${chamado.setor || '-'}
🖥️ TIPO: ${chamado.tag_identificador || '-'}

🛠️ Serviço: ${chamado.servico || '-'}
⚠️ Prioridade: ${chamado.prioridade || '-'}
📌 Status: ${chamado.status || '-'}
📅 Data: ${formatarData(chamado.criadoEm)}

📝 Descrição:
${descricaoFinal}
    `.trim();

    log('[Monitor SARP] Mensagem ntfy:', mensagem);

    // Envia para o ntfy
    const { ntfyURL: ntfyUrl } = await chrome.storage.sync.get(['ntfyURL']);
    if (ntfyUrl) {
      await enviarParaNtfy(mensagem, ntfyUrl);
    } else {
      console.warn('[Monitor SARP] URL do ntfy não configurada');
    }

    // Guarda os dados limpos para o HUD
    loteParaSalvar.push({
      id: chamado.id,
      numero: chamado.numero,
      nome: nome || 'Não informado',
      setor: chamado.setor || '-',
      telefone: telefone || null,
      servico: chamado.servico || null,
      prioridade: chamado.prioridade || null,
      tipo: chamado.tag_identificador || '-'
    });
  }

  // Sempre sobrescreve o lote anterior
  await chrome.storage.session.set({
    ultimosChamados: loteParaSalvar,
    atualizadoEm: formatarData(new Date())
  });

  log('[Monitor SARP] Lote salvo no session:', loteParaSalvar);

  // Avisa o content script (HUD) que tem dados novos
  const tabs = await chrome.tabs.query({ url: 'https://sarp.saude.rn.gov.br/*' });
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'ATUALIZAR_HUD_CHAMADOS',
        chamados: loteParaSalvar
      }).catch(() => {});
    }
  }
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

    log( '[Monitor SARP] Mensagem enviada com sucesso para o ntfy' );
    return true;

  } catch (error) {

    console.warn( '[Monitor SARP] Falha ao enviar para o ntfy:',
      error
    );
    return false;

  }
}

// Busca nome, telefone e descrição real na página show/{id}
async function buscarDadosSolicitante(chamadoId, isSuporte = false) {
  try {
    const url = `https://sarp.saude.rn.gov.br/ti/chamados/show/${chamadoId}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Accept': 'text/html',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      log(`[Monitor SARP] Erro ao buscar show/${chamadoId}: HTTP ${response.status}`);
      return {
        nome: null,
        telefone: null,
        descricaoReal: null
      };
    }

    const html = await response.text();

    // ===== NOME =====
    let nome = null;

    const nomeMatch = html.match(
      /<small[^>]*>\s*Solicitante:\s*<\/small>[\s\S]{0,1000}?<a[^>]*>([\s\S]*?)<\/a>/i
    );

    if (nomeMatch) {
      nome = nomeMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Remove os dados do popover e deixa somente o nome
      if (nome.includes("'>")) {
        nome = nome.split("'>")[1].trim();
      }
    }

    // ===== TELEFONE =====
    let telefone = null;

    const telefoneMatch = html.match(
      /<small[^>]*>\s*Telefone:\s*<\/small>[\s\S]{0,250}?<span[^>]*>\s*([^<]+?)\s*<\/span>/i
    );

    if (telefoneMatch) {
      telefone = telefoneMatch[1]
        .replace(/\s+/g, ' ')
        .trim();
    }

    // ===== DESCRIÇÃO =====
    let descricaoReal = null;

    if (isSuporte) {
      const descricaoMatch =
        html.match(
          /<small[^>]*>\s*Descricao:\s*<\/small>[\s\S]{0,500}?<span[^>]*>([\s\S]*?)<\/span>/i
        ) ||
        html.match(
          /<small[^>]*>\s*Descrição:\s*<\/small>[\s\S]{0,500}?<span[^>]*>([\s\S]*?)<\/span>/i
        );

      if (descricaoMatch) {
        descricaoReal = descricaoMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    log(`[Monitor SARP] Dados solicitante (${chamadoId}):`, {
      nome,
      telefone,
      descricaoReal
    });

    return {
      nome: nome || null,
      telefone: telefone || null,
      descricaoReal: descricaoReal || null
    };

  } catch (erro) {
    console.warn(
      `[Monitor SARP] Erro ao buscar dados do solicitante ${chamadoId}:`,
      erro
    );

    return {
      nome: null,
      telefone: null,
      descricaoReal: null
    };
  }
}

// SALVAR DADOS NO STORAGE
async function salvarMonitor(
  json,
  chamados,
  idsAtuais,
  novosChamados
) {

  const dadosParaSalvar = {

    // Quantidade total no SARP
    recordsTotal: json?.recordsTotal ?? null,

    // Quantidade encontrada pelo filtro ABERTO
    recordsFiltered: json?.recordsFiltered ?? null,

    // IDs dos chamados abertos
    idsAbertos: idsAtuais,

    // Todos os chamados abertos
    chamados:chamados,

    // Novos encontrados nessa consulta
    novosChamados: novosChamados,

    // Momento da consulta
    ultimaConsulta: new Date().toISOString()
  };

  //await chrome.storage.local.set({ sarpMonitor: dadosParaSalvar });
  await chrome.storage.session.set({ sarpMonitor: dadosParaSalvar });

  log( '[Monitor SARP] Dados salvos no storage.' );
}

// ALARME
chrome.alarms.onAlarm.addListener(
  async (alarm) => {
    if ( alarm.name !== ALARM_NAME ) {
      return;
    }

    log( '[Monitor SARP] Pulso de monitoramento.');

    await executarMonitoramento();
  }
);

// ATIVA / DESATIVA MONITORAMENTO E RECEBE MENSAGENS
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('[Monitor SARP] Mensagem recebida:', request.action, request);

  if (request.action === 'TOGGLE_MONITORING') {
    // Isolado o async aqui dentro para não quebrar o sendResponse
    (async () => {
      const isActive = request.payload?.isActive === true;
      await chrome.storage.sync.set({ isActive });

      chrome.action.setBadgeText({ text: isActive ? 'ON' : 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: isActive ? '#0284c7' : '#64748b' });

      // Manda o comando de atualizar pagina pra o content
      const abas = await chrome.tabs.query({ url: 'https://sarp.saude.rn.gov.br/ti/chamados*' });
      for (const aba of abas) {
        if (aba.id) {
          chrome.tabs.sendMessage(aba.id, { action: 'ATT_PAG' }).catch(() => {});
        }
      }

      // Se acabou de ativar consulta imediatamente
      if (isActive) {
        await chrome.storage.session.remove('sarpMonitor');
        chrome.alarms.create(ALARM_NAME, { periodInMinutes: 0.5 });
        log('[Monitor SARP] Alarme criado.');
        executarMonitoramento();
      } else {
        await chrome.alarms.clear(ALARM_NAME);
        log('[Monitor SARP] Monitor OFF. Alarme removido.');
      }

      // Atualiza HUD da pagina
      chrome.tabs.query({ url: 'https://sarp.saude.rn.gov.br/*' }, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_HUD', isActive }).catch(() => {});
          }
        });
      });

      sendResponse({ success: true, isActive });
    })();
    
    // Retorna true SÍNCRONO para avisar ao Chrome que responderemos depois
    return true; 
  }

  if (request.action === 'OBTER_ULTIMOS_CHAMADOS') {
    // Busca no storage session e envia a resposta com .then()
    chrome.storage.session.get(['ultimosChamados', 'atualizadoEm']).then((dados) => {
      sendResponse({
        success: true,
        ultimosChamados: Array.isArray(dados.ultimosChamados) ? dados.ultimosChamados : [],
        atualizadoEm: dados.atualizadoEm || null
      });
    });
    
    // Retorna true SÍNCRONO para avisar ao Chrome que responderemos depois
    return true;
  }

  // DEFAULT para qualquer outra chamada desconhecida
  if (request.action !== 'TOGGLE_MONITORING' && request.action !== 'OBTER_ULTIMOS_CHAMADOS') {
    sendResponse({ status: 'unknown_action' });
  }
});

// QUANDO UMA ABA É ATIVADA
chrome.tabs.onActivated.addListener(
  async (activeInfo) => {
    const config = await chrome.storage.sync.get([ 'isActive' ]);
    if (
      config.isActive !== true
    ) {
      return;
    }

    try {

      const tab = await chrome.tabs.get( activeInfo.tabId );

      // Só importa o dominio SARP
      if (
        tab.url &&
        tab.url.startsWith(
          'https://sarp.saude.rn.gov.br/'
        )
      ) {

        log( '[Monitor SARP] Aba SARP ativada. Consultando...' );

        await executarMonitoramento();
      }

    } catch (erro) {

      console.warn( '[Monitor SARP] Erro ao verificar aba:', erro );

    }

  }
);

// QUANDO UMA ABA TERMINA DE CARREGAR
chrome.tabs.onUpdated.addListener(

  async ( tabId, changeInfo, tab
  ) => {

    if ( changeInfo.status !== 'complete' ) {
      return;
    }

    // Só importa o dominio SARP
    if (
      !tab.url ||
      !tab.url.startsWith(
        'https://sarp.saude.rn.gov.br/'
      )
    ) {
      return;
    }

    const config =await chrome.storage.sync.get([ 'isActive' ]);
    
    if ( config.isActive !== true ) {
      return;
    }

    log( '[Monitor SARP] Página SARP carregada. Consultando...' );

    await executarMonitoramento();
  }
);

// CONSULTA DE COLETA DE NUMEROS DE CHAMADOS
async function salvarContadores() {
  log( '[Monitor SARP] Atualizando contadores de chamados...' );

  try {

    // Consultar contadores por status
    async function consultarStatus(status) {
      const url = ENDPOINT +
        '?start=0' +
        '&length=0' +
        '&columns[1][search][value]=' +
        encodeURIComponent(status) +
        '&_=' +
      Date.now();

      const response =  await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
      }});

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} - Status: ${status}`
        );
      }

      const json = await response.json();
      return Number( json?.recordsFiltered ?? 0 );
    }

    // Consulta de suporte abertos
    async function consultarSuporte() {
      const url = ENDPOINT +
        '?start=0' +
        '&length=0' +

        // STATUS = ABERTO
        '&columns[1][search][value]=ABERTO' +

        // TIPO = SUPORTE
        '&columns[4][search][value]=SUPORTE' +
        '&_=' +
      Date.now();

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
      }});

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} - Suporte`
        );
      }

      const json = await response.json();
      return Number( json?.recordsFiltered ?? 0 );

    }

    // Consulta os contadores de modo paralelo
    const [
      nAbertos,
      nFechados,
      nAtendimentos,
      nPendentes,
      nSuporte
    ] = await Promise.all([
      consultarStatus('ABERTO'),
      consultarStatus('FECHADO'),
      consultarStatus('EM ATENDIMENTO'),
      consultarStatus('PENDENTE'),
      consultarSuporte()
    ]);

    // Salva a pesquisa
    await chrome.storage.sync.set({
      nAbertos,
      nFechados,
      nAtendimentos,
      nPendentes,
      nSuporte
    });

    log( '[Monitor SARP] Contadores atualizados:',
      {
        nAbertos,
        nFechados,
        nAtendimentos,
        nPendentes,
        nSuporte
      }
    );

  } catch (erro) {

    console.warn( '[Monitor SARP] Erro ao atualizar contadores:', erro);

  }
}

// Limpa quando muda o target (TODOS / SUPORTE)
chrome.storage.onChanged.addListener(
  async (changes, areaName) => {

    if (areaName !== 'sync') {
      return;
    }

    if (changes.targetSelector) {

      log( '[Monitor SARP] Tipo de chamado alterado. Limpando referência.');

      await chrome.storage.session.remove('sarpMonitor');

      // Recarrega somente a página principal de chamados
      const tabs = await chrome.tabs.query({
        url: 'https://sarp.saude.rn.gov.br/ti/chamados'
      });

      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.reload(tab.id);
        }
      }
    }
  }
);

//
//
// FUNÇÃO DE TESTE: ENVIA TODOS OS CHAMADOS ABERTOS PARA O ntfy
async function testeNtfy() {
  log( '[Monitor SARP] ===== INÍCIO DO TESTE DE NOTIFICAÇÃO =====' );
  try {
    // CONSULTA O SARP REAL
    const resultado = await consultarChamados();
    // VERIFICA AUTENTICAÇÃO
    if ( !resultado.logado ) {
      console.warn( '[Monitor SARP] Teste cancelado: usuário não está logado.', resultado.motivo || '' );
      return;
    }
    // PEGA OS REGISTROS DO JSON
    const registros = Array.isArray( resultado.json?.data )
        ? resultado.json.data
        : [];

    log( `[Monitor SARP] ${registros.length} registros recebidos no JSON.`);
    // FILTRA SOMENTE OS CHAMADOS ABERTOS
    const chamadosAbertos = registros.filter(
        chamado => {
          return String(
            chamado?.status?.name || ''
          )
            .trim()
            .toUpperCase() === 'ABERTO';
        }
      );

    log( `[Monitor SARP] ${chamadosAbertos.length} chamados ABERTOS encontrados para teste.` );
    // CONVERTE PARA O MESMO FORMATO
    // UTILIZADO PELO MONITOR REAL
    const chamados = chamadosAbertos.map( extrairDadosChamado );
    // VERIFICA SE EXISTEM CHAMADOS
    if ( chamados.length === 0) {
      log( '[Monitor SARP] Nenhum chamado aberto encontrado.');
      return;
    }
    log( '[Monitor SARP] Chamados que serão enviados:', chamados);
    // ENVIA TODOS COMO SE FOSSEM NOVOS
    await notificarNovosChamados( chamados );
    log( '[Monitor SARP] ===== FIM DO TESTE DE NOTIFICAÇÃO =====');
  } catch (erro) {
    console.warn( '[Monitor SARP] Erro durante teste de notificação:', erro );
  }
}
globalThis.testeNtfy = testeNtfy;

