"use client";import {useEffect,useRef,useState,type CSSProperties} from "react";
type Kind="share"|"close"|"whatsapp"|"facebook"|"x"|"linkedin"|"telegram"|"mail"|"link";
type Option={kind:Kind;label:string;href:string;tone:string;blank:boolean};
const ICONS:Record<Kind,string[]>={
share:["M12 15V3","M8 7l4-4 4 4","M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"],
close:["M6 6 18 18","M18 6 6 18"],
whatsapp:["M20.6 11.7a8.6 8.6 0 0 1-12.8 7.5L3.4 20.6l1.5-4.2A8.6 8.6 0 1 1 20.6 11.7Z","M8.9 7.9h1.3l1 2.3-.9.9a5.4 5.4 0 0 0 3.6 3.6l.9-.9 2.3 1v1.3a1 1 0 0 1-1.1 1 7.7 7.7 0 0 1-8.1-8.1 1 1 0 0 1 1-1.1Z"],
facebook:["M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z","M14.4 8.6h-1.2c-.9 0-1.4.5-1.4 1.5v1.3h2.4l-.3 2.2h-2.1v5.2","M9.9 11.4h4.4"],
x:["M5 4.4 19 19.6","M19 4.4 5 19.6"],
linkedin:["M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","M8.3 10.3V17","M8.3 7.1h.01","M12.3 17v-6.7","M12.3 13.1a2.4 2.4 0 0 1 4.8 0V17"],
telegram:["M21.4 4.3 2.9 11.3a.45.45 0 0 0 .05.84l4.4 1.4 1.7 4.7a.45.45 0 0 0 .79.12l2.2-2.6 4.3 3.1a.45.45 0 0 0 .71-.28l2.9-13.6a.45.45 0 0 0-.6-.5Z","M7.4 13.5 21.4 4.3","M7.4 13.5l1.7 4.7"],
mail:["M3.5 5.8h17v12.4h-17z","M4 6.4 12 12.5l8-6.1"],
link:["M10.6 13.4a3.6 3.6 0 0 0 5.1 0l2.3-2.3a3.6 3.6 0 0 0-5.1-5.1l-1 1","M13.4 10.6a3.6 3.6 0 0 0-5.1 0l-2.3 2.3a3.6 3.6 0 0 0 5.1 5.1l1-1"]};
const BRAND="UKWELISASA.DRC.CD";
const Icon=({kind,size=20}:{kind:Kind;size?:number})=><svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">{ICONS[kind].map((d,i)=><path key={i} d={d}/>)}</svg>;
const FULL:CSSProperties={display:"inline-flex",alignItems:"center",justifyContent:"center",gap:".5rem",color:"#fff"};
const SMALL:CSSProperties={display:"inline-flex",alignItems:"center",gap:".35rem",background:"var(--red,#c51d2e)",borderColor:"var(--red,#c51d2e)",color:"#fff",fontSize:".75rem",fontWeight:700,padding:".32rem .6rem"};
const OPTION:CSSProperties={display:"flex",alignItems:"center",gap:".5rem",minHeight:46,padding:".5rem .65rem",border:"1px solid var(--line,#dce2e7)",borderRadius:9,background:"#fff",color:"var(--ink,#101820)",font:"inherit",fontSize:".82rem",fontWeight:600,textDecoration:"none",cursor:"pointer",textAlign:"left",width:"100%"};
const CLOSE:CSSProperties={display:"grid",placeItems:"center",width:34,height:34,flex:"0 0 auto",border:"1px solid var(--line,#dce2e7)",borderRadius:999,background:"#fff",color:"var(--ink,#101820)",cursor:"pointer",padding:0};
export function ShareButtons({url,title,variant="full"}:{url:string;title:string;variant?:"full"|"compact"}){
const compact=variant==="compact";
const[open,setOpen]=useState(false);
const[shown,setShown]=useState(false);
const[note,setNote]=useState("");
const[mobile,setMobile]=useState(false);
const[reduce,setReduce]=useState(false);
const trigger=useRef<HTMLButtonElement|null>(null);
const closer=useRef<HTMLButtonElement|null>(null);
const exit=useRef<ReturnType<typeof setTimeout>|null>(null);
const toast=useRef<ReturnType<typeof setTimeout>|null>(null);
useEffect(()=>{
const small=window.matchMedia("(max-width: 640px)"),calm=window.matchMedia("(prefers-reduced-motion: reduce)");
const sync=()=>{setMobile(small.matches);setReduce(calm.matches)};
sync();
small.addEventListener("change",sync);
calm.addEventListener("change",sync);
return ()=>{small.removeEventListener("change",sync);calm.removeEventListener("change",sync)};
},[]);
useEffect(()=>()=>{if(exit.current)clearTimeout(exit.current);if(toast.current)clearTimeout(toast.current)},[]);
useEffect(()=>{
if(!open)return;
const previous=document.body.style.overflow;
document.body.style.overflow="hidden";
closer.current?.focus();
const frame=window.requestAnimationFrame(()=>setShown(true));
const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();dismiss()}};
document.addEventListener("keydown",onKey);
return ()=>{
window.cancelAnimationFrame(frame);
document.removeEventListener("keydown",onKey);
document.body.style.overflow=previous;
};
},[open]);
function dismiss(){
setShown(false);
if(exit.current)clearTimeout(exit.current);
exit.current=setTimeout(()=>{setOpen(false);exit.current=null},window.matchMedia("(prefers-reduced-motion: reduce)").matches?0:200);
if(trigger.current)trigger.current.focus();
}
function openSheet(){
if(exit.current){clearTimeout(exit.current);exit.current=null}
setShown(false);
setOpen(true);
}
function flash(text:string){
setNote(text);
if(toast.current)clearTimeout(toast.current);
toast.current=setTimeout(()=>{setNote("");toast.current=null},2500);
}
async function share(){
const text=`${title} — ${BRAND}`;
const nav=navigator as Navigator&{share?:(data:{title:string;text:string;url:string})=>Promise<void>};
if(typeof nav.share==="function"){
try{await nav.share({title,text,url});return}
catch(error){if((error as {name?:string}|null)?.name==="AbortError")return}
}
openSheet();
}
async function copy(){
let done=false;
try{
if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);done=true}
else{
const area=document.createElement("textarea");
area.value=url;
area.setAttribute("readonly","");
area.style.position="fixed";
area.style.top="-1000px";
area.style.opacity="0";
document.body.appendChild(area);
area.select();
area.setSelectionRange(0,area.value.length);
done=document.execCommand("copy");
document.body.removeChild(area);
}
}catch{done=false}
flash(done?"Lien copié":"Copie impossible");
dismiss();
}
const options:Option[]=[
{kind:"whatsapp",label:"WhatsApp",tone:"#128C7E",blank:true,href:`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`},
{kind:"facebook",label:"Facebook",tone:"#1877F2",blank:true,href:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`},
{kind:"x",label:"X",tone:"#0F172A",blank:true,href:`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`},
{kind:"linkedin",label:"LinkedIn",tone:"#0A66C2",blank:true,href:`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`},
{kind:"telegram",label:"Telegram",tone:"#229ED9",blank:true,href:`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`},
{kind:"mail",label:"E-mail",tone:"var(--red,#c51d2e)",blank:false,href:`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}];
return <div style={{position:"relative",display:"inline-flex"}}>
<button ref={trigger} type="button" className={compact?"pill action":"button"} aria-haspopup="dialog" aria-expanded={open} onClick={event=>{event.preventDefault();void share()}} style={compact?SMALL:FULL}>
<Icon kind="share" size={compact?15:18}/>{compact?"Partager":"PARTAGER"}
</button>
{open&&<div onClick={event=>{if(event.target===event.currentTarget)dismiss()}} style={{position:"fixed",inset:0,zIndex:900,display:"flex",justifyContent:"center",alignItems:mobile?"flex-end":"center",padding:mobile?0:"1.25rem",background:"rgba(4,16,26,.62)",opacity:shown?1:0,transition:reduce?"none":"opacity .18s ease"}}>
<div role="dialog" aria-modal="true" aria-label="Partager cet article" style={{width:"100%",maxWidth:mobile?"none":540,maxHeight:mobile?"88vh":"86vh",overflowY:"auto",background:"#fff",color:"var(--ink,#101820)",borderRadius:mobile?"18px 18px 0 0":14,padding:mobile?"1.1rem 1.1rem 1.5rem":"1.15rem 1.3rem 1.4rem",boxShadow:mobile?"0 -20px 50px rgba(2,6,23,.35)":"0 24px 60px rgba(2,6,23,.35)",opacity:shown?1:0,transform:shown?"none":mobile?"translateY(100%)":"translateY(14px)",transition:reduce?"none":"transform .22s ease, opacity .22s ease"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:".75rem",marginBottom:".85rem"}}>
<strong style={{fontSize:".8rem",fontWeight:800,letterSpacing:".08em",textTransform:"uppercase"}}>PARTAGER CET ARTICLE</strong>
<button ref={closer} type="button" aria-label="Fermer" onClick={event=>{event.preventDefault();dismiss()}} style={CLOSE}><Icon kind="close" size={17}/></button>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:".5rem"}}>
{options.map(option=><a key={option.kind} href={option.href} target={option.blank?"_blank":undefined} rel={option.blank?"noopener noreferrer":undefined} onClick={()=>dismiss()} style={OPTION}><span style={{display:"inline-flex",color:option.tone}}><Icon kind={option.kind} size={18}/></span>{option.label}</a>)}
<button type="button" onClick={event=>{event.preventDefault();void copy()}} style={{...OPTION,borderColor:"#f0c9cd",background:"#fff6f7",color:"var(--red,#c51d2e)",fontWeight:700}}><Icon kind="link" size={18}/>Copier le lien</button>
</div>
</div>
</div>}
{note&&<div role="status" aria-live="polite" style={{position:"fixed",left:"50%",bottom:"1.4rem",transform:"translateX(-50%)",zIndex:1000,background:"#102a43",color:"#fff",padding:".55rem 1rem",borderRadius:999,fontSize:".78rem",fontWeight:700,boxShadow:"0 10px 30px rgba(2,6,23,.35)",pointerEvents:"none"}}>{note}</div>}
</div>;
}
