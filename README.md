# CreatorQI (Creator Lab)

Adaptação em português do [Creator Lab de Artem Novitckii](https://github.com/artemnovitckii/creator-lab), distribuída sob a licença MIT original. Esta edição usa Jev via OpenRouter e acrescenta uma área experimental de análise de carrosséis por perfil.

Transforme os Reels do Instagram de um criador em uma biblioteca de pesquisa. Filtre por tema e gancho, compare o engajamento, leia os roteiros e abra as publicações originais por trás de cada padrão.

Feito com **Apify → transcrição pelo Groq → TypeSafe Jev via OpenRouter**. A área experimental de carrosséis usa um modelo visual do OpenRouter para ler slides e o Jev para classificar o relatório. Fireworks é uma alternativa opcional para transcrição. O sistema roda localmente no navegador. Use suas próprias chaves de API e escolha um perfil público, inclusive o seu.

## Comece por aqui

O [guia rápido](docs/GUIA-RAPIDO.md) mostra o caminho mais curto. O **[guia completo de configuração](docs/SETUP.md)** explica as ferramentas, chaves, primeira análise e solução de problemas.

1. Instale [Node.js](https://nodejs.org/en/download) (24 recomendado; mínimo 22.9) e [FFmpeg](https://ffmpeg.org/download.html). `ffmpeg` e `ffprobe` precisam estar no PATH.
2. Baixe este repositório usando **Code → Download ZIP**, extraia o arquivo e abra um terminal nessa pasta. Ou clone o repositório:

   ```sh
   git clone https://github.com/custodiorod/creator-lab.git
   cd creator-lab
   ```

3. Crie sua configuração local:

   ```sh
   npm run setup
   ```

4. Abra `.env` no editor e adicione `APIFY_TOKEN`, `OPENROUTER_API_KEY` e `GROQ_API_KEY`. Groq é o transcritor padrão; Fireworks é uma alternativa opcional.
5. Verifique e inicie:

   ```sh
   npm run doctor
   npm start
   ```

6. Abra **http://127.0.0.1:5190**, confira **Conexões** e escolha **Nova análise**. Digite o nome de usuário sem `@`. Comece com um teste de 20 Reels.

Não é necessário instalar dependências npm nem compilar o projeto. O ensaio visual com dados sintéticos funciona sem chaves; a coleta e análise reais usam APIs pagas dos provedores.

## O que você recebe

- Oito classificações da transcrição: tema, tipo de abertura, mecanismo do gancho, estrutura do roteiro, evidências, apelo emocional, especificidade do conselho e chamada para ação falada.
- Trechos do roteiro identificados como gancho, contexto, problema, exemplo, orientação, conclusão, chamada para ação ou outro, com o texto original e marcações de tempo disponíveis.
- Filtros combinados por tema e gancho, comparações de engajamento com tamanho das amostras e links para os Reels originais.
- Mural sincronizado de miniaturas e mapa de desempenho, com reprodução dos resultados salvos para gravação de tela.
- Pausa e retomada, reutilização de transcrições, cache de classificações e exportação em JSON.
- Área experimental para pesquisar carrosséis de um perfil público e inspecionar a análise visual dos slides. Valide resultados e custos em um lote pequeno antes de usar em produção.

O Jev analisa a fala antes de associar as métricas de desempenho. Visualizações e reproduções permanecem separadas. Métricas desconhecidas continuam identificadas como desconhecidas. As comparações descrevem a amostra selecionada; não provam o que causou o desempenho de um Reel.

## Provedores

| Etapa | Provedor | Configuração |
| --- | --- | --- |
| Coletar dados e endereços de mídia dos Reels | [Apify Instagram Reel Scraper](https://apify.com/apify/instagram-reel-scraper) | `APIFY_TOKEN` |
| Transcrever, opção padrão | [Groq](https://console.groq.com/docs/speech-to-text) | `TRANSCRIPTION_PROVIDER=groq`, `GROQ_API_KEY` |
| Transcrever, alternativa opcional | [Fireworks](https://fireworks.ai/) | `TRANSCRIPTION_PROVIDER=fireworks`, `FIREWORKS_API_KEY` |
| Classificar roteiros | [TypeSafe Jev via OpenRouter](https://openrouter.ai/typesafe/jev-1.13) | `OPENROUTER_API_KEY` |

Use apenas um dos provedores de transcrição. Não há troca automática que possa gerar cobrança em outro provedor. Reinicie o servidor após alterar `.env`.

## Custos e cobertura

Você paga diretamente aos provedores. O limite de gastos da Apify no formulário cobre **somente a Apify**, não o Jev nem a transcrição. Comece com poucos itens e confira a cobrança dos provedores antes de aumentar o lote. Os custos exibidos são estimativas baseadas nas tarifas configuradas, não uma garantia de cobrança.

Cada execução solicita de 1 a 1.000 Reels de um perfil. A cobertura real depende do Instagram e da Apify. O coletor ignora Reels fixados e de teste; portanto, não garante um arquivo completo da conta. Mídias privadas, apagadas, expiradas ou inacessíveis podem falhar. Vídeos só com música ou fala muito curta ficam fora da análise de roteiro.

A reprodução anima resultados salvos. Ela não faz uma nova coleta nem uma nova análise, e sua velocidade não representa o tempo de processamento do sistema.

## Privacidade

O servidor fica disponível em `127.0.0.1`. As chaves ficam no `.env` local (inclusive quando salvas pela janela Conexões) e autenticam as solicitações aos provedores. A Apify recebe o perfil; o provedor de fala escolhido recebe o áudio; o OpenRouter encaminha a classificação ao Jev. A mídia original é obtida de endereços CDN compatíveis. O painel também carrega fontes do Google Fonts. [Veja o fluxo completo dos dados](docs/PRIVACY.md).

`.env`, dados gerados, caches e mídias baixadas ficam fora do Git. Este repositório não inclui chaves pessoais nem arquivos coletados de criadores. Nunca publique suas chaves em uma issue do GitHub nem compartilhe o arquivo `.env`.

## Desenvolvimento

```sh
npm run check
npm test
```

Os testes usam respostas simuladas dos provedores e arquivos locais para o FFmpeg; não fazem chamadas pagas. A verificação das chaves confirma o acesso à conta, mas não uma análise completa bem-sucedida. Um pequeno teste real é a etapa final de configuração.

- `server.mjs`: servidor HTTP local, API e configuração das conexões.
- `lib/providers.mjs`: chamadas aos provedores e extração de mídia.
- `lib/pipeline.mjs`: processamento, persistência, novas tentativas e cache.
- `lib/schema.mjs`: definições das classificações do Jev.
- `public/`: painel de pesquisa e telas de gravação.
- `data/`: gerado automaticamente e mantido localmente.

Licenciado sob MIT, preservando o copyright de Artem Novitckii no [LICENSE](LICENSE). As adaptações desta edição estão neste fork. Este é um projeto independente e não é um produto oficial do Instagram, Apify, Fireworks, Groq, OpenRouter ou TypeSafe.
