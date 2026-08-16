# Monitor SARP - Extensão para Google Chrome (Manifest V3)

## 🚀 Como instalar no Google Chrome

1. **Baixe e extraia** todos os arquivos desta pasta em um diretório no seu computador.
2. Abra o Google Chrome e digite na barra de endereços: `chrome://extensions/`
3. No canto superior direito da página de extensões, ative a chave **"Modo do desenvolvedor"** (Developer Mode).
4. Clique no botão **"Carregar sem compactação"** (Load unpacked) no canto superior esquerdo.
5. Selecione a pasta onde estão os arquivos (a pasta que contém o arquivo `manifest.json`).
6. **Pronto!** O ícone do **Monitor SARP** aparecerá na barra de ferramentas do seu navegador. Fixe-o para acessar o popup com facilidade.

---

## 🤖 Configuração do Telegram (Notificações)

Para receber as notificações de novos chamados no Telegram, você precisa criar um bot e obter o **Token** e o **Chat ID**.

### 1. Criar o Bot

1. Abra o Telegram e procure por **@BotFather** (oficial, com selo azul).
2. Envie o comando `/start`.
3. Envie o comando `/newbot`.
4. Escolha um **nome** para o bot (ex: `Monitor SARP`).
5. Escolha um **username** que termine com `bot` (ex: `monitor_sarp_bot`).  
   > O username precisa ser único.
6. O BotFather vai te enviar o **Token** do bot.  
   Ele se parece com isto:  
   `1234567890:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`  
   **Guarde este token com cuidado** (não compartilhe publicamente).

### 2. Obter o Chat ID

1. Procure pelo bot que você acabou de criar e clique em **Iniciar** (ou envie qualquer mensagem, como `/start`).
2. Abra o navegador e acesse o link abaixo (substitua `SEU_TOKEN` pelo token que você recebeu): **https://api.telegram.org/botSEU_TOKEN/getUpdates**
3. No JSON que aparecer, procure pelo campo `"chat": { "id": 123456789 }`.  
O número que estiver em `id` é o seu **Chat ID**.

> **Dica rápida:** Você também pode usar o bot [@userinfobot](https://t.me/userinfobot) ou [@getmyid_bot](https://t.me/getmyid_bot) para descobrir seu Chat ID de forma mais simples.

### 3. Configurar na Extensão

1. Clique com o botão direito no ícone da extensão **Monitor SARP**.
2. Selecione **Opções**.
3. Cole o **Token** e o **Chat ID** nos campos correspondentes.
4. Salve as configurações.

Pronto! A partir de agora as notificações de novos chamados serão enviadas para o seu Telegram.

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
