"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {readSaved,writeSaved,type SavedEntry} from "@/components/SaveButton";

type SavedSummary={slug:string;title:string;excerpt:string;featuredImage:string|null;category:{name:string;slug:string};publishedAt:string|null;views:number};

const PLACEHOLDER={width:"100%",aspectRatio:"16/10",background:"var(--soft)"};
const Trash=<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M7 7l1 13h8l1-13"/></svg>;

function formatDate(value:string|null){
  if(!value)return "";
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"":new Intl.DateTimeFormat("fr-CD",{dateStyle:"medium"}).format(date);
}

function summaryLine(detail:SavedSummary|undefined,loaded:boolean){
  if(!loaded)return "Chargement des détails…";
  if(!detail)return "Cet article n’est plus disponible.";
  const date=formatDate(detail.publishedAt);
  return date?`${date} · ${detail.views} vue(s)`:`${detail.views} vue(s)`;
}

export default function SavedArticlesPage(){
  const [entries,setEntries]=useState<SavedEntry[]|null>(null);
  const [details,setDetails]=useState<SavedSummary[]>([]);
  const [loaded,setLoaded]=useState(false);
  const [notice,setNotice]=useState("");
  useEffect(()=>{
    const list=readSaved();
    setEntries(list);
    const slugs=list.map(e=>e.slug);
    if(!slugs.length){setLoaded(true);return}
    const controller=new AbortController();
    fetch(`/api/saved?slugs=${encodeURIComponent(slugs.join(","))}`,{signal:controller.signal})
      .then(r=>r.ok?r.json():[])
      .then((rows:SavedSummary[])=>setDetails(Array.isArray(rows)?rows:[]))
      .catch(()=>{})
      .finally(()=>{if(!controller.signal.aborted)setLoaded(true)});
    return ()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(!notice)return;
    const timer=setTimeout(()=>setNotice(""),2500);
    return ()=>clearTimeout(timer);
  },[notice]);
  function remove(slug:string){
    const next=readSaved().filter(e=>e.slug!==slug);
    writeSaved(next);
    setEntries(next);
    setNotice("Article retiré de vos enregistrements.");
  }
  const list=entries||[];
  const bySlug=new Map(details.map(d=>[d.slug,d]));
  return <>
    <h1>Articles enregistrés</h1>
    <p className="meta">Vos enregistrements sont conservés dans ce navigateur uniquement. Aucun compte n’est nécessaire pour les retrouver.</p>
    <p role="status" className="meta">{notice}</p>
    {entries&&!entries.length
      ? <div className="empty newsroom-empty"><strong>Aucun article enregistré pour le moment.</strong><p>Ouvrez un article et utilisez le bouton « Enregistrer » pour le retrouver ici, sur cet appareil.</p><Link className="button" href="/">Parcourir les articles</Link></div>
      : <section className="section"><div className="grid">{list.map(entry=>{const detail=bySlug.get(entry.slug);return <article className="card" key={entry.slug}>
          {detail
            ? detail.featuredImage&&<Link href={`/article/${detail.slug}`}><img loading="lazy" src={detail.featuredImage} alt=""/></Link>
            : <div style={PLACEHOLDER} aria-hidden="true"/>}
          <span className="kicker">{detail?detail.category.name:"Enregistré"}</span>
          <h3>{detail?<Link href={`/article/${detail.slug}`}>{detail.title}</Link>:entry.title||entry.slug}</h3>
          {detail?.excerpt&&<p>{detail.excerpt}</p>}
          <div className="meta">{summaryLine(detail,loaded)}</div>
          <button type="button" className="pill action" onClick={()=>remove(entry.slug)} style={{marginTop:".55rem"}}>{Trash}Retirer</button>
        </article>})}</div></section>}
  </>;
}
