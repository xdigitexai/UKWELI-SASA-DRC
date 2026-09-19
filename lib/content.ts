import { db } from "@/lib/db";
export const publishedWhere={status:"PUBLISHED" as const,get publishedAt(){return {lte:new Date()}}};
export async function activeBreaking(){return db.breakingNews.findMany({where:{active:true,startsAt:{lte:new Date()},OR:[{endsAt:null},{endsAt:{gt:new Date()}}]},orderBy:[{priority:"desc"},{createdAt:"desc"}],take:5});}
export function readingTime(html:string){const words=html.replace(/<[^>]+>/g," ").trim().split(/\s+/).length;return Math.max(1,Math.ceil(words/220));}
