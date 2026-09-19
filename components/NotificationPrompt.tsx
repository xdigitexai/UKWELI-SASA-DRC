"use client";import {useCallback,useEffect,useState} from "react";import {site} from "@/lib/site";
type State="idle"|"prompt"|"working"|"granted"|"denied"|"unsupported";
const KEY="ukweli_notif_snooze_until",DAY=86400000;
function decode(s:string){const p="=".repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...b].map(c=>c.charCodeAt(0)))}
const supported=()=>typeof window!=="undefined"&&"Notification"in window&&"serviceWorker"in navigator&&"PushManager"in window;
const snoozed=()=>{try{const v=localStorage.getItem(KEY);return !!v&&Date.now()<Number(v)}catch{return false}};
const snooze=(d:number)=>{try{localStorage.setItem(KEY,String(Date.now()+d*DAY))}catch{}};
const clearSnooze=()=>{try{localStorage.removeItem(KEY)}catch{}};
async function subscribe(){const key=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;if(!key)throw new Error("VAPID absente");const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(key)});const r=await fetch("/api/push/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(sub)});if(!r.ok)throw new Error("Enregistrement refusé")}
const Bell=()=> <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>;
export function NotificationPrompt({mode="auto"}:{mode?:"auto"|"settings"}){
  const[state,setState]=useState<State>("idle"),[msg,setMsg]=useState("");
  useEffect(()=>{
    if(!supported()){setState("unsupported");return}
    if(Notification.permission==="granted"){
      navigator.serviceWorker.ready.then(r=>r.pushManager.getSubscription()).then(sub=>sub?null:subscribe().catch(()=>null)).catch(()=>null).then(()=>setState("granted"));
      return;
    }
    if(Notification.permission==="denied"){setState("denied");return}
    if(mode==="settings"){setState("prompt");return}
    if(snoozed())return;
    setState("prompt");
  },[mode]);
  const enable=useCallback(async()=>{
    setState("working");setMsg("");
    try{
      const perm=await Notification.requestPermission();
      if(perm!=="granted"){setState(perm==="denied"?"denied":"idle");setMsg(perm==="denied"?"Les notifications sont bloquées par votre navigateur.":"Autorisation non accordée.");return}
      await subscribe();clearSnooze();setState("granted");setMsg("Notifications activées");
    }catch{setState("idle");setMsg("Activation impossible pour le moment.")}
  },[]);
  const later=useCallback(()=>{snooze(3);setState("idle")},[]);
  if(state==="unsupported")return mode==="settings"?<p className="meta">Les notifications ne sont pas prises en charge par ce navigateur.</p>:null;
  if(state==="granted")return mode==="settings"?<p className="meta">Notifications activées sur cet appareil.</p>:<div className="notif-toast" role="status"><Bell/>Notifications activées</div>;
  if(state==="denied")return <p className="meta">Les notifications sont bloquées dans votre navigateur. Vous pouvez les réactiver dans les paramètres du site.</p>;
  if(state==="idle")return msg?<p className="meta" role="status">{msg}</p>:null;
  if(mode==="settings")return <span className="notif-inline"><button type="button" className="button secondary" onClick={enable} disabled={state==="working"}>{state==="working"?"Activation…":"Activer les notifications sur cet appareil"}</button>{msg&&<small role="status" className="meta"> {msg}</small>}</span>;
  return <div className="notif-card" role="dialog" aria-labelledby="notif-title"><div className="notif-brand"><Bell/><strong>{site.name}</strong></div><h2 id="notif-title">Restez informé</h2><p>Recevez les dernières actualités et les alertes importantes directement sur votre appareil.</p>{msg&&<p className="meta" role="status">{msg}</p>}<div className="notif-actions"><button type="button" className="button secondary" onClick={later} disabled={state==="working"}>PLUS TARD</button><button type="button" className="button" onClick={enable} disabled={state==="working"}>{state==="working"?"Activation…":"AUTORISER"}</button></div></div>;
}
