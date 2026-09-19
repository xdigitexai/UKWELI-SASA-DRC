"use client";import {useState} from "react";
export function CommentReportButton({commentId}:{commentId:string}){
  const[msg,setMsg]=useState(""),[done,setDone]=useState(false);
  async function report(){
    const r=await fetch("/api/comments/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId})});
    const j=await r.json();setMsg(j.message);if(r.ok)setDone(true);
  }
  return <span className="report-action"><button type="button" className="link-button" onClick={report} disabled={done}>Signaler</button>{msg&&<small role="status" className="meta"> {msg}</small>}</span>
}
