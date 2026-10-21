
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
// Lab workbook: overview, preparation, exercise introductions and one task per page.
// Keep existing step IDs and storage keys so saved work and links still work.
const labGuides=$$('.lab-guide');
const contentSections=$$('.main-inner > section');
const labModels=new Map();
const labAliases=new Map();
const labKey='bmu-md102-lab-steps-v1';
const labPositionKey='bmu-md102-lab-position-v1';
let labDone=new Set(),labStorage=true,labPositions={};

function labElement(tag,className,text){
 const element=document.createElement(tag);element.className=className;
 if(text)element.textContent=text;
 return element;
}
function labLink(text,id,className=''){const link=labElement('a',className,text);link.href='#'+id;return link;}
function unwrapLabDisclosure(details){
 const section=labElement('section',details.className);
 if(details.id)section.id=details.id;
 const title=labElement('h3','',details.querySelector(':scope > summary')?.textContent);
 const content=details.querySelector(':scope > .disclosure-content');
 section.append(title);
 if(content)section.append(...content.childNodes);
 details.replaceWith(section);return section;
}

labGuides.forEach((guide,index)=>{
 const number=String(index+3).padStart(2,'0');guide.dataset.labGuide=number;
 const title=guide.querySelector(':scope > header h3').textContent;
 const exercises=[...guide.querySelectorAll('[data-lab-exercise]')];
 const overview=labElement('section','lab-page lab-overview');overview.id=`lab${number}-overzicht`;
 const preparation=unwrapLabDisclosure(guide.querySelector('.lab-preparation'));
 preparation.className='lab-page lab-preparation-page';preparation.id=`lab${number}-voorbereiding`;
 const outcomeNode=guide.querySelector('.lab-outcome');
 const outcome=outcomeNode.tagName==='DETAILS'?unwrapLabDisclosure(outcomeNode):outcomeNode;
 outcome.classList.add('lab-page','lab-outcome-page');
 const pages=[overview,preparation];
 const model={guide,number,title,exercises,pages,overview,preparation,outcome,steps:[],current:overview};
 labModels.set(guide.id,model);
 // The original header, workbench and work plan become the overview page.
 [...guide.children].forEach(child=>{
  if(child===preparation||child===outcome||child.matches('.lab-exercise'))return;
  if(child.tagName==='A'&&child.getAttribute('href')==='#labs'){child.remove();return;}
  overview.append(child);
 });
 const intro=overview.querySelector('.lab-workbench > p');
 if(intro)intro.textContent='Voer elke stap uit in je eigen labomgeving. Onderaan ga je naar de vorige of volgende pagina. Met ‘Uitgevoerd en verder’ bewaar je de stap en ga je door.';
 overview.querySelector('.lab-workbench h4').textContent=`Aan de slag met Lab ${number}.`;
 const preparationLink=labLink('Bekijk de voorbereiding',preparation.id,'lab-preparation-link');
 overview.querySelector('.lab-workbench').append(preparationLink);
 const pageHeader=overview.querySelector(':scope > header');
 if(pageHeader){pageHeader.classList.add('lab-overview-header');pageHeader.querySelector('.lab-number').textContent=`Lab ${number}`;}
 exercises.forEach(exercise=>{
  const steps=[...exercise.querySelectorAll('.lab-action')];
  const exerciseTitle=exercise.querySelector(':scope > h3').textContent;
  const exerciseNumber=exercise.dataset.labExercise;
  // Preserve routes to the old iOS, Android and monitoring task containers.
  exercise.querySelectorAll('.lab-part[id], .lab-task[id]').forEach(part=>{
   const first=part.querySelector('.lab-action');
   if(first)labAliases.set(part.id,first.id);
  });
  steps.forEach((step,stepIndex)=>{
   const part=step.closest('.lab-part');
   const partTitle=part?.getAttribute('aria-label')||'';
   step.classList.add('lab-page');step.dataset.exerciseId=exercise.id;
   step.dataset.stepIndex=String(stepIndex+1);step.dataset.exerciseStepCount=String(steps.length);
   const label=step.querySelector('.lab-step-toggle');
   label.querySelector('span').textContent='Deze stap is uitgevoerd en gecontroleerd';
   const header=step.querySelector('.lab-action-header');label.remove();
   step._completionLabel=label;
   header.className='lab-task-heading';
   header.querySelector('.lab-step-number').textContent=String(stepIndex+1).padStart(2,'0');
   const taskTitle=header.querySelector('h4');taskTitle.querySelector('.lab-action-type').textContent=partTitle?`${exerciseTitle} · ${partTitle}`:exerciseTitle;
   // Static pages are peers, so the instruction is never nested in another card.
   step.remove();pages.push(step);model.steps.push(step);
  });
  // Preparation and background belong to the exercise introduction, fully visible.
  exercise.querySelectorAll('.lab-part,.lab-task').forEach(part=>{if(part.id){const alias=labElement('span','lab-page-alias');alias.id=part.id;part.replaceWith(alias);}else part.remove();});
  exercise.querySelectorAll('details').forEach(unwrapLabDisclosure);
  exercise.querySelectorAll('.lab-back').forEach(link=>link.remove());
  exercise.classList.add('lab-page','lab-exercise-intro');
  const stepStart=pages.length-steps.length;pages.splice(stepStart,0,exercise);
  const start=labLink(`Start oefening ${String(exerciseNumber).padStart(2,'0')} →`,steps[0].id,'button red lab-exercise-start');
  exercise.append(start);
 });
 pages.push(outcome);
 guide.replaceChildren();
 const flowHeader=labElement('div','lab-flow-header');
 const flowTitle=labElement('div','lab-flow-title');
 flowTitle.append(labElement('span','lab-flow-number',`Lab ${number}`),labElement('span','lab-flow-course',title));
 const jump=labElement('select','lab-exercise-jump');jump.setAttribute('aria-label',`Ga naar een pagina van Lab ${number}`);
 const jumpOptions=[[overview.id,'Overzicht'],[preparation.id,'Voorbereiding'],...exercises.map(ex=>[ex.id,`Oefening ${String(ex.dataset.labExercise).padStart(2,'0')} · ${ex.querySelector(':scope > h3').textContent}`]),[outcome.id,'Eindresultaat']];
 jumpOptions.forEach(([id,label])=>{const option=document.createElement('option');option.value=id;option.textContent=label;jump.append(option);});
 jump.addEventListener('change',()=>navigateLab(jump.value));
 const flowStatus=labElement('p','lab-flow-status');flowStatus.setAttribute('role','status');
 const flowProgress=document.createElement('progress');flowProgress.className='lab-flow-progress';flowProgress.setAttribute('aria-label',`Voortgang Lab ${number}`);
 flowHeader.append(flowTitle,jump,flowStatus,flowProgress);guide.append(flowHeader);
 model.jump=jump;model.flowStatus=flowStatus;model.flowProgress=flowProgress;
 pages.forEach((page,pageIndex)=>{
  page.dataset.labPage='';page.hidden=page!==overview;
  const pageLabel=labElement('p','lab-page-label');
  const exercise=page.matches('.lab-action')?exercises.find(ex=>ex.id===page.dataset.exerciseId):page.matches('.lab-exercise')?page:null;
  if(page.matches('.lab-action')){
   pageLabel.textContent=`Lab ${number} / Oefening ${String(exercise.dataset.labExercise).padStart(2,'0')} / Stap ${page.dataset.stepIndex} van ${page.dataset.exerciseStepCount}`;
  }else{pageLabel.textContent=`Lab ${number} / ${page===overview?'Overzicht':page===preparation?'Voorbereiding':page===outcome?'Eindresultaat':'Oefening '+String(exercise.dataset.labExercise).padStart(2,'0')}`;}
  page.prepend(pageLabel);
  // Every page has its own bottom navigation; next never requires opening a panel.
  const footer=labElement('footer','lab-page-footer');
  if(page._completionLabel)footer.append(page._completionLabel);
  const navigation=labElement('nav','lab-page-navigation');navigation.setAttribute('aria-label','Pagina’s van het lab');
  navigation.append(labLink(pageIndex?'← Vorige':'← Alle labs',pageIndex?pages[pageIndex-1].id:'labs','lab-previous'));
  navigation.append(labElement('span','lab-page-counter',`Pagina ${pageIndex+1} / ${pages.length}`));
  const next=pages[pageIndex+1];
  if(next){
   const nextLink=labLink('Volgende →',next.id,'lab-next');
   if(page._completionLabel){
    const complete=labElement('button','lab-complete-next','Uitgevoerd en verder →');complete.type='button';
    complete.addEventListener('click',()=>{
     const checkbox=page.querySelector('[data-lab-step]');checkbox.checked=true;checkbox.dispatchEvent(new Event('change'));navigateLab(next.id);
    });
    footer.append(complete);page._completeNext=complete;
   }
   navigation.append(nextLink);
  }else{navigation.append(labLink('Naar alle labs →','labs','lab-next'));}
  footer.append(navigation);page.append(footer);guide.append(page);
 });
});

// A compact toolbar replaces the course sidebar while working in a lab.
const labToolbar=labElement('nav','lab-app-toolbar');labToolbar.setAttribute('aria-label','Labwerkboek');
labToolbar.hidden=true;
labToolbar.append(labLink('← Cursus','home','lab-course-back'),labElement('span','lab-app-brand','MD-102 / LABWERKBOEK'),labLink('Alle labs','labs','lab-library-link'));
const openWindow=labElement('button','lab-open-window','Open als werkvenster ↗');openWindow.type='button';
openWindow.addEventListener('click',()=>{
 const workWindow=window.open(location.href,'_blank','popup,width=680,height=900');
 // Same-origin windows inherit the course session; detach after creation.
 if(workWindow)workWindow.opener=null;
});
labToolbar.append(openWindow);$('#environment').prepend(labToolbar);

function navigateLab(id){
 const target=document.getElementById(id);if(!target)return;
 history.pushState(null,'','#'+id);const destination=revealTarget(target)||target;
 destination.scrollIntoView({behavior:'instant',block:'start'});
 const heading=destination.querySelector('h1,h2,h3,h4');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
 setActive('labs');
}
function selectLab(id,target){
 labGuides.forEach(guide=>guide.hidden=guide.id!==id);
 $$('[data-lab-select]').forEach(link=>{const selected=link.dataset.labSelect===id;link.classList.toggle('selected',selected);if(selected)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
 const model=labModels.get(id);$('#labs').classList.toggle('lab-is-selected',!!model);
 if(!model)return null;
 const page=target?.closest('[data-lab-page]')||model.overview;
 model.pages.forEach(item=>item.hidden=item!==page);model.current=page;
 model.jump.value=page.dataset.exerciseId||page.id;
 if(page.matches('.lab-action')){
  labPositions[id]=page.id;
  try{localStorage.setItem(labPositionKey,JSON.stringify(labPositions));}catch{}
 }
 return page;
}
function revealTarget(target){
 const alias=labAliases.get(target.id);if(alias)target=document.getElementById(alias);
 const section=target.closest('.main-inner > section');
 if(section){contentSections.forEach(item=>{
  const pathIntro=section.matches('section[data-module]')&&item.id==='lp'+section.dataset.learningPath;
  const pathModule=section.matches('[data-path]')&&item.matches('section[data-module]')&&item.dataset.learningPath===section.dataset.path;
  item.hidden=item!==section&&!pathIntro&&!pathModule;
 });}
 const isLab=section?.id==='labs';document.body.classList.toggle('lab-active',isLab);labToolbar.hidden=!isLab;
 const guide=target.closest('.lab-guide');
 if(isLab){const page=selectLab(guide?.id,target);if(page&&!page.contains(target))target=page;}
 let node=target;while(node){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}
 return target;
}
const labSteps=$$('[data-lab-step]');
try{const saved=JSON.parse(localStorage.getItem(labKey)||'[]');if(Array.isArray(saved))labDone=new Set(saved.filter(id=>labSteps.some(input=>input.dataset.labStep===id)));}catch{labStorage=false;}
try{const saved=JSON.parse(localStorage.getItem(labPositionKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))labPositions=saved;}catch{}
function updateLab(){
 labSteps.forEach(input=>{
  input.checked=labDone.has(input.dataset.labStep);const page=input.closest('.lab-action');page.classList.toggle('is-done',input.checked);
  if(page._completeNext)page._completeNext.textContent=input.checked?'Verder →':'Uitgevoerd en verder →';
 });
 labModels.forEach(model=>{
  let finished=0;const {guide,steps,exercises}=model;
  exercises.forEach(ex=>{
   const inputs=steps.filter(step=>step.dataset.exerciseId===ex.id).map(step=>step.querySelector('[data-lab-step]'));
   const done=inputs.filter(i=>i.checked).length,complete=inputs.length>0&&done===inputs.length;finished+=Number(complete);
   ex.classList.toggle('is-done',complete);
   ex.querySelector('[data-lab-exercise-progress]').textContent=complete?`✓ Oefening ${String(ex.dataset.labExercise).padStart(2,'0')} afgerond · ${done}/${inputs.length}`:`${done} van ${inputs.length} stappen uitgevoerd`;
   const status=guide.querySelector(`[data-lab-toc-status="${ex.dataset.labExercise}"]`);
   if(status){status.textContent=complete?'✓ Afgerond':`${done}/${inputs.length} stappen`;status.closest('a').classList.toggle('is-done',complete);}
  });
  const count=steps.filter(step=>step.querySelector('[data-lab-step]').checked).length,total=steps.length;
  const status=`${count} van ${total} stappen uitgevoerd · ${finished} van ${exercises.length} oefeningen afgerond`;
  guide.querySelector('[data-lab-total-status]').textContent=status;model.flowStatus.textContent=status;
  const bar=guide.querySelector('[data-lab-progress]');bar.max=total;bar.value=count;model.flowProgress.max=total;model.flowProgress.value=count;
  const first=steps.find(step=>!step.querySelector('[data-lab-step]').checked);
  const remembered=steps.find(step=>step.id===labPositions[guide.id]&&!step.querySelector('[data-lab-step]').checked);
  const resume=guide.querySelector('[data-lab-resume]');resume.href='#'+(remembered||first||model.outcome).id;
  resume.textContent=count===total?'Bekijk het eindresultaat →':remembered||count?'Verder waar je was →':'Start de eerste stap →';
  guide.querySelector('.lab-storage-note').textContent=labStorage?'Je voortgang wordt automatisch bewaard in deze browser.':'Je browser blokkeert opslag. Je voortgang blijft alleen tijdens dit bezoek bewaard.';
  const card=$(`[data-lab-select="${guide.id}"] [data-lab-card-progress]`);if(card)card.textContent=`${count}/${total} stappen · ${finished}/${exercises.length} oefeningen`;
 });
}
function saveLab(){try{localStorage.setItem(labKey,JSON.stringify([...labDone]));labStorage=true;}catch{labStorage=false;announce('Je browser blokkeert opslag. Je voortgang blijft alleen tijdens dit bezoek bewaard.');}updateLab();}
labSteps.forEach(input=>input.addEventListener('change',()=>{if(input.checked)labDone.add(input.dataset.labStep);else labDone.delete(input.dataset.labStep);saveLab();}));
$$('[data-lab-reset]').forEach(button=>button.addEventListener('click',()=>{
 const guide=button.closest('.lab-guide'),label='Lab '+guide.dataset.labGuide;
 if(!confirm(`Wil je de uitgevoerde stappen van ${label} wissen? Andere labs en je theorievoortgang blijven behouden.`))return;
 labModels.get(guide.id).steps.forEach(step=>labDone.delete(step.querySelector('[data-lab-step]').dataset.labStep));delete labPositions[guide.id];
 try{localStorage.setItem(labPositionKey,JSON.stringify(labPositions));}catch{}
 saveLab();announce(`De voortgang van ${label} is gewist.`);
}));
window.addEventListener('storage',event=>{if(event.key===labKey){try{const ids=JSON.parse(event.newValue||'[]');if(Array.isArray(ids)){labDone=new Set(ids.filter(id=>labSteps.some(input=>input.dataset.labStep===id)));updateLab();}}catch{}}});
window.addEventListener('hashchange',()=>{const target=document.getElementById(location.hash.slice(1));if(target){const destination=revealTarget(target)||target;destination.scrollIntoView({block:'start'});}});
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
