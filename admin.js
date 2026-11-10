
'use strict';
const sidebarItems=[
['painel','▣','Painel'],['series','▤','Séries e Doramas'],['episodios','◫','Episódios'],
['temporadas','▭','Temporadas'],['categorias','◈','Categorias'],['usuarios','♙','Usuários'],
['pedidos','▦','Pedidos e Pagamentos'],['relatorios','↗','Relatórios'],
['banners','▨','Banners e Destaques'],['configuracoes','⚙','Configurações']
];
const att=(id,element)=>document.getElementById(id)?.[element||'value']||'';
const rstatus=v=>'<span class="pill '+(v?'on':'off')+'">'+(v?'Publicado':'Rascunho')+'</span>';
const amount=v=>Math.max(0,num(v));
function adminTab(t){Admin.tab=t;Admin.seriesId=null;Admin.epId=null;Admin.bannerId=null;render();scrollTo(0,0)}
function openSeriesEditor(id){Admin.seriesId=id;Admin.tab='series';navigate('admin')}
function openEpisodeEditor(id){Admin.epId=id;Admin.tab='episodios';navigate('admin')}
function table(head,rows){return '<div class="table-wrap"><table><thead><tr>'+head.map(x=>'<th>'+h(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'}
function adminPanel(){
 const active=Admin.tab;
 const s=sidebarItems.map(x=>'<button type="button" class="'+(active===x[0]?'active':'')+'" onclick="adminTab(\''+x[0]+'\')"><span>'+x[1]+'</span> '+h(x[2])+'</button>').join('');
 let page;
 switch(active){
 case 'series':page=adminSeries();break;
 case 'temporadas':page=adminSeasons();break;
 case 'episodios':page=adminEpisodes();break;
 case 'categorias':page=adminCategories();break;
 case 'usuarios':page=adminUsers();break;
 case 'pedidos':page=adminOrders();break;
 case 'relatorios':page=adminReports();break;
 case 'banners':page=adminBanners();break;
 case 'configuracoes':page=adminSettings();break;
 default:page=adminHome();
 }
 return '<div class="admin-layout"><aside class="sidebar" aria-label="Menu administrador">'+s+'</aside><section class="admin-body">'+page+'</section></div>';
}
function adminHeader(title,action){
 return '<div class="admin-head"><div><div class="eyebrow">Administração Tramia</div><h1>'+h(title)+'</h1></div><div class="flex">'+(action||'')+'<button class="btn ghost small" onclick="reload()">↻ Atualizar</button></div></div>';
}
function adminHome(){
 const published=D.series.filter(x=>x.published).length;
 const epPublic=D.episodes.filter(x=>x.published).length;
 const paid=D.orders.filter(x=>x.status==='paid').reduce((t,x)=>t+num(x.amount),0);
 return adminHeader('Painel')+
 '<div class="grid wide"><div class="stat"><span class="muted">Séries cadastradas</span><strong>'+D.series.length+'</strong></div>'+
 '<div class="stat"><span class="muted">Séries publicadas</span><strong>'+published+'</strong></div>'+
 '<div class="stat"><span class="muted">Episódios publicados</span><strong>'+epPublic+'</strong></div>'+
 '<div class="stat"><span class="muted">Usuários</span><strong>'+D.profiles.length+'</strong></div></div>'+
 '<div class="panel" style="margin-top:20px"><h3>Gerenciar conteúdo</h3><p>O catálogo é carregado diretamente do Supabase. Todas as alterações salvas aqui permanecem após recarregar o site.</p>'+
 '<div class="flex"><button class="btn" onclick="createSeries()">+ Nova série</button><button class="btn secondary" onclick="adminTab(\'episodios\')">Episódios</button><button class="btn secondary" onclick="adminTab(\'banners\')">Banners</button></div></div>'+
 '<div class="panel" style="margin-top:20px"><h3>Receita registrada</h3><strong style="font-size:26px">'+money(paid)+'</strong><p class="hint">Soma de pedidos marcados como pagos no banco. A plataforma ainda não processa pagamentos online.</p></div>';
}
function adminSeries(){
 const s=seriesOf(Admin.seriesId);
 if(s)return seriesEditor(s);
 return adminHeader('Séries e Doramas','<button class="btn" onclick="createSeries()">+ Adicionar série</button>')+
 (D.series.length?table(['Título','Tipo','Temporadas','Episódios','Status','Ações'],D.series.map(x=>
 '<tr><td><strong>'+h(x.title)+'</strong></td><td>'+h(x.kind==='dorama'?'Dorama':'Série')+'</td><td>'+seriesSeasons(x.id).length+'</td><td>'+countEps(x.id)+'</td><td>'+rstatus(x.published)+'</td>'+
 '<td><button class="btn small" onclick="openSeriesEditor(\''+x.id+'\')">Editar / Episódios</button><button class="btn danger small" onclick="deleteSeries(\''+x.id+'\')">Excluir</button></td></tr>')):
 empty('Seu catálogo está vazio','Clique em Adicionar série para cadastrar o primeiro título. Não há séries de demonstração.'));
}
async function createSeries(){
 const title=prompt('Qual é o título da nova série ou dorama?');
 if(title===null)return;
 if(!title.trim()||title.trim().length>180)return toast('Informe um título entre 1 e 180 caracteres.');
 const r=await client.from('tramia_series').insert({title:title.trim(),published:false}).select('id').single();
 if(r.error)return toast('Falha ao criar série: '+r.error.message);
 await loadData();Admin.seriesId=r.data.id;Admin.tab='series';render();
}
function seriesEditor(s){
 return adminHeader('Editar série','<button class="btn secondary" onclick="Admin.seriesId=null;render()">← Voltar à lista</button>')+
 '<form class="panel form" onsubmit="event.preventDefault();saveSeries(\''+s.id+'\')">'+
 '<div class="formgrid"><label>Título<input id="series-title" required maxlength="180" value="'+h(s.title)+'"></label>'+
 '<label>Tipo<select id="series-kind"><option value="serie" '+(s.kind==='serie'?'selected':'')+'>Série</option><option value="dorama" '+(s.kind==='dorama'?'selected':'')+'>Dorama</option></select></label>'+
 '<label class="span2">Sinopse<textarea id="series-synopsis" rows="4">'+h(s.synopsis)+'</textarea></label>'+
 '<label>Gêneros (separe com vírgula)<input id="series-genres" value="'+h((s.genres||[]).join(', '))+'" placeholder="Romance, Drama"></label>'+
 '<label>Classificação indicativa<input id="series-class" maxlength="15" value="'+h(s.classification)+'"></label>'+
 '<label>Link da capa (HTTPS)<input id="series-cover" type="url" value="'+h(s.cover_url||'')+'" placeholder="https://..."></label>'+
 '<label>Link da imagem de destaque (HTTPS)<input id="series-backdrop" type="url" value="'+h(s.backdrop_url||'')+'" placeholder="https://..."></label>'+
 '<label>Preço de aluguel (R$)<input id="series-rent" type="number" min="0" step=".01" value="'+num(s.price_rent)+'"></label>'+
 '<label>Preço de compra (R$)<input id="series-buy" type="number" min="0" step=".01" value="'+num(s.price_buy)+'"></label>'+
 '<label>Horas de aluguel<input id="series-hours" type="number" min="1" max="720" value="'+s.rental_hours+'"></label>'+
 '<label style="display:flex;align-items:center;gap:10px"><input type="checkbox" id="series-public" '+(s.published?'checked':'')+'> Publicada no catálogo</label>'+
 '<label style="display:flex;align-items:center;gap:10px"><input type="checkbox" id="series-featured" '+(s.featured?'checked':'')+'> Em destaque na página inicial</label>'+
 '</div><button class="btn" type="submit">Salvar série</button></form>'+
 '<div class="sec-head"><h2>Temporadas e episódios</h2><button class="btn" onclick="createSeason(\''+s.id+'\')">+ Nova temporada</button></div>'+
 (seriesSeasons(s.id).length?seriesSeasons(s.id).map(sn=>'<div class="panel" style="margin-bottom:12px"><div class="flex between"><div><h3>Temporada '+sn.number+' '+h(sn.title)+'</h3><span class="hint">'+seasonEps(sn.id).length+' episódios · '+(sn.published?'Publicada':'Rascunho')+'</span></div>'+
 '<div class="flex"><button class="btn secondary small" onclick="editSeason(\''+sn.id+'\')">Editar temporada</button><button class="btn small" onclick="createEpisode(\''+sn.id+'\')">+ Episódio</button><button class="btn danger small" onclick="deleteSeason(\''+sn.id+'\')">Excluir</button></div></div>'+
 (seasonEps(sn.id).length?table(['Número','Título','Acesso','Status','Ações'],seasonEps(sn.id).map(e=>
 '<tr><td>'+e.number+'</td><td>'+h(e.title||'Episódio '+e.number)+'</td><td>'+(e.is_free?'Grátis':'Premium')+'</td><td>'+rstatus(e.published)+'</td><td><button class="btn secondary small" onclick="openEpisodeEditor(\''+e.id+'\')">Editar vídeo</button><button class="btn danger small" onclick="deleteEpisode(\''+e.id+'\')">Excluir</button></td></tr>')):
 '<p class="muted">Ainda não há episódios nesta temporada.</p>')+'</div>').join(''):
 empty('Nenhuma temporada cadastrada','Adicione uma temporada para começar a inserir seus episódios.'));
}
async function saveSeries(id){
 const title=att('series-title').trim();
 if(!title)return toast('O título é obrigatório.');
 const genres=att('series-genres').split(',').map(x=>x.trim()).filter(Boolean).slice(0,15);
 const cover=att('series-cover').trim(),back=att('series-backdrop').trim();
 if((cover&&!/^https:\/\//i.test(cover))||(back&&!/^https:\/\//i.test(back)))return toast('As imagens precisam ter um endereço HTTPS.');
 const data={
 title,kind:att('series-kind'),synopsis:att('series-synopsis'),genres,classification:att('series-class').trim()||'L',
 cover_url:cover||null,backdrop_url:back||null,price_rent:amount(att('series-rent')),price_buy:amount(att('series-buy')),
 rental_hours:Math.min(720,Math.max(1,Math.round(num(att('series-hours'))))),
 published:$('#series-public').checked,featured:$('#series-featured').checked
 };
 const r=await client.from('tramia_series').update(data).eq('id',id).select('id');
 if(r.error||!r.data?.length)return toast('Não foi possível salvar a série: '+(r.error?.message||'Sem permissão.'));
 await reload();toast('Série salva no banco de dados.');
}
async function deleteSeries(id){
 if(!confirm('Excluir esta série definitivamente? Temporadas e episódios cadastrados também serão removidos. Esta operação não pode ser desfeita.'))return;
 const r=await client.from('tramia_series').delete().eq('id',id);
 if(r.error)return toast('Erro ao excluir: '+r.error.message);
 Admin.seriesId=null;await reload();toast('Série excluída.');
}
function adminSeasons(){
 const seasons=[...D.seasons].sort((a,b)=>seriesOf(a.series_id)?.title.localeCompare(seriesOf(b.series_id)?.title||'')||a.number-b.number);
 return adminHeader('Temporadas','<button class="btn" onclick="createSeason()">+ Nova temporada</button>')+
 (seasons.length?table(['Série','Temporada','Episódios','Status','Ações'],seasons.map(s=>
 '<tr><td>'+h(seriesOf(s.series_id)?.title||'—')+'</td><td>'+s.number+' · '+h(s.title)+'</td><td>'+seasonEps(s.id).length+'</td><td>'+rstatus(s.published)+'</td>'+
 '<td><button class="btn small" onclick="editSeason(\''+s.id+'\')">Editar</button><button class="btn secondary small" onclick="createEpisode(\''+s.id+'\')">+ Episódio</button><button class="btn danger small" onclick="deleteSeason(\''+s.id+'\')">Excluir</button></td></tr>')):
 empty('Nenhuma temporada','Crie uma série e depois cadastre sua primeira temporada.'));
}
async function createSeason(seriesId){
 let id=seriesId;
 if(!id){
  if(!D.series.length)return toast('Cadastre uma série antes de criar temporadas.');
  $('#dialog').innerHTML='<div class="overlay" onclick="if(event.target===this)closeDialog()"><div class="dialog"><h2>Nova temporada</h2><p>Selecione a série:</p><select id="choose-series" style="width:100%">'+D.series.map(s=>'<option value="'+s.id+'">'+h(s.title)+'</option>').join('')+'</select><div class="flex" style="margin-top:18px"><button class="btn" onclick="const id=document.getElementById(\'choose-series\').value;closeDialog();createSeason(id)">Criar temporada</button><button class="btn secondary" onclick="closeDialog()">Cancelar</button></div></div></div>';return;
 }

 if(!seriesOf(id))return toast('Selecione uma série cadastrada.');
 const next=1+Math.max(0,...seriesSeasons(id).map(s=>s.number));
 const r=await client.from('tramia_seasons').insert({series_id:id,number:next,title:'',published:false});
 if(r.error)return toast('Não foi possível criar temporada: '+r.error.message);
 await reload();toast('Temporada '+next+' adicionada.');
}
async function editSeason(id){
 const s=seasonOf(id);if(!s)return;
 const title=prompt('Nome da temporada (pode ficar vazio):',s.title||'');if(title===null)return;
 const number=prompt('Número da temporada:',String(s.number));if(number===null)return;
 const parsed=Number(number);
 if(!Number.isInteger(parsed)||parsed<1)return toast('Número da temporada inválido.');
 const published=confirm('Deseja deixar esta temporada PUBLICADA?\nOK = publicada / Cancelar = rascunho');
 const r=await client.from('tramia_seasons').update({title:title.trim(),number:parsed,published}).eq('id',id);
 if(r.error)return toast('Erro ao editar: '+r.error.message);
 await reload();toast('Temporada salva.');
}
async function deleteSeason(id){
 if(!confirm('Excluir a temporada e todos os episódios dela?'))return;
 const r=await client.from('tramia_seasons').delete().eq('id',id);
 if(r.error)return toast('Erro ao excluir temporada: '+r.error.message);
 await reload();toast('Temporada excluída.');
}
function adminEpisodes(){
 const e= D.episodes.find(x=>x.id===Admin.epId);
 if(e)return episodeEditor(e);
 return adminHeader('Episódios','<button class="btn" onclick="createEpisode()">+ Novo episódio</button>')+
 (D.episodes.length?table(['Série','Temporada','Ep.','Título','Grátis','Status','Ações'],D.episodes.map(e=>{
 const se=seasonOf(e.season_id);
 return '<tr><td>'+h(seriesOf(se?.series_id)?.title||'—')+'</td><td>'+num(se?.number)+'</td><td>'+e.number+'</td><td>'+h(e.title||'Sem título')+'</td><td>'+(e.is_free?'Sim':'Não')+'</td><td>'+rstatus(e.published)+'</td>'+
 '<td><button class="btn small" onclick="openEpisodeEditor(\''+e.id+'\')">Editar / Vídeo</button><button class="btn danger small" onclick="deleteEpisode(\''+e.id+'\')">Excluir</button></td></tr>';
 })):empty('Nenhum episódio cadastrado','Adicione uma temporada e depois um episódio.'));
}
async function createEpisode(seasonId){
 let id=seasonId;
 if(!id){
  if(!D.seasons.length)return toast('Cadastre uma temporada antes de criar episódios.');
  $('#dialog').innerHTML='<div class="overlay" onclick="if(event.target===this)closeDialog()"><div class="dialog"><h2>Novo episódio</h2><p>Selecione a temporada:</p><select id="choose-season" style="width:100%">'+D.seasons.map(s=>'<option value="'+s.id+'">'+h(seriesOf(s.series_id)?.title||'')+' — Temporada '+s.number+'</option>').join('')+'</select><div class="flex" style="margin-top:18px"><button class="btn" onclick="const id=document.getElementById(\'choose-season\').value;closeDialog();createEpisode(id)">Criar episódio</button><button class="btn secondary" onclick="closeDialog()">Cancelar</button></div></div></div>';return;
 }

 if(!seasonOf(id))return toast('Temporada não encontrada.');
 const next=1+Math.max(0,...seasonEps(id).map(x=>x.number));
 const r=await client.from('tramia_episodes').insert({season_id:id,number:next,title:'Episódio '+next,published:false}).select('id').single();
 if(r.error)return toast('Erro ao criar episódio: '+r.error.message);
 await loadData();Admin.epId=r.data.id;Admin.tab='episodios';render();
}
function episodeEditor(e){
 const season=seasonOf(e.season_id);
 return adminHeader('Editar episódio','<button class="btn secondary" onclick="Admin.epId=null;render()">← Voltar à lista</button>')+
 '<p class="muted">'+h(seriesOf(season?.series_id)?.title||'')+' · Temporada '+season?.number+'</p>'+
 '<form class="panel form" onsubmit="event.preventDefault();saveEpisode(\''+e.id+'\')">'+
 '<div class="formgrid"><label>Número<input id="ep-number" type="number" min="1" required value="'+e.number+'"></label>'+
 '<label>Título<input id="ep-title" maxlength="200" required value="'+h(e.title)+'"></label>'+
 '<label>Duração (segundos)<input id="ep-duration" type="number" min="0" value="'+num(e.duration_seconds)+'"></label>'+
 '<label>URL da miniatura (HTTPS)<input id="ep-thumb" type="url" value="'+h(e.thumbnail_url||'')+'"></label>'+
 '<label class="span2" style="display:flex;align-items:center;gap:8px"><input id="ep-free" type="checkbox" '+(e.is_free?'checked':'')+'> Episódio gratuito</label>'+
 '<label class="span2" style="display:flex;align-items:center;gap:8px"><input id="ep-published" type="checkbox" '+(e.published?'checked':'')+'> Publicado</label></div>'+
 '<button type="submit" class="btn">Salvar episódio</button></form>'+
 '<div class="panel" style="margin-top:20px"><h3>Enviar arquivo de vídeo</h3><p>Arquivos MP4 ou WebM enviados para um armazenamento privado, protegidos pelas permissões de episódio. Tamanho máximo: 50 MB por arquivo nesta configuração.</p>'+
 '<div class="flex"><input type="file" accept="video/mp4,video/webm,video/quicktime" id="ep-video-file"><button class="btn" onclick="uploadEpisodeVideo(\''+e.id+'\')">Enviar vídeo</button></div><p id="video-upload-status" class="hint"></p>'+
 '<div class="notice">Para vídeos grandes e streaming em escala, será necessário integrar um serviço especializado de vídeo. Não publique links externos premium sem proteção.</div></div>';
}
async function saveEpisode(id){
 const thumb=att('ep-thumb').trim();
 if(thumb&&!/^https:\/\//i.test(thumb))return toast('A miniatura exige um endereço HTTPS.');
 const data={number:Math.max(1,Math.round(num(att('ep-number')))),title:att('ep-title').trim(),duration_seconds:Math.round(amount(att('ep-duration'))),thumbnail_url:thumb||null,is_free:$('#ep-free').checked,published:$('#ep-published').checked};
 if(!data.title)return toast('Informe o título.');
 const r=await client.from('tramia_episodes').update(data).eq('id',id).select('id');
 if(r.error||!r.data?.length)return toast('Erro ao salvar episódio: '+(r.error?.message||'Sem permissão.'));
 await reload();toast('Episódio salvo.');
}
async function deleteEpisode(id){
 if(!confirm('Excluir este episódio permanentemente?'))return;
 const r=await client.from('tramia_episodes').delete().eq('id',id);
 if(r.error)return toast('Falha ao excluir: '+r.error.message);
 Admin.epId=null;await reload();toast('Episódio excluído.');
}
async function uploadEpisodeVideo(id){
 const f=$('#ep-video-file')?.files?.[0];if(!f)return toast('Selecione um vídeo.');
 if(f.size>50*1024*1024)return toast('O arquivo ultrapassa 50 MB. Use um serviço de vídeo para arquivos maiores.');
 if(!['video/mp4','video/webm','video/quicktime'].includes(f.type))return toast('Formato não permitido. Use MP4, WebM ou MOV.');
 const st=$('#video-upload-status');st.textContent='Enviando vídeo para armazenamento privado...';
 const filename=f.name.replace(/[^a-zA-Z0-9_.-]/g,'_').slice(-100);
 const path=id+'/'+Date.now()+'-'+filename;
 const upload=await client.storage.from('tramia-episodes').upload(path,f,{cacheControl:'3600',contentType:f.type,upsert:false});
 if(upload.error){st.textContent='Falha: '+upload.error.message;return;}
 const result=await client.from('tramia_episode_media').upsert({episode_id:id,storage_path:path,video_url:null});
 if(result.error){st.textContent='O arquivo foi enviado, mas não foi vinculado: '+result.error.message;return;}
 st.textContent='Vídeo vinculado ao episódio. Publicação depende do status da série, temporada e episódio.';
 toast('Upload salvo.');
}
function adminCategories(){
 return adminHeader('Categorias','<button class="btn" onclick="createCategory()">+ Criar categoria</button>')+
 (D.categories.length?table(['Categoria','Ação'],D.categories.map(x=>
 '<tr><td>'+h(x.name)+'</td><td><button class="btn danger small" onclick="deleteCategory(\''+x.id+'\')">Excluir</button></td></tr>')):
 empty('Nenhuma categoria','Cadastre seus gêneros e categorias para organizar a biblioteca.'))+
 '<p class="hint" style="margin-top:12px">As categorias cadastradas aparecem como filtros. Na edição de cada série, informe os gêneros separados por vírgula.</p>';
}
async function createCategory(){
 const name=prompt('Nome da categoria:');if(name===null)return;
 const v=name.trim();if(!v||v.length>60)return toast('Informe um nome de até 60 caracteres.');
 const r=await client.from('tramia_categories').insert({name:v});
 if(r.error)return toast('Não foi possível criar categoria: '+r.error.message);
 await reload();toast('Categoria salva.');
}
async function deleteCategory(id){
 if(!confirm('Excluir esta categoria? Os gêneros já cadastrados nas séries permanecem.'))return;
 const r=await client.from('tramia_categories').delete().eq('id',id);
 if(r.error)return toast('Erro: '+r.error.message);await reload();
}
function adminUsers(){
 return adminHeader('Usuários')+
 '<p>Contas são criadas pelos próprios usuários. O sistema não exige aprovação manual do administrador. O usuário recebe mensagens de recuperação por e-mail automaticamente.</p>'+
 (D.profiles.length?table(['Nome','E-mail','Cadastrado em'],D.profiles.map(u=>
 '<tr><td>'+h(u.display_name||'—')+'</td><td>'+h(u.email||'—')+'</td><td>'+date(u.created_at)+'</td></tr>')):
 empty('Nenhum usuário','Os usuários aparecerão aqui quando criarem suas contas.'))+
 '<p class="hint">Por segurança, senhas nunca são exibidas nem recuperadas pelo administrador.</p>';
}
function adminOrders(){
 return adminHeader('Pedidos e Pagamentos')+
 '<div class="notice">Consulta de pedidos reais registrados no banco. O checkout e as cobranças automáticas ainda dependem de um provedor de pagamento e de confirmação segura por webhook.</div>'+
 (D.orders.length?table(['Pedido','Cliente','Série','Tipo','Valor','Situação','Criado'],D.orders.map(o=>
 '<tr><td>'+h(o.id.slice(0,8))+'</td><td>'+h(D.profiles.find(p=>p.user_id===o.user_id)?.email||'—')+'</td><td>'+h(seriesOf(o.series_id)?.title||'—')+'</td><td>'+h(o.kind)+'</td><td>'+money(o.amount)+'</td><td>'+h(o.status)+'</td><td>'+date(o.created_at)+'</td></tr>')):
 empty('Nenhum pedido registrado','Nenhum pagamento de demonstração será exibido aqui.'));
}
function adminReports(){
 const real=D.orders.filter(o=>o.status==='paid');
 const paid=real.reduce((sum,x)=>sum+num(x.amount),0);
 const count=D.orders.length;
 const memberships=D.entitlements.length;
 return adminHeader('Relatórios')+
 '<div class="grid wide"><div class="stat"><span class="muted">Faturamento registrado</span><strong>'+money(paid)+'</strong></div><div class="stat"><span class="muted">Total de pedidos</span><strong>'+count+'</strong></div><div class="stat"><span class="muted">Pedidos pagos</span><strong>'+real.length+'</strong></div><div class="stat"><span class="muted">Acessos registrados</span><strong>'+memberships+'</strong></div></div>'+
 '<div class="panel" style="margin-top:20px"><h3>Conteúdo</h3><p>Séries publicadas: <b>'+D.series.filter(x=>x.published).length+'</b> · Temporadas: <b>'+D.seasons.length+'</b> · Episódios: <b>'+D.episodes.length+'</b></p><p class="hint">Os números são calculados em tempo real a partir dos registros existentes, sem dados falsos de demonstração. Métricas de visualização exigem integração de analytics.</p></div>';
}
function adminBanners(){
 const b=D.banners.find(x=>x.id===Admin.bannerId);
 if(b)return bannerEditor(b);
 return adminHeader('Banners e Destaques','<button class="btn" onclick="createBanner()">+ Novo banner</button>')+
 (D.banners.length?table(['Título','Ordem','Série','Ativo','Ações'],D.banners.map(x=>
 '<tr><td>'+h(x.title||'Sem título')+'</td><td>'+x.sort_order+'</td><td>'+h(seriesOf(x.series_id)?.title||'—')+'</td><td>'+rstatus(x.active)+'</td>'+
 '<td><button class="btn small" onclick="Admin.bannerId=\''+x.id+'\';render()">Editar</button><button class="btn danger small" onclick="deleteBanner(\''+x.id+'\')">Excluir</button></td></tr>')):
 empty('Nenhum banner cadastrado','Sem banners de demonstração. Você pode criar destaques para a página inicial.'));
}
async function createBanner(){
 const r=await client.from('tramia_banners').insert({title:'Novo destaque',active:false}).select('id').single();
 if(r.error)return toast('Erro: '+r.error.message);
 await loadData();Admin.bannerId=r.data.id;render();
}
function bannerEditor(b){
 return adminHeader('Editar banner','<button class="btn secondary" onclick="Admin.bannerId=null;render()">← Voltar</button>')+
 '<form class="form panel" onsubmit="event.preventDefault();saveBanner(\''+b.id+'\')">'+
 '<label>Título<input id="banner-title" value="'+h(b.title)+'" required></label><label>Subtítulo<textarea id="banner-subtitle" rows="3">'+h(b.subtitle)+'</textarea></label>'+
 '<label>Imagem (HTTPS)<input id="banner-image" type="url" value="'+h(b.image_url||'')+'"></label>'+
 '<label>Série relacionada<select id="banner-series"><option value="">Sem série</option>'+D.series.map(s=>'<option value="'+s.id+'" '+(s.id===b.series_id?'selected':'')+'>'+h(s.title)+'</option>').join('')+'</select></label>'+
 '<label>Ordem<input id="banner-order" type="number" value="'+b.sort_order+'"></label>'+
 '<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="banner-active" '+(b.active?'checked':'')+'> Banner ativo</label><button class="btn">Salvar banner</button></form>';
}
async function saveBanner(id){
 const image=att('banner-image').trim();
 if(image&&!/^https:\/\//i.test(image))return toast('Endereço da imagem deve usar HTTPS.');
 const r=await client.from('tramia_banners').update({
 title:att('banner-title').trim(),subtitle:att('banner-subtitle'),image_url:image||null,
 series_id:att('banner-series')||null,sort_order:Math.round(num(att('banner-order'))),active:$('#banner-active').checked
 }).eq('id',id);
 if(r.error)return toast('Erro ao salvar: '+r.error.message);
 await reload();toast('Banner salvo.');
}
async function deleteBanner(id){
 if(!confirm('Excluir este banner?'))return;
 const r=await client.from('tramia_banners').delete().eq('id',id);
 if(r.error)return toast('Erro: '+r.error.message);
 Admin.bannerId=null;await reload();
}
function adminSettings(){
 return adminHeader('Configurações')+
 '<form class="panel form" onsubmit="event.preventDefault();saveSiteSettings()">'+
 '<label>Nome do site<input id="settings-name" maxlength="60" required value="'+h(siteSetting('site_name','Tramia'))+'"></label>'+
 '<label>Frase principal da home<input id="settings-title" maxlength="150" value="'+h(siteSetting('home_title','Séries e doramas para maratonar'))+'"></label>'+
 '<label>Descrição da home<textarea id="settings-subtitle" rows="3">'+h(siteSetting('home_subtitle','Descubra histórias incríveis e comece a assistir.'))+'</textarea></label>'+
 '<button class="btn">Salvar configurações</button></form>'+
 '<div class="panel" style="margin-top:20px"><h3>Autenticação e cobrança</h3>'+
 '<p>Cadastro e login com Supabase Auth. Recuperação de senha por e-mail sem intervenção da equipe.</p>'+
 '<p class="hint">O envio de mensagens ao público e o endereço de redirecionamento precisam estar configurados no painel do Supabase.</p>'+
 '<div class="notice">O gateway de pagamento não está configurado. Não habilite compras ou aluguéis como cobranças reais até conectar um provedor.</div></div>';
}
async function saveSiteSettings(){
 const changes=[['site_name',att('settings-name').trim()],['home_title',att('settings-title').trim()],['home_subtitle',att('settings-subtitle').trim()]];
 if(!changes[0][1])return toast('Informe o nome do site.');
 const r=await client.from('tramia_settings').upsert(changes.map(([key,value])=>({key,value,updated_at:new Date().toISOString()})));
 if(r.error)return toast('Erro ao salvar configurações: '+r.error.message);
 await reload();toast('Configurações salvas.');
}
