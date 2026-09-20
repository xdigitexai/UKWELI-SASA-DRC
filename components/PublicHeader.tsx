"use client";import Link from "next/link";import {usePathname} from "next/navigation";import {useEffect,useState} from "react";import {site,slugify} from "@/lib/site";import {NotificationBell} from "./NotificationBell";
type Cat={name:string;slug:string};
const P={menu:"M4 6h16M4 12h16M4 18h16",close:"m6 6 12 12M18 6 6 18",search:"m21 21-4.5-4.5M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"};
const CI:Record<string,string>={accueil:"M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z",rdc:"M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",politique:"M3 21h18M5 21V10l7-5 7 5v11M10 21v-6h4v6",societe:"M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1.5a4 4 0 0 0-3-3.9M16 3.6a4 4 0 0 1 0 7.8",economie:"M3 17.5 9 11l4 4 8-8M15 7h6v6",securite:"M12 3l7 3v6c0 4.4-3 8.1-7 9-4-.9-7-4.6-7-9V6l7-3Z",justice:"M12 3v18M6 7h12M6 7l-3 7h6L6 7Zm12 0-3 7h6l-3-7ZM8 21h8",sante:"M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 22l8.8-8.3a5 5 0 0 0 0-7.1Z",education:"M3 7.5 12 3l9 4.5-9 4.5-9-4.5Zm3 3.2V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5.3",environnement:"M12 21c0-6 4-11 9-12 0 6-4 11-9 12Zm0 0C7.5 19 4 15 3 10c3 0 6 1 8 3",culture:"M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",sport:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.5 2 2.5 16 0 18M3.5 9h17M3.5 15h17",afrique:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c3 2.5 3 15.5 0 18M3 12h18",international:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c3 2.5 3 15.5 0 18M3 12h18",analyses:"M4 20V10m5 10V4m5 16v-7m5 7V8",videos:"M3 6h18v12H3zM10 9.5l5 2.5-5 2.5v-5Z",enquetes:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-5.2-5.2"};
const icon=(slug:string)=>CI[slug]||"M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z";
const I=({d,size=20}:{d:string;size?:number})=><svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
export function PublicHeader({categories,date,reader,alert}:{categories:Cat[];date:string;reader:boolean;alert?:{text:string;url:string|null}}){
  const[open,setOpen]=useState(false);const path=usePathname()||"/";
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>e.key==="Escape"&&setOpen(false);
    const ext=()=>setOpen(true);
    document.addEventListener("keydown",key);
    window.addEventListener("ukweli-drawer-open",ext);
    return ()=>{document.removeEventListener("keydown",key);window.removeEventListener("ukweli-drawer-open",ext)};
  },[]);
  useEffect(()=>{
    const body=document.body;
    body.classList.toggle("drawer-open",open);
    const prev=body.style.overflow;
    body.style.overflow=open?"hidden":prev;
    return ()=>{body.style.overflow=prev};
  },[open]);
  const close=()=>setOpen(false);
  const isOn=(href:string)=>href==="/"?path==="/":path.startsWith(href);
  const items=categories.length?categories:[{name:"Accueil",slug:""}];
  return <>
    <a className="skip" href="#contenu">Aller au contenu</a>
    <div className="utility"><div className="container"><span>{date}</span><span>Kinshasa · RDC</span><span>Information fiable, responsable et proche du terrain</span></div></div>
    <header className="public-header">
      <div className="mobile-mast">
        <button type="button" className="icon-button" onClick={()=>setOpen(true)} aria-label="Ouvrir le menu" aria-expanded={open} aria-controls="menu-mobile"><I d={P.menu}/></button>
        <Link href="/" className="mobile-logo">UKWELISASA</Link>
        <Link href="/recherche" className="icon-button" aria-label="Rechercher"><I d={P.search}/></Link>
        <NotificationBell variant="icon"/>
      </div>
      <div className="container masthead">
        <span className="edition">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</span>
        <Link className="brand" href="/"><strong>{site.name}</strong><span>{site.slogan}</span></Link>
        <div className="mast-actions">
          <Link href="/recherche" className="icon-button" aria-label="Rechercher"><I d={P.search}/></Link>
          <NotificationBell/>
        </div>
      </div>
      <nav className="public-nav" aria-label="Navigation principale"><div className="container"><Link href="/" className={isOn("/")?"active":""}>Accueil</Link>{items.filter(c=>c.slug).map(c=><Link key={c.slug} href={`/categorie/${c.slug}`} className={isOn(`/categorie/${c.slug}`)?"active":""}>{c.name}</Link>)}</div></nav>
    </header>
    <button type="button" className={`public-overlay ${open?"show":""}`} aria-label="Fermer le menu" onClick={close} tabIndex={open?0:-1}/>
    <aside id="menu-mobile" className={`public-drawer ${open?"open":""}`} aria-label="Menu principal" aria-hidden={!open}>
      <div className="drawer-head">
        <div className="drawer-brand"><strong>UKWELISASA.DRC.CD</strong><span>{site.slogan}</span></div>
        <button type="button" className="icon-button drawer-close" onClick={close} aria-label="Fermer le menu"><I d={P.close}/></button>
      </div>
      <nav className="drawer-body">
        <Link href="/" onClick={close} className={isOn("/")?"active":""}><I d={CI.accueil} size={18}/><span>Accueil</span></Link>
        {categories.map(c=><Link key={c.slug} href={`/categorie/${c.slug}`} onClick={close} className={isOn(`/categorie/${c.slug}`)?"active":""}><I d={icon(c.slug)} size={18}/><span>{c.name}</span></Link>)}
        <hr/>
        <Link href="/a-propos" onClick={close}><I d={CI.societe} size={18}/><span>À propos</span></Link>
        <Link href="/contact" onClick={close}><I d="M3 6.5h18V19H3zM3.6 7l8.4 6 8.4-6" size={18}/><span>Contact</span></Link>
        <Link href="/rss.xml" onClick={close}><I d="M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 12a7 7 0 0 1 7 7M5 5a14 14 0 0 1 14 14" size={18}/><span>Flux RSS</span></Link>
      </nav>
      <div className="drawer-foot"><Link href={reader?"/mon-compte":"/connexion"} onClick={close}>{reader?"Mon compte":"Connexion lecteur"}</Link></div>
    </aside>
    {alert&&<div className="breaking"><div className="container"><strong>DERNIÈRE MINUTE</strong><Link href={alert.url||"/"}>{alert.text}<span aria-hidden="true"> →</span></Link></div></div>}
  </>;
}
