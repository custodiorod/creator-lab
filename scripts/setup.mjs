import {copyFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
try {
 await copyFile(new URL('.env.example',root),new URL('.env',root),constants.COPYFILE_EXCL);
 console.log('Arquivo .env criado. Abra-o no editor de texto e adicione suas chaves.');
} catch(error) {
 if(error.code!=='EEXIST')throw error;
 console.log('O arquivo .env existente foi preservado.');
}
console.log(`Configuration: ${fileURLToPath(new URL('.env',root))}`);
console.log('O padrão usa Groq para transcrição e Jev via OpenRouter. Fireworks é uma alternativa opcional para transcrição.\nDepois execute npm run doctor e npm start. Nunca compartilhe seu .env.');
