import {NextResponse} from "next/server";
import {z} from "zod";
import {requireRole} from "@/lib/auth";
import {db} from "@/lib/db";
import {chat,extractJSON,aiConfigured,aiModel} from "@/lib/ai";
import {cleanArticle,cleanText} from "@/lib/security";

const schema=z.object({
  brief:z.string().min(10).max(4000),
  categoryId:z.string().min(1),
  tone:z.enum(["informatif","analyse","reportage","explicatif","entretien"]).default("informatif"),
  length:z.enum(["court","moyen","long"]).default("moyen"),
  keywords:z.string().max(400).optional(),
  noNumbers:z.boolean().default(true),
});
const ALLOWED="<p> <h2> <h3> <strong> <em> <ul> <ol> <li> <blockquote>";
const WORDS={court:"350 à 450 mots",moyen:"650 à 800 mots",long:"1000 à 1300 mots"};
const BUDGET={court:7000,moyen:9000,long:12000};

export async function POST(req:Request){
  try{await requireRole(["ADMINISTRATEUR","REDACTEUR_EN_CHEF"])}
  catch{return NextResponse.json({message:"Non autorisé."},{status:403})}
  if(!aiConfigured())return NextResponse.json({message:"Générateur IA non configuré (DEEPSEEK_API_KEY manquante)."},{status:503});

  const p=schema.safeParse(await req.json().catch(()=>null));
  if(!p.success)return NextResponse.json({message:"Brief invalide : décrivez le sujet en quelques phrases."},{status:400});

  const category=await db.category.findUnique({where:{id:p.data.categoryId},select:{name:true}});
  if(!category)return NextResponse.json({message:"Rubrique introuvable."},{status:400});
  const media=await db.media.findMany({where:{type:"IMAGE"},orderBy:{createdAt:"desc"},take:200,
    select:{url:true,filename:true,altText:true,credit:true}});
  const imageList=media.map(m=>`- ${m.filename} : ${m.altText||""}`).join("\n");

  const rules=[
    "N'invente jamais de citation, de témoignage, de chiffre, de statistique, de date précise ni de source nommée.",
    "Si une information factuelle précise est nécessaire et qu'elle n'est pas dans le brief, reste général et décris le contexte.",
    "Pas de sensationnalisme, pas d'accusation, pas d'attribution d'intention à une personne réelle.",
  ];
  if(p.data.noNumbers)rules.push("N'écris aucun chiffre ni pourcentage dans le corps de l'article.");

  const system=[
    "Tu es rédacteur en chef francophone de la rédaction de UKWELISASA.DRC.CD, média de la République démocratique du Congo.",
    "Tu écris un français professionnel, sobre et précis, dans le style d'une rédaction sérieuse.",
    "Tu comprends le sujet, tu l'organises, et tu choisis l'illustration la plus pertinente parmi celles fournies.",
    "Tu réponds UNIQUEMENT par un objet JSON valide, sans commentaire, sans texte avant ni après, sans balise de code.",
    ...rules,
  ].join(" ");

  const user=[
    "Rédige un article.",
    `Sujet / brief : ${p.data.brief}`,
    `Rubrique : ${category.name}`,
    `Ton : ${p.data.tone}`,
    `Longueur : ${WORDS[p.data.length]}`,
    p.data.keywords?`Mots-clés à intégrer si pertinent : ${p.data.keywords}`:"",
    `Schéma JSON attendu : {"title":"","subtitle":"","excerpt":"","content":"","seoTitle":"","seoDescription":"","tags":[""],"imageKeywords":[""],"imageFile":""}`,
    "title : accroche sobre. subtitle : chapeau d'une phrase. excerpt : résumé de 2 phrases maximum.",
    `content : HTML autorisé uniquement ${ALLOWED}, sans aucun attribut, avec 2 à 4 <h2>.`,
    "tags : 3 à 5 mots-clés courts. imageKeywords : 4 à 6 mots décrivant l'illustration attendue.",
    "seoTitle : 60 caractères maximum. seoDescription : 155 caractères maximum.",
    imageList?`Images disponibles — dans imageFile, recopie le nom de fichier EXACT de l'image dont le sujet correspond le mieux à l'article. N'invente aucun nom de fichier ; laisse "" si aucune ne convient :\n${imageList}`:"",
  ].filter(Boolean).join("\n");

  let out;
  try{
    out=await chat([{role:"system",content:system},{role:"user",content:user}],
      {maxTokens:BUDGET[p.data.length],temperature:0.6});
  }catch(error){
    return NextResponse.json({message:`Erreur de l'API IA : ${error instanceof Error?error.message:"inconnue"}`},{status:502});
  }

  let raw:Record<string,unknown>;
  try{raw=extractJSON(out.text)}
  catch{return NextResponse.json({message:"L'IA n'a pas renvoyé un JSON exploitable. Réessayez."},{status:502})}

  const str=(v:unknown,max=400)=>cleanText(typeof v==="string"?v:"",max);
  const tags=(Array.isArray(raw.tags)?raw.tags:[]).map(t=>cleanText(String(t),40)).filter(Boolean).slice(0,5);
  const keywords=(Array.isArray(raw.imageKeywords)?raw.imageKeywords:[])
    .map(k=>String(k).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()).filter(k=>k.length>2);

  const draft={
    title:str(raw.title,240),
    subtitle:str(raw.subtitle,500),
    excerpt:str(raw.excerpt,700),
    content:cleanArticle(typeof raw.content==="string"?raw.content:""),
    seoTitle:str(raw.seoTitle,240),
    seoDescription:str(raw.seoDescription,320),
    tags,
  };
  if(draft.title.length<5||draft.content.length<200)
    return NextResponse.json({message:"Réponse IA trop courte ou inexploitable. Réessayez."},{status:502});

  // the model picks from the real library; if it names something unknown we fall back to keyword overlap
  const wanted=String(raw.imageFile||"").trim();
  let best:typeof media[number]|null=media.find(m=>m.filename===wanted)||null;
  let how=best?"choisie par l’assistant":"";
  if(!best){
    let bestScore=0;
    for(const m of media){
      const hay=`${m.altText||""} ${m.filename||""}`.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[-_]/g," ");
      let score=0;
      for(const k of keywords)if(hay.includes(k))score+=k.length;
      if(score>bestScore){bestScore=score;best=m}
    }
    if(best)how="déduite des mots-clés";
  }

  return NextResponse.json({
    draft,
    image:best?{url:best.url,altText:best.altText,credit:best.credit,match:how}:null,
    keywords,
    model:out.model||aiModel(),
    usage:out.usage,
  });
}
