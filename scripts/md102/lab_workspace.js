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
