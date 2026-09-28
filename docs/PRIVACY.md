# Fluxo de dados e arquivos locais

- O aplicativo usa `127.0.0.1`, sem escutar em todas as interfaces de rede. Não tem autenticação multiusuário e não deve ser exposto como servidor público.
- As chaves vêm do `.env`, do ambiente do processo ou da janela Conexões. Ao salvar pela janela, as chaves são gravadas no `.env` local. A API retorna apenas os estados de configuração/verificação, nunca os valores das chaves. As chaves são enviadas aos respectivos provedores para autenticação.
- A Apify recebe o nome do perfil e a configuração da coleta.
- O servidor baixa mídias compatíveis do Instagram/CDN e extrai o áudio localmente. Os arquivos temporários de extração são removidos após o processamento.
- Fireworks ou Groq recebe o áudio extraído para transcrição. Apenas o provedor selecionado é usado.
- O OpenRouter encaminha a solicitação de classificação ao TypeSafe Jev, que recebe o texto transcrito e os identificadores dos trechos. A solicitação de classificação não envia ao Jev as métricas de engajamento nem a legenda da publicação.
- Na análise experimental de carrossel, o usuário informa um perfil público. A Apify recebe o nome do perfil e retorna publicações; os slides selecionados são enviados pelo servidor local ao modelo visual escolhido no OpenRouter. O relatório textual dessa leitura é enviado ao Jev pelo OpenRouter para classificação estruturada. Os provedores processam as imagens conforme suas próprias condições e políticas de retenção.
- O navegador carrega fontes do Google Fonts. Os links de Reels originais abrem o Instagram; prévias e miniaturas podem solicitar a mídia de origem.
- `data/runs/` guarda o estado das análises, respostas dos provedores e dados brutos importados/coletados. `data/cache/` guarda transcrições e classificações. `data/media/` guarda miniaturas. Trate essa pasta como dados privados do projeto.
- As exportações JSON omitem as respostas brutas da transcrição e classificação e não incluem chaves de API. Ainda contêm conteúdo do criador, métricas e endereços das mídias; revise antes de compartilhar.
- `.gitignore` exclui credenciais locais e dados gerados. É uma proteção, não substitui a revisão dos arquivos antes da publicação.

As políticas de retenção e uso são definidas por cada serviço. Executar a interface localmente não significa que todo o processamento aconteça no seu computador.
