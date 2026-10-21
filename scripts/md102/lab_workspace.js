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
