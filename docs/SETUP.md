# Configure seu próprio painel de pesquisa de criadores

Você precisa de um computador, Node.js, FFmpeg e três chaves de API: Apify, OpenRouter (para o TypeSafe Jev) e Groq (para transcrição). Fireworks é uma alternativa opcional de transcrição. Não é solicitada a senha do Instagram.

## 1. Instale as ferramentas

Instale o Node.js 24 em [nodejs.org](https://nodejs.org/en/download). A versão 22.9 ou mais recente também funciona. Abra um novo terminal após a instalação.

Instale o FFmpeg usando a opção para o seu computador:

**macOS with Homebrew**

```sh
brew install ffmpeg
```

Se você não tiver o Homebrew, use os links de compilação do macOS em [página de download do FFmpeg](https://ffmpeg.org/download.html), ou instale primeiro o Homebrew pelo site oficial.

**Windows with WinGet, in PowerShell**

```powershell
winget install --id Gyan.FFmpeg --exact
```

Feche e abra o PowerShell novamente após a instalação. Se o WinGet não estiver disponível, use os links de compilação do Windows na página de download do FFmpeg e adicione a pasta `bin` ao PATH.

**Ubuntu / Debian**

```sh
sudo apt update
sudo apt install ffmpeg
```

Verify installation:

```sh
node --version
npm --version
ffmpeg -version
ffprobe -version
```

## 2. Baixe o CreatorQI

Na [página deste fork](https://github.com/custodiorod/creator-lab), clique em **Code → Download ZIP** e extraia o arquivo. Abra um terminal dentro da pasta extraída, onde está o `package.json`.

Se você usa Git:

```sh
git clone https://github.com/custodiorod/creator-lab.git
cd creator-lab
```

Execute:

```sh
npm run setup
```

Isso copia `.env.example` para `.env` sem substituir um arquivo existente. Abra `.env` em um editor de texto. Arquivos iniciados por ponto podem ficar ocultos no Finder; um editor como o VS Code consegue exibi-los.

## 3. Obtenha suas chaves

| Chave | Onde obter | Para que serve |
| --- | --- | --- |
| Apify | [Apify Console](https://console.apify.com/), configurações da conta / integrações de API | Coleta endereços dos Reels, miniaturas e métricas públicas |
| Jev | [OpenRouter](https://openrouter.ai/settings/keys), crie uma chave de API; [Jev model](https://openrouter.ai/typesafe/jev-1.13) | Classifica transcrições e trechos do roteiro |
| Groq, padrão | [Groq chaves de API](https://console.groq.com/keys) | Transcreve o áudio com Whisper Large V3 Turbo |
| Fireworks, alternativa opcional | [Conta Fireworks](https://app.fireworks.ai/), chaves de API | Transcreve o áudio com Whisper V3 Turbo |

Ative o acesso à API e a cobrança necessária em cada conta. Planos, créditos, cotas e opções de upgrade podem mudar. A cobrança é feita por esses serviços, não pelo CreatorQI. O aplicativo usa o [Instagram Reel Scraper](https://apify.com/apify/instagram-reel-scraper), Actor ID `xMc5Ga1oCONPmWJIa`.

## 4. Configure um provedor de transcrição

Para usar a transcrição padrão do **Groq**, preencha estas entradas em `.env`:

```dotenv
APIFY_TOKEN=your_apify_token
OPENROUTER_API_KEY=your_openrouter_key
TRANSCRIPTION_PROVIDER=groq
GROQ_API_KEY=your_groq_key
PORT=5190
```

Para usar o **Fireworks**, substitua pelas configurações abaixo:

```dotenv
APIFY_TOKEN=your_apify_token
OPENROUTER_API_KEY=your_openrouter_key
TRANSCRIPTION_PROVIDER=fireworks
FIREWORKS_API_KEY=your_fireworks_key
PORT=5190
```

Substitua os valores de exemplo pelas suas chaves. Use apenas um valor por configuração. Deixe vazia a chave do provedor de fala que não será usado. Não é necessário editar o JavaScript.

Os limites locais padrão de solicitações por minuto são `FIREWORKS_REQUESTS_PER_MINUTE=60` and `GROQ_REQUESTS_PER_MINUTE=20`. Eles são limites locais, não representam a cota da sua conta. Reduza-os se sua conta tiver um limite menor. Também podem existir cotas de duração de áudio.

As chaves também podem ser informadas por variáveis de ambiente ou na janela **Conexões**. Ao salvar pela janela, as chaves são gravadas no `.env` desta pasta e permanecem após reiniciar o servidor. Não compartilhe esse arquivo. Esta versão não lê o `.env` de uma pasta acima.

## 5. Inicie e verifique

```sh
npm run doctor
npm start
```

O diagnóstico verifica as ferramentas instaladas e a presença das chaves, sem exibi-las nem chamar as APIs dos provedores. Abra **http://127.0.0.1:5190** no navegador. Mantenha o terminal aberto durante o processamento.

Abra **Conexões** e use **Salvar e verificar conexões**. Você precisa apenas de Apify, Jev e do provedor de fala escolhido. A ausência da chave de um provedor de fala não utilizado não é um problema. A verificação confirma o acesso à API; ainda será necessário concluir a primeira solicitação de áudio.

Para parar o servidor, pressione **Ctrl+C** no terminal. Depois de editar `.env`, pare e inicie o servidor novamente.

## 6. Faça um teste pequeno

1. Escolha **Nova análise**.
2. Digite o nome de usuário sem `@` ou cole o endereço do perfil. Use sua conta ou outro perfil público.
3. Comece com **20 Reels**, concorrência **2** e um limite baixo da Apify, como **US$ 1**. A coleta pode parar antes da quantidade solicitada; esse limite cobre apenas as cobranças da Apify.
4. Se quiser, informe um código de idioma de duas letras, como `pt`; caso contrário, deixe o campo vazio.
5. Inicie a análise. Acompanhe a coleta, a transcrição e a classificação em Atividade da análise.
6. Confira algumas transcrições e os Reels originais antes de coletar um lote maior.

O fluxo baixa a mídia, extrai o áudio mono de 16 kHz com FFmpeg, envia-o ao serviço de transcrição escolhido e pede ao Jev que classifique a fala. Cada etapa leva tempo. A reprodução animada só funciona quando os resultados já existem.

Uma análise aceita até 1.000 Reels solicitados. A disponibilidade do Instagram e o coletor determinam o que será retornado. Reels fixados e de teste são ignorados. Isso não garante a análise de todos os Reels de uma conta.

## 7. Use os resultados na sua próxima publicação

Escolha um **Tema** e depois um **Gancho**. O mural, o gráfico e os exemplos serão filtrados juntos. Selecione **Comparar engajamento** para comparar padrões por mediana de reproduções ou visualizações, curtidas por mil e comentários por mil. Confira o tamanho das amostras e compare publicações de idade e duração semelhantes.

Abra **Ler roteiro** ou clique em uma miniatura para ver a abertura, as partes do roteiro e a transcrição. Use **Reel original** para conferir como o conteúdo foi apresentado. Guarde uma estrutura de abertura que possa adaptar ao seu tema e à sua experiência. Engajamento é uma pista para investigar, não uma prova de que copiar um gancho repetirá o resultado.

Você pode repetir o processo na sua conta para encontrar temas que valem ser retomados. Cada análise usa um perfil separado; o aplicativo não combina vários criadores em uma única execução.

Use **Reproduzir análise** para animar os resultados salvos. Filtrar e reproduzir não inicia novas análises pagas. Exporte um JSON para criar um backup local; os arquivos contêm conteúdo do criador e endereços de origem, então confira antes de compartilhar.

## 8. Pause, retome e altere provedores

**Pausar análise** permite que as solicitações em andamento terminem. **Iniciar / retomar** tenta novamente os itens pendentes e preserva os resultados concluídos. Fechar o navegador não para o servidor. Após reiniciá-lo, selecione a análise salva e retome.

Para trocar o provedor de transcrição: pause a análise, pare o servidor, altere `TRANSCRIPTION_PROVIDER` e a chave correspondente em `.env`, reinicie e retome. As transcrições existentes serão reutilizadas. A troca não substitui automaticamente transcrições pelas quais você já pagou.

Se a resposta de início da Apify for perdida, o aplicativo bloqueia uma nova execução duplicada. Encontre o ID da execução do Actor na Apify, anexe-o em **Atividade da análise** e retome. Não inicie outra coleta só porque a primeira resposta se perdeu.

## Solução de problemas

| Problema | O que fazer |
| --- | --- |
| `node` ou `npm` não encontrado | Instale o Node.js e abra o terminal novamente. |
| `--env-file-if-exists` não é compatível | Atualize para Node 22.9 ou mais recente. |
| FFmpeg ou ffprobe ausente | Instale o FFmpeg e confira se os dois comandos estão no PATH. |
| Chave ausente após editar `.env` | Confirme que o arquivo se chama `.env`, não `.env.txt`, e está na mesma pasta de `server.mjs`. Reinicie o servidor. |
| HTTP 401 ou 403 | Confira a chave do provedor escolhido, as permissões da conta e a cobrança. |
| HTTP 429 / análise pausada | Confira as cotas do provedor. Aguarde a renovação ou reduza o ritmo e retome. Limites breves são tentados novamente automaticamente. |
| Acesso ao Groq indisponível | Configure Fireworks como provedor alternativo. As transcrições existentes continuam salvas. |
| Sem áudio / fala muito curta | Esses Reels ficam fora das comparações de roteiros falados; não são classificações pendentes. |
| Falha no download ou mídia expirada | Confira o Reel original. Retomar pode tentar novamente, mas um endereço de origem expirado pode exigir uma nova coleta. |
| O gráfico tem menos pontos que Reels | Reproduções ou visualizações ausentes/não positivas, curtidas desconhecidas, filtros de idade, duplicatas e exclusões podem remover pontos. |
| Nenhum Reel retornado | Confira o nome de usuário, se a conta é pública, o acesso ao Actor, o orçamento e o registro da execução da Apify. |
| Porta já está em uso | Pare o servidor anterior ou defina `PORT=5191` e abra essa porta. |
| A página para de responder após reiniciar | Atualize o navegador para obter um novo token de solicitação local. |

## Custos, privacidade e compartilhamento

As estimativas de custo são separadas para coleta, transcrição e Jev. Valores mínimos das contas, novas tentativas e alterações de tarifas afetam a cobrança real. A fatura de cada provedor é a fonte definitiva. [documentação de fala do Groq](https://console.groq.com/docs/speech-to-text), [preços do Actor da Apify](https://apify.com/apify/instagram-reel-scraper/pricing), e [documentação da TypeSafe](https://docs.typesafe.ai/) são pontos de partida para consultar os termos atuais. A implementação do Fireworks usa o endpoint de áudio Whisper Turbo; confirme a disponibilidade na sua conta.

Não publique por engano `.env`, `data/`, capturas de tela com chaves ou arquivos exportados. Esses arquivos são excluídos do Git por padrão. [Leia o fluxo de dados](PRIVACY.md). O servidor foi feito para uso no seu computador, não para hospedagem pública.

## Grave a demonstração

Abra o **Estúdio de gravação** no painel ou acesse **http://127.0.0.1:5190/record**. Escolha o arquivo salvo e um layout:

- **Scanner:** um mural de miniaturas paginado, análise ampliada do Reel atual, contadores e barras de frequência dos ganchos.
- **Wall + map:** miniaturas maiores ocupam o mural enquanto os pontos correspondentes aparecem no mapa de engajamento. O eixo identifica claramente reproduções ou visualizações, conforme os dados disponíveis; elas nunca são somadas.
- **Script breakdown:** uma imagem grande do Reel e trechos legíveis com os papéis do roteiro identificados pelo Jev.
- **Análise de carrosséis por perfil:** abra **Buscar carrosséis do perfil**, informe o @ de um perfil público e escolha até 12 publicações recentes. A Apify filtra automaticamente os posts em carrossel e busca as imagens dos slides; não é necessário fazer upload manual. O modelo visual padrão é `google/gemini-3.1-flash-lite`; a mesma chave OpenRouter também envia o relatório ao Jev para classificação final. Cada imagem tem limite de 1,5 MB e a seleção, 10 MB. Para trocar o modelo visual, configure `OPENROUTER_VISION_MODEL` no `.env` usando um modelo que aceite imagens pelo OpenRouter.

Escolha 12, 20 ou 40 segundos, pressione Reproduzir e depois **Tela limpa** para ocultar os controles. Pressione **C** para exibi-los, **Espaço** para pausar e **R** para reiniciar. O controle da linha do tempo permite inspecionar qualquer quadro. A repetição mantém uma breve pausa no final.

O quadro tem 1080 × 1000 pixels e se ajusta à janela. Recorte a gravação de tela ao redor dele e coloque-a sobre seu vídeo vertical. Ele é mais alto que o painel de pesquisa para manter o texto legível no celular. Trechos de roteiro podem aparecer truncados; use o painel principal para ler a transcrição completa.

O contador de custos da gravação soma as estimativas salvas do Jev para os roteiros exibidos, incluindo resultados reutilizados; não representa uma nova cobrança nem a fatura completa do fluxo. Custos ausentes aparecem como desconhecidos. O ensaio sintético não tem custo real. Todos os layouts reproduzem resultados salvos e não fazem novas chamadas pagas de análise.
