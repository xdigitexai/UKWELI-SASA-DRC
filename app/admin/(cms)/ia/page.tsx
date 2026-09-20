import {requireRole} from "@/lib/auth";import {db} from "@/lib/db";import {aiConfigured,aiModel} from "@/lib/ai";import {AiComposer} from "@/components/AiComposer";
export default async function AiPage(){
  await requireRole(["ADMINISTRATEUR","REDACTEUR_EN_CHEF"]);
  const [categories,media]=await Promise.all([
    db.category.findMany({where:{visible:true},orderBy:{position:"asc"},select:{id:true,name:true}}),
    db.media.findMany({where:{type:"IMAGE"},orderBy:{createdAt:"desc"},take:200,select:{url:true,altText:true,credit:true}}),
  ]);
  return <><h1>Générateur d’articles (IA)</h1>
    <p className="meta">Décrivez le sujet : l’assistant prépare un brouillon (titre, chapeau, corps, SEO, mots-clés et illustration). Relisez et corrigez avant toute publication.</p>
    {aiConfigured()
      ? <AiComposer categories={categories} media={media} model={aiModel()}/>
      : <div className="empty compact"><strong>Générateur non configuré.</strong><p>Renseignez DEEPSEEK_API_KEY dans la configuration du serveur.</p></div>}
  </>;
}
