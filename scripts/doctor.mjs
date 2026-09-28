import {readFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {spawnSync} from 'node:child_process';
let config={};try{config=parseEnv(await readFile(new URL('../.env',import.meta.url),'utf8'));}catch{}
const value=name=>config[name]||process.env[name];
let failures=0;
function check(name,ok,hint){console.log(`${ok?'OK':'MISSING'} ${name}${ok?'':`: ${hint}`}`);if(!ok)failures++;}
const [major,minor]=process.versions.node.split('.').map(Number);
check('Node.js',major>22||major===22&&minor>=9,'Instale o Node 24 LTS ou Node >=22.9.');
for(const cmd of ['ffmpeg','ffprobe'])check(cmd,spawnSync(cmd,['-version'],{stdio:'ignore'}).status===0,'Instale o FFmpeg e abra o terminal novamente.');
const provider=value('TRANSCRIPTION_PROVIDER')||'groq';
check('Provedor de transcrição',['fireworks','groq'].includes(provider),'Defina TRANSCRIPTION_PROVIDER como groq ou fireworks.');
check('Chave da Apify',Boolean(value('APIFY_TOKEN')||value('APIFY_API_TOKEN')),'Adicione APIFY_TOKEN ao .env.');
check('Chave do OpenRouter para o Jev',Boolean(value('OPENROUTER_API_KEY')),'Adicione OPENROUTER_API_KEY ao .env.');
if(['fireworks','groq'].includes(provider))check(`Chave do ${provider}`,Boolean(value(provider==='groq'?'GROQ_API_KEY':'FIREWORKS_API_KEY')),`Adicione sua chave do ${provider} ao .env.`);
console.log('As chaves são verificadas apenas quanto à presença. Seus valores não são exibidos e nenhuma solicitação paga é feita.');
console.log(failures?'Corrija os itens acima para executar análises reais. A demonstração sintética funciona sem chaves.':'Tudo pronto para um teste. Inicie o aplicativo e verifique as Conexões.');
process.exitCode=failures?1:0;
