"use client";import {useCallback,useEffect,useState} from "react";
type S="checking"|"unsupported"|"idle"|"on"|"blocked";
const BellIcon=({size=18,active=false}:{size?:number;active?:boolean})=><svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={active?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>;
const supported=()=>typeof window!=="undefined"&&"Notification"in window&&"serviceWorker"in navigator&&"PushManager"in window;
export function NotificationBell({variant="full"}:{variant?:"full"|"icon"}){
  const[state,setState]=useState<S>("checking"),[note,setNote]=useState("");
  const check=useCallback(()=>{
    if(!supported()){setState("unsupported");return}
    if(Notification.permission==="denied"){setState("blocked");return}
    if(Notification.permission!=="granted"){setState("idle");return}
    navigator.serviceWorker.ready.then(r=>r.pushManager.getSubscription()).then(s=>setState(s?"on":"idle")).catch(()=>setState("idle"));
  },[]);
  useEffect(()=>{
    check();
    const onChange=()=>check();
    window.addEventListener("ukweli-notif-change",onChange);
    return ()=>window.removeEventListener("ukweli-notif-change",onChange);
  },[check]);
  useEffect(()=>{if(!note)return;const t=setTimeout(()=>setNote(""),2800);return ()=>clearTimeout(t)},[note]);
  const activate=useCallback(()=>{
    if(state==="idle"){window.dispatchEvent(new Event("ukweli-notif-open"));return}
    if(state==="blocked"){setNote("Notifications bloquées dans votre navigateur. Réactivez-les dans les paramètres du site.");return}
    if(state==="on"){setNote("Notifications activées sur cet appareil.")}
  },[state]);
  if(state==="checking"||state==="unsupported")return null;
  const text=state==="on"?"Notifications activées":state==="blocked"?"Notifications bloquées":"Notifications";
  return <span className="notif-bell-wrap">
    <button type="button" className={`notif-bell ${state==="on"?"is-on":""} ${variant==="icon"?"is-icon":""}`.trim()} onClick={activate} aria-label={text} title={text}>
      <BellIcon size={variant==="icon"?20:18} active={state==="on"}/>
      {variant!=="icon"&&<span>{text}</span>}
      {state==="on"&&<i className="notif-dot" aria-hidden="true"/>}
    </button>
    {note&&<span role="status" className="notif-bell-note">{note}</span>}
  </span>;
}
