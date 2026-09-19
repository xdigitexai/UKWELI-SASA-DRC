"use client";import {useState} from "react";import {useRouter} from "next/navigation";
export function CommentForm({articleId,parentId}:{articleId:string;parentId?:string}){
  const[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);const router=useRouter();
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();const form=e.currentTarget;setBusy(true);
    const r=await fetch("/api/comments",{method:"POST",body:new FormData(form)});
    const j=await r.json();
    setBusy(false);setMsg(j.message);
    if(r.ok){form.reset();router.refresh()}
  }
  return <form onSubmit={submit} className="form-grid"><input type="hidden" name="articleId" value={articleId}/>{parentId&&<input type="hidden" name="parentId" value={parentId}/>}<label>Nom<input name="name" required maxLength={100}/></label><label>Email (facultatif, non publié)<input name="email" type="email" maxLength={200}/></label><label className="full">Commentaire<textarea name="content" required minLength={2} rows={parentId?3:5} maxLength={2000}/></label><label className="skip">Site web<input name="website" tabIndex={-1} autoComplete="off"/></label><button type="submit" className="button" disabled={busy}>{busy?"Publication…":"PUBLIER LE COMMENTAIRE"}</button><span role="status" className="meta">{msg}</span></form>
}
