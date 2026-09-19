"use client";import {useEffect,useRef,useState,type CSSProperties} from "react";
type Kind="share"|"whatsapp"|"facebook"|"x"|"linkedin"|"telegram"|"mail"|"link";
const PATHS:Record<Kind,string[]>={
share:["M12 16V4","M8 8l4-4 4 4","M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"],
whatsapp:["M4.5 5.5h15A1.5 1.5 0 0 1 21 7v9a1.5 1.5 0 0 1-1.5 1.5H10.5L6 20.8v-3.3H4.5A1.5 1.5 0 0 1 3 16V7a1.5 1.5 0 0 1 1.5-1.5Z","M8.8 8.8c0 3.4 2.6 6 6 6 .6 0 1-.4 1-1v-.6l-1.7-.7-.7.7a5 5 0 0 1-2.3-2.3l.7-.7-.7-1.7h-.6c-.6 0-1 .4-1 1Z"],
facebook:["M14.6 8.6H17V5h-2.4A4.6 4.6 0 0 0 10 9.6v2.2H8V15h2v6h3.4v-6H16l.9-3.2h-3.5V9.6c0-.6.4-1 1.2-1Z"],
x:["M5 4l14 16","M19 4 5 20"],
linkedin:["M5 9.6h3.2V20H5z","M6.6 4.6a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z","M11.3 9.6h3V11a3.4 3.4 0 0 1 5.9 2.4V20h-3.2v-5.9a1.5 1.5 0 0 0-3 0V20h-2.7Z"],
telegram:["M21 4 2.8 11.7l5.8 2.1 1.9 5.7 3-4.2","M8.6 13.8 21 4"],
mail:["M3 6.5h18V19H3z","M3.6 7l8.4 6 8.4-6"],
link:["M9.5 14.5 14.5 9.5","M8.7 7.6H7.2a4.5 4.5 0 0 0 0 9h1.5","M15.3 7.6h1.5a4.5 4.5 0 0 1 0 9h-1.5"]};
const Icon=({kind,size=18}:{kind:Kind;size?:number})=><svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{PATHS[kind].map((d,i)=><path key={i} d={d}/>)}</svg>;
const BRAND="UKWELISASA.DRC.CD";
const HEAD:CSSProperties={display:"flex",alignItems:"center",gap:".55rem",padding:".5rem .6rem",fontSize:".85rem",borderRadius:"6px",color:"inherit",textDecoration:"none",width:"100%",background:"transparent",border:0,textAlign:"left",cursor:"pointer"};
const PANEL:CSSProperties={position:"absolute",top:"calc(100% + .45rem)",left:0,zIndex:60,minWidth:220,background:"var(--paper,#fff)",border:"1px solid var(--line,#dce2e7)",borderRadius:"10px",boxShadow:"0 14px 34px rgba(16,42,67,.2)",padding:".35rem",display:"grid",gap:"2px"};
export function ShareButtons({url,title,variant="full"}:{url:string;title:string;variant?:"full"|"compact"}){
const[open,setOpen]=useState(false);
const[note,setNote]=useState("");
const box=useRef<HTMLSpanElement|null>(null);
const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
const compact=variant==="compact";
useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
useEffect(()=>{
if(!open)return;
const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};
const onDown=(e:MouseEvent)=>{if(box.current&&e.target instanceof Node&&box.current.contains(e.target))return;setOpen(false)};
document.addEventListener("keydown",onKey);
document.addEventListener("mousedown",onDown);
return ()=>{document.removeEventListener("keydown",onKey);document.removeEventListener("mousedown",onDown)};
},[open]);
function flash(text:string){setNote(text);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setNote(""),2000)}
async function share(){
const text=`${title} — ${BRAND}`;
if(typeof navigator.share==="function"){
try{await navigator.share({title,text,url});return}
catch(e){if((e as {name?:string})?.name==="AbortError")return}
}
setOpen(o=>!o);
}
async function copy(){
try{
if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(url);
else{
const area=document.createElement("textarea");
area.value=url;
area.setAttribute("readonly","");
area.style.position="fixed";
area.style.top="-1000px";
document.body.appendChild(area);
area.select();
const done=document.execCommand("copy");
document.body.removeChild(area);
if(!done)throw new Error("copy");
}
flash("Lien copié");
}catch{flash("Copie impossible")}
setOpen(false);
}
const items:{kind:Kind;label:string;href:string;blank:boolean}[]=[
{kind:"whatsapp",label:"WhatsApp",href:`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,blank:true},
{kind:"facebook",label:"Facebook",href:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,blank:true},
{kind:"x",label:"X",href:`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,blank:true},
{kind:"linkedin",label:"LinkedIn",href:`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,blank:true},
{kind:"telegram",label:"Telegram",href:`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,blank:true},
{kind:"mail",label:"E-mail",href:`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,blank:false}];
return <span ref={box} style={{position:"relative",display:"inline-block"}}>
<button type="button" className="pill action" aria-haspopup="true" aria-expanded={open} onClick={e=>{e.preventDefault();share()}} style={{display:"inline-flex",alignItems:"center",gap:".4rem",background:"transparent",color:"inherit",cursor:"pointer",...(compact?{fontSize:".72rem",padding:".3rem .5rem"}:{})}}><Icon kind="share" size={compact?15:18}/>Partager</button>
{open&&<div style={PANEL}>
{items.map(item=><a key={item.kind} href={item.href} target={item.blank?"_blank":undefined} rel={item.blank?"noopener noreferrer":undefined} onClick={()=>setOpen(false)} style={HEAD}><Icon kind={item.kind} size={16}/>{item.label}</a>)}
<button type="button" onClick={e=>{e.preventDefault();copy()}} style={HEAD}><Icon kind="link" size={16}/>Copier le lien</button>
</div>}
{note&&<span role="status" className="meta" style={{marginLeft:".5rem"}}>{note}</span>}
</span>;
}
