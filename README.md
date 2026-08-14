# Monitor SARP - Extensão para Google Chrome (Manifest V3)

## 🚀 Como instalar no Google Chrome

1. **Baixe ou extraia** todos os arquivos desta pasta em um diretório no seu computador.
2. Abra o Google Chrome e digite na barra de endereços: `chrome://extensions/`
3. No canto superior direito da página de extensões, ative a chave **"Modo do desenvolvedor"** (Developer Mode).
4. Clique no botão **"Carregar sem compactação"** (Load unpacked) no canto superior esquerdo.
5. Selecione a pasta onde estão os arquivos (a pasta que contém o arquivo `manifest.json`).
6. **Pronto!** O ícone do **Monitor SARP** aparecerá na barra de ferramentas do seu navegador. Fixe-o para acessar o popup com facilidade.

## 📂 Estrutura de Arquivos

- `background/`: Service worker que roda em segundo plano (`background.js`).
- `content/`: Scripts injetados nas páginas acessadas pelo usuário (`content.js`, `content.css`).
- `icons/`: Ícones da extensão (16x16, 48x48, 128x128).
- `options/`: Página de configurações da extensão (`options.html`, `options.js`, `options.css`).
- `popup/`: Interface gráfica (`popup.html`, `popup.css`, `popup.js`).
- `manifest.json`: Manifesto V3 com declaração de permissões, scripts e popup.

## 🔧 Comandos Git

### 🔄 Antes de programar

`git pull`

### 📤 Fazer commit

`git add .`
`git commit -m "Descreva a alteração"`
`git push`

>**Alerta:** Sempre execute `git pull` antes de começar a programar.