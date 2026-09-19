import {NextResponse} from "next/server";import {headers} from "next/headers";import {z} from "zod";import {db} from "@/lib/db";import {getReader} from "@/lib/reader-auth";import {clientIp,hashValue} from "@/lib/security";
async function visitorKey(){const h=await headers();return hashValue(`reaction:${clientIp(h)}:${h.get("user-agent")||""}`)}
async function counts(articleId:string,readerId:string|null,visitorHash:string){
  const [likes,dislikes,mine]=await Promise.all([
    db.articleReaction.count({where:{articleId,type:"LIKE"}}),
    db.articleReaction.count({where:{articleId,type:"DISLIKE"}}),
    readerId
      ? db.articleReaction.findUnique({where:{readerId_articleId:{readerId,articleId}}})
      : db.articleReaction.findFirst({where:{articleId,visitorHash}}),
  ]);
  return {likes,dislikes,reaction:mine?.type||null};
}
export async function GET(req:Request){
  const articleId=new URL(req.url).searchParams.get("articleId");
  if(!articleId)return NextResponse.json({error:"articleId requis"},{status:400});
  const reader=await getReader();
  return NextResponse.json(await counts(articleId,reader?.id||null,await visitorKey()));
}
export async function POST(req:Request){
  const p=z.object({articleId:z.string().min(1),type:z.enum(["LIKE","DISLIKE"])}).safeParse(await req.json().catch(()=>null));
  if(!p.success)return NextResponse.json({message:"Réaction invalide."},{status:400});
  const reader=await getReader(),visitorHash=await visitorKey();
  const current=reader
    ? await db.articleReaction.findUnique({where:{readerId_articleId:{readerId:reader.id,articleId:p.data.articleId}}})
    : await db.articleReaction.findFirst({where:{articleId:p.data.articleId,visitorHash}});
  if(current&&current.type===p.data.type)await db.articleReaction.delete({where:{id:current.id}});
  else if(current)await db.articleReaction.update({where:{id:current.id},data:{type:p.data.type}});
  else await db.articleReaction.create({data:{articleId:p.data.articleId,type:p.data.type,readerId:reader?.id||null,visitorHash}});
  return NextResponse.json(await counts(p.data.articleId,reader?.id||null,visitorHash));
}
