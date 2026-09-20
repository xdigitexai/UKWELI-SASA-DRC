import {db} from "@/lib/db";import {nav} from "@/lib/site";import {activeBreaking} from "@/lib/content";import {getReader} from "@/lib/reader-auth";import {PublicHeader} from "./PublicHeader";
export async function Header(){
  const [alerts,reader,cats]=await Promise.all([
    activeBreaking().catch(()=>[]),
    getReader(),
    db.category.findMany({where:{visible:true},orderBy:{position:"asc"},select:{name:true,slug:true}}).catch(()=>[]),
  ]);
  const categories=cats.length?cats:nav.map(n=>({name:n,slug:n==="Vidéos"?"videos":n.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}));
  return <PublicHeader categories={categories} reader={Boolean(reader)} date={new Intl.DateTimeFormat("fr-CD",{dateStyle:"full"}).format(new Date())} alert={alerts[0]?{text:alerts[0].text,url:alerts[0].url}:undefined}/>;
}
