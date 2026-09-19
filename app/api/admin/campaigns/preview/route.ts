import {NextResponse} from "next/server";
import {requireRole} from "@/lib/auth";
import {db} from "@/lib/db";
import {campaignContent,campaignHtml} from "@/lib/campaigns";
const text=(body:string,status:number)=>new NextResponse(body,{status,headers:{"Content-Type":"text/plain; charset=utf-8"}});
export async function GET(req:Request){
  try{await requireRole(["ADMINISTRATEUR","REDACTEUR_EN_CHEF"])}catch{return text("403 — Accès refusé",403)}
  const id=new URL(req.url).searchParams.get("id");
  if(!id)return text("Paramètre id manquant.",400);
  const campaign=await db.newsletterCampaign.findUnique({where:{id},include:{leadArticle:true,items:{include:{article:true},orderBy:{position:"asc"}}}});
  if(!campaign)return text("Campagne introuvable.",404);
  return new NextResponse(campaignHtml(campaignContent(campaign)),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
}
