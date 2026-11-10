
'use strict';
const SUPABASE_URL='https://onnnegyvrczarwwtnvum.supabase.co';
const SUPABASE_KEY='sb_publishable_lhrPBQbxZ9S5hopHTizGwQ_Cm0jSMGV';
const client=window.supabase?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
let currentUser=null,isAdmin=false,ready=false,dataError='',term='',authMode='login',recoveryReady=false,recoveryEmail='',recoveryNotice='';
let D={series:[],seasons:[],episodes:[],categories:[],banners:[],settings:[],favorites:[],entitlements:[],profiles:[],orders:[]};
let Admin={tab:'painel',seriesId:null,epId:null,bannerId:null};
const $=s=>document.querySelector(s);
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const src=v=>{try{let u=new URL(String(v),location.origin);return /^https?:$/.test(u.protocol)?h(u.href):''}catch{return ''}};
const num=v=>Number(v||0);
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(num(v));
const date=v=>v?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'}).format(new Date(v)):'—';
const seriesOf=id=>D.series.find(x=>x.id===id);
const seasonOf=id=>D.seasons.find(x=>x.id===id);
const seasonEps=id=>D.episodes.filter(x=>x.season_id===id).sort((a,b)=>a.number-b.number);
const seriesSeasons=id=>D.seasons.filter(x=>x.series_id===id).sort((a,b)=>a.number-b.number);
const countEps=id=>seriesSeasons(id).reduce((t,s)=>t+seasonEps(s.id).length,0);
const siteSetting=(k,f)=>D.settings.find(x=>x.key===k)?.value||f;
const canWatch=id=>isAdmin||D.entitlements.some(e=>e.series_id===id&&(e.kind==='buy'||(e.expires_at&&new Date(e.expires_at).getTime()>Date.now())));
function toast(message){const old=$('.toast');if(old)old.remove();const d=document.createElement('div');d.className='toast';d.textContent=message;document.body.append(d);setTimeout(()=>d.remove(),4500)}
function navigate(route){const hash='#'+route;if(location.hash===hash)render();else location.hash=hash}
function navLink(route,label,current){return '<a class="navlink '+(current===route?'active':'')+'" href="#'+route+'">'+label+'</a>'}
function nav(){
 const path=location.hash.slice(1)||'inicio';
 $('#brand-name').textContent=siteSetting('site_name','Tramia');
 let n=navLink('inicio','Início',path)+navLink('series','Séries e Doramas',path)+navLink('biblioteca','Minha biblioteca',path);
 if(isAdmin)n+=navLink('admin','Admin',path);
 $('#nav').innerHTML=n;
 $('#user-action').innerHTML=currentUser?'<button class="btn secondary small" onclick="logout()">Sair</button>':'<a class="btn small" href="#entrar">Entrar</a>';
}
function poster(x){const u=src(x.cover_url);return '<div class="poster">'+(u?'<img loading="lazy" src="'+u+'" alt="Capa de '+h(x.title)+'">':'<span class="placeholder">▶</span>')+'</div>'}
function card(x){return '<button class="cover" onclick="navigate(\'serie/'+x.id+'\')">'+poster(x)+'<div class="cover-title">'+h(x.title)+'</div><div class="cover-sub">'+h(x.kind==='dorama'?'Dorama':'Série')+' · '+countEps(x.id)+' episódios</div></button>'}
function empty(title,desc,action){return '<div class="empty"><div class="empty-icon">✦</div><h2>'+h(title)+'</h2><p>'+h(desc)+'</p>'+(action||'')+'</div>'}
function grid(list){return list.length?'<div class="grid">'+list.map(card).join('')+'</div>':empty('Nenhuma série encontrada','O catálogo ainda não tem títulos com esse filtro.')}
function visibleSeries(){return isAdmin?D.series.filter(x=>x.published):D.series}
function homePage(){
 const all=visibleSeries();
 const b=[...D.banners].filter(x=>x.active).sort((a,b)=>a.sort_order-b.sort_order)[0];
 const f=all.find(x=>x.featured)||all[0];
 const main=b?.series_id?all.find(x=>x.id===b.series_id):f;
 const title=b?.title||main?.title||siteSetting('home_title','Séries e doramas para maratonar');
 const intro=b?.subtitle||main?.synopsis||siteSetting('home_subtitle','Descubra histórias incríveis e comece a assistir.');
 const image=src(b?.image_url||main?.backdrop_url||main?.cover_url);
 return '<section class="hero">'+(image?'<img alt="" src="'+image+'">':'')+
 '<div class="hero-content"><div class="eyebrow">✦ '+(main?'Em destaque':'Bem-vindo à Tramia')+'</div><h1>'+h(title)+'</h1><p>'+h(intro)+'</p>'+
 (main?'<button class="btn" onclick="navigate(\'serie/'+main.id+'\')">▶ Ver série</button>':'<a class="btn" href="#series">Explorar catálogo</a>')+'</div></section>'+
 (all.length?'<div class="sec-head"><h2>Séries e doramas</h2><a class="btn secondary small" href="#series">Ver todos</a></div>'+grid(all.slice(0,12)):
 empty('O catálogo começa aqui','Ainda não há séries publicadas. Novos títulos aparecerão automaticamente quando forem adicionados.',isAdmin?'<button class="btn" onclick="Admin.tab=\'series\';navigate(\'admin\')">Cadastrar primeira série</button>':''));
}
function browsePage(){
 const q=term.toLocaleLowerCase('pt-BR').trim();
 const list=visibleSeries().filter(x=>(x.title+' '+(x.genres||[]).join(' ')+' '+x.kind).toLocaleLowerCase('pt-BR').includes(q));
 return '<div class="sec-head"><h1 style="margin:0">Séries e Doramas</h1><span class="muted">'+list.length+' título(s)</span></div>'+
 '<div class="chips" style="margin-bottom:22px"><button class="chip" onclick="searchGenre(\'\')">Todas</button>'+
 D.categories.map(x=>'<button class="chip" onclick="searchGenre(\''+h(x.name).replace(/&#39;/g,"\\'")+'\')">'+h(x.name)+'</button>').join('')+'</div>'+grid(list);
}
function searchGenre(value){term=value;$('#search').value=value;navigate('series')}
function seriesPage(id){
 const x=seriesOf(id);if(!x)return empty('Série não encontrada','A série pode ter sido removida ou ainda não está publicada.');
 const seasons=seriesSeasons(x.id).filter(s=>s.published||isAdmin);
 const access=canWatch(x.id);
 return '<div class="detail"><div>'+poster(x)+'</div><div><div class="eyebrow">'+(x.kind==='dorama'?'Dorama':'Série')+'</div>'+
 '<h1>'+h(x.title)+'</h1><div class="chips"><span class="chip">'+h(x.classification)+'</span>'+
 (x.genres||[]).map(g=>'<span class="chip">'+h(g)+'</span>').join('')+
 '<span class="chip">'+seasons.length+' temporadas</span></div>'+
 '<p>'+h(x.synopsis)+'</p><div class="flex"><button class="btn secondary" onclick="toggleFavorite(\''+x.id+'\')">'+(D.favorites.some(f=>f.series_id===x.id)?'★ Na minha lista':'☆ Minha lista')+'</button>'+
 (isAdmin?'<button class="btn secondary" onclick="openSeriesEditor(\''+x.id+'\')">✎ Editar série</button>':'')+
 '</div><p class="hint">Episódios gratuitos podem ser assistidos sem pagamento. O acesso a episódios premium depende de uma compra ou liberação válida.</p></div></div>'+
 (seasons.length?seasons.map(season=>{
 const eps=seasonEps(season.id).filter(e=>e.published||isAdmin);
 return '<div class="sec-head"><h2>Temporada '+season.number+(season.title?' · '+h(season.title):'')+'</h2><span class="muted">'+eps.length+' episódios</span></div>'+
 (eps.length?'<div class="episode-grid">'+eps.map(e=>'<button class="episode" onclick="playEpisode(\''+e.id+'\')"><strong>▶ '+h(e.title||'Episódio '+e.number)+'</strong><p>Ep. '+e.number+'</p><span class="pill '+(e.is_free||access?'on':'off')+'">'+(e.is_free?'Grátis':access?'Liberado':'Premium 🔒')+'</span></button>').join('')+'</div>':
 '<p class="muted">Esta temporada ainda não tem episódios publicados.</p>');
 }).join(''):empty('Nenhum episódio disponível','As temporadas e episódios aparecerão aqui quando forem publicados.'))+
 ((!access&&num(x.price_buy)>0)?'<div class="panel" style="margin-top:26px"><h3>Conteúdo premium</h3><p>Aluguel: '+money(x.price_rent)+' · Compra: '+money(x.price_buy)+'</p><div class="notice">Pagamentos online ainda não estão habilitados. Nenhum valor será cobrado por este site.</div></div>':'');
}
function libraryPage(){
 if(!currentUser)return empty('Entre para acessar sua biblioteca','Crie uma conta ou entre para salvar séries e consultar seu acesso.', '<a class="btn" href="#entrar">Entrar ou criar conta</a>');
 const favs=D.series.filter(x=>D.favorites.some(f=>f.series_id===x.id));
 const owned=D.series.filter(x=>canWatch(x.id));
 return '<h1>Minha biblioteca</h1><h2>Favoritas</h2>'+(favs.length?grid(favs):'<p>Você ainda não salvou nenhuma série.</p>')+
 '<div class="sec-head"><h2>Minhas séries liberadas</h2></div>'+(owned.length?grid(owned):'<p>Nenhum acesso premium ativo.</p>');
}
async function toggleFavorite(id){
 if(!currentUser){toast('Entre na sua conta para salvar séries.');navigate('entrar');return;}
 const existing=D.favorites.some(f=>f.series_id===id);
 const r=existing?await client.from('tramia_favorites').delete().eq('series_id',id).eq('user_id',currentUser.id):await client.from('tramia_favorites').insert({user_id:currentUser.id,series_id:id});
 if(r.error)return toast('Não foi possível atualizar sua biblioteca: '+r.error.message);
 const f=await client.from('tramia_favorites').select('*');if(!f.error)D.favorites=f.data||[];render();
}
async function playEpisode(id){
 const e=D.episodes.find(x=>x.id===id);if(!e)return toast('Episódio não encontrado.');
 const sn=seasonOf(e.season_id);if(!sn)return toast('Temporada não encontrada.');
 const sr=seriesOf(sn.series_id);if(!sr)return toast('Série não encontrada.');
 if(!e.is_free&&!canWatch(sr.id)){
  $('#dialog').innerHTML='<div class="overlay" onclick="if(event.target===this)closeDialog()"><div class="dialog"><div class="flex between"><h2>Acesso premium</h2><button class="btn secondary small" onclick="closeDialog()">✕</button></div><p>Este episódio exige acesso liberado.</p><p>O pagamento online ainda não está ativo. Entre em contato com a administração para consultar a disponibilidade, sem realizar pagamentos por aqui.</p><button class="btn" onclick="closeDialog()">Entendi</button></div></div>';return;
 }
 $('#dialog').innerHTML='<div class="overlay"><div class="dialog"><h2>Abrindo episódio...</h2></div></div>';
 const r=await client.from('tramia_episode_media').select('*').eq('episode_id',e.id).maybeSingle();
 if(r.error||!r.data){$('#dialog').innerHTML='<div class="overlay" onclick="if(event.target===this)closeDialog()"><div class="dialog"><h2>'+h(e.title)+'</h2><p>O vídeo ainda não foi enviado ou você não tem permissão para assisti-lo.</p><button class="btn secondary" onclick="closeDialog()">Voltar</button></div></div>';return;}
 let u=r.data.video_url||'';
 if(r.data.storage_path){
  const link=await client.storage.from('tramia-episodes').createSignedUrl(r.data.storage_path,3600);
  if(link.error)return toast('Não foi possível abrir o arquivo: '+link.error.message);
  u=link.data?.signedUrl||'';
 }
 u=src(u);
 if(!u)return toast('URL de vídeo inválida.');
 $('#dialog').innerHTML='<div class="overlay"><div class="dialog" style="max-width:850px"><div class="flex between"><h2>'+h(e.title||'Episódio '+e.number)+'</h2><button class="btn secondary small" onclick="closeDialog()">Fechar ✕</button></div><video src="'+u+'" controls playsinline autoplay controlsList="nodownload">Seu navegador não suporta a reprodução.</video><p class="hint">O vídeo está disponível conforme as permissões definidas para este episódio.</p></div></div>';
}
function closeDialog(){$('#dialog').innerHTML=''}
function authPage(){
 return '<div class="authbox panel"><div class="eyebrow">Minha conta</div><h1>'+({login:'Entrar na Tramia',signup:'Criar minha conta'}[authMode]||'Entrar na Tramia')+'</h1>'+
 '<p>'+ (authMode==='signup'?'Cadastre-se para ter sua biblioteca. Nenhuma autorização manual do administrador é necessária.':'Entre para acessar sua conta e sua biblioteca.')+'</p>'+
 '<div class="flex"><button class="btn '+(authMode==='login'?'':'secondary')+'" onclick="authMode=\'login\';render()">Entrar</button><button class="btn '+(authMode==='signup'?'':'secondary')+'" onclick="authMode=\'signup\';render()">Criar conta</button></div>'+
 '<form class="form" onsubmit="event.preventDefault();submitAuth()">'+
 (authMode==='signup'?'<label>Nome<input type="text" id="auth-name" autocomplete="name" maxlength="90" required></label>':'')+
 '<label>E-mail<input type="email" id="auth-email" autocomplete="email" required></label>'+
 '<label>Senha<input type="password" id="auth-password" minlength="8" autocomplete="'+(authMode==='signup'?'new-password':'current-password')+'" required></label>'+
 '<button type="submit" class="btn">'+(authMode==='signup'?'Cadastrar':'Entrar')+'</button></form>'+
 '<div style="margin-top:18px"><a class="text-btn" href="#recuperar">Esqueci minha senha</a></div></div>';
}
async function submitAuth(){
 if(!client)return toast('Serviço de autenticação indisponível.');
 const email=$('#auth-email').value.trim().toLowerCase(),password=$('#auth-password').value;
 let r;
 if(authMode==='signup'){
  r=await client.auth.signUp({email,password,options:{data:{full_name:$('#auth-name').value.trim()}}});
  if(r.error)return toast('Cadastro não concluído: '+r.error.message);
  if(!r.data.session){toast('Cadastro recebido. Confira seu e-mail para confirmar a conta e entrar.');authMode='login';render();return;}
  toast('Conta criada com sucesso!');
 } else{
  r=await client.auth.signInWithPassword({email,password});
  if(r.error)return toast('Não foi possível entrar. Confira seu e-mail e senha.');
  toast('Login realizado!');
 }
 await restoreAuth();
 navigate(isAdmin?'admin':'inicio');
}
function recoveryPage(){
 return '<div class="authbox panel"><div class="eyebrow">Recuperar acesso</div><h1>Esqueceu a senha?</h1>'+
 (recoveryReady?'<p>Verificação concluída. Defina uma nova senha para sua conta.</p><form class="form" onsubmit="event.preventDefault();setNewPassword()"><label>Nova senha<input type="password" id="new-pass" minlength="8" required autocomplete="new-password"></label><label>Confirme a senha<input type="password" id="repeat-pass" minlength="8" required autocomplete="new-password"></label><button class="btn">Atualizar senha</button></form>':
 '<p>Informe seu e-mail. Você receberá uma mensagem automática com um link de recuperação. Se o e-mail estiver configurado para enviar código, também poderá informar o código abaixo.</p><form class="form" onsubmit="event.preventDefault();sendRecovery()"><label>E-mail cadastrado<input type="email" id="recovery-email" value="'+h(recoveryEmail)+'" required autocomplete="email"></label><button class="btn">Enviar recuperação</button></form>'+
 '<form class="form" onsubmit="event.preventDefault();verifyRecoveryCode()" style="margin-top:20px"><label>Código recebido por e-mail<input id="recovery-code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" maxlength="8" placeholder="Código de verificação" required></label><button class="btn secondary">Confirmar código</button></form>'+
 '<p class="hint">O link funciona automaticamente. Para receber um código numérico, o modelo de e-mail de recuperação precisa estar configurado para enviar o código.</p>')+
 (recoveryNotice?'<div class="notice">'+h(recoveryNotice)+'</div>':'')+
 '<p><a class="text-btn" href="#entrar">Voltar ao login</a></p></div>';
}
async function sendRecovery(){
 if(!client)return toast('Serviço indisponível.');
 recoveryEmail=$('#recovery-email').value.trim().toLowerCase();
 const url=location.origin+location.pathname+'#recuperar';
 const r=await client.auth.resetPasswordForEmail(recoveryEmail,{redirectTo:url});
 if(r.error){recoveryNotice='Não foi possível enviar. Verifique a configuração de e-mails da plataforma.';toast('Erro: '+r.error.message);}
 else{recoveryNotice='Se o e-mail estiver cadastrado, enviaremos as instruções para recuperar sua senha. Verifique também o spam.';toast('Verifique seu e-mail.');}
 render();
}
async function verifyRecoveryCode(){
 recoveryEmail=$('#recovery-email').value.trim().toLowerCase();
 const token=$('#recovery-code').value.trim();
 const r=await client.auth.verifyOtp({email:recoveryEmail,token,type:'recovery'});
 if(r.error)return toast('Código inválido ou expirado. Confira a mensagem recebida.');
 recoveryReady=true;recoveryNotice='';render();
}
async function setNewPassword(){
 const p=$('#new-pass').value;
 if(p!==$('#repeat-pass').value)return toast('As senhas não coincidem.');
 const r=await client.auth.updateUser({password:p});
 if(r.error)return toast('Não foi possível atualizar a senha: '+r.error.message);
 recoveryReady=false;recoveryNotice='';
 await client.auth.signOut();
 await restoreAuth();toast('Senha atualizada. Agora você pode entrar.');
 navigate('entrar');
}
async function logout(){
 if(client)await client.auth.signOut();
 await restoreAuth();toast('Você saiu da sua conta.');navigate('inicio');
}
async function restoreAuth(){
 if(!client){ready=true;dataError='Não foi possível carregar o Supabase.';render();return;}
 try{
 const u=await client.auth.getUser();currentUser=u.data.user||null;
 isAdmin=false;
 if(currentUser){
  const a=await client.from('tramia_admins').select('user_id').eq('user_id',currentUser.id).maybeSingle();
  isAdmin=!a.error&&!!a.data;
 }
 await loadData();
 }catch(e){dataError='Falha na conexão com o banco de dados: '+e.message}
 ready=true;render();
}
async function loadData(){
 const tables=['tramia_series','tramia_seasons','tramia_episodes','tramia_categories','tramia_banners','tramia_settings'];
 const fields=['series','seasons','episodes','categories','banners','settings'];
 const req=tables.map(t=>client.from(t).select('*'));
 if(currentUser){req.push(client.from('tramia_favorites').select('*'),client.from('tramia_entitlements').select('*'));}
 if(isAdmin){req.push(client.from('tramia_profiles').select('*'),client.from('tramia_orders').select('*'));}
 const all=await Promise.all(req);dataError='';
 all.forEach((r,i)=>{if(r.error){dataError='Falha ao carregar '+(tables[i]||'dados')+': '+r.error.message;return}
  const k=i<fields.length?fields[i]:i===6?'favorites':i===7?'entitlements':currentUser?'profiles':'profiles';
  // administradores ainda podem consultar usuários e pedidos com ou sem sessão de biblioteca
  if(k)D[k]=r.data||[];
 });
 if(isAdmin){
  const prof=all[currentUser?8:6],ord=all[currentUser?9:7];
  D.profiles=prof&&!prof.error?prof.data||[]:[];
  D.orders=ord&&!ord.error?ord.data||[]:[];
 }else{D.profiles=[];D.orders=[];}
 if(!currentUser){D.favorites=[];D.entitlements=[];}
 D.series.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
}
async function reload(){await loadData();render()}
function render(){
 if(!$('#app'))return;
 nav();
 if(!ready){$('#app').innerHTML='<div class="panel">Carregando Tramia...</div>';return;}
 if(dataError){$('#app').innerHTML='<div class="notice">'+h(dataError)+' <button class="btn small" onclick="restoreAuth()">Tentar novamente</button></div>';return;}
 const route=decodeURIComponent(location.hash.slice(1)||'inicio');
 let body='';
 if(route==='inicio')body=homePage();
 else if(route==='series')body=browsePage();
 else if(route==='biblioteca')body=libraryPage();
 else if(route==='entrar')body=authPage();
 else if(route==='recuperar')body=recoveryPage();
 else if(route.startsWith('serie/'))body=seriesPage(route.slice(6));
 else if(route==='admin'){if(!currentUser)body=empty('Acesso restrito','Faça login com sua conta administradora.','<a class="btn" href="#entrar">Entrar</a>');
  else if(!isAdmin)body=empty('Sem permissão administrativa','Esta conta pode assistir às séries, mas não pode gerenciar o site.');
  else body=adminPanel();
 }else body=empty('Página não encontrada','Volte para a página inicial.','<a class="btn" href="#inicio">Início</a>');
 $('#app').innerHTML=body;document.title=siteSetting('site_name','Tramia')+' | Séries e doramas';
}
function boot(){
 if(!client){ready=true;dataError='Serviço de login não foi carregado.';render();return;}
 $('#search').addEventListener('input',e=>{term=e.target.value;if(location.hash!=='#series')navigate('series');else render()});
 addEventListener('hashchange',render);
 addEventListener('keydown',e=>{if(e.key==='Escape')closeDialog()});
 client.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY'){recoveryReady=true;recoveryNotice='';setTimeout(()=>navigate('recuperar'),0);}
  if(['SIGNED_IN','SIGNED_OUT','TOKEN_REFRESHED','USER_UPDATED'].includes(event))setTimeout(restoreAuth,0);
 });
 restoreAuth();
}
document.addEventListener('DOMContentLoaded',boot);
