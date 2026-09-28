# CreatorQI: guia rápido

Este é um fork em português do [Creator Lab de Artem Novitckii](https://github.com/artemnovitckii/creator-lab). Ele ajuda a pesquisar roteiros de Reels de perfis públicos: coleta, transcreve, classifica partes do roteiro e permite comparar padrões de engajamento dentro da amostra. Não prevê viralização.

## Instale em cinco passos

1. Instale [Node.js](https://nodejs.org/en/download) 22.9 ou mais recente e [FFmpeg](https://ffmpeg.org/download.html). Confirme que `ffmpeg` e `ffprobe` funcionam no terminal.
2. [Baixe o projeto em ZIP](https://github.com/custodiorod/creator-lab/archive/refs/heads/main.zip) e extraia, ou rode `git clone https://github.com/custodiorod/creator-lab.git`.
3. Na pasta do projeto, rode `npm run setup`. Abra o `.env` criado e preencha suas próprias chaves `APIFY_TOKEN`, `OPENROUTER_API_KEY` e `GROQ_API_KEY`.
4. Rode `npm run doctor` e `npm start`. Abra [http://127.0.0.1:5190](http://127.0.0.1:5190) e confira **Conexões**.
5. Em **Nova análise**, informe um perfil público e comece com 20 Reels e um limite baixo para a Apify. Quando terminar, filtre por tema e gancho, abra os trechos do roteiro e compare grupos considerando o tamanho das amostras.

Sem chaves, o painel oferece apenas um ensaio visual com dados sintéticos. Uma análise real pode gerar cobranças separadas da Apify, do Groq e do OpenRouter/Jev. O limite informado para Apify não limita os outros provedores. A área de carrosséis está em fase experimental.

Para configuração detalhada, troca de provedor, privacidade e solução de problemas, leia o [guia completo](SETUP.md). Mantenha seu `.env` e a pasta `data/` fora de qualquer compartilhamento. O código é distribuído sob a licença [MIT](../LICENSE), com o aviso de autoria original preservado.
