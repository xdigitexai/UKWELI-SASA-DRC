import {NextResponse} from "next/server";import {z} from "zod";import {requireRole} from "@/lib/auth";import {db} from "@/lib/db";import {cleanArticle,cleanText} from "@/lib/security";import {slugify} from "@/lib/site";
const schema=z.object({title:z.string().min(5).max(240),subtitle:z.string().max(500).optional(),excerpt:z.string().min(10).max(700),content:z.string().min(50),
  seoTitle:z.string().max(240).optional(),seoDescription:z.string().max(320).optional(),tags:z.array(z.string().max(40)).max(6).optional(),
  categoryId:z.string().min(1),featuredImage:z.string().max(1000).optional(),imageCaption:z.string().max(300).optional(),imageCredit:z.string().max(300).optional(),
  status:z.enum(["DRAFT","PUBLISHED"]).default("DRAFT")});
export async function POST(req:Request){
  let user;try{user=await requireRole(["ADMINISTRATEUR","REDACTEUR_EN_CHEF"])}catch{return NextResponse.json({message:"Non autorisé."},{status:403})}
  const p=schema.safeParse(await req.json().catch(()=>null));
  if(!p.success)return NextResponse.json({message:"Contenu invalide."},{status:400});
  const category=await db.category.findUnique({where:{id:p.data.categoryId},select:{id:true}});
  if(!category)return NextResponse.json({message:"Rubrique introuvable."},{status:400});

  const title=cleanText(p.data.title,240);
  let slug=slugify(title),n=1;
  while(await db.article.findUnique({where:{slug},select:{id:true}})){n++;slug=`${slugify(title)}-${n}`}
  const now=new Date();
  const article=await db.article.create({data:{
    title,slug,
    subtitle:cleanText(p.data.subtitle||"",500)||null,
    excerpt:cleanText(p.data.excerpt,700),
    content:cleanArticle(p.data.content),
    featuredImage:cleanText(p.data.featuredImage||"",1000)||null,
    imageCaption:cleanText(p.data.imageCaption||"",300)||null,
    imageCredit:cleanText(p.data.imageCredit||"",300)||null,
    status:p.data.status,
    publishedAt:p.data.status==="PUBLISHED"?now:null,
    submittedAt:now,reviewedAt:p.data.status==="PUBLISHED"?now:null,
    seoTitle:cleanText(p.data.seoTitle||"",240)||null,
    seoDescription:cleanText(p.data.seoDescription||"",320)||null,
    commentsEnabled:true,categoryId:category.id,authorId:user.id,
    tags:{connectOrCreate:(p.data.tags||[]).map(t=>cleanText(t,40)).filter(Boolean).map(t=>({where:{slug:slugify(t)},create:{name:t,slug:slugify(t)}}))},
  },select:{id:true,slug:true,status:true}});
  await db.auditLog.create({data:{userId:user.id,action:"AI_ARTICLE_CREATED",entity:"Article",entityId:article.id,details:{status:article.status}}});
  return NextResponse.json({id:article.id,slug:article.slug,status:article.status,editUrl:`/admin/articles/${article.id}`},{status:201});
}
