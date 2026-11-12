// Avisos de novos chamados em todas as páginas HTTP/HTTPS.
let chamadosNaoLidos = 0;
const tituloOriginal = document.title;

chrome.runtime.onMessage.addListener((request) => {
  if (
    request.action === 'NOVOS_CHAMADOS_DETECTADOS' &&
    Number.isInteger(request.quantidade) &&
    request.quantidade > 0
  ) {
    mostrarAvisoNovosChamados(request.quantidade);
  }
});

function mostrarAvisoNovosChamados(quantidade) {
  chamadosNaoLidos += quantidade;
  document.title = `(${chamadosNaoLidos}) ${tituloOriginal}`;

  let aviso = document.getElementById('monitor-sarp-aviso-novos-chamados');

  if (!aviso) {
    aviso = document.createElement('div');
    aviso.id = 'monitor-sarp-aviso-novos-chamados';
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');

    const texto = document.createElement('div');
    texto.className = 'monitor-sarp-aviso-texto';

    const titulo = document.createElement('strong');
    titulo.textContent = 'Nova notificação SARP';
    texto.appendChild(titulo);

    const mensagem = document.createElement('span');
    mensagem.id = 'monitor-sarp-aviso-mensagem';
    texto.appendChild(mensagem);

    const fechar = document.createElement('button');
    fechar.type = 'button';
    fechar.className = 'monitor-sarp-aviso-fechar';
    fechar.setAttribute('aria-label', 'Fechar notificação');
    fechar.textContent = '×';
    fechar.addEventListener('click', fecharAvisoNovosChamados);

    aviso.append(texto, fechar);
    document.body.appendChild(aviso);
  }

  const mensagem = document.getElementById('monitor-sarp-aviso-mensagem');
  if (mensagem) {
    mensagem.textContent = chamadosNaoLidos === 1
      ? '1 chamado novo recebido.'
      : `${chamadosNaoLidos} chamados novos recebidos.`;
  }
}

function fecharAvisoNovosChamados() {
  document.getElementById('monitor-sarp-aviso-novos-chamados')?.remove();
  chamadosNaoLidos = 0;
  document.title = tituloOriginal;
}
