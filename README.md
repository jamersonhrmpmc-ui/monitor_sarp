# Monitor SARP - Extensão para Google Chrome, Microsoft Edge e Firefox (Manifest V3)

## 🚀 Como instalar no Google Chrome e Microsoft Edge

1. **Baixe e extraia** todos os arquivos desta pasta em um diretório no seu computador.

2. Abra o navegador e acesse:

   * Google Chrome: `chrome://extensions/`
   * Microsoft Edge: `edge://extensions/`

3. No canto superior direito da página de extensões, ative a chave **"Modo do desenvolvedor"** (Developer Mode).

4. Clique no botão **"Carregar sem compactação"** (Load unpacked).

5. Selecione a pasta onde estão os arquivos da extensão (a pasta que contém o arquivo `manifest.json`).

6. **Pronto!** O ícone do **Monitor SARP** aparecerá na barra de ferramentas do navegador. Fixe-o para acessar o popup com facilidade.

> **Importante:** Para Chrome e Edge, utilize o arquivo `manifest.json` destinado a esses navegadores.

---

## 🦊 Como instalar no Mozilla Firefox

O Firefox possui algumas diferenças na validação do `manifest.json`. Por isso, a extensão possui um manifesto específico para Firefox.

Na pasta da extensão existem dois arquivos de manifesto:

* `manifest.json` → versão para **Google Chrome e Microsoft Edge**
* `manifest-Firefox-Renomear.json` → versão para **Mozilla Firefox**

### 🔄 Preparar a extensão para o Firefox

Antes de instalar no Firefox:

1. Entre na pasta da extensão.

2. Renomeie o arquivo atual:

   `manifest.json`

   para:

   `manifest-Chrome-Edge.json`

3. Renomeie:

   `manifest-Firefox-Renomear.json`

   para:

   `manifest.json`

> **Importante:** O Firefox precisa encontrar um arquivo chamado exatamente `manifest.json` na pasta da extensão.

### 🛠️ Instalar no Firefox

1. Abra o Mozilla Firefox.

2. Digite na barra de endereços:

   `about:debugging`

3. No menu lateral, selecione **"Este Firefox"** (ou **"This Firefox"**, dependendo do idioma do navegador).

4. Clique em **"Carregar extensão temporária..."** (Load Temporary Add-on).

5. Navegue até a pasta do **Monitor SARP**.

6. Selecione o arquivo:

   `manifest.json`

7. A extensão será carregada no Firefox.

> **Nota:** A extensão temporária do Firefox pode ser removida quando o navegador for reiniciado. Para desenvolvimento e testes, é necessário carregá-la novamente quando isso acontecer.

### 🔄 Para voltar a usar no Chrome ou Edge

Depois de testar no Firefox, você pode restaurar os arquivos:

1. Renomeie:

   `manifest.json`

   para:

   `manifest-Firefox.json`

2. Renomeie:

   `manifest-Chrome-Edge.json`

   novamente para:

   `manifest.json`

Agora a pasta estará novamente preparada para **Chrome e Edge**.

---

## 🔔 Configuração do ntfy (Notificações)

O **Monitor SARP utiliza o ntfy** para enviar notificações de novos chamados ao celular.

### 1. Instale o ntfy no celular

Baixe o aplicativo oficial [ntfy na Google Play Store](https://play.google.com/store/apps/details?id=io.heckel.ntfy), abra-o e permita o envio de notificações quando solicitado.

### 2. Crie um tópico

No aplicativo ntfy, adicione ou inscreva-se em um novo tópico. Escolha um nome longo, exclusivo e difícil de adivinhar, por exemplo:

`sarp-a7k9m2x-q4zp`

O tópico funciona como um endereço público: qualquer pessoa que souber o nome poderá publicar mensagens nele. Evite nomes simples como `sarp`, `monitor` ou `notificacao`.

### 3. Personalize o tópico (recomendado)

Nas configurações do tópico, altere o nome de exibição para algo fácil de reconhecer, como `Monitor SARP` ou `Chamados SARP`. Também é possível definir um ícone personalizado.

Essa personalização não altera a URL do tópico.

### 4. Copie a URL completa

Nas informações ou configurações do tópico, copie a URL completa. Ela terá um formato semelhante a:

`https://ntfy.sh/seu-topico-dificil-de-adivinhar`

Não compartilhe essa URL publicamente: quem a conhecer poderá publicar mensagens no seu tópico.

### 5. Configure a extensão

1. Abra o popup do **Monitor SARP**.

2. Clique no ícone de **Configurações ⚙**.

3. Localize o campo **URL ntfy**.

4. Cole a URL completa do tópico.

5. Clique em **Salvar Preferências**.

Depois de salvar, volte ao popup e clique em **TESTAR NTFY**. Se a URL estiver correta, você receberá no celular a mensagem de teste `TESTE CONCLUIDO`.

### 📱 Configuração recomendada no celular

Para receber notificações com a tela bloqueada:

* Permita as notificações do ntfy e na tela de bloqueio.
* Permita vibração e funcionamento em segundo plano.
* Ative o **Instant Delivery** no ntfy, caso esteja disponível.
* Evite restrições de bateria para o ntfy, especialmente em aparelhos Xiaomi, Samsung, Android ou MIUI.

---

## 🔧 Comandos Git

### 🔄 Antes de programar

`git pull`

### 📤 Fazer commit

`git add .`

`git commit -m "Descreva a alteração"`

`git push`

> **Alerta:** Sempre execute `git pull` antes de começar a programar.
