import http from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';
import {Pipeline} from './lib/pipeline.mjs';
import {dimensions,roles,VERSION} from './lib/schema.mjs';
import {metrics} from './lib/data.mjs';
import {checkProvider,download,mediaURL,startCarouselProfileScrape,pollScrape,dataset,delay} from './lib/providers.mjs';
import {demo,artwork} from './lib/demo.mjs';
const ROOT=dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT||5190),HOST='127.0.0.1';
const CSRF=randomBytes(32).toString('hex');
let localEnv={};try{localEnv=parseEnv(await readFile(join(ROOT,'.env'),'utf8'));}catch{}
const transcriptionProvider=localEnv.TRANSCRIPTION_PROVIDER||process.env.TRANSCRIPTION_PROVIDER||'groq';
const sessionKeys={};const verified={};
const keys=()=>({fireworks:sessionKeys.fireworks||localEnv.FIREWORKS_API_KEY||process.env.FIREWORKS_API_KEY,apify:sessionKeys.apify||localEnv.APIFY_TOKEN||process.env.APIFY_TOKEN||process.env.APIFY_API_TOKEN,groq:sessionKeys.groq||localEnv.GROQ_API_KEY||process.env.GROQ_API_KEY,jev:sessionKeys.jev||localEnv.OPENROUTER_API_KEY||process.env.OPENROUTER_API_KEY});
const envNames={apify:'APIFY_TOKEN',groq:'GROQ_API_KEY',fireworks:'FIREWORKS_API_KEY',jev:'OPENROUTER_API_KEY'};
async function saveConnectionKeys(data){
 let source='';try{source=await readFile(join(ROOT,'.env'),'utf8')}catch{}
 const lines=source.split(/\r?\n/);let changed=false;
 for(const [name,envName] of Object.entries(envNames)){
  if(typeof data[name]!=='string'||!data[name].trim())continue;
  const value=data[name].trim();if(/[\r\n\0]/.test(value)||value.length>500)throw new Error(`A chave ${name} tem formato inválido`);
  const index=lines.findIndex(line=>new RegExp(`^\\s*(?:export\\s+)?${envName}\\s*=`).test(line));const line=`${envName}=${JSON.stringify(value)}`;
  if(index>=0)lines[index]=line;else lines.push(line);
  sessionKeys[name]=value;localEnv[envName]=value;verified[name]=false;changed=true;
 }
 if(changed)await writeFile(join(ROOT,'.env'),lines.filter((line,index)=>index<lines.length-1||line!=='').join('\n').replace(/\n*$/,'\n'),{mode:0o600});
}
const pipeline=await new Pipeline(process.env.LAB_DATA_DIR||join(ROOT,'data'),keys,{transcriptionProvider,visionModel:localEnv.OPENROUTER_VISION_MODEL||process.env.OPENROUTER_VISION_MODEL||'google/gemini-3.1-flash-lite',fireworksRpm:Number(localEnv.FIREWORKS_REQUESTS_PER_MINUTE||process.env.FIREWORKS_REQUESTS_PER_MINUTE||60),groqRpm:Number(localEnv.GROQ_REQUESTS_PER_MINUTE||process.env.GROQ_REQUESTS_PER_MINUTE||20)}).init();
let mediaActive=0;const mediaWaiters=[],mediaPending=new Map();async function mediaTask(fn){if(mediaActive>=8)await new Promise(resolve=>mediaWaiters.push(resolve));else mediaActive++;try{return await fn();}finally{if(mediaWaiters.length)mediaWaiters.shift()();else mediaActive--;}}
const clients=new Set();pipeline.listeners.add(id=>{for(const res of clients)res.write(`data: ${JSON.stringify({id})}\n\n`);});
const publicJob=j=>{const copy=structuredClone(j);for(const p of copy.posts){if(p.transcript)delete p.transcript.raw;if(p.analysis)delete p.analysis.raw;}return copy;};
const summary=j=>({id:j.id,creator:j.creator,status:j.status,createdAt:j.createdAt,count:j.posts.length,completed:j.posts.filter(p=>p.analysis).length});
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>20*1024*1024)throw new Error('A solicitação excede 20 MB');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString()||'{}');}
const streams=setInterval(()=>{for(const res of clients)res.write(': heartbeat\n\n');},20000);streams.unref();
const server=http.createServer(async(req,res)=>{
 try{
  if(![`127.0.0.1:${PORT}`,`localhost:${PORT}`].includes(req.headers.host)){json(res,403,{error:'Local requests only'});return;}
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  const url=new URL(req.url,`http://${HOST}:${PORT}`);const path=url.pathname;
  if(req.method!=='GET'&&(req.headers['x-lab-token']!==CSRF||req.headers.origin&&![`http://${HOST}:${PORT}`,`http://localhost:${PORT}`].includes(req.headers.origin))){json(res,403,{error:'Refresh the local app before changing data'});return;}
  if(path==='/api/bootstrap'){json(res,200,{token:CSRF,transcriptionProvider,dimensions:Object.fromEntries(Object.entries(dimensions).map(([k,v])=>[k,{title:v.title,criteria:v.question.criteria}])),roles,version:VERSION,connections:Object.fromEntries(Object.entries(keys()).map(([k,v])=>[k,{configured:Boolean(v),verified:verified[k]||false}])),runs:[...pipeline.jobs.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(summary)});return;}
  if(path==='/api/connections'&&req.method==='POST'){const data=await body(req);await saveConnectionKeys(data);json(res,200,{saved:true,persisted:true});return;}
  if(path==='/api/connections/check'&&req.method==='POST'){const results=Object.fromEntries(await Promise.all(Object.entries(keys()).map(async([name,key])=>[name,await checkProvider(name,key)])));for(const [name,r]of Object.entries(results))verified[name]=r.verified;json(res,200,results);return;}
  if(path==='/api/carousel/analyze'&&req.method==='POST'){
   const data=await body(req),images=data.images;
   if(!keys().jev)throw new Error('Conecte a chave OpenRouter em Conexões antes de analisar');
   if(!Array.isArray(images)||images.length<1||images.length>10)throw new Error('Envie de 1 a 10 imagens, na ordem do carrossel');
   let total=0;const safeImages=images.map((image,index)=>{
    if(!image||typeof image.data!=='string'||!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image.data))throw new Error(`A imagem ${index+1} não é um JPEG, PNG ou WebP válido`);
    const bytes=Buffer.from(image.data.slice(image.data.indexOf(',')+1),'base64');if(!bytes.length||bytes.length>1.5*1024*1024)throw new Error(`Cada imagem precisa ter até 1,5 MB (imagem ${index+1})`);total+=bytes.length;
    const mime=image.data.slice(5,image.data.indexOf(';'));const pngSignature=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);if(mime==='image/jpeg'&&!(bytes[0]===0xff&&bytes[1]===0xd8)||mime==='image/png'&&!bytes.subarray(0,8).equals(pngSignature)||mime==='image/webp'&&bytes.toString('ascii',8,12)!=='WEBP')throw new Error(`O conteúdo da imagem ${index+1} não corresponde ao formato declarado`);
    return {name:typeof image.name==='string'?image.name.slice(0,120):`Slide ${index+1}`,data:image.data,mime};
   });
   if(total>10*1024*1024)throw new Error('O conjunto de imagens precisa ter até 10 MB');
   const result=await pipeline.analyzeCarousel(safeImages);
   json(res,200,result);return;
  }
  if(path==='/api/carousel/profile'&&req.method==='POST'){
   const data=await body(req),creator=String(data.creator||'').replace(/^@/,'').trim(),limit=Number(data.limit??6),budget=Number(data.budget??1);
   if(!/^[a-zA-Z0-9_.]{1,30}$/.test(creator))throw new Error('Digite um nome de usuário válido do Instagram');
   if(!Number.isInteger(limit)||limit<1||limit>12)throw new Error('Escolha de 1 a 12 publicações recentes');
   if(!Number.isFinite(budget)||budget<0.05||budget>30)throw new Error('O limite da Apify deve ficar entre US$ 0,05 e US$ 30');
   const k=keys();if(!k.apify)throw new Error('Conecte o token da Apify em Conexões antes de buscar o perfil');if(!k.jev)throw new Error('Conecte a chave OpenRouter em Conexões antes de analisar');
   let scrape=await startCarouselProfileScrape({creator,limit,budget},k.apify);const started=Date.now();
   while(!['SUCCEEDED','FAILED','ABORTED','TIMED-OUT'].includes(scrape.status)){if(Date.now()-started>8*60*1000)throw new Error('A coleta da Apify demorou mais que o esperado. Tente novamente mais tarde.');await delay(2500);scrape=await pollScrape(scrape.id,k.apify);}
   if(scrape.status!=='SUCCEEDED')throw new Error(`A coleta do perfil terminou como ${scrape.status}. Confira se o perfil é público e tente novamente.`);
   const rows=await dataset(scrape.defaultDatasetId,k.apify,Math.min(limit,12));
   const carousels=rows.filter(row=>row.type==='post'&&row.isCarousel===true).slice(0,limit);
   if(!carousels.length)throw new Error(`A Apify não encontrou carrosséis recentes em @${creator}. Confira se o perfil é público ou tente Reels + carrossel.`);
   const results=[];
   for(const row of carousels){
    const urls=Array.isArray(row.childImageUrls)&&row.childImageUrls.length?row.childImageUrls:Array.isArray(row.children)?row.children.map(child=>child.imageUrl).filter(Boolean):[];
    if(!urls.length){results.push({id:row.shortcode||row.id,url:row.url,caption:row.caption||'',error:'A Apify não retornou as imagens dos slides.'});continue;}
    const images=[];for(const [i,rawUrl] of urls.slice(0,10).entries()){
     const {bytes,type}=await download(mediaURL(rawUrl),4*1024*1024);const mime=type.split(';')[0].toLowerCase();if(!['image/jpeg','image/png','image/webp'].includes(mime))throw new Error(`A imagem ${i+1} de @${creator} está em um formato não compatível`);
     if(bytes.length>2.5*1024*1024)throw new Error(`A imagem ${i+1} de um carrossel excede 2,5 MB; tente novamente mais tarde`);
     images.push({name:`Slide ${i+1}`,data:`data:${mime};base64,${bytes.toString('base64')}`});
    }
    try{const analysis=await pipeline.analyzeCarousel(images);results.push({id:row.shortcode||row.id,url:row.url||`https://www.instagram.com/p/${row.shortcode}/`,caption:row.caption||'',publishedAt:row.takenAt||null,likes:row.likesCount??null,comments:row.commentsCount??null,slideCount:urls.length,analyzedSlideCount:images.length,slides:urls.slice(0,images.length),analysis});}
    catch(error){results.push({id:row.shortcode||row.id,url:row.url,caption:row.caption||'',error:error.message});}
   }
   json(res,200,{creator,requested:limit,found:carousels.length,results,apifyCostUsd:typeof scrape.usageTotalUsd==='number'?scrape.usageTotalUsd:null});return;
  }
  if(path==='/api/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache',Connection:'keep-alive'});res.write(': connected\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;}
  if(path==='/api/demo'){json(res,200,demo());return;}
  if(path==='/api/runs'&&req.method==='POST'){const data=await body(req);const job=await pipeline.create(data,data.rows);json(res,201,publicJob(job));return;}
  const match=path.match(/^\/api\/runs\/([\w-]+)(?:\/(run|pause|export|metrics|attach))?$/);
  if(match){const [,id,action]=match;const job=pipeline.jobs.get(id);if(!job){json(res,404,{error:'Análise não encontrada'});return;}
   if(action==='run'&&req.method==='POST'){if(pipeline.active.size&&!pipeline.active.has(id))throw new Error('Pause a análise atual antes de iniciar outra');const settings=await body(req);if(settings.concurrency!==undefined){const n=Number(settings.concurrency);if(!Number.isInteger(n)||n<1||n>12)throw new Error('A concorrência deve ser de 1 a 12');job.concurrency=n;}await pipeline.run(id);json(res,200,publicJob(job));return;}
   if(action==='pause'&&req.method==='POST'){await pipeline.pause(id);json(res,200,{paused:true});return;}
   if(action==='attach'&&req.method==='POST'){await pipeline.attachScrape(id,(await body(req)).runId);json(res,200,{attached:true});return;}
   if(action==='metrics'){json(res,200,metrics(job.posts,{dimension:url.searchParams.get('dimension')||'mechanism',metric:url.searchParams.get('metric')||'views',minAgeDays:Number(url.searchParams.get('minAgeDays')??7)}));return;}
   if(action==='export'){res.setHeader('Content-Disposition',`attachment; filename="${job.creator}-${id}.json"`);json(res,200,publicJob(job));return;}
   json(res,200,publicJob(job));return;
  }
  const art=path.match(/^\/demo-art\/(\d+)\.svg$/);if(art){res.writeHead(200,{'Content-Type':'image/svg+xml','Cache-Control':'public, max-age=86400'});res.end(artwork(Number(art[1])));return;}
  const thumb=path.match(/^\/media\/([\w-]+)\/([\w-]+)$/);if(thumb){const job=pipeline.jobs.get(thumb[1]),post=job?.posts.find(p=>p.id===thumb[2]);if(!post?.thumbnailUrl){res.writeHead(404);res.end();return;}const file=join(pipeline.root,'media',post.id+'.img');let bytes;try{bytes=await readFile(file);}catch{if(!mediaPending.has(file))mediaPending.set(file,mediaTask(async()=>{const result=await download(post.thumbnailUrl,8*1024*1024);if(!/^image\/(jpeg|png|webp)/.test(result.type))throw new Error('Formato de miniatura não compatível');await writeFile(file,result.bytes);return result.bytes;}).finally(()=>mediaPending.delete(file)));bytes=await mediaPending.get(file);}const type=bytes[0]===0x89?'image/png':bytes.toString('ascii',8,12)==='WEBP'?'image/webp':'image/jpeg';res.writeHead(200,{'Content-Type':type,'Cache-Control':'public, max-age=86400'});res.end(bytes);return;}
  const files={'/record':'record.html','/record.js':'record.js','/record.css':'record.css','/carousel':'carousel.html','/carousel.js':'carousel.js','/carousel.css':'carousel.css','/':'index.html','/app.js':'app.js','/research.mjs':'research.mjs','/styles.css':'styles.css'};
  if(files[path]){const file=join(ROOT,'public',files[path]);const content=await readFile(file);res.writeHead(200,{'Content-Type':path.endsWith('.css')?'text/css':path.endsWith('.js')||path.endsWith('.mjs')?'text/javascript':'text/html','Cache-Control':'no-cache'});res.end(content);return;}
  json(res,404,{error:'Not found'});
 }catch(e){json(res,400,{error:e.message||'Request failed'});}
});
server.listen(PORT,HOST,()=>console.log(`Creator Lab ready at http://${HOST}:${PORT}`));
