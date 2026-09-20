"use client";
import {useEffect,useState} from "react";

export type SavedEntry={slug:string;title:string;savedAt:string};
export const SAVED_KEY="ukweli_saved";

export function readSaved():SavedEntry[]{
  if(typeof window==="undefined")return [];
  try{
    const raw=window.localStorage.getItem(SAVED_KEY);
    if(!raw)return [];
    const parsed:unknown=JSON.parse(raw);
    if(!Array.isArray(parsed))return [];
    const out:SavedEntry[]=[];
    for(const item of parsed){
      if(!item||typeof item!=="object")continue;
      const {slug,title,savedAt}=item as {slug?:unknown;title?:unknown;savedAt?:unknown};
      if(typeof slug!=="string"||!slug||out.some(e=>e.slug===slug))continue;
      out.push({slug,title:typeof title==="string"?title:"",savedAt:typeof savedAt==="string"?savedAt:""});
    }
    return out;
  }catch{return []}
}

export function writeSaved(entries:SavedEntry[]){
  if(typeof window==="undefined")return;
  try{window.localStorage.setItem(SAVED_KEY,JSON.stringify(entries))}catch{}
}

const Bookmark=({filled}:{filled:boolean})=><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>;

export function SaveButton({slug,title,variant="full"}:{slug:string;title:string;variant?:"full"|"compact"}){
  const compact=variant==="compact";
  const [saved,setSaved]=useState(false);
  const [msg,setMsg]=useState("");
  useEffect(()=>{
    const sync=()=>setSaved(readSaved().some(e=>e.slug===slug));
    sync();
    window.addEventListener("storage",sync);
    return ()=>window.removeEventListener("storage",sync);
  },[slug]);
  useEffect(()=>{
    if(!msg)return;
    const timer=setTimeout(()=>setMsg(""),2500);
    return ()=>clearTimeout(timer);
  },[msg]);
  function toggle(){
    const list=readSaved(),exists=list.some(e=>e.slug===slug);
    writeSaved(exists?list.filter(e=>e.slug!==slug):[...list,{slug,title,savedAt:new Date().toISOString()}]);
    setSaved(!exists);
    setMsg(exists?"Article retiré des favoris.":"Article enregistré.");
  }
  return <>
    <button type="button" className={`pill action ${saved?"active":""}`} aria-pressed={saved} onClick={toggle} style={compact?{fontSize:".72rem",padding:".3rem .5rem"}:undefined}>
      <Bookmark filled={saved}/>{saved?"Enregistré":"Enregistrer"}
    </button>
    {msg&&<span role="status" className="meta" style={compact?{marginLeft:".4rem"}:{display:"block",marginTop:".35rem"}}>{msg}</span>}
  </>;
}
