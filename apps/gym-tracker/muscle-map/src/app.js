(function(){
"use strict";
/*@LIB@*/
/*@I18N@*/
/* ---------- language ---------- */
let lang="en";
const L=()=>lang==="pl"?1:0;
const t=(k,...a)=>{const e=S[k]; if(!e) return k; const v=e[L()]; return typeof v==="function"?v(...a):v;};
const plural=(n,k)=>{const f=P[k][L()]; let w; if(lang==="pl") w=n===1?f[0]:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?f[1]:f[2]); else w=n===1?f[0]:f[1]; return n+" "+w;};
const LOC=()=>lang==="pl"?"pl-PL":"en-GB";
const mN=k=>M[k]?M[k][L()]:k;
const nm=l=>l.n[L()];
const WD=()=>lang==="pl"?["pn","wt","śr","cz","pt","so","nd"]:["Mo","Tu","We","Th","Fr","Sa","Su"];

/* ---------- library lookup ---------- */
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l");
const ALIAS=[];LIB.forEach(e=>{[...e.n,...e.al].forEach(a=>ALIAS.push([norm(a),e]))});ALIAS.sort((a,b)=>b[0].length-a[0].length);
const LIBBY=Object.fromEntries(LIB.map(e=>[e.id,e]));
const libCache=new Map();
function findLib(name){ if(libCache.has(name)) return libCache.get(name); const n=norm(name); const hit=ALIAS.find(([a])=>n.includes(a)); const r=hit?hit[1]:null; libCache.set(name,r); return r; }
const keyOf=e=>{ if(e.lib&&LIBBY[e.lib]) return e.lib; const l=findLib(e.name); return l?l.id:"c:"+e.name; };
const libOf=e=>LIBBY[keyOf(e)]||null;
const exLabel=e=>{const l=libOf(e);return l?nm(l):e.name};
const keyLabel=k=>LIBBY[k]?nm(LIBBY[k]):k.slice(2);

const PAIR=new Set(["lateral","inclinedb","lunge","dbcurl"]);
const BAR=new Set(["bench","squat","deadlift","rdl","ohp","bbrow","hipthrust","bbcurl"]);
const REST={bench:150,squat:180,deadlift:180,rdl:150,ohp:150,bbrow:120,hipthrust:120,legpress:150,pulldown:120,cablerow:120,inclinedb:120,dips:120,pullup:120,lunge:120,latpull_close:120,plank:60,kneeraise:60,kbpass:60,halo:60,hyper:90,calfraise:60};
const PLATES={kg:[[25,"#D23A2E",100],[20,"#1F5FC4",100],[15,"#E9B713",90],[10,"#2F9A57",80],[5,"#F3F3EF",62],[2.5,"#1B2130",52],[1.25,"#8A919E",44],[0.5,"#C9CCD2",38]],
              lb:[[45,"#1F5FC4",100],[35,"#E9B713",90],[25,"#2F9A57",80],[10,"#F3F3EF",62],[5,"#1B2130",52],[2.5,"#8A919E",44]]};
const BARS={kg:[20,15,10,0],lb:[45,35,25,0]};
const LIGHT_PLATE=new Set([5,0.5,10]);

/* ---------- utils ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ds=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today=()=>ds(new Date());
const pd=s=>new Date(s+"T12:00:00");
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const fmtDate=s=>{try{return pd(s).toLocaleDateString(LOC(),{weekday:"long",day:"numeric",month:"long"})}catch(e){return s}};
const fmtShort=s=>{try{return pd(s).toLocaleDateString(LOC(),{day:"numeric",month:"short"})}catch(e){return s}};
const num=v=>{const n=parseFloat(String(v).replace(",","."));return isFinite(n)?n:0};
const fmtN=n=>(Math.round(n*10)/10).toLocaleString(LOC());
const U=()=>settings().unit==="lb"?"lb":"kg";
const fmtW=n=>fmtN(n)+" "+U();
const e1rm=(kg,r)=>r>0&&kg>0?(r===1?kg:kg*(1+r/30)):0;
const clone=o=>JSON.parse(JSON.stringify(o));
const daysBetween=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const fmtSec=v=>{v=Math.round(num(v));const neg=v<0;v=Math.abs(v);return (neg?"−":"")+(v>=60?Math.floor(v/60)+":"+String(v%60).padStart(2,"0")+" min":v+" s")};
const fmtDur=ms=>{const m=Math.round(ms/60000);return m>=60?Math.floor(m/60)+" h "+(m%60)+" min":m+" min"};
const clock=ms=>{const s=Math.max(0,Math.floor(ms/1000));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+":"+String(m).padStart(2,"0"):m)+":"+String(x).padStart(2,"0")};
const reduced=()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}};
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
const mondayOf=d=>{const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const perHand=v=>{const n=num(v);return n?"2 × "+fmtN(n/2)+" "+U():"";};

/* ---------- state ---------- */
const docs=new Map();
let tab="workout", progEx=null, progMetric="e1rm", progDays=30, libFilter=null, libQuery="", infoMetric=null;
let calMonth=(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1)})();
let calSel=today();
let confirmDel=null, sheetMode=null, sheetArg=null, sheetOpener=null;
let mapMode="done", fxNew=null, fxPop=null, enterAnim=false;
let setView="main", impData=null, wipeAsk=false;

/* ---------- storage (this browser only) ---------- */
const KEY="gym-notebook.v1";
let canStore=true, saveT=null;
const ID_RE=/^[A-Za-z0-9_-]{1,64}$/;
const str=(v,max)=>v==null?"":String(v).slice(0,max);
const intIn=(v,a,b,d)=>{const n=Math.round(Number(v));return isFinite(n)?Math.min(b,Math.max(a,n)):d};
const tsOr=v=>{const n=Number(v);return isFinite(n)&&n>0?n:null};
const numStr=v=>{if(v==null||v==="") return ""; const n=parseFloat(String(v).replace(",",".")); return isFinite(n)&&n>=0&&n<100000?String(Math.round(n*1000)/1000):"";};
function sanEx(e,plan){
  if(!e||typeof e!=="object") return null;
  const name=str(e.name,80).trim(); if(!name) return null;
  const o={name}; if(typeof e.lib==="string"&&LIBBY[e.lib]) o.lib=e.lib;
  if(e.type==="t"||e.type==="w") o.type=e.type;
  if(plan){ o.n=intIn(e.n,1,20,3); return o; }
  if(e.note) o.note=str(e.note,500);
  o.sets=Array.isArray(e.sets)?e.sets.slice(0,40).map(s=>({kg:numStr(s&&s.kg),reps:numStr(s&&s.reps),done:!!(s&&s.done)})):[];
  return o;
}
function sanitize(id,d){
  if(typeof id!=="string"||!ID_RE.test(id)||!d||typeof d!=="object"||Array.isArray(d)) return null;
  if(id==="settings") return {kind:"settings",goal:intIn(d.goal,1,7,3),lang:d.lang==="pl"||d.lang==="en"?d.lang:null,unit:d.unit==="lb"?"lb":"kg",sound:d.sound!==false,wake:d.wake!==false,seeded:!!d.seeded};
  const raw=Array.isArray(d.exercises)?d.exercises.slice(0,60):[];
  if(d.kind==="plan") return {kind:"plan",name:str(d.name,40).trim()||"Plan",createdAt:tsOr(d.createdAt)||Date.now(),usedAt:tsOr(d.usedAt),sample:!!d.sample,exercises:raw.map(e=>sanEx(e,true)).filter(Boolean)};
  if(d.kind) return null;
  if(typeof d.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||isNaN(pd(d.date))) return null;
  const o={date:d.date,createdAt:tsOr(d.createdAt)||Date.now(),startedAt:tsOr(d.startedAt),finishedAt:tsOr(d.finishedAt),done:!!d.done,exercises:raw.map(e=>sanEx(e,false)).filter(Boolean)};
  if(d.reopened) o.reopened=true; if(d.sample) o.sample=true;
  if(typeof d.planId==="string"&&ID_RE.test(d.planId)) o.planId=d.planId;
  if(d.planName) o.planName=str(d.planName,40);
  return o;
}
function readDocs(obj){ /* accepts an export ({docs:{...}}) or a plain id→doc map */
  const src=obj&&typeof obj==="object"&&!Array.isArray(obj)?(obj.docs&&typeof obj.docs==="object"&&!Array.isArray(obj.docs)?obj.docs:obj):null;
  const out=new Map(); if(!src) return out;
  Object.keys(src).forEach(k=>{ const s=sanitize(k,src[k]); if(s) out.set(k,s); });
  return out;
}
function load(){
  try{ const raw=localStorage.getItem(KEY); if(raw) readDocs(JSON.parse(raw)).forEach((v,k)=>docs.set(k,v));
       localStorage.setItem(KEY+".probe","1"); localStorage.removeItem(KEY+".probe"); }
  catch(e){ canStore=false; }
}
function persist(){
  clearTimeout(saveT); saveT=null;
  try{ const o={}; docs.forEach((v,k)=>o[k]=v); localStorage.setItem(KEY,JSON.stringify({app:"gym-notebook",version:1,docs:o})); canStore=true; }
  catch(e){ if(canStore){ canStore=false; renderNotice(); } }
}
function queueSave(){ clearTimeout(saveT); saveT=setTimeout(persist,300); }
addEventListener("pagehide",()=>{ if(saveT) persist(); });
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden"&&saveT) persist(); syncWake(); });
function removeDoc(id){ docs.delete(id); queueSave(); render(); }

/* ---------- data ---------- */
const sorted=()=>[...docs.entries()].filter(([,w])=>!w.kind).map(([id,w])=>({id,...w})).sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||0)-(a.createdAt||0));
const plans=()=>[...docs.entries()].filter(([,w])=>w.kind==="plan").map(([id,w])=>({id,...w})).sort((a,b)=>(b.usedAt||b.createdAt||0)-(a.usedAt||a.createdAt||0));
function settings(){ return docs.get("settings")||{kind:"settings",goal:3,unit:"kg",sound:true,wake:true}; }
function saveSettings(o){ docs.set("settings",Object.assign({},settings(),o,{kind:"settings"})); queueSave(); }
const active=()=>sorted().find(w=>!w.done);
const valid=ex=>(ex.sets||[]).filter(s=>num(s.reps)>0);
const hasSample=()=>[...docs.values()].some(d=>d.sample);
const typeOf=ex=>ex.type?(ex.type==="t"?"s":"r"):(()=>{const l=libOf(ex);return l&&l.unit==="s"?"s":"r"})();
function unitOfKey(k){ for(const w of sorted()){ const ex=(w.exercises||[]).find(e=>keyOf(e)===k); if(ex) return typeOf(ex); } const l=LIBBY[k]; return l&&l.unit==="s"?"s":"r"; }
function lastPerf(key,excl){ for(const w of sorted()){ if(w.id===excl||!w.done) continue; const ex=(w.exercises||[]).find(e=>keyOf(e)===key); if(ex&&valid(ex).length) return {date:w.date,sets:valid(ex),note:ex.note}; } return null; }
function bestBefore(key,excl){ let b=0; sorted().forEach(w=>{ if(w.id===excl) return; (w.exercises||[]).forEach(ex=>{ if(keyOf(ex)===key) valid(ex).forEach(s=>{b=Math.max(b,e1rm(num(s.kg),num(s.reps)))}); }); }); return b; }
function bestRepsBefore(key,excl){ let b=0; sorted().forEach(w=>{ if(w.id===excl) return; (w.exercises||[]).forEach(ex=>{ if(keyOf(ex)===key) valid(ex).forEach(s=>{b=Math.max(b,num(s.reps))}); }); }); return b; }
function history(key){
  const out=[];
  sorted().slice().reverse().forEach(w=>{
    if(!w.done) return;
    const ex=(w.exercises||[]).find(e=>keyOf(e)===key); if(!ex) return;
    const ss=valid(ex); if(!ss.length) return;
    let maxKg=0,best=0,vol=0,maxR=0,sumR=0,top=ss[0];
    ss.forEach(s=>{const kg=num(s.kg),r=num(s.reps);maxKg=Math.max(maxKg,kg);maxR=Math.max(maxR,r);sumR+=r;const e=e1rm(kg,r);if(e>best){best=e;top=s;}vol+=kg*r;});
    if(!best) top=ss.reduce((a,s)=>num(s.reps)>num(a.reps)?s:a,ss[0]);
    out.push({date:w.date,maxKg,e1rm:best,vol,maxR,sumR,top,sets:ss.length,all:ss});
  });
  return out;
}
function usedKeys(){ const m=new Map(); sorted().forEach(w=>(w.exercises||[]).forEach(e=>{const k=keyOf(e); if(!m.has(k)) m.set(k,{name:exLabel(e),date:w.date});})); return m; }
const setsTxt=(ss,u)=>ss.map(s=>u==="s"?fmtSec(s.reps):(num(s.kg)?fmtN(num(s.kg))+" "+U()+" × ":"")+num(s.reps)).join(", ");
function muscleLoad(list,mode){
  const m={}; list.forEach(w=>(w.exercises||[]).forEach(ex=>{ const l=libOf(ex); if(!l) return;
    const n=mode==="done"?(ex.sets||[]).filter(s=>s.done&&num(s.reps)>0).length:mode==="plan"?(ex.sets||[]).length:(valid(ex).length||(w.done?0:(ex.sets||[]).length)); if(!n) return;
    l.p.forEach(k=>m[k]=(m[k]||0)+n); l.s.forEach(k=>m[k]=(m[k]||0)+n*.5); })); return m; }
const volOf=w=>(w.exercises||[]).reduce((a,e)=>typeOf(e)==="s"?a:a+valid(e).reduce((b,s)=>b+num(s.kg)*num(s.reps),0),0);
const setsOf=w=>(w.exercises||[]).reduce((a,e)=>a+valid(e).length,0);
function weekCount(mon){ const a=ds(mon), e=new Date(mon); e.setDate(e.getDate()+6); const b=ds(e); return sorted().filter(w=>w.done&&w.date>=a&&w.date<=b).length; }
function streak(){ const g=settings().goal||3; const mon=mondayOf(new Date()); let n=0; if(weekCount(mon)>=g) n++; for(let i=0;i<200;i++){ mon.setDate(mon.getDate()-7); if(weekCount(mon)>=g) n++; else break; } return n; }
function recovery(){
  const r={}; const td=today();
  sorted().filter(w=>w.done).forEach(w=>(w.exercises||[]).forEach(ex=>{ const l=libOf(ex); if(!l||!valid(ex).length) return;
    [...l.p,...l.s].forEach(m=>{ const d=daysBetween(w.date,td); if(r[m]==null||d<r[m]) r[m]=d; }); }));
  return r;
}
function restFor(ex){ const l=libOf(ex); return l&&REST[l.id]||90; }
function incFor(ex,top){ const l=libOf(ex); const lb=U()==="lb";
  if(l&&PAIR.has(l.id)) return lb?5:2; if(l&&BAR.has(l.id)) return lb?5:2.5;
  return lb?Math.max(2.5,Math.round(top*0.05/2.5)*2.5):Math.max(1,Math.round(top*0.05*2)/2); }
function quickOpts(ex,prev){
  const u=typeOf(ex); const ps=prev.sets; const day=fmtShort(prev.date);
  const mk=f=>ps.map(s=>{const r=f(s);return {kg:r.kg===""?"":String(Math.round(r.kg*100)/100),reps:String(r.reps)};});
  if(u==="s") return [
    {id:"same",lab:t("qoSame"),sub:t("qoAs",day),sets:mk(s=>({kg:"",reps:num(s.reps)}))},
    {id:"t5",lab:"+5 s",sub:t("qoEach"),sets:mk(s=>({kg:"",reps:num(s.reps)+5}))},
    {id:"t10",lab:"+10 s",sub:t("qoEach"),sets:mk(s=>({kg:"",reps:num(s.reps)+10}))}];
  const top=Math.max(...ps.map(s=>num(s.kg)));
  const out=[{id:"same",lab:t("qoSame"),sub:t("qoAs",day),sets:mk(s=>({kg:num(s.kg)||"",reps:num(s.reps)}))}];
  if(top>0){ const inc=incFor(ex,top); out.push({id:"kg",lab:"+"+fmtW(inc),sub:t("qoSameReps"),sets:mk(s=>({kg:num(s.kg)?num(s.kg)+inc:"",reps:num(s.reps)}))}); }
  out.push({id:"reps",lab:t("qoRep"),sub:t("qoSameW"),sets:mk(s=>({kg:num(s.kg)||"",reps:num(s.reps)+1}))});
  return out;
}

/* ---------- body outline (muscle shapes from react-body-highlighter, MIT License) ---------- */
const BODY=/*@BODY@*/null;
const FRONT_M=new Set(["chest","abs","obliques","biceps","quads","shoulders"]), BACK_M=new Set(["upper","rear","lats","lower","glutes","hams","triceps"]);
function fig(k,scores,col,dx){
  return `<g${dx?` transform="translate(${dx} 0)"`:""}>`+BODY[k].map(([m,pts])=>{const v=m?scores[m]||0:0;
    return pts.map(pt=>`<polygon points="${pt}" fill="${v>0?(col&&col[m]||"var(--red)"):(m?"var(--body)":"var(--body2)")}"${v>0?` fill-opacity="${(0.25+0.75*Math.min(1,v)).toFixed(2)}"`:""}/>`).join("");}).join("")+"</g>";
}
function bodySvg(scores,col){
  return `<svg viewBox="0 0 216 214" role="img" aria-label="${esc(t("bodyAria"))}">${fig("f",scores,col,0)}${fig("b",scores,col,116)}
    <text x="50" y="211" text-anchor="middle" font-size="9" fill="var(--muted)">${esc(t("front"))}</text>
    <text x="166" y="211" text-anchor="middle" font-size="9" fill="var(--muted)">${esc(t("back"))}</text></svg>`;
}
const thumbCache=new Map();
function thumb(k,name,cls){
  const l=LIBBY[k];
  if(!l) return `<span class="thumb ph ${cls||""}" aria-hidden="true">${esc((name||"?").trim().charAt(0).toUpperCase())}</span>`;
  if(!thumbCache.has(k)){
    const sc={}; l.s.forEach(m=>sc[m]=.38); l.p.forEach(m=>sc[m]=1);
    const score=set=>l.p.filter(m=>set.has(m)).length*2+l.s.filter(m=>set.has(m)).length;
    const v=score(FRONT_M)>=score(BACK_M)?"f":"b";
    thumbCache.set(k,`<svg viewBox="${v==="f"?"-2 -2 104 202":"-2 -2 104 224"}" aria-hidden="true">${fig(v,sc)}</svg>`);
  }
  return `<span class="thumb ${cls||""}">${thumbCache.get(k)}</span>`;
}
function loadBlock(load,emptyTxt){
  const ent=Object.entries(load).sort((a,b)=>b[1]-a[1]);
  if(!ent.length) return emptyTxt?`<div class="muted small">${esc(emptyTxt)}</div>`:"";
  const mx=ent[0][1]; const sc={}; ent.forEach(([k,v])=>sc[k]=v/mx);
  return `<div class="map-wrap">${bodySvg(sc)}<div class="mlist">${ent.slice(0,6).map(([k,v],i)=>`<div class="mrow"><span>${esc(mN(k))}</span><b>${fmtN(v)}</b><div class="bar"><i style="width:${Math.round(v/mx*100)}%;animation-delay:${i*50}ms"></i></div></div>`).join("")}
</div></div>`;
}
function recBlock(){
  const r=recovery(); const sc={},col={};
  Object.keys(M).forEach(m=>{ const d=r[m]; if(d==null||d>14) return; sc[m]=1; col[m]=d<2?"var(--red)":d<3?"var(--yellow)":"var(--green)"; });
  return `<div class="map-wrap">${bodySvg(sc,col)}</div>
    <div class="rec-leg"><span><i style="background:var(--red)"></i>${esc(t("upTo2"))}</span><span><i style="background:var(--yellow)"></i>${esc(t("d23"))}</span><span><i style="background:var(--green)"></i>${esc(t("ready"))}</span><span><i style="background:var(--body)"></i>${esc(t("over2w"))}</span></div>`;
}

/* ---------- render ---------- */
function applyStatic(){
  document.documentElement.lang=lang;
  document.title=t("appName");
  document.querySelectorAll("[data-t]").forEach(el=>{el.textContent=t(el.dataset.t)});
  document.querySelectorAll("[data-ta]").forEach(el=>{el.setAttribute("aria-label",t(el.dataset.ta))});
}
function render(){
  document.querySelectorAll("nav.tabs button").forEach(b=>{const on=b.dataset.tab===tab;b.classList.toggle("on",on);if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});
  const w=active();
  $("#liveDot").classList.toggle("hide",!w||tab==="workout");
  ({workout:renderWorkout,calendar:renderCalendar,progress:renderProgress,library:renderLibrary})[tab]();
  const v=$("#view"); if(enterAnim){ v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter"); enterAnim=false; }
  renderLive(); renderNotice(); syncWake(); fxNew=null; fxPop=null;
}
function head(a){ $("#title").textContent=a; }
const shortDate=s=>{try{return cap(pd(s).toLocaleDateString(LOC(),{weekday:"short",day:"numeric",month:"short"}))}catch(e){return s}};
function renderNotice(){
  const n=$("#notice");
  if(!canStore){ n.innerHTML=`<span>${esc(t("storeOff"))}</span><button data-act="set-open-export">${esc(t("sExport"))}</button>`; n.classList.remove("hide"); return; }
  if(hasSample()&&tab==="workout"&&!active()){ n.innerHTML=`<span>${esc(t("sampleOn"))}</span><button data-act="sample-del">${esc(t("removeSample"))}</button>`; n.classList.remove("hide"); return; }
  n.classList.add("hide"); n.innerHTML="";
}
function renderLive(){
  const w=active(); const el=$("#live");
  if(!w||tab!=="workout"){ el.classList.add("hide"); el.innerHTML=""; return; }
  const tot=(w.exercises||[]).reduce((a,e)=>a+(e.sets||[]).length,0);
  const dn=(w.exercises||[]).reduce((a,e)=>a+(e.sets||[]).filter(s=>s.done).length,0);
  const showClock=w.startedAt&&w.date===today()&&!w.reopened;
  el.classList.remove("hide");
  el.innerHTML=`<div class="clock" id="clock">${showClock?clock(Date.now()-w.startedAt):"—"}</div>
    <div class="prog"><div class="t"><span>${esc(showClock?t("duration"):t("editing"))}</span><span>${esc(t("setsOf",dn,tot))}</span></div><div class="pb"><i style="width:${tot?Math.round(dn/tot*100):0}%"></i></div></div>
    <button class="btn btn-ink btn-sm" data-act="finish">${esc(t("finish"))}</button>`;
}
setInterval(()=>{ const c=$("#clock"); const w=active(); if(c&&w&&w.startedAt&&w.date===today()&&!w.reopened) c.textContent=clock(Date.now()-w.startedAt); },1000);

const IC={
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  rep:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/></svg>',
  plate:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 12h20"/><rect x="6" y="5" width="3" height="14" rx="1"/><rect x="15" y="5" width="3" height="14" rx="1"/><rect x="9.5" y="8" width="2" height="8" rx="1"/><rect x="12.5" y="8" width="2" height="8" rx="1"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  chev:'<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'};

function weekAgo(){ const td=today(); let best=null,bd=99; sorted().forEach(w=>{ if(!w.done) return; const d=daysBetween(w.date,td); if(d>=5&&d<=9&&Math.abs(d-7)<bd){bd=Math.abs(d-7);best=w;} }); return best; }
function renderHome(){
  const done=sorted().filter(x=>x.done); const g=settings().goal||3;
  const mon=mondayOf(new Date()); const wc=weekCount(mon); const sk=streak();
  head(shortDate(today()));
  const td=today(); const days=new Set(done.map(w=>w.date)); const wd=WD();
  let wk=""; for(let i=0;i<7;i++){ const d=new Date(mon); d.setDate(mon.getDate()+i); const s=ds(d); wk+=`<div class="hd ${days.has(s)?"has":""} ${s===td?"today":""} ${s>td?"future":""}"><span>${wd[i]}</span><b>${d.getDate()}</b></div>`; }
  const ps=plans(); const last=done[0];
  const qa=[["start",t("qaStart"),IC.play,true],["repeat",t("qaRepeat"),IC.rep,!!last],["plates-free",t("qaPlates"),IC.plate,true],["go-lib",t("qaLib"),IC.book,true]];
  const wa=weekAgo();
  const waEx=wa?(wa.exercises||[]).filter(e=>valid(e).length):[];
  $("#view").innerHTML=`
    <section class="hero" aria-label="${esc(t("thisWeek"))}">
      <div class="hero-top">
        <div><div class="hero-lab">${esc(t("thisWeek"))}</div><div class="hero-num">${wc}<small> / ${g}</small></div>
          <div class="hero-sub">${esc(wc>=g?t("goalDone"):sk?t("streak",plural(sk,"week")):t("toGoal"))}</div></div>
        <div class="hero-goal"><span>${esc(t("weeklyGoal"))}</span><span class="stepper"><button data-act="goal-" aria-label="${esc(t("fewer"))}">−</button><span>${g}</span><button data-act="goal+" aria-label="${esc(t("more"))}">+</button></span></div>
      </div>
      <div class="hweek">${wk}</div>
    </section>
    <div class="qa">${qa.map(([a,l,i,on])=>`<button class="qa-b ${a==="start"?"pri":""}" data-act="${a}" ${on?"":"disabled"}><span class="qa-i">${i}</span><span class="qa-l">${esc(l)}</span></button>`).join("")}</div>
    ${wa?`<div class="panel wa"><div class="tx"><div class="h2" style="margin:0;font-size:20px">${esc(t("weekAgo"))}</div><div class="muted small">${esc(shortDate(wa.date))} · ${esc(wa.planName||plural(waEx.length,"exercise"))}</div></div>
        <button class="btn btn-ink btn-sm" data-act="copy" data-id="${esc(wa.id)}">${esc(t("copy"))}</button></div>`:""}
    <div class="panel"><div class="h2row"><span class="h2">${esc(t("plans"))}</span>${last?`<button class="link" data-act="plan-from" data-id="${esc(last.id)}">${esc(t("fromLast"))}</button>`:""}</div>
      ${ps.length?ps.map(p=>{const ex=p.exercises||[];return `<div class="plan"><button class="pi" data-act="plan-start" data-id="${esc(p.id)}">
          <span class="stack">${ex.slice(0,3).map(e=>thumb(keyOf(e),e.name,"av")).join("")}</span>
          <span class="ptx"><span class="pn">${esc(p.name)}</span><span class="pm">${esc(plural(ex.length,"exercise"))}</span></span></button>
        <button class="plan-del ${confirmDel==="p"+p.id?"confirm":""}" data-act="plan-del" data-id="${esc(p.id)}" aria-label="${esc(t("delPlan"))}">${confirmDel==="p"+p.id?esc(t("delQ")):"⋯"}</button><button class="go" data-act="plan-start" data-id="${esc(p.id)}">Start</button></div>`}).join("")
      :`<div class="muted small">${esc(t("plansEmpty"))}</div>`}
    </div>
    ${done.length?`<div class="panel"><div class="h2row"><span class="h2">${esc(t("recovery"))}</span><span class="muted small">${esc(t("daysSince"))}</span></div>${recBlock()}</div>`
      :`<div class="panel"><p class="muted" style="margin:0 0 12px">${esc(t("tryDemo"))}</p><button class="btn btn-line btn-block" data-act="sample-load">${esc(t("loadSample"))}</button></div>`}`;
}
function sessionGet(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
function renderWorkout(){
  const w=active();
  if(!w) return renderHome();
  head(w.planName||shortDate(w.date));
  const exs=w.exercises||[]; const un=U();
  let h=`<div class="wk-meta"><label class="small muted" for="wkDate">${esc(t("date"))} <input id="wkDate" type="date" data-f="date" value="${esc(w.date)}" max="${today()}"></label>
    <button class="btn btn-line btn-sm danger" data-act="discard">${esc(confirmDel==="discard"?t("discardQ"):t("discard"))}</button></div>`;
  if(exs.length){ const tot=exs.reduce((a,e)=>a+(e.sets||[]).length,0), dn=exs.reduce((a,e)=>a+(e.sets||[]).filter(x=>x.done).length,0);
    h+=`<details class="panel fold" ${sessionGet("gym-tracker-muscle-map:foldMap")==="1"?"open":""} data-fold="gym-tracker-muscle-map:foldMap"><summary><span class="h2" style="margin:0">${esc(t("muscles"))}</span>${IC.chev}</summary>
      <div class="seg"><button data-act="mapmode" data-m="done" class="${mapMode==="done"?"on":""}">${esc(t("mDone",dn))}</button><button data-act="mapmode" data-m="plan" class="${mapMode==="plan"?"on":""}">${esc(t("mPlan",tot))}</button></div>
      ${loadBlock(muscleLoad([w],mapMode),mapMode==="done"?t("mDoneEmpty"):t("mPlanEmpty"))}</details>`; }
  exs.forEach((ex,i)=>{
    const k=keyOf(ex), l=libOf(ex), u=typeOf(ex), pair=!!(l&&PAIR.has(l.id));
    const prev=lastPerf(k,w.id), best=bestBefore(k,w.id), bestR=bestRepsBefore(k,w.id);
    const prSet=j=>{const s=ex.sets[j]; if(!s.done||!num(s.reps)) return false; if(u==="s"||!num(s.kg)) return bestR>0&&num(s.reps)>bestR; return best>0&&e1rm(num(s.kg),num(s.reps))>best+0.01;};
    const anyPR=(ex.sets||[]).some((_,j)=>prSet(j));
    const allDone=(ex.sets||[]).length&&(ex.sets||[]).every(s=>s.done);
    const opts=prev?quickOpts(ex,prev):[];
    const openSets=(ex.sets||[]).some(s=>!s.done);
    const label=exLabel(ex);
    h+=`<article class="ex ${allDone?"complete":""} ${fxNew==="ex"+i?"new":""}" aria-label="${esc(label)}">
      <div class="ex-h"><button class="ex-thb" data-act="info" data-k="${esc(k)}" data-name="${esc(ex.name)}" aria-label="${esc(t("details"))}">${thumb(k,ex.name,"")}</button>
        <button class="ex-title" data-act="info" data-k="${esc(k)}" data-name="${esc(ex.name)}">
        <span class="ex-name">${esc(label)}</span>
        <span class="ex-tags">${l?esc(l.p.map(mN).join(", ")):""}${pair&&u!=="s"?`<span class="pairtag">${esc(t("pairTag"))}</span>`:""}${anyPR?`<span class="pr">${esc(t("record"))}</span>`:""}</span></button>
        <div class="ex-act"><button class="ic" data-act="info" data-k="${esc(k)}" data-name="${esc(ex.name)}" aria-label="${esc(t("details"))}">${IC.info}</button>
        <button class="ic del ${confirmDel==="ex"+i?"confirm":""}" data-act="ex-del" data-ex="${i}" aria-label="${esc(t("delEx"))}">${confirmDel==="ex"+i?esc(t("delQ")):IC.trash}</button></div>
        <div class="ex-prev">${prev?esc(t("lastTime",fmtShort(prev.date),setsTxt(prev.sets,u))):esc(t("firstTime"))}</div></div>
      ${opts.length&&openSets?`<div class="qo" role="group" aria-label="${esc(t("qoGroup"))}">${opts.map(o=>`<button class="qo-b ${ex.qo===o.id?"on":""}" data-act="qo" data-ex="${i}" data-o="${o.id}"><b>${esc(o.lab)}</b><span>${esc(o.sub)}</span></button>`).join("")}</div>`:""}
      <div class="sets ${u==="s"?"time":""}"><div class="sets-head" aria-hidden="true"><div>#</div>${u==="s"?`<div>${esc(t("secs"))}</div>`:(pair?`<div>${esc(t("total",un))}</div>`:`<div>${un}</div>`)+`<div>${esc(t("reps"))}</div>`}<div></div><div></div></div>
      ${(ex.sets||[]).map((s,j)=>{
        const ph=prev?(prev.sets[j]||prev.sets[prev.sets.length-1]):null;
        return `<div class="set ${s.done?"done":""} ${fxPop==="s"+i+"-"+j?"pop":""} ${fxNew==="s"+i+"-"+j?"new":""} ${prSet(j)?"isPR":""}" data-ex="${i}" data-set="${j}">
          <div class="n">${j+1}</div>
          ${u==="s"?"":`<label class="kgw ${pair?"p":""}"><input id="kg-${i}-${j}" inputmode="decimal" enterkeyhint="next" autocomplete="off" data-f="kg" aria-label="${esc(pair?t("ariaKgPair",un):t("ariaKg",un))} · ${j+1}" value="${esc(s.kg??"")}" placeholder="${ph&&num(ph.kg)?esc(fmtN(num(ph.kg))):(l&&l.bw?"—":"0")}">${pair?`<small class="ph">${esc(perHand(s.kg!==""?s.kg:(ph?ph.kg:"")))}</small>`:""}</label>`}
          <input id="rp-${i}-${j}" inputmode="numeric" enterkeyhint="done" autocomplete="off" data-f="reps" aria-label="${esc(u==="s"?t("ariaSec"):t("ariaReps"))} · ${j+1}" value="${esc(s.reps??"")}" placeholder="${ph?esc(num(ph.reps)):"0"}">
          <button class="chk" data-act="done" aria-pressed="${s.done?"true":"false"}" aria-label="${esc(t("ariaDone"))} · ${j+1}">${IC.check}</button>
          <button class="x" data-act="set-del" aria-label="${esc(t("ariaDelSet"))} · ${j+1}">×</button></div>`}).join("")}</div>
      ${ex.noteOpen||ex.note?`<textarea class="note" id="note-${i}" data-f="note" data-ex="${i}" aria-label="${esc(t("note"))}" placeholder="${esc(t("notePh"))}">${esc(ex.note||"")}</textarea>`:""}
      ${prev&&prev.note&&!ex.note?`<div class="prevnote">${esc(t("lastNote"))}<i>${esc(prev.note)}</i></div>`:""}
      <div class="ex-foot"><button class="link" data-act="set-add" data-ex="${i}">${esc(t("addSet"))}</button>
        ${ex.noteOpen||ex.note?"":`<button class="tool" data-act="note" data-ex="${i}">${esc(t("note"))}</button>`}
        ${l&&BAR.has(l.id)&&u!=="s"?`<button class="tool" data-act="plates" data-ex="${i}">${esc(t("plates"))}</button>`:""}
        <button class="tool" data-act="ex-type" data-ex="${i}">${esc(u==="s"?t("measureW"):t("measureT"))}</button></div></article>`;
  });
  h+=`<button class="btn btn-line btn-block" data-act="ex-add" style="margin:4px 0 10px">${esc(t("addEx"))}</button>`;
  if(exs.length) h+=`<button class="btn btn-ink btn-block" data-act="finish" style="height:56px;font-size:22px">${esc(t("finishSave"))}</button>`;
  $("#view").innerHTML=h;
}

function renderCalendar(){
  const done=sorted().filter(w=>w.done);
  const byDay={}; done.forEach(w=>(byDay[w.date]=byDay[w.date]||[]).push(w));
  const y=calMonth.getFullYear(), m=calMonth.getMonth();
  const monthName=calMonth.toLocaleDateString(LOC(),{month:"long",year:"numeric"});
  const inMonth=done.filter(w=>{const d=pd(w.date);return d.getFullYear()===y&&d.getMonth()===m}).length;
  head(t("calendar"));
  const first=new Date(y,m,1), off=(first.getDay()+6)%7, start=new Date(y,m,1-off);
  const td=today();
  let g=WD().map(d=>`<div class="wd" aria-hidden="true">${d}</div>`).join("");
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i); const s=ds(d);
    if(i>=35&&d.getMonth()!==m) break;
    const cls=["d",d.getMonth()!==m?"out":"",byDay[s]?"has":"",s===td?"today":"",s===calSel?"sel":"",s>td?"future":""].join(" ");
    g+=`<button class="${cls}" data-act="day" data-d="${s}" aria-pressed="${s===calSel}" aria-label="${esc(fmtDate(s))}${byDay[s]?esc(t("withWorkout")):""}">${d.getDate()}</button>`;
  }
  const list=byDay[calSel]||[];
  let det=`<div class="panel" style="margin-top:12px"><div class="h2">${esc(cap(fmtDate(calSel)))}</div>`;
  if(!list.length){
    det+=`<div class="muted" style="margin-bottom:12px">${esc(t("noWorkoutDay"))}</div>`;
    if(calSel<=td) det+=`<button class="btn btn-line btn-block" data-act="add-day">${esc(t("addDay"))}</button>`;
  } else list.forEach(w=>{
    const exs=(w.exercises||[]).filter(e=>valid(e).length);
    det+=`<div class="muted small" style="margin-bottom:12px">${esc(plural(exs.length,"exercise"))}, ${esc(plural(setsOf(w),"set"))}, ${esc(fmtW(volOf(w)))} ${esc(t("volume"))}${w.startedAt&&w.finishedAt&&w.finishedAt>w.startedAt&&!w.reopened?", "+fmtDur(w.finishedAt-w.startedAt):""}</div>
      ${loadBlock(muscleLoad([w]),"")}
      <div style="margin-top:12px">${exs.map(e=>`<div class="day-ex"><button class="t" data-act="info" data-k="${esc(keyOf(e))}" data-name="${esc(e.name)}">${esc(exLabel(e))}<span class="link">${esc(t("moreInfo"))}</span></button><div class="s">${esc(setsTxt(valid(e),typeOf(e)))}</div>${e.note?`<div class="nt">${esc(e.note)}</div>`:""}</div>`).join("")}</div>
      <div class="rowbtns"><button class="btn btn-line btn-sm" data-act="h-edit" data-id="${esc(w.id)}">${esc(t("edit"))}</button>
      <button class="btn btn-line btn-sm" data-act="copy" data-id="${esc(w.id)}">${esc(t("copyToday"))}</button>
      <button class="btn btn-line btn-sm" data-act="plan-from" data-id="${esc(w.id)}">${esc(t("saveAsPlan"))}</button>
      <button class="btn btn-line btn-sm danger" data-act="h-del" data-id="${esc(w.id)}">${esc(confirmDel==="h"+w.id?t("sure"):t("del"))}</button></div>`;
  });
  det+="</div>";
  $("#view").innerHTML=`<div class="panel"><div class="cal-h"><button data-act="cal-prev" aria-label="${esc(t("prevM"))}">‹</button><span class="m" aria-live="polite">${esc(monthName)}</span><button data-act="cal-next" aria-label="${esc(t("nextM"))}">›</button></div><div class="cal">${g}</div></div>${det}`;
}

function renderProgress(){
  const done=sorted().filter(w=>w.done);
  head(t("progress"));
  if(!done.length){$("#view").innerHTML=`<p class="empty">${esc(t("progEmpty"))}</p><button class="btn btn-line" data-act="sample-load">${esc(t("loadSample"))}</button>`;return;}
  const from=new Date();from.setDate(from.getDate()-progDays+1);const fs=ds(from);
  const recent=done.filter(w=>w.date>=fs);
  const keys=[...usedKeys().entries()].filter(([k])=>history(k).length);
  if(!keys.length){$("#view").innerHTML=`<p class="empty">${esc(t("progEmpty"))}</p>`;return;}
  if(!progEx||!keys.find(([k])=>k===progEx)) progEx=keys[0][0];
  const h=history(progEx), u=unitOfKey(progEx), bw=u==="s"||h.every(x=>!x.maxKg), un=U();
  const metrics=bw?[["maxR",u==="s"?t("longest"):t("maxReps")],["sumR",u==="s"?t("totalTime"):t("sumReps")]]:[["e1rm",t("e1rm")],["maxKg",t("maxKg",un)],["vol",t("vol")]];
  if(!metrics.find(x=>x[0]===progMetric)) progMetric=metrics[0][0];
  const first=h[0],last=h[h.length-1];
  const main=bw?"maxR":"e1rm";
  const best=Math.max(...h.map(x=>x[main])), diff=last[main]-first[main];
  const totalVol=recent.reduce((a,w)=>a+volOf(w),0);
  const board=keys.map(([k,v])=>{const hh=history(k);const uu=unitOfKey(k);const b=uu==="s"||hh.every(x=>!x.maxKg);
    const top=b?hh.reduce((a,x)=>x.maxR>a.maxR?x:a,hh[0]):hh.reduce((a,x)=>x.e1rm>a.e1rm?x:a,hh[0]);
    return {k,name:keyLabel(k),val:setsTxt([top.top],uu),date:top.date};});
  const isT=u==="s";
  $("#view").innerHTML=`
    <div class="panel"><div class="h2">${esc(t("recentMuscles"))}</div>
      <div class="seg">${[7,30,90].map(d=>`<button data-act="days" data-d="${d}" class="${progDays===d?"on":""}">${esc(t("nDays",d))}</button>`).join("")}</div>
      ${loadBlock(muscleLoad(recent),t("noneInRange"))}</div>
    <div class="h2" style="margin-top:18px">${esc(t("exercises"))}</div>
    <div class="chips">${keys.map(([k])=>`<button class="chip ${k===progEx?"on":""}" data-act="pick" data-k="${esc(k)}">${esc(keyLabel(k))}</button>`).join("")}</div>
    <div class="kpis">
      <div class="kpi"><b>${bw?(isT?fmtSec(Math.max(...h.map(x=>x.maxR))):fmtN(Math.max(...h.map(x=>x.maxR)))):fmtN(Math.max(...h.map(x=>x.maxKg)))}</b><span>${esc(bw?(isT?t("kLongest"):t("kMaxReps")):t("kMax",un))}</span></div>
      <div class="kpi"><b>${bw?h.length:fmtN(best)}</b><span>${esc(bw?t("kSessions"):t("k1rm",un))}</span></div>
      <div class="kpi"><b style="color:${diff>=0?"var(--green)":"var(--red)"}">${isT?(diff>=0?"+":"")+fmtSec(diff):(diff>=0?"+":"")+fmtN(diff)}</b><span>${esc(t("sinceFirst"))}</span></div>
    </div>
    <div class="panel chart">
      <div class="seg">${metrics.map(([k,l])=>`<button data-act="metric" data-m="${k}" class="${progMetric===k?"on":""}">${esc(l)}</button>`).join("")}</div>
      ${chart(h.map(x=>({d:x.date,v:x[progMetric]})))}
      ${h.length<2?`<div class="muted small" style="margin-top:6px">${esc(t("trendLater"))}</div>`:""}
    </div>
    <div class="panel rows"><div class="h2">${esc(t("sessions"))}</div>
      ${h.slice().reverse().slice(0,5).map(x=>`<div class="r"><div>${esc(fmtShort(x.date))}</div><span>${esc(plural(x.sets,"set"))}, ${esc(t("best",setsTxt([x.top],u)))}</span></div>`).join("")}
    </div>
    <div class="panel rows"><div class="h2">${esc(t("board"))}</div>
      ${board.map(b=>`<div class="r"><button data-act="pick" data-k="${esc(b.k)}" style="text-align:left">${esc(b.name)}</button><span><b>${esc(b.val)}</b><br>${esc(fmtShort(b.date))}</span></div>`).join("")}
    </div>
`;
}
function chart(pts){
  const W=340,H=180,pl=38,pr=14,pt=22,pb=24;
  if(pts.length===1) pts=[pts[0],pts[0]];
  const vs=pts.map(p=>p.v);let mn=Math.min(...vs),mx=Math.max(...vs);
  if(mx-mn<1){mn-=5;mx+=5;} const pad=(mx-mn)*.15;mn=Math.max(0,mn-pad);mx+=pad;
  const x=i=>pl+(W-pl-pr)*(i/(pts.length-1)), y=v=>pt+(H-pt-pb)*(1-(v-mn)/(mx-mn));
  let len=0; for(let i=1;i<pts.length;i++) len+=Math.hypot(x(i)-x(i-1),y(pts[i].v)-y(pts[i-1].v));
  const line=pts.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(p.v).toFixed(1)).join(" ");
  const area=line+` L${x(pts.length-1).toFixed(1)} ${H-pb} L${pl} ${H-pb} Z`;
  const L_=pts.length-1;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(fmtShort(pts[0].d))} – ${esc(fmtShort(pts[L_].d))}: ${fmtN(pts[0].v)} → ${fmtN(pts[L_].v)}">
    ${[mn,(mn+mx)/2,mx].map(tk=>`<line x1="${pl}" x2="${W-pr}" y1="${y(tk).toFixed(1)}" y2="${y(tk).toFixed(1)}" stroke="var(--line)"/><text x="${pl-6}" y="${(y(tk)+4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--muted)">${Math.round(tk)}</text>`).join("")}
    <path d="${area}" fill="var(--blue)" fill-opacity=".08"/>
    <path class="ln" style="--len:${Math.ceil(len)+2}" d="${line}" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p,i)=>`<circle class="dot" style="animation-delay:${Math.round(i/Math.max(1,L_)*700)}ms" cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${i===L_?5:3.5}" fill="${i===L_?"var(--red)":"var(--surface)"}" stroke="${i===L_?"var(--red)":"var(--ink)"}" stroke-width="2"/>`).join("")}
    <text x="${pl}" y="${H-5}" font-size="11" fill="var(--muted)">${esc(fmtShort(pts[0].d))}</text>
    <text x="${W-pr}" y="${H-5}" font-size="11" fill="var(--muted)" text-anchor="end">${esc(fmtShort(pts[L_].d))}</text>
    <text x="${Math.min(x(L_),W-pr)}" y="${Math.max(14,y(pts[L_].v)-11)}" font-size="15" font-weight="700" fill="var(--ink)" text-anchor="end" style="font-family:var(--cond)">${fmtN(pts[L_].v)}</text>
  </svg>`;
}

function renderLibrary(){
  head(t("tabLib"));
  const used=usedKeys();
  $("#view").innerHTML=`
    <input class="search" id="libSearch" type="search" placeholder="${esc(t("search"))}" aria-label="${esc(t("search"))}" value="${esc(libQuery)}" autocomplete="off" style="margin-bottom:10px">
    <div class="chips"><button class="chip ${!libFilter?"on":""}" data-act="lf" data-m="">${esc(t("all"))}</button>${Object.keys(M).map(k=>`<button class="chip ${libFilter===k?"on":""}" data-act="lf" data-m="${k}">${esc(mN(k))}</button>`).join("")}</div>
    <div class="panel" style="padding:0 14px" id="libList"></div>`;
  renderLibraryList(used);
}
function libItems(items,used){
  return items.map(e=>`<button class="item th" data-act="info" data-k="${esc(e.k)}" data-name="${esc(e.name)}">
      ${thumb(e.k,e.name,"")}<div class="tx"><div class="nm">${esc(e.name)}</div><div class="mu">${e.p.length?esc(e.p.map(mN).join(", ")):esc(e.alt)}</div></div>
      <span class="rt">${used.has(e.k)?esc(t("doneOn",fmtShort(used.get(e.k).date))):""}</span></button>`).join("")||`<div class="empty">${esc(t("libEmpty"))}</div>`;
}

/* ---------- sheets ---------- */
function openSheet(mode,arg){
  if(!sheetMode) sheetOpener=document.activeElement;
  sheetMode=mode; sheetArg=arg;
  $("#sheet").classList.toggle("full",mode==="summary");
  $("#sheetBg").classList.add("on");$("#sheet").classList.add("on");
  $("#shHead").innerHTML="";
  const ttl={pick:t("addExTitle"),plates:t("plateCalc"),plan:t("planTitle"),settings:t("settings")}[mode]||"";
  $("#shTitle").textContent=ttl; $("#sheet").setAttribute("aria-label",ttl||t("moreInfo"));
  if(mode==="pick"){
    $("#shHead").innerHTML=`<input class="search" id="exSearch" type="search" placeholder="${esc(t("pickPh"))}" aria-label="${esc(t("pickPh"))}" autocomplete="off">`;
    renderPick(); setTimeout(()=>{const s=$("#exSearch"); if(s) s.focus();},300);
  } else if(mode==="info") renderInfo(arg.k,arg.name);
  else if(mode==="plates") renderPlates();
  else if(mode==="summary") renderSummary(arg);
  else if(mode==="plan") renderPlanForm(arg);
  else if(mode==="settings"){ setView=arg&&arg.view||"main"; impData=null; wipeAsk=false; renderSettings(); }
  $("#shBody").scrollTop=0;
  if(mode!=="pick"&&mode!=="plan") setTimeout(()=>{ const c=$("#sheet [data-act='sheet-close']"); if(c&&sheetMode) c.focus({preventScroll:true}); },320);
}
function closeSheet(){
  if(!sheetMode) return;
  $("#sheetBg").classList.remove("on");$("#sheet").classList.remove("on");
  const a=document.activeElement; if(a&&$("#sheet").contains(a)) a.blur();
  sheetMode=null;
  if(sheetOpener&&document.body.contains(sheetOpener)) try{sheetOpener.focus({preventScroll:true})}catch(e){}
  sheetOpener=null;
}
function renderPick(){
  const q=($("#exSearch")||{}).value||""; const qn=norm(q.trim());
  const used=usedKeys(); const w=active(); const inW=new Set(w?(w.exercises||[]).map(keyOf):[]);
  let items=LIB.map(e=>({k:e.id,name:nm(e),mu:e.p.map(mN).join(", "),alt:e.n[1-L()]+" "+e.al.join(" ")}));
  used.forEach((v,k)=>{ if(k.startsWith("c:")) items.push({k,name:v.name,mu:t("customShort"),alt:""}); });
  items=items.filter(e=>!qn||norm(e.name+" "+e.alt).includes(qn));
  items.sort((a,b)=>((used.get(b.k)||{}).date||"").localeCompare((used.get(a.k)||{}).date||"")||a.name.localeCompare(b.name,LOC()));
  let h="";
  if(q.trim()&&!items.some(e=>norm(e.name)===qn)) h+=`<button class="item new" data-act="pick-ex" data-k="${esc("c:"+q.trim().slice(0,80))}"><div><div class="nm">${esc(t("addCustom",q.trim()))}</div><div class="mu">${esc(t("custom"))}</div></div><span class="add-dot" aria-hidden="true">+</span></button>`;
  h+=items.map(e=>`<button class="item th" data-act="pick-ex" data-k="${esc(e.k)}">${thumb(e.k,e.name,"sm")}<div class="tx"><div class="nm">${esc(e.name)}</div><div class="mu">${esc(e.mu)}${inW.has(e.k)?esc(t("inWorkout")):""}</div></div><span class="add-dot" aria-hidden="true">+</span></button>`).join("");
  $("#shBody").innerHTML=h;
}
function progressBlock(k,u){
  const h=history(k); if(!h.length) return `<p class="muted">${esc(t("noHistory"))}</p>`;
  const bw=u==="s"||h.every(x=>!x.maxKg), un=U();
  const metrics=bw?[["maxR",u==="s"?t("longest"):t("maxReps")],["sumR",u==="s"?t("totalTime"):t("sumReps")]]:[["e1rm","1RM"],["maxKg",t("maxKg",un)],["vol",t("vol")]];
  if(!metrics.find(m=>m[0]===infoMetric)) infoMetric=metrics[0][0];
  const isR=infoMetric==="maxR"||infoMetric==="sumR";
  const fm=v=>isR?(u==="s"?fmtSec(v):fmtN(v)):fmtN(v)+(infoMetric==="vol"?"":" "+un);
  const first=h[0], last=h[h.length-1], diff=last[infoMetric]-first[infoMetric];
  const best=h.reduce((a,x)=>x[infoMetric]>a[infoMetric]?x:a,h[0]);
  let rows=""; for(let i=h.length-1;i>=Math.max(0,h.length-8);i--){ const x=h[i], pv=h[i-1]; const d=pv?x[infoMetric]-pv[infoMetric]:null;
    rows+=`<div class="pg-row"><span class="d">${esc(fmtShort(x.date))}</span><span class="v">${esc(setsTxt(x.all,u))}</span>${d==null?`<span class="delta eq">${esc(t("start"))}</span>`:`<span class="delta ${d>0.05?"up":d<-0.05?"dn":"eq"}">${Math.abs(d)<0.05?"=":(d>0?"+":"")+(u==="s"&&isR?fmtSec(d):fmtN(d))}</span>`}</div>`; }
  return `<div class="mystats">
      <div><b>${esc(fm(last[infoMetric]))}</b><span>${esc(t("latest"))}</span></div>
      <div><b>${esc(fm(best[infoMetric]))}</b><span>${esc(t("recordOn",fmtShort(best.date)))}</span></div>
      <div><b style="color:${diff>0.05?"var(--green)":diff<-0.05?"var(--red)":"var(--ink)"}">${diff>0.05?"+":""}${esc(u==="s"&&isR?fmtSec(diff):fmtN(diff))}</b><span>${esc(t("sinceD",fmtShort(first.date)))}</span></div></div>
    <div class="seg" style="margin-top:10px">${metrics.map(([m,l])=>`<button data-act="imetric" data-m="${m}" class="${infoMetric===m?"on":""}">${esc(l)}</button>`).join("")}</div>
    <div class="chart">${h.length>1?chart(h.map(x=>({d:x.date,v:x[infoMetric]}))):`<p class="muted small" style="margin:4px 0 8px">${esc(t("chartLater"))}</p>`}</div>
    <div style="margin-top:6px">${rows}</div>`;
}
function renderInfo(k,name){
  const l=LIBBY[k]; const u=unitOfKey(k); const w=active();
  const title=l?nm(l):(k.startsWith("c:")?k.slice(2):name);
  let html=`<div class="det"><h2>${esc(title)}</h2><div class="alt">${esc(l?l.n[1-L()]:t("custom"))}</div>`;
  if(l){
    const sc={}; l.s.forEach(m=>{sc[m]=.38}); l.p.forEach(m=>{sc[m]=1});
    html+=`<div class="map-box">${bodySvg(sc)}<div class="legend">
      <div><span class="k" style="background:var(--red)"></span><b>${esc(t("primary"))}</b><div>${esc(l.p.map(mN).join(", "))}</div></div>
      ${l.s.length?`<div><span class="k" style="background:var(--red);opacity:.45"></span><b>${esc(t("secondary"))}</b><div>${esc(l.s.map(mN).join(", "))}</div></div>`:""}
      <div class="muted" style="grid-column:1/-1">${esc(t("rest",fmtSec(REST[l.id]||90)))}</div></div></div>`;
  }
  html+=`<h3>${esc(t("yourProgress"))}</h3>${progressBlock(k,u)}`;
  if(l) html+=`<h3>${esc(t("howTo"))}</h3><p>${esc(l.d[L()])}</p>
      <h3>${esc(t("avoid"))}</h3><ul class="avoid">${l.a[L()].map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
  const inW=w&&(w.exercises||[]).some(e=>keyOf(e)===k);
  html+=`<div style="margin-top:18px">${inW?`<div class="muted small">${esc(t("alreadyIn"))}</div>`:`<button class="btn btn-ink btn-block" data-act="pick-ex" data-k="${esc(l?k:"c:"+title)}">${esc(w?t("addToW"):t("startWith"))}</button>`}</div></div>`;
  $("#shBody").innerHTML=html;
}
let plateBar=null, plateKg=60;
function plateMath(total,bar){ let side=(total-bar)/2; const out=[]; if(side<0) return {out,rest:side}; PLATES[U()].forEach(([p])=>{ while(side>=p-1e-9){ out.push(p); side=Math.round((side-p)*100)/100; } }); return {out,rest:side}; }
function renderPlates(){
  const un=U(); if(plateBar==null||!BARS[un].includes(plateBar)) plateBar=BARS[un][0];
  const {out,rest}=plateMath(plateKg,plateBar);
  const pc=Object.fromEntries(PLATES[un].map(p=>[p[0],p]));
  let x=150, svg="";
  out.forEach(p=>{ const [,c,h]=pc[p]; const wdt=h>=80?14:h>=50?10:7; svg+=`<rect x="${x}" y="${60-h/2}" width="${wdt}" height="${h}" rx="2" fill="${c}" stroke="rgba(0,0,0,.3)"/>`; x+=wdt+2; });
  const bars=`<rect x="10" y="56" width="${Math.max(x+20,200)-10}" height="8" rx="3" fill="#9AA0AA"/><rect x="132" y="48" width="14" height="24" rx="2" fill="#7C8492"/>`;
  const exact=plateKg-Math.max(0,rest)*2;
  $("#shBody").innerHTML=`
    <label class="small muted" for="plKg">${esc(t("totalW",un))}</label>
    <input class="fld" id="plKg" inputmode="decimal" autocomplete="off" value="${esc(fmtN(plateKg))}" style="margin:4px 0 12px">
    <div class="small muted" style="margin-bottom:4px">${esc(t("bar"))}</div>
    <div class="seg">${BARS[un].map(b=>`<button data-act="pbar" data-b="${b}" class="${plateBar===b?"on":""}">${b?b+" "+un:esc(t("noBar"))}</button>`).join("")}</div>
    <div class="barbell"><svg viewBox="0 0 ${Math.max(x+30,220)} 120" aria-hidden="true">${bars}${svg}</svg></div>
    <div aria-live="polite">
    ${plateKg<plateBar?`<p class="muted">${esc(t("lessThanBar"))}</p>`:out.length?`<div class="small muted">${esc(t("perSide"))}</div><div class="platelist">${out.map(p=>`<span style="background:${pc[p][1]};${LIGHT_PLATE.has(p)&&pc[p][1]==="#F3F3EF"?"color:#1B2130;":""}${pc[p][1]==="#C9CCD2"?"color:#1B2130;":""}">${fmtN(p)}</span>`).join("")}</div>`:`<p class="muted">${esc(t("barOnly"))}</p>`}
    ${rest>0.001?`<p class="small" style="margin-top:10px">${esc(t("missing",fmtW(rest*2),fmtW(exact)))}</p>`:""}</div>
    ${sheetArg&&sheetArg.ex!=null?`<button class="btn btn-ink btn-block" data-act="plates-use" style="margin-top:14px">${esc(t("fillEmpty",fmtW(exact)))}</button>`:""}`;
}
function renderPlanForm(w){
  const def=w.planName||t("workoutOf",(fmtDate(w.date).split(",")[0]||""));
  $("#shBody").innerHTML=`<p class="muted small" style="margin-top:0">${esc((w.exercises||[]).filter(e=>valid(e).length||!w.done).map(exLabel).join(", "))}</p>
    <label class="small muted" for="planName">${esc(t("planName"))}</label>
    <input class="fld" id="planName" value="${esc(def)}" style="margin:4px 0 14px" maxlength="40" autocomplete="off">
    <button class="btn btn-ink btn-block" data-act="plan-save" data-id="${esc(w.id)}">${esc(t("savePlan"))}</button>`;
  setTimeout(()=>{const i=$("#planName"); if(i){i.focus();i.select();}},320);
}
const FACT_KG=[180,300,600,1200,3000,6000,12000];
function factFor(vol){ const kg=U()==="lb"?vol*0.4536:vol; if(kg<150) return null; let bi=0; FACT_KG.forEach((f,i)=>{ if(kg/f>=1) bi=i; }); const n=kg/FACT_KG[bi];
  return esc(t("factPre"))+`<b>${n>=1.95?fmtN(Math.round(n*10)/10)+" ×":esc(t("factSame"))} ${esc(S.facts[L()][bi])}</b>.`; }
function renderSummary(id){
  const w=docs.get(id); if(!w) return closeSheet();
  const dur=w.startedAt&&w.finishedAt&&!w.reopened?w.finishedAt-w.startedAt:0;
  const prs=[];
  (w.exercises||[]).forEach(ex=>{ const k=keyOf(ex), u=typeOf(ex); const b=bestBefore(k,id), br=bestRepsBefore(k,id);
    let top=null; valid(ex).forEach(s=>{ if(u==="s"||!num(s.kg)){ if(br>0&&num(s.reps)>br&&(!top||num(s.reps)>num(top.reps))) top=s; } else { const e=e1rm(num(s.kg),num(s.reps)); if(b>0&&e>b+0.01&&(!top||e>e1rm(num(top.kg),num(top.reps)))) top=s; } });
    if(top) prs.push({name:exLabel(ex),txt:setsTxt([top],u)}); });
  const vol=volOf(w), sets=setsOf(w), f=factFor(vol);
  $("#shBody").innerHTML=`
    <div class="sum-hero"><h2>${esc(prs.length?t("newRecords"):t("goodJob"))}</h2><p>${esc(cap(fmtDate(w.date)))}${w.planName?", "+esc(t("planLab",w.planName)):""}</p></div>
    <div class="sum-kpis">
      <div><b data-count="${dur?Math.round(dur/60000):0}">0</b><span>${esc(dur?t("minutes"):t("unknownTime"))}</span></div>
      <div><b data-count="${Math.round(vol)}">0</b><span>${esc(t("volLab",U()))}</span></div>
      <div><b data-count="${sets}">0</b><span>${esc(t("setsLab"))}</span></div></div>
    ${f?`<div class="fact">${f}</div>`:""}
    ${prs.length?`<div class="panel prlist"><div class="h2">${esc(t("records"))}</div>${prs.map((p,i)=>`<div class="r" style="animation-delay:${200+i*90}ms"><span>${esc(p.name)}</span><b>${esc(p.txt)}</b></div>`).join("")}</div>`:""}
    <div class="panel"><div class="h2">${esc(t("muscles"))}</div>${loadBlock(muscleLoad([w]),"")}</div>
    ${w.planId&&docs.get(w.planId)?"":`<button class="btn btn-line btn-block" data-act="plan-from" data-id="${esc(id)}" style="margin-bottom:10px">${esc(t("saveAsPlan"))}</button>`}
    <button class="btn btn-ink btn-block" data-act="sheet-close">${esc(t("done"))}</button>`;
  countUp(); if(prs.length) setTimeout(confetti,250);
}
function countUp(){
  document.querySelectorAll("[data-count]").forEach(el=>{ const to=+el.dataset.count; if(reduced()){el.textContent=to.toLocaleString(LOC());return;}
    const t0=performance.now(), D=900; const step=tm=>{ const p=Math.min(1,(tm-t0)/D), e=1-Math.pow(1-p,3); el.textContent=Math.round(to*e).toLocaleString(LOC()); if(p<1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
}
function confetti(){
  if(reduced()) return;
  const c=$("#fx"), ctx=c.getContext("2d"); const W=c.width=innerWidth, H=c.height=innerHeight;
  const cols=["#D23A2E","#1F5FC4","#E9B713","#2F9A57","#8A919E"];
  const Pt=Array.from({length:90},()=>({x:W/2+(Math.random()-.5)*60,y:H*.32,vx:(Math.random()-.5)*11,vy:-Math.random()*11-4,r:Math.random()*Math.PI,vr:(Math.random()-.5)*.3,w:6+Math.random()*6,h:3+Math.random()*4,c:cols[Math.floor(Math.random()*cols.length)]}));
  const t0=performance.now();
  const step=tm=>{ ctx.clearRect(0,0,W,H); Pt.forEach(p=>{p.vy+=.32;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});
    if(tm-t0<2200) requestAnimationFrame(step); else ctx.clearRect(0,0,W,H); };
  requestAnimationFrame(step); buzz([30,40,30]);
}

/* ---------- settings, export, import ---------- */
function counts(m){ let w=0,p=0; m.forEach((d,k)=>{ if(k==="settings") return; if(d.kind==="plan") p++; else w++; }); return {w,p}; }
function exportJson(){ const o={}; docs.forEach((v,k)=>o[k]=v); return JSON.stringify({app:"gym-tracker-muscle-map",version:1,exportedAt:new Date().toISOString(),docs:o},null,1); }
function renderSettings(){
  const st=settings(); const c=counts(docs);
  let h="";
  if(setView==="export"){
    h=`<p class="muted small" style="margin-top:0">${esc(t("expHint"))}</p>
      <textarea class="io" id="ioOut" readonly aria-label="JSON">${esc(exportJson())}</textarea>
      <div class="dbtns"><button class="btn btn-ink btn-sm" data-act="exp-dl">${esc(t("download"))}</button><button class="btn btn-line btn-sm" data-act="exp-copy">${esc(t("copyText"))}</button></div>
      <button class="link" data-act="set-back">← ${esc(t("settings"))}</button>`;
  } else if(setView==="import"){
    h=`<p class="muted small" style="margin-top:0">${esc(t("impHint"))}</p>
      <label class="btn btn-line btn-sm" for="impFile" style="cursor:pointer">${esc(t("chooseFile"))}</label>
      <input type="file" id="impFile" accept="application/json,.json" class="hide">
      <textarea class="io" id="ioIn" aria-label="${esc(t("impPh"))}" placeholder="${esc(t("impPh"))}"></textarea>
      <button class="btn btn-line btn-sm" data-act="imp-check">${esc(t("impCheck"))}</button>
      <div id="impRes" aria-live="polite" style="margin-top:12px"></div>
      <p><button class="link" data-act="set-back">← ${esc(t("settings"))}</button></p>`;
  } else {
    h=`<section class="set-grp"><h3>${esc(t("sGeneral"))}</h3>
      <div class="set-row"><div class="lb">${esc(t("sLang"))}</div><div class="seg" role="group" aria-label="${esc(t("sLang"))}"><button data-act="lang" data-v="en" class="${lang==="en"?"on":""}" lang="en">English</button><button data-act="lang" data-v="pl" class="${lang==="pl"?"on":""}" lang="pl">Polski</button></div></div>
      <div class="set-row"><div class="lb">${esc(t("sUnit"))}</div><div class="seg" role="group" aria-label="${esc(t("sUnit"))}"><button data-act="unit" data-v="kg" class="${U()==="kg"?"on":""}">kg</button><button data-act="unit" data-v="lb" class="${U()==="lb"?"on":""}">lb</button></div></div>
      <div class="set-row"><div class="lb">${esc(t("sSound"))}</div><button class="tgl" role="switch" aria-checked="${st.sound!==false}" aria-label="${esc(t("sSound"))}" data-act="tgl" data-k="sound"></button></div>
      <div class="set-row"><div class="lb">${esc(t("sWake"))}</div><button class="tgl" role="switch" aria-checked="${st.wake!==false}" aria-label="${esc(t("sWake"))}" data-act="tgl" data-k="wake"></button></div>
    </section>
    <section class="set-grp"><h3>${esc(t("sData"))}</h3>
      <p class="muted small" style="margin:0 0 6px">${esc(t("sDataHint"))}</p>
      <p class="small" style="margin:0 0 12px"><b>${esc(t("sStats",plural(c.w,"workout"),plural(c.p,"plan")))}</b></p>
      <div class="dbtns">
        <button class="btn btn-line btn-sm" data-act="set-open-export">${esc(t("sExport"))}</button>
        <button class="btn btn-line btn-sm" data-act="set-open-import">${esc(t("sImport"))}</button>
        ${hasSample()?`<button class="btn btn-line btn-sm wide" data-act="sample-del">${esc(t("sSampleDel"))}</button>`:`<button class="btn btn-line btn-sm wide" data-act="sample-load">${esc(t("sSample"))}</button>`}
        <button class="btn btn-line btn-sm danger wide" data-act="wipe">${esc(t("sWipe"))}</button>
      </div>
      ${wipeAsk?`<div class="confirmbox" role="alert">${esc(t("sWipeQ"))}<div class="rowbtns"><button class="btn btn-line btn-sm" data-act="wipe-no">${esc(t("cancel"))}</button><button class="btn btn-sm danger" data-act="wipe-yes">${esc(t("sWipeYes"))}</button></div></div>`:""}
    </section>
    <section class="set-grp about"><h3 style="color:var(--ink)">${esc(t("sAbout"))}</h3><p>${esc(t("about1"))}</p><p>${esc(t("about2"))}</p></section>`;
  }
  $("#shTitle").textContent=setView==="export"?t("expTitle"):setView==="import"?t("impTitle"):t("settings");
  $("#shBody").innerHTML=h;
  const f=$("#impFile");
  if(f) f.addEventListener("change",()=>{ const file=f.files&&f.files[0]; if(!file) return; if(file.size>5e6){ showImp(null); return; } const r=new FileReader(); r.onload=()=>{ $("#ioIn").value=String(r.result||""); checkImport(); }; r.readAsText(file); });
}
function showImp(m){
  const box=$("#impRes"); if(!box) return;
  if(!m||!m.size){ impData=null; box.innerHTML=`<div class="confirmbox">${esc(t("impBad"))}</div>`; return; }
  impData=m; const c=counts(m);
  box.innerHTML=`<p class="small" style="margin:0 0 10px"><b>${esc(t("impFound",plural(c.w,"workout"),plural(c.p,"plan")))}</b></p>
    <div class="dbtns"><button class="btn btn-ink btn-sm" data-act="imp-merge">${esc(t("impMerge"))}</button><button class="btn btn-sm danger" data-act="imp-replace">${esc(t("impReplace"))}</button></div>`;
}
function checkImport(){ const txt=($("#ioIn")||{}).value||""; let m=null; try{ m=readDocs(JSON.parse(txt)); }catch(e){ m=null; } showImp(m); }
function applyImport(replace){
  if(!impData) return; const c=counts(impData);
  if(active()) stopRest();
  if(replace) docs.clear();
  impData.forEach((v,k)=>docs.set(k,v));
  impData=null; persist(); initLang(); applyStatic(); closeSheet(); tab="workout"; render();
  toast(t("impDone",plural(c.w,"workout")));
}
function setLang(v){ lang=v; saveSettings({lang:v}); applyStatic(); render(); if(sheetMode==="settings") renderSettings(); }
function initLang(){ const s=settings().lang; if(s) lang=s; else { let n=""; try{n=(navigator.languages&&navigator.languages[0])||navigator.language||""}catch(e){} lang=/^pl\b/i.test(n)?"pl":"en"; } }

/* ---------- example data (fake, generated relative to today) ---------- */
function rng(seed){ return ()=>{ seed=(seed*1664525+1013904223)%4294967296; return seed/4294967296; }; }
function makeSample(){
  const r=rng(42), lb=U()==="lb", out=new Map(), P_=L();
  const rw=v=>lb?Math.round(v*2.2046/5)*5:v;
  const PL=[
    {id:"pSampleUpper",n:["Upper A","Góra A"],ex:[["bench",4,60,2.5,8],["bbrow",4,55,2.5,8],["ohp",3,37.5,1.25,8],["pulldown",3,50,2.5,10],["lateral",3,16,2,12],["pushdown",3,25,2.5,12]]},
    {id:"pSampleLower",n:["Lower A","Dół A"],ex:[["squat",4,80,2.5,5],["rdl",3,70,2.5,8],["legpress",3,140,5,10],["hipthrust",3,80,5,10],["calfraise",3,60,5,12],["plank",3,45,5,0]]},
    {id:"pSampleFull",n:["Full body B","Całe ciało B"],ex:[["deadlift",3,100,5,5],["inclinedb",3,40,2,10],["pullup",3,0,0,6],["dips",3,0,0,8],["lunge",3,24,2,10],["facepull",3,20,2.5,15],["kneeraise",3,0,0,10]]}];
  const NOTES={pulldown:["Thigh pad on notch 3","Wałki na 3. pozycji"],squat:["Belt from the 3rd set","Pas od 3. serii"],legpress:["Seat on hole 5","Oparcie na 5. otworze"]};
  PL.forEach(p=>out.set(p.id,{kind:"plan",name:p.n[P_],createdAt:Date.now()-60*864e5,usedAt:null,sample:true,exercises:p.ex.map(([id,n])=>({name:nm(LIBBY[id]),lib:id,n}))}));
  const cnt={}; let rot=0;
  for(let back=55;back>=1;back--){
    const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-back); const dow=(d.getDay()+6)%7;
    if(![0,2,4].includes(dow)&&!(dow===5&&r()<.25)) continue;
    if(r()<.1) continue;
    const p=PL[rot%3]; rot++;
    const start=new Date(d); start.setHours(dow===5?10:18,Math.floor(r()*40),0,0);
    const exs=p.ex.map(([id,n,base,inc,reps])=>{
      const i=cnt[id]=(cnt[id]||0)+1; const l=LIBBY[id];
      const sets=[];
      for(let j=0;j<n;j++){
        if(l.unit==="s"){ sets.push({kg:"",reps:String(base+inc*Math.floor(i/2)+(j===n-1?-5:0)),done:true}); continue; }
        if(!base){ const rr=reps+Math.floor(i/3)-(j===n-1&&r()<.5?1:0)-(j>0&&r()<.3?1:0); sets.push({kg:"",reps:String(Math.max(1,rr)),done:true}); continue; }
        const kg=rw(base+inc*Math.floor((i-1)/2)); const miss=j===n-1&&r()<.35?1+Math.floor(r()*2):0;
        sets.push({kg:String(kg),reps:String(reps-miss),done:true});
      }
      const o={name:nm(l),lib:id,sets}; if(NOTES[id]&&i===1) o.note=NOTES[id][P_]; return o;
    });
    const wid="wSample"+ds(d).replace(/-/g,"");
    out.set(wid,{date:ds(d),createdAt:start.getTime(),startedAt:start.getTime(),finishedAt:start.getTime()+(52+Math.floor(r()*20))*60000,done:true,planId:p.id,planName:p.n[P_],sample:true,exercises:exs});
  }
  return out;
}
function loadSample(){ if(active()){ toast(t("sampleBusy")); return; } makeSample().forEach((v,k)=>docs.set(k,v)); saveSettings({seeded:true}); persist(); progEx=null; }
function removeSample(){ [...docs.entries()].forEach(([k,d])=>{ if(d.sample) docs.delete(k); }); saveSettings({seeded:true}); persist(); progEx=null; }

/* ---------- rest timer, sound, screen ---------- */
let restEnd=0,restTotal=90000,restIv=null,restBuzzed=false,actx=null,wakeLock=null,wakeBusy=false;
function primeAudio(){ if(settings().sound===false) return; try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; actx=actx||new AC(); if(actx.state==="suspended") actx.resume(); }catch(e){} }
function beep(){ if(settings().sound===false||!actx) return; try{ [0,.22].forEach(off=>{ const o=actx.createOscillator(), g=actx.createGain(); o.type="sine"; o.frequency.value=880; const t0=actx.currentTime+off; g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.25,t0+.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+.18); o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0+.2); }); }catch(e){} }
function startRest(sec){restTotal=sec*1000;restEnd=Date.now()+restTotal;restBuzzed=false;$("#rest").classList.add("on");$("#rest").classList.remove("end");clearInterval(restIv);restIv=setInterval(tickRest,250);tickRest();}
function tickRest(){const ms=restEnd-Date.now();const s=Math.max(0,Math.ceil(ms/1000));$("#restT").textContent=Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
  const C=119.4; $("#restRing").setAttribute("stroke-dashoffset",(C*(1-Math.max(0,ms)/restTotal)).toFixed(1));
  const end=s===0; $("#rest").classList.toggle("end",end); if(end&&!restBuzzed){restBuzzed=true;buzz([120,80,120]);beep();}
  if(ms<-20000)stopRest();}
function stopRest(){clearInterval(restIv);$("#rest").classList.remove("on","end");}
async function syncWake(){
  const want=settings().wake!==false&&!!active()&&document.visibilityState==="visible";
  if(wakeBusy) return; wakeBusy=true;
  try{
    if(want&&!wakeLock&&navigator.wakeLock){ wakeLock=await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release",()=>{wakeLock=null}); }
    else if(!want&&wakeLock){ await wakeLock.release(); wakeLock=null; }
  }catch(e){ wakeLock=null; }
  wakeBusy=false;
}

/* ---------- actions ---------- */
function newWorkout(exercises,date,extra){
  const id=uid("w"); const d=date||today();
  docs.set(id,Object.assign({date:d,createdAt:Date.now(),startedAt:d===today()?Date.now():null,finishedAt:null,done:false,exercises:exercises||[]},extra||{}));
  queueSave(); return id;
}
function addExercise(k){
  let name,lib=null;
  if(LIBBY[k]){ lib=k; name=nm(LIBBY[k]); } else { name=String(k||"").replace(/^c:/,"").trim().slice(0,80); const l=findLib(name); if(l&&norm(nm(l))===norm(name)){lib=l.id;} }
  if(!name) return;
  let w=active(); if(!w){newWorkout();w=active();}
  const obj=docs.get(w.id);
  const e={name}; if(lib) e.lib=lib;
  const prev=lastPerf(keyOf(e),w.id);
  const n=prev?Math.max(1,prev.sets.length):3;
  e.sets=Array.from({length:n},()=>({kg:"",reps:"",done:false}));
  obj.exercises.push(e);
  fxNew="ex"+(obj.exercises.length-1);
  queueSave(); closeSheet(); tab="workout"; render();
  setTimeout(()=>{const els=document.querySelectorAll(".ex");const el=els[els.length-1];if(el)el.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"center"});},60);
}
const exCopy=e=>({name:e.name,...(e.lib?{lib:e.lib}:{}),...(e.type?{type:e.type}:{})});
function copyFrom(src){ return (src.exercises||[]).filter(e=>valid(e).length).map(e=>({...exCopy(e),sets:valid(e).map(s=>({kg:s.kg??"",reps:s.reps,done:false}))})); }
function blankFrom(exs){ return (exs||[]).map(e=>({...exCopy(e),sets:Array.from({length:Math.max(1,e.n||(e.sets?valid(e).length||e.sets.length:3))},()=>({kg:"",reps:"",done:false}))})); }

document.addEventListener("click",ev=>{
  const tb=ev.target.closest("nav.tabs button");
  if(tb){ if(tab!==tb.dataset.tab) enterAnim=true; tab=tb.dataset.tab;confirmDel=null;render();window.scrollTo(0,0);return;}
  const b=ev.target.closest("[data-act]"); if(!b) return;
  const act=b.dataset.act;
  const w=active(); const wo=w?docs.get(w.id):null;
  const setEl=b.closest(".set");
  const ei=setEl?+setEl.dataset.ex:(b.dataset.ex!=null?+b.dataset.ex:null);
  const si=setEl?+setEl.dataset.set:null;
  if(!["ex-del","discard","h-del","plan-del"].includes(act)) confirmDel=null;
  switch(act){
    case "start": if(!w) newWorkout(); enterAnim=true; render(); openSheet("pick"); break;
    case "repeat":{ const last=sorted().find(x=>x.done); if(!last||w) return; newWorkout(blankFrom(last.exercises.filter(e=>valid(e).length)),null,last.planName?{planId:last.planId,planName:last.planName}:null); enterAnim=true; render(); window.scrollTo(0,0); break;}
    case "plan-start":{ const p=docs.get(b.dataset.id); if(!p) return; if(w){toast(t("finishFirst"));return;}
      newWorkout(blankFrom(p.exercises),null,{planId:b.dataset.id,planName:p.name}); p.usedAt=Date.now(); queueSave(); enterAnim=true; render(); window.scrollTo(0,0); break;}
    case "copy":{ const src=docs.get(b.dataset.id); if(!src) return; if(w){toast(t("finishFirst"));return;}
      newWorkout(copyFrom(src),null,src.planName?{planId:src.planId,planName:src.planName}:null); tab="workout"; enterAnim=true; closeSheet(); render(); window.scrollTo(0,0); toast(t("copied",fmtShort(src.date))); break;}
    case "plan-del":{ const id=b.dataset.id; if(confirmDel==="p"+id){confirmDel=null;removeDoc(id);} else {confirmDel="p"+id;render();} break;}
    case "plan-from":{ const src=docs.get(b.dataset.id); if(!src) return; openSheet("plan",{id:b.dataset.id,...src}); break;}
    case "plan-save":{ const src=docs.get(b.dataset.id); if(!src) return; const name=($("#planName").value||"").trim().slice(0,40)||t("myPlan");
      const pid=uid("p");
      docs.set(pid,{kind:"plan",name,createdAt:Date.now(),usedAt:null,exercises:(src.exercises||[]).filter(e=>valid(e).length||!src.done).map(e=>({...exCopy(e),n:valid(e).length||(e.sets||[]).length||3}))});
      queueSave(); closeSheet(); toast(t("planSaved",name)); render(); break;}
    case "goal-": saveSettings({goal:Math.max(1,(settings().goal||3)-1)}); render(); break;
    case "goal+": saveSettings({goal:Math.min(7,(settings().goal||3)+1)}); render(); break;
    case "ex-add": openSheet("pick"); break;
    case "set-add":{ if(!wo) return; const ex=wo.exercises[ei]; const l=ex.sets[ex.sets.length-1]; ex.sets.push({kg:l?l.kg:"",reps:l?l.reps:"",done:false}); fxNew="s"+ei+"-"+(ex.sets.length-1); queueSave(); render(); break;}
    case "set-del": if(!wo) return; wo.exercises[ei].sets.splice(si,1); queueSave(); render(); break;
    case "done":{
      if(!wo) return; primeAudio();
      const ex=wo.exercises[ei]; const s=ex.sets[si];
      const ik=setEl.querySelector('[data-f="kg"]'), ir=setEl.querySelector('[data-f="reps"]');
      if(!s.done){ const pk=ik?ik.placeholder:"0", pr=ir.placeholder; if(ik&&s.kg===""&&pk!=="0"&&pk!=="—") s.kg=String(num(pk.replace(/\s/g,""))); if(s.reps===""&&pr!=="0") s.reps=pr; }
      if(!s.done&&!num(s.reps)){ toast(typeOf(ex)==="s"?t("needSec"):t("needReps")); if(ir) ir.focus(); return; }
      s.done=!s.done; queueSave();
      if(s.done){
        fxPop="s"+ei+"-"+si; buzz(15);
        const k=keyOf(ex), u=typeOf(ex); const b2=bestBefore(k,w.id), br=bestRepsBefore(k,w.id);
        const others=ex.sets.filter((x,j)=>j!==si&&x.done);
        const isPR=(u==="s"||!num(s.kg))?(br>0&&num(s.reps)>br&&others.every(x=>num(x.reps)<num(s.reps))):(b2>0&&e1rm(num(s.kg),num(s.reps))>b2+0.01&&others.every(x=>e1rm(num(x.kg),num(x.reps))<e1rm(num(s.kg),num(s.reps))));
        if(isPR){ toast(t("newPR",exLabel(ex),setsTxt([s],u)),"gold"); confetti(); }
        const all=wo.exercises.every(e=>(e.sets||[]).every(x=>x.done));
        if(!all) startRest(restFor(ex)); else { stopRest(); if(!isPR) toast(t("allDone")); }
      }
      render(); break;}
    case "qo":{ if(!wo) return; const ex=wo.exercises[ei]; const prev=lastPerf(keyOf(ex),w.id); if(!prev) return; const o=quickOpts(ex,prev).find(x=>x.id===b.dataset.o); if(!o) return;
      const dn=ex.sets.filter(x=>x.done); ex.sets=dn.concat(o.sets.slice(dn.length).map(x=>({kg:x.kg,reps:x.reps,done:false})));
      if(ex.sets.length===dn.length) ex.sets.push(Object.assign({},o.sets[o.sets.length-1],{done:false}));
      ex.qo=o.id; queueSave(); buzz(10); render(); break;}
    case "note": if(!wo) return; wo.exercises[ei].noteOpen=true; render(); setTimeout(()=>{const tx=$("#note-"+ei); if(tx) tx.focus();},30); break;
    case "plates":{ if(!wo) return; const ex=wo.exercises[ei]; const s=ex.sets.find(x=>!x.done&&x.kg!=="")||ex.sets.find(x=>x.kg!=="");
      const ph=lastPerf(keyOf(ex),w.id); plateKg=(s?num(s.kg):(ph?Math.max(...ph.sets.map(x=>num(x.kg))):0))||(U()==="lb"?135:60); openSheet("plates",{ex:ei}); break;}
    case "pbar": plateBar=+b.dataset.b; renderPlates(); break;
    case "plates-use":{ const ex=wo&&wo.exercises[sheetArg.ex]; if(!ex) return; const {rest}=plateMath(plateKg,plateBar); const v=String(Math.round((plateKg-Math.max(0,rest)*2)*100)/100);
      ex.sets.forEach(s=>{ if(!s.done&&s.kg==="") s.kg=v; }); queueSave(); closeSheet(); render(); break;}
    case "ex-type":{ if(!wo) return; const ex=wo.exercises[ei]; ex.type=typeOf(ex)==="s"?"w":"t"; if(ex.type==="t") ex.sets.forEach(x=>x.kg=""); queueSave(); render(); break;}
    case "ex-del": if(!wo) return; if(confirmDel==="ex"+ei){wo.exercises.splice(ei,1);confirmDel=null;queueSave();} else confirmDel="ex"+ei; render(); break;
    case "discard": if(!w) return; if(confirmDel==="discard"){confirmDel=null;stopRest();removeDoc(w.id);} else {confirmDel="discard";render();} break;
    case "finish":{
      if(!wo) return;
      wo.exercises=wo.exercises.map(e=>{ const {noteOpen,qo,...rest}=e; return {...rest,sets:e.sets.filter(s=>num(s.reps)>0)}; }).filter(e=>e.sets.length);
      if(!wo.exercises.length){toast(t("needOne"));render();return;}
      wo.done=true; if(!wo.reopened) wo.finishedAt=Date.now(); persist(); stopRest(); calSel=wo.date; render(); window.scrollTo(0,0); openSheet("summary",w.id); break;}
    case "day": calSel=b.dataset.d; render(); break;
    case "cal-prev": calMonth=new Date(calMonth.getFullYear(),calMonth.getMonth()-1,1); enterAnim=true; render(); break;
    case "cal-next": calMonth=new Date(calMonth.getFullYear(),calMonth.getMonth()+1,1); enterAnim=true; render(); break;
    case "add-day": if(w){toast(t("finishFirst"));return;} newWorkout([],calSel); tab="workout"; enterAnim=true; render(); openSheet("pick"); break;
    case "h-del":{const id=b.dataset.id; if(confirmDel==="h"+id){confirmDel=null;removeDoc(id);} else {confirmDel="h"+id;render();} break;}
    case "h-edit":{ const id=b.dataset.id; if(w){toast(t("finishFirst"));return;} const d=docs.get(id); if(!d) return; d.done=false; d.reopened=true; queueSave(); tab="workout"; enterAnim=true; render(); window.scrollTo(0,0); break;}
    case "pick": progEx=b.dataset.k; render(); if(b.closest(".rows")) window.scrollTo({top:0,behavior:reduced()?"auto":"smooth"}); break;
    case "metric": progMetric=b.dataset.m; render(); break;
    case "days": progDays=+b.dataset.d; render(); break;
    case "lf": libFilter=b.dataset.m||null; render(); break;
    case "info": openSheet("info",{k:b.dataset.k,name:b.dataset.name}); break;
    case "plates-free": plateKg=U()==="lb"?135:60; openSheet("plates",{ex:null}); break;
    case "go-lib": tab="library"; enterAnim=true; render(); window.scrollTo(0,0); break;
    case "imetric": infoMetric=b.dataset.m; { const st=$("#shBody").scrollTop; renderInfo(sheetArg.k,sheetArg.name); $("#shBody").scrollTop=st; } break;
    case "mapmode": mapMode=b.dataset.m; render(); break;
    case "sheet-close": closeSheet(); break;
    case "rest-add": restEnd+=30000; restTotal+=30000; restBuzzed=false; tickRest(); break;
    case "rest-sub": restEnd-=15000; tickRest(); break;
    case "rest-stop": stopRest(); break;
    case "pick-ex": addExercise(b.dataset.k); break;
    /* settings */
    case "open-settings": openSheet("settings"); break;
    case "lang": setLang(b.dataset.v); break;
    case "unit": saveSettings({unit:b.dataset.v}); plateBar=null; render(); renderSettings(); break;
    case "tgl":{ const k=b.dataset.k; saveSettings({[k]:settings()[k]===false}); if(k==="sound"&&settings().sound) primeAudio(); renderSettings(); syncWake(); break;}
    case "set-open-export": if(sheetMode!=="settings") openSheet("settings",{view:"export"}); else { setView="export"; renderSettings(); } break;
    case "set-open-import": setView="import"; renderSettings(); break;
    case "set-back": setView="main"; renderSettings(); break;
    case "exp-copy":{ const ta=$("#ioOut"); const txt=ta.value; const fail=()=>{ ta.focus(); ta.select(); toast(t("copyFail")); };
      try{ navigator.clipboard.writeText(txt).then(()=>toast(t("copiedT")),fail); }catch(e){ fail(); } break;}
    case "exp-dl":{ try{ const blob=new Blob([exportJson()],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="gym-tracker-"+today()+".json"; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500); }catch(e){ toast(t("dlHint")); } break;}
    case "imp-check": checkImport(); break;
    case "imp-merge": applyImport(false); break;
    case "imp-replace": applyImport(true); break;
    case "sample-load": loadSample(); if(!active()){ closeSheet(); tab="workout"; enterAnim=true; render(); window.scrollTo(0,0); toast(t("sampleLoaded")); } break;
    case "sample-del": removeSample(); render(); if(sheetMode==="settings") renderSettings(); toast(t("sampleGone")); break;
    case "wipe": wipeAsk=true; renderSettings(); break;
    case "wipe-no": wipeAsk=false; renderSettings(); break;
    case "wipe-yes":{ const keep={lang,seeded:true}; docs.clear(); saveSettings(keep); stopRest(); persist(); wipeAsk=false; closeSheet(); tab="workout"; render(); toast(t("wiped")); break;}
  }
});
document.addEventListener("toggle",ev=>{const d=ev.target; if(d.dataset&&d.dataset.fold){try{sessionStorage.setItem(d.dataset.fold,d.open?"1":"0")}catch(e){}}},true);
document.addEventListener("input",ev=>{
  const el=ev.target;
  if(el.id==="exSearch"){renderPick();return;}
  if(el.id==="libSearch"){libQuery=el.value; const used=usedKeys(); renderLibraryList(used); return;}
  if(el.id==="plKg"){ plateKg=num(el.value); const pos=el.selectionStart; renderPlates(); const n=$("#plKg"); n.focus(); try{n.setSelectionRange(pos,pos)}catch(e){} return; }
  const f=el.dataset.f; if(!f) return;
  const w=active(); if(!w) return; const wo=docs.get(w.id);
  if(f==="date"){ if(el.value&&/^\d{4}-\d{2}-\d{2}$/.test(el.value)){wo.date=el.value;queueSave();$("#title").textContent=cap(fmtDate(wo.date));} return; }
  if(f==="kg"){ const sm=el.parentElement.querySelector(".ph"); if(sm) sm.textContent=perHand(el.value); }
  if(f==="note"){ wo.exercises[+el.dataset.ex].note=el.value.slice(0,500); queueSave(); return; }
  const setEl=el.closest(".set"); if(!setEl) return;
  wo.exercises[+setEl.dataset.ex].sets[+setEl.dataset.set][f]=el.value.replace(",",".").slice(0,8); queueSave();
});
function renderLibraryList(used){
  const q=norm(libQuery);
  let items=LIB.map(e=>({k:e.id,name:nm(e),alt:e.n[1-L()],find:e.n[1-L()]+" "+e.al.join(" "),p:e.p,s:e.s}));
  used.forEach((v,k)=>{ if(k.startsWith("c:")) items.push({k,name:v.name,alt:t("custom"),find:"",p:[],s:[]}); });
  items=items.filter(e=>(!q||norm(e.name+" "+e.find).includes(q))&&(!libFilter||e.p.includes(libFilter)||e.s.includes(libFilter)));
  items.sort((a,b)=>(used.has(b.k)-used.has(a.k))||a.name.localeCompare(b.name,LOC()));
  const box=$("#libList"); if(box) box.innerHTML=libItems(items,used);
}
document.addEventListener("keydown",ev=>{
  if(ev.key==="Escape"&&sheetMode){ closeSheet(); return; }
  if(ev.key==="Tab"&&sheetMode){ /* keep focus inside the open sheet */
    const f=[...$("#sheet").querySelectorAll("button,input,textarea,select,label[for],[tabindex]:not([tabindex='-1'])")].filter(x=>!x.disabled&&x.offsetParent!==null);
    if(f.length){ const a=f[0], z=f[f.length-1]; if(ev.shiftKey&&document.activeElement===a){ev.preventDefault();z.focus();} else if(!ev.shiftKey&&document.activeElement===z){ev.preventDefault();a.focus();} else if(!$("#sheet").contains(document.activeElement)){ev.preventDefault();a.focus();} }
  }
  if(ev.key==="Enter"&&ev.target.id==="exSearch"){ const v=ev.target.value.trim(); if(v){ const l=findLib(v); addExercise(l&&norm(nm(l)).includes(norm(v))?l.id:"c:"+v);} }
  if(ev.key==="Enter"&&ev.target.id==="planName"){ const bt=document.querySelector('[data-act="plan-save"]'); if(bt) bt.click(); }
  if(ev.key==="Enter"&&ev.target.dataset&&ev.target.dataset.f==="kg"){ ev.preventDefault(); const r=ev.target.closest(".set").querySelector('[data-f="reps"]'); r.focus(); }
});
document.addEventListener("focusout",ev=>{ if(ev.target.closest&&(ev.target.closest(".set")||ev.target.classList.contains("note"))) setTimeout(()=>{const ae=document.activeElement;if(!(ae&&(ae.tagName==="INPUT"||ae.tagName==="TEXTAREA")))render();},120); });
$("#sheetBg").addEventListener("click",closeSheet);

let toastT;
function toast(m,kind){const tt=$("#toast");tt.textContent=m;tt.classList.toggle("gold",kind==="gold");tt.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>tt.classList.remove("on"),2800);}

/* ---------- start ---------- */
load(); initLang();
if(!settings().seeded&&![...docs.keys()].some(k=>k!=="settings")){ makeSample().forEach((v,k)=>docs.set(k,v)); saveSettings({seeded:true}); persist(); }
applyStatic(); render();
})();
