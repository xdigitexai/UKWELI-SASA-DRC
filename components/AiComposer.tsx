"use client";import {useState} from "react";
type Cat={id:string;name:string};
type Img={url:string;altText:string|null;credit:string|null};
type Draft={title:string;subtitle:string;excerpt:string;content:string;seoTitle:string;seoDescription:string;tags:string[]};
const TONES:[string,string][]=[["informatif","Informatif"],["analyse","Analyse"],["reportage","Reportage"],["explicatif","Explicatif"],["entretien","Entretien"]];
const LENGTHS:[string,string][]=[["court","Courte (350-450 mots)"],["moyen","Moyenne (650-800)"],["long","Longue (1000-1300)"]];
export function AiComposer({categories,media,model}:{categories:Cat[];media:Img[];model:string}){
  const[brief,setBrief]=useState(""),[categoryId,setCategoryId]=useState(categories[0]?.id||""),
    [tone,setTone]=useState("informatif"),[length,setLength]=useState("moyen"),[keywords,setKeywords]=useState(""),
    [noNumbers,setNoNumbers]=useState(true),[busy,setBusy]=useState(false),[saving,setSaving]=useState(""),
    [msg,setMsg]=useState(""),[draft,setDraft]=useState<Draft|null>(null),
    [imageUrl,setImageUrl]=useState(""),[suggested,setSuggested]=useState<Img|null>(null),
    [meta,setMeta]=useState(""),[link,setLink]=useState("");

  const img=media.find(m=>m.url===imageUrl)||null;
  const set=(k:"title"|"subtitle"|"excerpt"|"content"|"seoTitle"|"seoDescription",v:string)=>setDraft(d=>d?{...d,[k]:v}:d);

  async function generate(){
    setBusy(true);setMsg("");setLink("");
    try{
      const r=await fetch("/api/admin/ai/generate",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({brief,categoryId,tone,length,keywords,noNumbers})});
      const j=await r.json();
      if(!r.ok){setMsg(j.message||"Échec de la génération.");return}
      setDraft(j.draft as Draft);
      setSuggested((j.image as Img)||null);
      setImageUrl((j.image&&j.image.url)||"");
      setMeta(`${j.model||model} · ${(j.usage&&j.usage.total_tokens)||"?"} jetons`);
      setMsg("Brouillon généré. Relisez et corrigez avant d’enregistrer.");
    }catch{setMsg("Erreur réseau pendant la génération.")}
    finally{setBusy(false)}
  }

  async function save(status:"DRAFT"|"PUBLISHED"){
    if(!draft)return;
    if(status==="PUBLISHED"&&!confirm("Publier ce contenu généré par IA ? Vérifiez qu’il ne contient aucune affirmation non vérifiée."))return;
    setSaving(status);setMsg("");
    try{
      const r=await fetch("/api/admin/ai/save",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...draft,categoryId,featuredImage:imageUrl,imageCaption:img?.altText||"",imageCredit:img?.credit||"",status})});
      const j=await r.json();
      if(!r.ok){setMsg(j.message||"Échec de l’enregistrement.");return}
      setMsg(status==="DRAFT"?"Article enregistré en brouillon.":"Article publié.");
      setLink(j.editUrl||"");
    }catch{setMsg("Erreur réseau pendant l’enregistrement.")}
    finally{setSaving("")}
  }

  return <>
    <section className="admin-panel">
      <h2>Brief rédactionnel</h2>
      <div className="form-grid">
        <label className="full">Sujet, angle et informations à couvrir
          <textarea rows={5} value={brief} onChange={e=>setBrief(e.target.value)} placeholder="Ex. : comprendre l’organisation du transport urbain à Kinshasa, les difficultés des usagers et les pistes d’amélioration."/>
        </label>
        <label>Rubrique<select value={categoryId} onChange={e=>setCategoryId(e.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Ton<select value={tone} onChange={e=>setTone(e.target.value)}>{TONES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label>Longueur<select value={length} onChange={e=>setLength(e.target.value)}>{LENGTHS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label>Mots-clés (facultatif)<input value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="Kinshasa, mobilité, usagers"/></label>
        <label className="full"><input type="checkbox" checked={noNumbers} onChange={e=>setNoNumbers(e.target.checked)}/> Ne produire aucun chiffre ni pourcentage (recommandé)</label>
        <div className="full"><button type="button" className="button" onClick={generate} disabled={busy||brief.trim().length<10}>{busy?"Génération en cours…":"Générer le brouillon"}</button>{meta&&<span className="meta"> {meta}</span>}</div>
      </div>
      <p className="meta">L’assistant n’invente ni citation, ni statistique, ni source nommée. Il prépare une base à relire : la responsabilité éditoriale reste celle de la rédaction.</p>
    </section>

    {msg&&<p className="meta" role="status">{msg}{link&&<> — <a href={link}>Ouvrir dans l’éditeur</a></>}</p>}

    {draft&&<>
      <section className="admin-panel">
        <h2>Aperçu modifiable</h2>
        <div className="form-grid">
          <label className="full">Titre<input value={draft.title} onChange={e=>set("title",e.target.value)} maxLength={240}/></label>
          <label className="full">Chapeau<input value={draft.subtitle} onChange={e=>set("subtitle",e.target.value)} maxLength={500}/></label>
          <label className="full">Résumé<textarea rows={3} value={draft.excerpt} onChange={e=>set("excerpt",e.target.value)} maxLength={700}/></label>
          <label className="full">Corps (HTML)<textarea rows={16} value={draft.content} onChange={e=>set("content",e.target.value)}/></label>
          <label>Titre SEO<input value={draft.seoTitle} onChange={e=>set("seoTitle",e.target.value)} maxLength={240}/></label>
          <label>Description SEO<input value={draft.seoDescription} onChange={e=>set("seoDescription",e.target.value)} maxLength={320}/></label>
          <label className="full">Mots-clés<input value={draft.tags.join(", ")} onChange={e=>setDraft({...draft,tags:e.target.value.split(",").map(t=>t.trim()).filter(Boolean).slice(0,5)})}/></label>
        </div>
      </section>

      <section className="admin-panel">
        <h2>Illustration</h2>
        <p className="meta">{suggested?`Suggestion de l’assistant : ${suggested.altText||suggested.url}`:"Aucune suggestion — choisissez une image de la bibliothèque."} (L’IA ne génère pas d’image : elle sélectionne dans la bibliothèque existante.)</p>
        <div className="form-grid">
          <label className="full">Image principale<select value={imageUrl} onChange={e=>setImageUrl(e.target.value)}><option value="">Aucune</option>{media.map(m=><option key={m.url} value={m.url}>{m.altText||m.url}</option>)}</select></label>
        </div>
        {img&&<figure><img src={img.url} alt={img.altText||""} width="360"/>{img.credit&&<figcaption className="meta">{img.credit}</figcaption>}</figure>}
      </section>

      <section className="admin-panel">
        <h2>Aperçu du rendu</h2>
        <article className="article">
          <h1>{draft.title}</h1>
          {draft.subtitle&&<p className="subtitle">{draft.subtitle}</p>}
          {img&&<figure><img src={img.url} alt={img.altText||""}/></figure>}
          <div className="article-body" dangerouslySetInnerHTML={{__html:draft.content}}/>
        </article>
      </section>

      <div className="share">
        <button type="button" className="button secondary" onClick={()=>save("DRAFT")} disabled={!!saving}>{saving==="DRAFT"?"Enregistrement…":"Enregistrer en brouillon"}</button>
        <button type="button" className="button" onClick={()=>save("PUBLISHED")} disabled={!!saving}>{saving==="PUBLISHED"?"Publication…":"Publier"}</button>
      </div>
    </>}
  </>;
}
