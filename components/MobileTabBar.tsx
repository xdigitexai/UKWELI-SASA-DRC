"use client";import Link from "next/link";import {usePathname} from "next/navigation";import {NotificationBell} from "./NotificationBell";
const I=({d}:{d:string})=><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const ICONS={home:"M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z",grid:"M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z",bookmark:"M6 3h12v18l-6-4-6 4V3Z",search:"m21 21-4.5-4.5M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"};
export function MobileTabBar(){
  const path=usePathname()||"/";
  const on=(p:string)=>p==="/"?path==="/":path.startsWith(p);
  return <nav className="tabbar" aria-label="Navigation rapide">
    <Link href="/" className={on("/")?"active":""}><I d={ICONS.home}/><span>Accueil</span></Link>
    <button type="button" onClick={()=>window.dispatchEvent(new Event("ukweli-drawer-open"))}><I d={ICONS.grid}/><span>Catégories</span></button>
    <span className="tabbar-notif"><NotificationBell variant="icon"/><span>Notifications</span></span>
    <Link href="/enregistres" className={on("/enregistres")?"active":""}><I d={ICONS.bookmark}/><span>Enregistrés</span></Link>
    <Link href="/recherche" className={on("/recherche")?"active":""}><I d={ICONS.search}/><span>Recherche</span></Link>
  </nav>;
}
