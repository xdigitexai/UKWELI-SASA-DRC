import {NextResponse} from "next/server";import {headers} from "next/headers";import {z} from "zod";import {db} from "@/lib/db";import {cleanText,clientIp,hashValue} from "@/lib/security";import {getReader} from "@/lib/reader-auth";
const schema=z.object({articleId:z.string().min(1),parentId:z.string().optional(),name:z.string().min(2).max(100),email:z.string().max(200).optional(),content:z.string().min(2).max(2000),website:z.string().max(0)});
export async function POST(req:Request){
  const f=await req.formData(),p=schema.safeParse(Object.fromEntries(f));
  if(!p.success)return NextResponse.json({message:"Vérifiez les champs du formulaire."},{status:400});
  const email=(p.data.email||"").trim().toLowerCase();
  if(email&&!z.string().email().safeParse(email).success)return NextResponse.json({message:"Adresse email invalide."},{status:400});
  const h=await headers(),ipHash=hashValue(clientIp(h)),reader=await getReader();
  const recent=await db.comment.count({where:{ipHash,createdAt:{gt:new Date(Date.now()-3600000)}}});
  if(recent>=10)return NextResponse.json({message:"Trop de commentaires envoyés. Réessayez dans un moment."},{status:429});
  const content=cleanText(p.data.content,2000);
  const duplicate=await db.comment.count({where:{ipHash,content,createdAt:{gt:new Date(Date.now()-120000)}}});
  if(duplicate>0)return NextResponse.json({message:"Ce commentaire vient déjà d’être envoyé."},{status:409});
  const [article,globalSetting]=await Promise.all([db.article.findFirst({where:{id:p.data.articleId,status:"PUBLISHED",commentsEnabled:true}}),db.setting.findUnique({where:{key:"comments.enabled"}})]);
  if(!article||globalSetting?.value===false)return NextResponse.json({message:"Commentaires indisponibles."},{status:404});
  if(p.data.parentId){const parent=await db.comment.findFirst({where:{id:p.data.parentId,articleId:article.id}});if(!parent)return NextResponse.json({message:"Commentaire parent invalide."},{status:400})}
  const created=await db.comment.create({
    data:{articleId:article.id,parentId:p.data.parentId||null,readerId:reader?.id||null,name:reader?.name||cleanText(p.data.name,100),email:reader?.email||email,content,status:"APPROVED",ipHash,userAgentHash:hashValue(h.get("user-agent")||"")},
    select:{id:true},
  });
  return NextResponse.json({message:"Votre commentaire a été publié.",id:created.id},{status:201});
}
