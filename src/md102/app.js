
'use strict';
(()=>{
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const modules=$$('section[data-module]'), paths=$$('section[data-path]');
const sessionKey='bmu-md102-session-v1', progressKey='bmu-md102-progress-v1';
const digestExpected='f0a501981dc6f7cba7837156599f0fa48566e690064f8d26ee7e581a78f1fdd9';
let completed=new Set(), active='', searchTimer, toastTimer, loginBusy=false;
let sessionStore=true, progressStore=true;
try{const saved=JSON.parse(localStorage.getItem(progressKey)||'[]');if(Array.isArray(saved))completed=new Set(saved.filter(id=>modules.some(m=>m.id===id)));}catch{progressStore=false;}
function announce(message){clearTimeout(toastTimer);$('#status').textContent=message;$('#status').hidden=false;toastTimer=setTimeout(()=>$('#status').hidden=true,5500);}
function menu(open){$('#sidebar').classList.toggle('open',open);$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-overlay').hidden=!open;if(open)$('#menu-close').focus();}
function setActive(id){if(active===id)return;active=id;$$('.sidebar a.active').forEach(a=>{a.classList.remove('active');a.removeAttribute('aria-current');});const a=$(`.sidebar a[href="#${id}"]:not(.search-results a)`);if(a){a.classList.add('active');a.setAttribute('aria-current','location');}const module=modules.find(m=>m.id===id);if(module){const group=$(`.nav-group[data-group="${module.dataset.learningPath}"]`);if(group)group.open=true;}}
function updateProgress(){const count=modules.filter(m=>completed.has(m.id)).length,total=modules.length,percent=total?Math.round(count/total*100):0;$('#progress-count').textContent=`${count} / ${total} voltooid`;$('#progress-percent').textContent=`${percent}%`;$('#hero-progress').textContent=`${percent}%`;$('.progress-fill').style.width=percent+'%';$('.progress-track').setAttribute('aria-valuenow',percent);modules.forEach(m=>{const done=completed.has(m.id),a=$(`.nav-module[href="#${m.id}"]`),button=$(`[data-complete="${m.id}"]`);a.classList.toggle('complete',done);a.querySelector('.check').textContent=done?'✓':String(m.dataset.module).padStart(2,'0');a.setAttribute('aria-label',m.dataset.title+(done?', voltooid':''));button.setAttribute('aria-pressed',String(done));button.textContent=done?'✓ Voltooid · ongedaan maken':'Markeer als voltooid';});paths.forEach(p=>{const group=modules.filter(m=>m.dataset.learningPath===p.dataset.path),done=group.filter(m=>completed.has(m.id)).length;$(`[data-path-progress="${p.dataset.path}"]`).textContent=`· ${done} voltooid`;});const next=modules.find(m=>!completed.has(m.id));$('#continue-learning').href=next?'#'+next.id:'#labs';$('#continue-learning').textContent=count===0?'Start je leertraject →':next?'Ga verder met leren →':'Alle modules voltooid ✓';}
function saveProgress(){try{localStorage.setItem(progressKey,JSON.stringify([...completed]));progressStore=true;}catch{progressStore=false;announce('Je browser blokkeert opslag. Deze voortgang blijft alleen tijdens het huidige bezoek bewaard.');}}
const nav=$('#module-navigation');
paths.forEach(path=>{const group=document.createElement('details');group.className='nav-group';group.dataset.group=path.dataset.path;group.open=path.dataset.path==='1';const summary=document.createElement('summary'),num=document.createElement('span'),title=document.createElement('span');num.className='path-number';num.textContent=path.dataset.path.padStart(2,'0');title.textContent=path.dataset.title;summary.append(num,title);group.append(summary);modules.filter(m=>m.dataset.learningPath===path.dataset.path).forEach(m=>{const a=document.createElement('a');a.className='nav-module';a.href='#'+m.id;const check=document.createElement('span');check.className='check';check.setAttribute('aria-hidden','true');const text=document.createElement('span');text.textContent=m.dataset.title;a.append(check,text);group.append(a);});nav.append(group);});
$('#path-total').textContent=String(paths.length).padStart(2,'0');$('#module-total').textContent=modules.length;
updateProgress();
$$('[data-complete]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.complete;if(completed.has(id))completed.delete(id);else completed.add(id);saveProgress();updateProgress();if(progressStore)announce(completed.has(id)?'Module voltooid. Je voortgang is bewaard.':'Module opnieuw als niet voltooid gemarkeerd.');}));
$('#reset-progress').addEventListener('click',()=>{if(confirm('Wil je de voortgang van alle modules wissen? Dit kan niet ongedaan worden gemaakt.')){completed.clear();saveProgress();updateProgress();if(progressStore)announce('Je modulevoortgang is gewist.');}});
window.addEventListener('storage',event=>{if(event.key===progressKey){try{const ids=JSON.parse(event.newValue||'[]');if(Array.isArray(ids)){completed=new Set(ids.filter(id=>modules.some(m=>m.id===id)));updateProgress();}}catch{}}});
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const searchIndex=[...modules.map(m=>({module:m,label:m.dataset.title,context:`Learning Path ${m.dataset.learningPath} · Module ${m.dataset.module}`,title:normalize(m.dataset.title),text:normalize(m.textContent)})),...$$('.lab-guide .lab-action').map(m=>{const label=m.querySelector('h4').textContent.replace(/^(Uitvoeren|Resultaat controleren)/,'').trim();return {module:m,label,context:'Lab '+(m.closest('.lab-guide').id==='lab-lp3-03'?'03':'04'),title:normalize(label),text:normalize(m.textContent)};})];
function search(){const query=normalize($('#search').value.trim()),box=$('#search-results');box.replaceChildren();box.hidden=!query;if(!query)return;const words=query.split(/\s+/),results=searchIndex.filter(entry=>words.every(w=>entry.text.includes(w))).sort((a,b)=>Number(words.every(w=>b.title.includes(w)))-Number(words.every(w=>a.title.includes(w))));const count=document.createElement('p');count.setAttribute('role','status');count.textContent=results.length?`${results.length} relevant${results.length===1?' onderdeel':'e onderdelen'}`:'Geen onderdelen gevonden. Probeer een andere zoekterm.';box.append(count);results.forEach(({module:m,label,context})=>{const a=document.createElement('a');a.href='#'+m.id;const meta=document.createElement('span');meta.textContent=context;a.append(meta,document.createTextNode(label));box.append(a);});}
$('#search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(search,140);});$('#search').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();search();const first=$('#search-results a');if(first)first.click();}if(event.key==='Escape'){$('#search').value='';search();}});
$('#menu-toggle').addEventListener('click',()=>menu(!$('#sidebar').classList.contains('open')));$('#menu-close').addEventListener('click',()=>{menu(false);$('#menu-toggle').focus();});$('#menu-overlay').addEventListener('click',()=>menu(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#sidebar').classList.contains('open')){menu(false);$('#menu-toggle').focus();}if(event.key==='Tab'&&$('#sidebar').classList.contains('open')&&matchMedia('(max-width:760px)').matches){const focusable=$$('#sidebar button, #sidebar input, #sidebar summary, #sidebar a[href]').filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
matchMedia('(max-width:760px)').addEventListener('change',()=>menu(false));
document.addEventListener('click',event=>{const a=event.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href').slice(1),target=document.getElementById(id);if(!target)return;event.preventDefault();menu(false);history.pushState(null,'','#'+id);const destination=revealTarget(target)||target;destination.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});setActive(id);const heading=destination.querySelector('h1,h2,h3,h4');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if($('#environment').hidden)return;const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible.length)setActive(visible[0].target.id);},{rootMargin:'-75px 0px -65% 0px',threshold:0});[...modules,...$$('[data-main-section]')].forEach(section=>observer.observe(section));}
$$('.quiz').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();let score=0;const fields=[...form.querySelectorAll('.quiz-question')];fields.forEach(field=>{const selected=field.querySelector('input:checked'),correct=selected&&selected.value===field.dataset.answer,feedback=field.querySelector('.quiz-feedback');if(correct)score++;feedback.hidden=false;feedback.className='quiz-feedback '+(correct?'correct':'incorrect');feedback.textContent=(correct?'Juist. ':'Nog niet juist. ')+feedback.dataset.explanation;});form.querySelector('.quiz-score').textContent=`${score} van ${fields.length} antwoorden juist.`;}));

// lab-workspace:start
// Independent exercise workbooks. Navigation stays inside the chosen exercise.
// Existing instruction IDs and saved confirmations remain valid.
const labGuides=$$('.lab-guide'),contentSections=$$('.main-inner > section');
const labModels=new Map(),labAliases=new Map(),availableStepIds=new Set();
const labKey='bmu-md102-lab-steps-v1',labPositionKey='bmu-md102-lab-position-v1';
let labDone=new Set(),labStorage=true,labPositions={};
function labElement(tag,className,text){const node=document.createElement(tag);node.className=className;if(text)node.textContent=text;return node;}
function labLink(text,id,className=''){const node=labElement('a',className,text);node.href='#'+id;return node;}
function unwrapLabDisclosure(details){
 const section=labElement('section',details.className);if(details.id)section.id=details.id;
 section.append(labElement('h3','',details.querySelector(':scope > summary')?.textContent));
 const content=details.querySelector(':scope > .disclosure-content');if(content)section.append(...content.childNodes);
 details.replaceWith(section);return section;
}
// Group small configuration actions into coherent pieces of the same exercise.
const labGrouping={
 '03':{
  '1':[[2,'De app publiceren'],[1,'De installatie controleren']],
  '2':[[1,'Het Win32-package voorbereiden'],[3,'De applicatie toevoegen'],[4,'Requirements en detectie instellen'],[2,'Toewijzen en controleren']],
  '3':[[3,'Microsoft 365 Apps toevoegen'],[1,'De suite configureren'],[2,'Toewijzen en controleren']],
  '4':[[3,'De catalogusapp selecteren'],[2,'Configureren en toewijzen'],[1,'De installatie controleren']],
  '5':[[1,'De nieuwe versie voorbereiden'],[6,'Het nieuwe package configureren'],[3,'Supersedence en toewijzing'],[1,'De upgrade controleren']],
  '6':[[2,'iOS/iPadOS: policy en apps'],[4,'iOS/iPadOS: bescherming en toegang'],[2,'Android: policy en apps'],[4,'Android: bescherming en toegang']],
  '7':[[1,'Monitoringrapporten bekijken'],[1,'Een installatiefout onderzoeken'],[1,'Installatiestatus exporteren'],[1,'Een assignment conflict onderzoeken']]
 },
 '04':{
  '1':[[2,'Defender en Intune verbinden'],[1,'Windows-toestellen onboarden'],[1,'De onboarding controleren']],
  '2':[[1,'De security baseline implementeren'],[1,'Antivirus configureren'],[1,'Windows Firewall configureren'],[2,'ASR voor pilootgroep en bredere omgeving']],
  '3':[[1,'BitLocker configureren'],[2,'Encryptie en recovery key controleren']],
  '4':[[2,'De Linux-server voorbereiden'],[2,'Serverconfiguratie en site maken'],[1,'Microsoft Tunnel installeren'],[1,'De serverstatus controleren'],[1,'Het VPN-profiel maken']],
  '5':[[2,'Root CA en Issuing CA maken'],[2,'De certificaatketen implementeren'],[1,'Het SCEP-profiel maken'],[1,'De certificaatinschrijving controleren']],
  '6':[[1,'Secure Score analyseren'],[1,'Threat detections en alerts onderzoeken'],[1,'Conditional Access met What If testen']]
 }
};
labGuides.forEach((guide,index)=>{
 const number=String(index+3).padStart(2,'0');guide.dataset.labGuide=number;
 const title=guide.querySelector(':scope > header h3').textContent;
 const sourceExercises=[...guide.querySelectorAll('[data-lab-exercise]')];
 const librarySummary=$(`[data-lab-select="${guide.id}"] small`);if(librarySummary){librarySummary.textContent=number==='03'?'Applicatiebeheer en zelfstandige extra opdrachten':'Beveiliging, Microsoft Tunnel en Cloud PKI';librarySummary.removeAttribute('data-lab-card-progress');}
 const overview=labElement('section','lab-page lab-overview');overview.id=`lab${number}-overzicht`;
 const preparation=unwrapLabDisclosure(guide.querySelector('.lab-preparation'));preparation.className='lab-page lab-preparation-page';preparation.id=`lab${number}-voorbereiding`;
 const outcomeNode=guide.querySelector('.lab-outcome'),outcome=outcomeNode.tagName==='DETAILS'?unwrapLabDisclosure(outcomeNode):outcomeNode;
 outcome.classList.add('lab-page','lab-outcome-page');
 const model={guide,number,title,overview,preparation,outcome,pages:[overview,preparation,outcome],exercises:[],current:overview};labModels.set(guide.id,model);
 const header=guide.querySelector(':scope > header');header.classList.add('lab-overview-header');
 header.querySelector('.lab-number').textContent=`Lab ${number}`;
 const countLabel=header.querySelector('.lab-meta span');if(countLabel)countLabel.textContent=number==='03'?'7 oefeningen + 3 extra':'6 oefeningen';
 overview.append(header,labElement('p','lab-overview-intro','Kies een oefening. Elke oefening heeft een eigen begin en einde. Met Vorige en Volgende ga je door de delen van die oefening; aan het einde keer je terug naar dit overzicht.'));
 overview.append(labLink('Voorbereiding en vereisten',preparation.id,'lab-preparation-link'));
 const baseCards=labElement('div','lab-exercise-cards'),extraCards=labElement('div','lab-exercise-cards');
 overview.append(labElement('h3','lab-card-group-title','Oefeningen'),baseCards);
 if(number==='03')overview.append(labElement('h3','lab-card-group-title','Extra oefeningen'),labElement('p','lab-extra-intro','Pas toe wat je hebt geleerd. Deze opdrachten voer je zelfstandig uit.'),extraCards);
 sourceExercises.forEach(exercise=>{
  const key=exercise.dataset.labExercise,extra=exercise.dataset.extraExercise;
  const label=extra?`Extra oefening ${extra}`:`Oefening ${String(key).padStart(2,'0')}`;
  const exerciseTitle=exercise.querySelector(':scope > h3').textContent;
  const steps=[...exercise.querySelectorAll('.lab-action')];
  const plan=labGrouping[number]?.[key]||steps.map(step=>[1,step.querySelector('h4').textContent.replace(/^(Uitvoeren|Resultaat controleren)/,'').trim()]);
  if(plan.reduce((sum,[count])=>sum+count,0)!==steps.length)throw Error('Ongeldige paginagroepering voor '+exercise.id);
  const entry={id:exercise.id,label,title:exerciseTitle,pages:[],stepIds:[],model};model.exercises.push(entry);
  exercise.querySelectorAll('.lab-part[id],.lab-task[id]').forEach(part=>{const first=part.querySelector('.lab-action');if(first)labAliases.set(part.id,first.id);});
  steps.forEach(step=>{
   const input=step.querySelector('[data-lab-step]');entry.stepIds.push(input.dataset.labStep);availableStepIds.add(input.dataset.labStep);
   step.querySelector('.lab-step-toggle').remove();step.querySelector('.lab-step-number')?.remove();step.querySelector('.lab-action-type')?.remove();
   step.classList.add('lab-instruction');step.remove();
  });
  exercise.querySelectorAll('.lab-part,.lab-task').forEach(part=>{if(part.id){const alias=labElement('span','lab-page-alias');alias.id=part.id;part.replaceWith(alias);}else part.remove();});
  exercise.querySelectorAll('details').forEach(unwrapLabDisclosure);
  exercise.querySelectorAll('.lab-back,[data-lab-exercise-progress]').forEach(node=>node.remove());
  let offset=0;
  plan.forEach(([count,pageTitle],partIndex)=>{
   const page=partIndex===0?exercise:labElement('section','');page.id=partIndex===0?exercise.id:`${exercise.id}-deel-${partIndex+1}`;
   page.classList.add('lab-page','lab-exercise-page');page.dataset.exerciseId=exercise.id;page._exercise=entry;
   const heading=labElement('div','lab-piece-heading');
   heading.append(labElement('p','lab-page-label',`Lab ${number} / ${label} / Deel ${partIndex+1} van ${plan.length}`));
   if(partIndex===0){const originalTitle=exercise.querySelector(':scope > h3');heading.append(originalTitle);exercise.querySelector(':scope > .lab-number')?.remove();}
   else heading.append(labElement('h3','',exerciseTitle));
   heading.append(labElement('p','lab-piece-title',pageTitle));page.prepend(heading);
   const content=labElement('div','lab-piece-content');content.append(...steps.slice(offset,offset+count));offset+=count;page.append(content);
   entry.pages.push(page);model.pages.push(page);
  });
  const card=labLink('',entry.id,'lab-exercise-card');
  card.append(labElement('span','lab-card-number',label),labElement('strong','',exerciseTitle),labElement('small','lab-card-status',`${entry.pages.length} delen · Open oefening →`));
  (extra?extraCards:baseCards).append(card);entry.card=card;
 });
 overview.append(labLink('Eindresultaat van het lab',outcome.id,'lab-preparation-link'));
 const storageNote=labElement('p','lab-storage-note');overview.append(storageNote);model.storageNote=storageNote;
 guide.replaceChildren();
 const flowHeader=labElement('div','lab-flow-header'),flowTitle=labElement('div','lab-flow-title');
 flowTitle.append(labElement('span','lab-flow-number',`Lab ${number}`),labElement('span','lab-flow-course',title));
 const jump=labElement('select','lab-exercise-jump');jump.setAttribute('aria-label',`Kies een oefening van Lab ${number}`);
 [[overview.id,'Laboverzicht'],[preparation.id,'Voorbereiding'],...model.exercises.map(ex=>[ex.id,`${ex.label} · ${ex.title}`]),[outcome.id,'Eindresultaat']].forEach(([id,text])=>{const option=document.createElement('option');option.value=id;option.textContent=text;jump.append(option);});
 jump.addEventListener('change',()=>navigateLab(jump.value));flowHeader.append(flowTitle,jump);guide.append(flowHeader);model.jump=jump;
 model.pages.forEach(page=>{
  page.dataset.labPage='';page.hidden=page!==overview;
  const entry=page._exercise;
  if(!entry)page.prepend(labElement('p','lab-page-label',`Lab ${number} / ${page===overview?'Overzicht':page===preparation?'Voorbereiding':'Eindresultaat'}`));
  const footer=labElement('footer','lab-page-footer'),navigation=labElement('nav','lab-page-navigation');navigation.setAttribute('aria-label',entry?`Delen van ${entry.label}`:'Laboverzicht');
  if(entry){
   const partIndex=entry.pages.indexOf(page),previous=entry.pages[partIndex-1],next=entry.pages[partIndex+1];
   navigation.append(labLink(previous?'← Vorige':`← Lab ${number}`,previous?.id||overview.id,'lab-previous'),labElement('span','lab-page-counter',`Deel ${partIndex+1} / ${entry.pages.length}`));
   if(next)navigation.append(labLink('Volgende →',next.id,'lab-next'));
   else{
    const complete=labElement('button','lab-complete-exercise','Oefening uitgevoerd');complete.type='button';
    complete.addEventListener('click',()=>{entry.stepIds.forEach(id=>labDone.add(id));saveLab();navigateLab(overview.id);});
    footer.append(complete);navigation.append(labLink('Naar overzicht →',overview.id,'lab-next'));
   }
  }else{
   const back=labElement('a','lab-previous',page===overview?'← Alle labs':`← Lab ${number}`);back.href=page===overview?(location.protocol==='file:'?'#labs':'/md102/#labs'):'#'+overview.id;navigation.append(back);
  }
  footer.append(navigation);page.append(footer);guide.append(page);
 });
});
const labToolbar=labElement('nav','lab-app-toolbar');labToolbar.setAttribute('aria-label','Labwerkboek');labToolbar.hidden=true;
const courseBack=labElement('a','lab-course-back','← Cursus');courseBack.href=location.protocol==='file:'?'#home':'/md102/';
const libraryLink=labElement('a','lab-library-link','Alle labs');libraryLink.href=location.protocol==='file:'?'#labs':'/md102/#labs';
labToolbar.append(courseBack,labElement('span','lab-app-brand','MD-102 / LABWERKBOEK'),libraryLink);
const openWindow=labElement('button','lab-open-window','Open als werkvenster ↗');openWindow.type='button';openWindow.addEventListener('click',()=>{const workWindow=window.open(location.href,'_blank','popup,width=680,height=900');if(workWindow)workWindow.opener=null;});
labToolbar.append(openWindow);$('#environment').prepend(labToolbar);
function navigateLab(id){
 const target=document.getElementById(id);if(!target)return;
 history.pushState(null,'','#'+id);const destination=revealTarget(target)||target;destination.scrollIntoView({behavior:'instant',block:'start'});
 const heading=destination.querySelector('h1,h2,h3,h4');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}setActive('labs');
}
function selectLab(id,target){
 labGuides.forEach(guide=>guide.hidden=guide.id!==id);
 const model=labModels.get(id);$('#labs').classList.toggle('lab-is-selected',!!model);if(!model)return null;
 const labPath=`/md102/lab-${model.number}/`;if(location.protocol!=='file:'&&location.pathname!==labPath)history.replaceState(null,'',labPath+location.hash);
 const page=target?.closest('[data-lab-page]')||model.overview;model.pages.forEach(item=>item.hidden=item!==page);model.current=page;model.jump.value=page.dataset.exerciseId||page.id;
 if(page._exercise){labPositions[page._exercise.id]=page.id;try{localStorage.setItem(labPositionKey,JSON.stringify(labPositions));}catch{}updateLab();}
 return page;
}
function revealTarget(target){
 const alias=labAliases.get(target.id);if(alias)target=document.getElementById(alias);
 const section=target.closest('.main-inner > section');
 if(section)contentSections.forEach(item=>{
  const pathIntro=section.matches('section[data-module]')&&item.id==='lp'+section.dataset.learningPath;
  const pathModule=section.matches('[data-path]')&&item.matches('section[data-module]')&&item.dataset.learningPath===section.dataset.path;
  item.hidden=item!==section&&!pathIntro&&!pathModule;
 });
 const isLab=section?.id==='labs';document.body.classList.toggle('lab-active',isLab);labToolbar.hidden=!isLab;
 if(isLab){const page=selectLab(target.closest('.lab-guide')?.id,target);if(page&&!page.contains(target))target=page;}
 let node=target;while(node){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}return target;
}
try{const saved=JSON.parse(localStorage.getItem(labKey)||'[]');if(Array.isArray(saved))labDone=new Set(saved.filter(id=>availableStepIds.has(id)));}catch{labStorage=false;}
try{const saved=JSON.parse(localStorage.getItem(labPositionKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))labPositions=saved;}catch{}
function updateLab(){
 labModels.forEach(model=>{
  model.exercises.forEach(entry=>{
   const done=entry.stepIds.every(id=>labDone.has(id));entry.card.classList.toggle('is-done',done);
   entry.card.querySelector('.lab-card-status').textContent=done?'Uitgevoerd · Bekijk oefening →':`${entry.pages.length} delen · Open oefening →`;
   const remembered=document.getElementById(labPositions[entry.id]||labPositions[model.guide.id]||'');
   const savedPage=remembered?.closest('[data-lab-page]');const resumeIndex=entry.pages.indexOf(savedPage);entry.card.href='#'+(!done&&resumeIndex>0?savedPage.id:entry.id);
   if(!done&&resumeIndex>0)entry.card.querySelector('.lab-card-status').textContent=`${entry.pages.length} delen · Verder met deel ${resumeIndex+1} →`;
  });
  model.storageNote.textContent=labStorage?'Je plek binnen elke oefening wordt bewaard in deze browser.':'Browseropslag is geblokkeerd. Je plek blijft alleen tijdens dit bezoek bewaard.';
 });
}
function saveLab(){try{localStorage.setItem(labKey,JSON.stringify([...labDone]));labStorage=true;}catch{labStorage=false;announce('Je browser blokkeert opslag. Je gegevens blijven alleen tijdens dit bezoek bewaard.');}updateLab();}
window.addEventListener('storage',event=>{if(event.key===labKey){try{const ids=JSON.parse(event.newValue||'[]');if(Array.isArray(ids)){labDone=new Set(ids.filter(id=>availableStepIds.has(id)));updateLab();}}catch{}}});
window.addEventListener('hashchange',()=>{const target=document.getElementById(location.hash.slice(1));if(target){const destination=revealTarget(target)||target;destination.scrollIntoView({block:'start'});}});
const labRoute=location.pathname.match(/\/md102\/lab-(03|04)\/?$/);
if(labRoute&&!location.hash)history.replaceState(null,'',`#lab-lp${labRoute[1]==='03'?'3':'4'}-${labRoute[1]}`);
updateLab();revealTarget($('#home'));
// lab-workspace:end

// Small SHA-256 fallback for file:// browsers without Web Crypto. Only a digest is stored.
function sha256Fallback(value){const bytes=new TextEncoder().encode(value),length=bytes.length,padded=Math.ceil((length+9)/64)*64,data=new Uint8Array(padded);data.set(bytes);data[length]=128;const view=new DataView(data.buffer);view.setUint32(padded-8,Math.floor(length/0x20000000));view.setUint32(padded-4,(length*8)>>>0);const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2],H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],W=new Uint32Array(64),rotr=(n,b)=>(n>>>b)|(n<<(32-b));for(let off=0;off<padded;off+=64){for(let t=0;t<16;t++)W[t]=view.getUint32(off+t*4);for(let t=16;t<64;t++){const x=W[t-15],y=W[t-2];W[t]=((rotr(x,7)^rotr(x,18)^(x>>>3))+W[t-16]+(rotr(y,17)^rotr(y,19)^(y>>>10))+W[t-7])>>>0;}let[a,b,c,d,f,g,h,i]=H;for(let t=0;t<64;t++){const s1=rotr(f,6)^rotr(f,11)^rotr(f,25),ch=(f&g)^(~f&h),t1=(i+s1+ch+K[t]+W[t])>>>0,s0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c),t2=(s0+maj)>>>0;i=h;h=g;g=f;f=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}[a,b,c,d,f,g,h,i].forEach((n,t)=>H[t]=(H[t]+n)>>>0);}return H.map(n=>n.toString(16).padStart(8,'0')).join('');}
async function hash(value){if(globalThis.crypto?.subtle){try{return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');}catch{}}return sha256Fallback(value);}
function unlock(){ $('#login').hidden=true;$('#environment').hidden=false;$('#password').value='';$('#login-error').hidden=true;requestAnimationFrame(()=>{const id=location.hash.slice(1),target=id&&document.getElementById(id);if(target&&$('#environment').contains(target)){const destination=revealTarget(target)||target;destination.scrollIntoView({behavior:'instant'});setActive(id);}else{revealTarget($('#home'));$('#home-title').focus({preventScroll:true});setActive('home');}});if(!progressStore)announce('Browseropslag is niet beschikbaar. Voortgang blijft alleen tijdens dit bezoek bewaard.');}
$('#login-form').addEventListener('submit',async event=>{event.preventDefault();if(loginBusy)return;loginBusy=true;const button=$('#login-form button');button.disabled=true;try{if(await hash($('#password').value)===digestExpected){try{sessionStorage.setItem(sessionKey,'authenticated');}catch{sessionStore=false;}unlock();if(!sessionStore)announce('Sessieopslag is geblokkeerd. Na vernieuwen moet je opnieuw aanmelden.');}else{$('#login-error').hidden=false;$('#login-error').textContent='Onjuist wachtwoord. Probeer opnieuw.';$('#password').setAttribute('aria-invalid','true');$('#password').focus();$('#password').select();}}finally{loginBusy=false;button.disabled=false;}});
$('#password').addEventListener('input',()=>$('#password').removeAttribute('aria-invalid'));
$('#logout').addEventListener('click',()=>{try{sessionStorage.removeItem(sessionKey);}catch{}menu(false);$('#environment').hidden=true;$('#login').hidden=false;$('#login-form').reset();$('#password').removeAttribute('aria-invalid');$('#login-error').hidden=true;$('#status').hidden=true;window.scrollTo({top:0,behavior:'instant'});$('#password').focus();});
try{if(sessionStorage.getItem(sessionKey)==='authenticated')unlock();else $('#password').focus({preventScroll:true});}catch{sessionStore=false;$('#password').focus({preventScroll:true});}
})();
