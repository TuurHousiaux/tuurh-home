// Compact lab workspace. Existing step IDs and storage key preserve Lab 03 progress.
const labGuides=$$('.lab-guide');
const contentSections=$$('.main-inner > section');
labGuides.forEach((guide,index)=>{
 guide.dataset.labGuide ||= String(index+3).padStart(2,'0');
 // Native disclosures keep every instruction available to keyboard and browser search.
 guide.querySelectorAll('.lab-exercise').forEach(exercise=>{
  const panel=document.createElement('details');
  [...exercise.attributes].forEach(a=>panel.setAttribute(a.name,a.value));
  const summary=document.createElement('summary');summary.className='lab-exercise-summary';
  const number=exercise.querySelector(':scope > .lab-number'),title=exercise.querySelector(':scope > h3'),status=exercise.querySelector(':scope > [data-lab-exercise-progress]');
  summary.append(number,title,status);
  const content=document.createElement('div');content.className='lab-exercise-body';content.append(...exercise.childNodes);
  panel.append(summary,content);exercise.replaceWith(panel);
 });
 guide.querySelectorAll('.lab-action').forEach(action=>{
  const panel=document.createElement('details');[...action.attributes].forEach(a=>panel.setAttribute(a.name,a.value));
  const header=action.querySelector('.lab-action-header'),body=action.querySelector('.lab-action-body');
  const summary=document.createElement('summary');summary.className='lab-action-summary';
  const label=header.querySelector('.lab-step-toggle');
  summary.append(header.querySelector('.lab-step-number'),header.querySelector('h4'));
  body.append(label);panel.append(summary,body);action.replaceWith(panel);
 });
});
function selectLab(id){
 labGuides.forEach(guide=>guide.hidden=guide.id!==id);
 $$('[data-lab-select]').forEach(link=>{
  const selected=link.dataset.labSelect===id;link.classList.toggle('selected',selected);
  if(selected)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
 });
}
// Called before scrolling/focusing a hash target, including links into closed parts.
function revealTarget(target){
 const section=target.closest('.main-inner > section');
 if(section){
  contentSections.forEach(item=>{
   const pathIntro=section.matches('section[data-module]')&&item.id==='lp'+section.dataset.learningPath;
   const pathModule=section.matches('[data-path]')&&item.matches('section[data-module]')&&item.dataset.learningPath===section.dataset.path;
   item.hidden=item!==section&&!pathIntro&&!pathModule;
  });
 }
 const guide=target.closest('.lab-guide');if(guide)selectLab(guide.id);
 let node=target;
 while(node){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}
}
selectLab(labGuides[0]?.id);
revealTarget($('#home'));
const labSteps=$$('[data-lab-step]'),labKey='bmu-md102-lab-steps-v1';
let labDone=new Set(),labStorage=true;
try{const saved=JSON.parse(localStorage.getItem(labKey)||'[]');if(Array.isArray(saved))labDone=new Set(saved.filter(id=>labSteps.some(input=>input.dataset.labStep===id)));}catch{labStorage=false;}
function updateLab(){
 labSteps.forEach(input=>{input.checked=labDone.has(input.dataset.labStep);input.closest('.lab-action').classList.toggle('is-done',input.checked);});
 labGuides.forEach(guide=>{
  const steps=[...guide.querySelectorAll('[data-lab-step]')],exercises=[...guide.querySelectorAll('[data-lab-exercise]')];
  let finished=0;
  exercises.forEach(ex=>{
   const inputs=[...ex.querySelectorAll('[data-lab-step]')],done=inputs.filter(i=>i.checked).length,complete=inputs.length>0&&done===inputs.length,number=ex.dataset.labExercise;
   finished+=Number(complete);ex.classList.toggle('is-done',complete);
   ex.querySelector('[data-lab-exercise-progress]').textContent=complete?`✓ Oefening ${number} afgerond · ${done}/${inputs.length}`:`${done} van ${inputs.length} stappen afgevinkt`;
   const status=guide.querySelector(`[data-lab-toc-status="${number}"]`);
   if(status){status.textContent=complete?'✓ Afgerond':done?`${done}/${inputs.length} stappen`:'Nog te doen';status.closest('a').classList.toggle('is-done',complete);}
  });
  const count=steps.filter(i=>i.checked).length,total=steps.length;
  guide.querySelector('[data-lab-total-status]').textContent=`${count} van ${total} stappen afgevinkt · ${finished} van ${exercises.length} oefeningen afgerond`;
  const bar=guide.querySelector('[data-lab-progress]');bar.max=total;bar.value=count;
  const first=steps.find(i=>!i.checked),resume=guide.querySelector('[data-lab-resume]');
  resume.href=first?'#'+first.dataset.labStep:'#'+guide.querySelector('.lab-outcome').id;
  resume.textContent=count===0?'Begin met oefening 1 →':first?'Ga verder met je volgende stap →':'Alles afgevinkt · Bekijk eindresultaat →';
  guide.querySelector('.lab-storage-note').textContent=labStorage?'Je vinkjes worden automatisch bewaard in deze browser.':'Je browser blokkeert opslag. Je vinkjes blijven alleen tijdens dit bezoek bewaard.';
  const card=$(`[data-lab-select="${guide.id}"] [data-lab-card-progress]`);if(card)card.textContent=`${count}/${total} stappen · ${finished}/${exercises.length} oefeningen`;
 });
}
labSteps.forEach(input=>input.addEventListener('change',()=>{
 if(input.checked)labDone.add(input.dataset.labStep);else labDone.delete(input.dataset.labStep);
 try{localStorage.setItem(labKey,JSON.stringify([...labDone]));labStorage=true;}catch{labStorage=false;announce('Je browser blokkeert opslag. Je labvinkjes blijven alleen tijdens dit bezoek bewaard.');}
 updateLab();
}));
$$('[data-lab-reset]').forEach(button=>button.addEventListener('click',()=>{
 const guide=button.closest('.lab-guide'),label='Lab '+guide.dataset.labGuide;
 if(!confirm(`Wil je de afgevinkte stappen van ${label} wissen? Andere labs en je theorievoortgang blijven behouden.`))return;
 guide.querySelectorAll('[data-lab-step]').forEach(input=>labDone.delete(input.dataset.labStep));
 try{localStorage.setItem(labKey,JSON.stringify([...labDone]));labStorage=true;}catch{labStorage=false;}
 updateLab();announce(`De afgevinkte stappen van ${label} zijn gewist.`);
}));
window.addEventListener('storage',event=>{
 if(event.key===labKey){try{const ids=JSON.parse(event.newValue||'[]');if(Array.isArray(ids)){labDone=new Set(ids.filter(id=>labSteps.some(input=>input.dataset.labStep===id)));updateLab();}}catch{}}
});
// Opening another exercise or step closes its siblings. Checked work stays saved.
$$('.lab-exercise, .lab-action').forEach(panel=>panel.addEventListener('toggle',()=>{
 if(!panel.open)return;
 const group=panel.classList.contains('lab-exercise')?panel.closest('.lab-guide'):panel.closest('.lab-exercise');
 const selector=panel.classList.contains('lab-exercise')?'.lab-exercise':'.lab-action';
 group.querySelectorAll(selector).forEach(other=>{if(other!==panel)other.open=false;});
}));
window.addEventListener('hashchange',()=>{
 const target=document.getElementById(location.hash.slice(1));if(target){revealTarget(target);target.scrollIntoView({block:'start'});}
});
updateLab();
