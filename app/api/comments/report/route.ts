import {NextResponse} from "next/server";import {headers} from "next/headers";import {z} from "zod";import {db} from "@/lib/db";import {cleanText,clientIp,hashValue} from "@/lib/security";import {getReader} from "@/lib/reader-auth";
const schema=z.object({commentId:z.string().min(1),reason:z.string().max(300).optional()});
export async function POST(req:Request){
  const p=schema.safeParse(await req.json().catch(()=>null));
  if(!p.success)return NextResponse.json({message:"Signalement invalide."},{status:400});
  const h=await headers(),ipHash=hashValue(clientIp(h)),reader=await getReader();
  const recent=await db.commentReport.count({where:{ipHash,createdAt:{gt:new Date(Date.now()-3600000)}}});
  if(recent>=10)return NextResponse.json({message:"Trop de signalements envoyés. Réessayez dans un moment."},{status:429});
  const comment=await db.comment.findUnique({where:{id:p.data.commentId},select:{id:true}});
  if(!comment)return NextResponse.json({message:"Commentaire introuvable."},{status:404});
  const already=await db.commentReport.count({where:{commentId:comment.id,ipHash}});
  if(already>0)return NextResponse.json({message:"Vous avez déjà signalé ce commentaire."});
  await db.commentReport.create({data:{commentId:comment.id,readerId:reader?.id||null,reason:cleanText(p.data.reason||"Signalement lecteur",300),ipHash}});
  return NextResponse.json({message:"Signalement enregistré. Merci."});
}
