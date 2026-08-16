# Monitor SARP - Extensão para Google Chrome (Manifest V3)

## 🚀 Como instalar no Google Chrome

1. **Baixe e extraia** todos os arquivos desta pasta em um diretório no seu computador.
2. Abra o Google Chrome e digite na barra de endereços: `chrome://extensions/`
3. No canto superior direito da página de extensões, ative a chave **"Modo do desenvolvedor"** (Developer Mode).
4. Clique no botão **"Carregar sem compactação"** (Load unpacked) no canto superior esquerdo.
5. Selecione a pasta onde estão os arquivos (a pasta que contém o arquivo `manifest.json`).
6. **Pronto!** O ícone do **Monitor SARP** aparecerá na barra de ferramentas do seu navegador. Fixe-o para acessar o popup com facilidade.

---

## 🔔 Configuração do ntfy (Notificações)

Para receber as notificações de novos chamados no celular, o **Monitor SARP utiliza o ntfy**.

O ntfy é um serviço de notificações que permite receber mensagens diretamente no celular por meio de tópicos.

### 1. Instalar o ntfy

Instale o aplicativo **ntfy** no seu celular.

Depois de instalar, abra o aplicativo e permita as notificações quando solicitado.

### 2. Criar um tópico

1. Acesse o ntfy pelo aplicativo ou pelo site.
2. Crie um novo tópico para o Monitor SARP.
3. Escolha um nome exclusivo para o tópico.

> **Importante:** O nome do tópico deve ser exclusivo. Evite utilizar nomes fáceis de adivinhar.

### 3. Copiar a URL do tópico

Depois de criar o tópico, copie a **URL completa** dele.

Ela terá um formato semelhante a:

`https://ntfy.sh/seu-topico`

Essa é a URL que será utilizada pela extensão para enviar as notificações.

### 4. Configurar na Extensão

1. Clique com o botão direito no ícone da extensão **Monitor SARP**.
2. Selecione **Opções**.
3. No campo destinado às notificações, cole a **URL completa do seu tópico ntfy**.
4. Salve as configurações.

Pronto!

A partir de agora, quando o Monitor SARP detectar novos chamados, as notificações serão enviadas automaticamente para o seu celular através do ntfy.

### 📱 Configuração recomendada no celular

Para garantir que as notificações sejam recebidas mesmo com a tela bloqueada:

- Permita as notificações do ntfy.
- Permita notificações na tela de bloqueio.
- Permita vibração.
- Permita notificações em segundo plano.
- Ative o **Instant Delivery** no ntfy, caso esteja disponível no seu dispositivo.
- No Android/MIUI, evite restringir o uso de bateria do ntfy em segundo plano.

---

## 📂 Estrutura de Arquivos

- `background/`: Service worker que roda em segundo plano (`background.js`).
- `content/`: Scripts injetados nas páginas acessadas pelo usuário (`content.js`, `content.css`).
- `icons/`: Ícones da extensão (16x16, 48x48, 128x128).
- `options/`: Página de configurações da extensão (`options.html`, `options.js`, `options.css`).
- `popup/`: Interface gráfica (`popup.html`, `popup.css`, `popup.js`).
- `manifest.json`: Manifesto V3 com declaração de permissões, scripts e popup.

## 🔧 Comandos Git

### 🔄 Antes de programar

- `git pull`

### 📤 Fazer commit

- `git add .`
- `git commit -m "Descreva a alteração"`
- `git push`

> **Alerta:** Sempre execute `git pull` antes de começar a programar.