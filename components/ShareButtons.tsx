"use client";import {useEffect,useRef,useState,type CSSProperties} from "react";
import type {IconType} from "react-icons";
import {FaCheck,FaEnvelope,FaFacebookF,FaLinkedinIn,FaLink,FaShareNodes,FaTelegram,FaWhatsapp,FaXmark,FaXTwitter} from "react-icons/fa6";
const BRAND="UKWELISASA.DRC.CD";
const CARD=["whatsapp","facebook","x","telegram","linkedin","mail"]as const;
const SHEET=["whatsapp","facebook","x","linkedin","telegram","mail"]as const;
type NetId=(typeof CARD)[number];
type NetLink={label:string;aria:string;tone:string;href:string;blank:boolean;Icon:IconType};
function buildLinks(url:string,title:string):Record<NetId,NetLink>{
const u=encodeURIComponent(url),t=encodeURIComponent(title);
return{
whatsapp:{label:"WhatsApp",aria:"Partager sur WhatsApp",tone:"#25D366",blank:true,href:`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,Icon:FaWhatsapp},
facebook:{label:"Facebook",aria:"Partager sur Facebook",tone:"#1877F2",blank:true,href:`https://www.facebook.com/sharer/sharer.php?u=${u}`,Icon:FaFacebookF},
x:{label:"X",aria:"Partager sur X",tone:"#0F1419",blank:true,href:`https://twitter.com/intent/tweet?url=${u}&text=${t}`,Icon:FaXTwitter},
telegram:{label:"Telegram",aria:"Partager sur Telegram",tone:"#229ED9",blank:true,href:`https://t.me/share/url?url=${u}&text=${t}`,Icon:FaTelegram},
linkedin:{label:"LinkedIn",aria:"Partager sur LinkedIn",tone:"#0A66C2",blank:true,href:`https://www.linkedin.com/sharing/share-offsite/?url=${u}`,Icon:FaLinkedinIn},
mail:{label:"E-mail",aria:"Partager par e-mail",tone:"#4B5563",blank:false,href:`mailto:?subject=${t}&body=${u}`,Icon:FaEnvelope}
};
}
async function writeClipboard(text:string){
if(navigator.clipboard&&window.isSecureContext){
try{await navigator.clipboard.writeText(text);return true}catch{return false}
}
try{
const area=document.createElement("textarea");
area.value=text;
area.setAttribute("readonly","");
area.style.position="fixed";
area.style.top="-1000px";
area.style.opacity="0";
document.body.appendChild(area);
area.select();
area.setSelectionRange(0,area.value.length);
const done=document.execCommand("copy");
document.body.removeChild(area);
return done;
}catch{return false}
}
const SMALL:CSSProperties={display:"inline-flex",alignItems:"center",gap:".35rem",background:"var(--red,#c51d2e)",borderColor:"var(--red,#c51d2e)",color:"#fff",fontSize:".75rem",fontWeight:700,padding:".32rem .6rem"};
const OPTION:CSSProperties={display:"flex",alignItems:"center",gap:".5rem",minHeight:46,padding:".5rem .65rem",border:"1px solid var(--line,#dce2e7)",borderRadius:9,background:"#fff",color:"var(--ink,#101820)",font:"inherit",fontSize:".82rem",fontWeight:600,textDecoration:"none",cursor:"pointer",textAlign:"left",width:"100%"};
const CLOSE:CSSProperties={display:"grid",placeItems:"center",width:34,height:34,flex:"0 0 auto",border:"1px solid var(--line,#dce2e7)",borderRadius:999,background:"#fff",color:"var(--ink,#101820)",cursor:"pointer",padding:0};
export function ShareButtons({url,title,variant="full"}:{url:string;title:string;variant?:"full"|"compact"}){
const compact=variant==="compact";
const links=buildLinks(url,title);
const[open,setOpen]=useState(false);
const[shown,setShown]=useState(false);
const[note,setNote]=useState("");
const[mobile,setMobile]=useState(false);
const[reduce,setReduce]=useState(false);
const[native,setNative]=useState(false);
const[copied,setCopied]=useState<"idle"|"done"|"fail">("idle");
const trigger=useRef<HTMLButtonElement|null>(null);
const closer=useRef<HTMLButtonElement|null>(null);
const exit=useRef<ReturnType<typeof setTimeout>|null>(null);
const toast=useRef<ReturnType<typeof setTimeout>|null>(null);
const revert=useRef<ReturnType<typeof setTimeout>|null>(null);
useEffect(()=>{setNative(typeof navigator!=="undefined"&&typeof (navigator as {share?:unknown}).share==="function")},[]);
useEffect(()=>{
if(!compact)return;
const small=window.matchMedia("(max-width: 640px)"),calm=window.matchMedia("(prefers-reduced-motion: reduce)");
const sync=()=>{setMobile(small.matches);setReduce(calm.matches)};
sync();
small.addEventListener("change",sync);
calm.addEventListener("change",sync);
return ()=>{small.removeEventListener("change",sync);calm.removeEventListener("change",sync)};
},[compact]);
useEffect(()=>()=>{if(exit.current)clearTimeout(exit.current);if(toast.current)clearTimeout(toast.current);if(revert.current)clearTimeout(revert.current)},[]);
useEffect(()=>{
if(!open||!compact)return;
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
},[open,compact]);
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
const nav=navigator as Navigator&{share?:(data:{title:string;text:string;url:string})=>Promise<void>};
if(typeof nav.share==="function"){
try{await nav.share({title,text:`${title} — ${BRAND}`,url});return}
catch(error){if((error as {name?:string}|null)?.name==="AbortError")return}
}
openSheet();
}
async function nativeShare(){
const nav=navigator as Navigator&{share?:(data:{title:string;text:string;url:string})=>Promise<void>};
if(typeof nav.share!=="function")return;
try{await nav.share({title,text:`${title} — ${BRAND}`,url})}
catch(error){if((error as {name?:string}|null)?.name==="AbortError")return}
}
async function copyLink(){
const done=await writeClipboard(url);
setCopied(done?"done":"fail");
if(revert.current)clearTimeout(revert.current);
revert.current=setTimeout(()=>{setCopied("idle");revert.current=null},done?2000:2500);
}
async function copy(){
const done=await writeClipboard(url);
flash(done?"Lien copié":"Copie impossible");
dismiss();
}
if(!compact)return <section className="share-card" aria-label="Partager cet article">
<div className="share-card-head">
<p className="share-card-title">Partager cet article</p>
<div className="share-card-tools">
<button type="button" className={`share-card-copy ${copied}`} aria-label="Copier le lien de l’article" onClick={event=>{event.preventDefault();void copyLink()}}>
{copied==="done"?<FaCheck aria-hidden="true"/>:<FaLink aria-hidden="true"/>}
<span aria-live="polite">{copied==="done"?"Lien copié ✓":copied==="fail"?"Copie impossible":"Copier le lien"}</span>
</button>
{native&&<button type="button" className="share-card-native" aria-label="Partager via une autre application" onClick={event=>{event.preventDefault();void nativeShare()}}>
<FaShareNodes aria-hidden="true"/><span>Partager via…</span>
</button>}
</div>
</div>
<ul className="share-card-networks">
{CARD.map(id=>{const{Icon,href,blank,aria,label,tone}=links[id];return <li key={id}>
<a className="share-net" href={href} target={blank?"_blank":undefined} rel={blank?"noopener noreferrer":undefined} aria-label={aria} style={{"--net":tone} as CSSProperties}>
<span className="share-net-circle"><Icon aria-hidden="true"/></span>
<span className="share-net-label">{label}</span>
</a>
</li>})}
</ul>
</section>;
return <div style={{position:"relative",display:"inline-flex"}}>
<button ref={trigger} type="button" className="pill action" aria-haspopup="dialog" aria-expanded={open} aria-label="Partager cet article" onClick={event=>{event.preventDefault();void share()}} style={SMALL}>
<FaShareNodes aria-hidden="true" size={14}/><span>Partager</span>
</button>
{open&&<div onClick={event=>{if(event.target===event.currentTarget)dismiss()}} style={{position:"fixed",inset:0,zIndex:900,display:"flex",justifyContent:"center",alignItems:mobile?"flex-end":"center",padding:mobile?0:"1.25rem",background:"rgba(4,16,26,.62)",opacity:shown?1:0,transition:reduce?"none":"opacity .18s ease"}}>
<div role="dialog" aria-modal="true" aria-label="Partager cet article" style={{width:"100%",maxWidth:mobile?"none":540,maxHeight:mobile?"88vh":"86vh",overflowY:"auto",background:"#fff",color:"var(--ink,#101820)",borderRadius:mobile?"18px 18px 0 0":14,padding:mobile?"1.1rem 1.1rem 1.5rem":"1.15rem 1.3rem 1.4rem",boxShadow:mobile?"0 -20px 50px rgba(2,6,23,.35)":"0 24px 60px rgba(2,6,23,.35)",opacity:shown?1:0,transform:shown?"none":mobile?"translateY(100%)":"translateY(14px)",transition:reduce?"none":"transform .22s ease, opacity .22s ease"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:".75rem",marginBottom:".85rem"}}>
<strong style={{fontSize:".8rem",fontWeight:800,letterSpacing:".08em",textTransform:"uppercase"}}>PARTAGER CET ARTICLE</strong>
<button ref={closer} type="button" aria-label="Fermer" onClick={event=>{event.preventDefault();dismiss()}} style={CLOSE}><FaXmark aria-hidden="true" size={16}/></button>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:".5rem"}}>
{SHEET.map(id=>{const{Icon,href,blank,aria,label,tone}=links[id];return <a key={id} href={href} target={blank?"_blank":undefined} rel={blank?"noopener noreferrer":undefined} aria-label={aria} onClick={()=>dismiss()} style={OPTION}><span style={{display:"inline-flex",fontSize:"1.05rem",color:tone}}><Icon aria-hidden="true"/></span>{label}</a>})}
<button type="button" aria-label="Copier le lien de l’article" onClick={event=>{event.preventDefault();void copy()}} style={{...OPTION,borderColor:"#f0c9cd",background:"#fff6f7",color:"var(--red,#c51d2e)",fontWeight:700}}><FaLink aria-hidden="true" size={17}/>Copier le lien</button>
</div>
</div>
</div>}
{note&&<div role="status" aria-live="polite" style={{position:"fixed",left:"50%",bottom:"1.4rem",transform:"translateX(-50%)",zIndex:1000,background:"#102a43",color:"#fff",padding:".55rem 1rem",borderRadius:999,fontSize:".78rem",fontWeight:700,boxShadow:"0 10px 30px rgba(2,6,23,.35)",pointerEvents:"none"}}>{note}</div>}
</div>;
}
