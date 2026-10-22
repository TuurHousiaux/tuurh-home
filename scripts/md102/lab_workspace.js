// Each exercise is one page, with all its instructions in order.
// Existing instruction IDs and saved confirmations remain valid.
const labGuides=$$('.lab-guide'),contentSections=$$('.main-inner > section');
const labModels=new Map(),labAliases=new Map(),availableStepIds=new Set();
const labKey='bmu-md102-lab-steps-v1';
let labDone=new Set(),labStorage=true;
function labElement(tag,className,text){const node=document.createElement(tag);node.className=className;if(text)node.textContent=text;return node;}
function labLink(text,id,className=''){const node=labElement('a',className,text);node.href='#'+id;return node;}
function unwrapLabDisclosure(details){
 const section=labElement('section',details.className);if(details.id)section.id=details.id;
 section.append(labElement('h3','',details.querySelector(':scope > summary')?.textContent));
 const content=details.querySelector(':scope > .disclosure-content');if(content)section.append(...content.childNodes);
 details.replaceWith(section);return section;
}
// Preserve addresses of the former pages without displaying a page sequence.
const legacyPageCounts={
 '03':{'1':2,'2':4,'3':3,'4':3,'5':4,'6':4,'7':4,'extra-1':3,'extra-2':2,'extra-3':2},
 '04':{'1':3,'2':4,'3':2,'4':5,'5':4,'6':3}
};
labGuides.forEach((guide,index)=>{
 const number=guide.dataset.labGuide||String(index+3).padStart(2,'0');guide.dataset.labGuide=number;
 const title=guide.querySelector(':scope > header h3').textContent;
 const sourceExercises=[...guide.querySelectorAll('[data-lab-exercise]')];
 const librarySummary=$(`[data-lab-select="${guide.id}"] small`);if(librarySummary){librarySummary.textContent=number==='03'?'Applicatiebeheer en zelfstandige extra opdrachten':number==='04'?'Beveiliging, Microsoft Tunnel en Cloud PKI':number==='05'?'Graph PowerShell, Remediations, delegatie en rapporten':'Laatste lab · EPM, Remote Help, Analytics, Windows 365 en AVD';librarySummary.removeAttribute('data-lab-card-progress');}
 const overview=labElement('section','lab-page lab-overview');overview.id=`lab${number}-overzicht`;
 const preparation=unwrapLabDisclosure(guide.querySelector('.lab-preparation'));preparation.className='lab-page lab-preparation-page';preparation.id=`lab${number}-voorbereiding`;
 const outcomeNode=guide.querySelector('.lab-outcome'),outcome=outcomeNode.tagName==='DETAILS'?unwrapLabDisclosure(outcomeNode):outcomeNode;
 outcome.classList.add('lab-page','lab-outcome-page');
 const model={guide,number,title,overview,preparation,outcome,pages:[overview,preparation,outcome],exercises:[],current:overview};labModels.set(guide.id,model);
 const header=guide.querySelector(':scope > header');header.classList.add('lab-overview-header');
 header.querySelector('.lab-number').textContent=`Lab ${number}`;
 const countLabel=header.querySelector('.lab-meta span');if(countLabel)countLabel.textContent=number==='03'?'7 oefeningen + 3 extra':`${sourceExercises.length} oefeningen`;
 overview.append(header,labElement('p','lab-overview-intro','Kies een oefening. Alle opdrachten en controles staan op één pagina, in de volgorde waarin je ze uitvoert. Onderaan keer je terug naar dit overzicht.'));
 overview.append(labLink('Voorbereiding en vereisten',preparation.id,'lab-preparation-link'));
 const baseCards=labElement('div','lab-exercise-cards'),extraCards=labElement('div','lab-exercise-cards');
 overview.append(labElement('h3','lab-card-group-title','Oefeningen'),baseCards);
 if(number==='03')overview.append(labElement('h3','lab-card-group-title','Extra oefeningen'),labElement('p','lab-extra-intro','Pas toe wat je hebt geleerd. Deze opdrachten voer je zelfstandig uit.'),extraCards);
 sourceExercises.forEach(exercise=>{
  const key=exercise.dataset.labExercise,extra=exercise.dataset.extraExercise;
  const label=extra?`Extra oefening ${extra}`:`Oefening ${String(key).padStart(2,'0')}`;
  const exerciseTitle=exercise.querySelector(':scope > h3').textContent;
  const steps=[...exercise.querySelectorAll('.lab-action')];
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
  exercise.classList.add('lab-page','lab-exercise-page');exercise.dataset.exerciseId=exercise.id;exercise._exercise=entry;
  const heading=labElement('div','lab-piece-heading');
  heading.append(labElement('p','lab-page-label',`Lab ${number} / ${label}`),exercise.querySelector(':scope > h3'));
  exercise.querySelector(':scope > .lab-number')?.remove();exercise.prepend(heading);
  const content=labElement('div','lab-piece-content');content.append(...steps);exercise.append(content);
  for(let part=2;part<=(legacyPageCounts[number]?.[key]||1);part++){
   const alias=labElement('span','lab-page-alias');alias.id=`${exercise.id}-deel-${part}`;
   exercise.append(alias);labAliases.set(alias.id,exercise.id);
  }
  entry.pages.push(exercise);model.pages.push(exercise);
  const card=labLink('',entry.id,'lab-exercise-card');
  card.append(labElement('span','lab-card-number',label),labElement('strong','',exerciseTitle),labElement('small','lab-card-status','Open oefening →'));
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
  const footer=labElement('footer','lab-page-footer'),navigation=labElement('nav','lab-page-navigation');navigation.setAttribute('aria-label','Terug naar het laboverzicht');
  if(entry){
   const complete=labElement('button','lab-complete-exercise','Oefening uitgevoerd');complete.type='button';
   complete.addEventListener('click',()=>{entry.stepIds.forEach(id=>labDone.add(id));saveLab();navigateLab(overview.id);});
   footer.append(complete);navigation.append(labLink(`← Naar Lab ${number}`,overview.id,'lab-back-overview'));
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
function updateLab(){
 labModels.forEach(model=>{
  model.exercises.forEach(entry=>{
   const done=entry.stepIds.every(id=>labDone.has(id));entry.card.classList.toggle('is-done',done);
   entry.card.querySelector('.lab-card-status').textContent=done?'Uitgevoerd · Bekijk oefening →':'Open oefening →';
   entry.card.href='#'+entry.id;
  });
  model.storageNote.textContent=labStorage?'Je uitgevoerde oefeningen worden bewaard in deze browser.':'Browseropslag is geblokkeerd. Je gegevens blijven alleen tijdens dit bezoek bewaard.';
 });
}
function saveLab(){try{localStorage.setItem(labKey,JSON.stringify([...labDone]));labStorage=true;}catch{labStorage=false;announce('Je browser blokkeert opslag. Je gegevens blijven alleen tijdens dit bezoek bewaard.');}updateLab();}
window.addEventListener('storage',event=>{if(event.key===labKey){try{const ids=JSON.parse(event.newValue||'[]');if(Array.isArray(ids)){labDone=new Set(ids.filter(id=>availableStepIds.has(id)));updateLab();}}catch{}}});
window.addEventListener('hashchange',()=>{const target=document.getElementById(location.hash.slice(1));if(target){const destination=revealTarget(target)||target;destination.scrollIntoView({block:'start'});}});
const labRoute=location.pathname.match(/\/md102\/lab-(03|04|05|06)\/?$/);
if(labRoute&&!location.hash)history.replaceState(null,'',`#lab-lp${Number(labRoute[1])}-${labRoute[1]}`);
updateLab();revealTarget($('#home'));
