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

- Permita as notificações do ntfy e na tela de bloqueio.
- Permita vibração e funcionamento em segundo plano.
- Ative o **Instant Delivery** no ntfy, caso esteja disponível.
- Evite restrições de bateria para o ntfy, especialmente em aparelhos Xiaomi, Samsung, Android ou MIUI.

---

## 🔧 Comandos Git

### 🔄 Antes de programar

- `git pull`

### 📤 Fazer commit

- `git add .`
- `git commit -m "Descreva a alteração"`
- `git push`

> **Alerta:** Sempre execute `git pull` antes de começar a programar.