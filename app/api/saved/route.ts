import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {publishedWhere} from "@/lib/content";

export const dynamic="force-dynamic";

const LIMIT=50;
const NO_STORE={"Cache-Control":"no-store"};

type SavedSummary={slug:string;title:string;excerpt:string;featuredImage:string|null;category:{name:string;slug:string};publishedAt:Date|null;views:number};

export async function GET(req:Request){
  try{
    const raw=new URL(req.url).searchParams.get("slugs")||"";
    const slugs:string[]=[];
    for(const part of raw.split(",")){
      const slug=part.trim();
      if(slug&&slugs.length<LIMIT&&!slugs.includes(slug))slugs.push(slug);
    }
    if(!slugs.length)return NextResponse.json([],{headers:NO_STORE});
    const rows=await db.article.findMany({
      where:{...publishedWhere,slug:{in:slugs}},
      select:{slug:true,title:true,excerpt:true,featuredImage:true,publishedAt:true,category:{select:{name:true,slug:true}},_count:{select:{views:true}}},
    });
    const found=new Map(rows.map(a=>[a.slug,a]));
    const items:SavedSummary[]=[];
    for(const slug of slugs){
      const a=found.get(slug);
      if(!a)continue;
      items.push({slug:a.slug,title:a.title,excerpt:a.excerpt,featuredImage:a.featuredImage,category:a.category,publishedAt:a.publishedAt,views:a._count.views});
    }
    return NextResponse.json(items,{headers:NO_STORE});
  }catch{
    return NextResponse.json([],{headers:NO_STORE});
  }
}
