import {NextResponse} from "next/server";import {headers} from "next/headers";import {z} from "zod";import {db} from "@/lib/db";import {clientIp,hashValue} from "@/lib/security";import {sendMail} from "@/lib/mail";import {site} from "@/lib/site";import {emailLayout,emailButton,emailNote,emailFooterText} from "@/lib/email-layout";
const hits=new Map<string,number[]>();
function allow(key:string,max:number,windowMs:number){const now=Date.now(),recent=(hits.get(key)||[]).filter(t=>now-t<windowMs);if(recent.length>=max){hits.set(key,recent);return false}recent.push(now);hits.set(key,recent);return true}
export async function POST(req:Request){
  const f=await req.formData();
  const parsed=z.string().email().safeParse(f.get("email"));
  if(!parsed.success)return NextResponse.json({message:"Adresse email invalide."},{status:400});
  if(!allow(hashValue(clientIp(await headers())),5,3600000))return NextResponse.json({message:"Trop d’inscriptions. Réessayez plus tard."},{status:429});
  const email=parsed.data.toLowerCase();
  const existing=await db.newsletterSubscriber.findUnique({where:{email}});
  if(existing?.status==="ACTIVE")return NextResponse.json({message:"Cette adresse est déjà inscrite."});
  const sub=await db.newsletterSubscriber.upsert({where:{email},update:{status:"ACTIVE",subscribedAt:new Date()},create:{email}});
  const unsubscribe=`${site.url}/api/newsletter/unsubscribe?token=${sub.unsubscribeToken}`;
  await sendMail({
    to:sub.email,
    subject:`Inscription confirmée — ${site.name}`,
    text:`${site.name}\n${site.slogan}\n\nInscription confirmée\n\nBonjour,\n\nVotre inscription à la lettre de ${site.name} est bien enregistrée.\n\nVous recevrez désormais nos dernières actualités selon vos préférences.\n\nVoir les dernières actualités : ${site.url}\n\nVous pouvez vous désabonner à tout moment :\n${unsubscribe}\n\n${emailFooterText()}`,
    html:emailLayout({
      heading:"Inscription confirmée",
      paragraphs:["Bonjour,",`Votre inscription à la lettre de ${site.name} est bien enregistrée.`,"Vous recevrez désormais nos dernières actualités selon vos préférences."],
      body:emailButton({label:"VOIR LES DERNIÈRES ACTUALITÉS",url:site.url})+emailNote("Vous pouvez vous désabonner à tout moment.",{label:"Se désabonner",url:unsubscribe}),
    }),
  });
  return NextResponse.json({message:"Inscription enregistrée. Merci !"});
}
