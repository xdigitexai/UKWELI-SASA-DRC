import {NextResponse} from "next/server";import {headers} from "next/headers";import {z} from "zod";import {db} from "@/lib/db";import {cleanText,clientIp,hashValue} from "@/lib/security";import {mailAddress,sendMail} from "@/lib/mail";import {site} from "@/lib/site";import {emailLayout,emailFooterText} from "@/lib/email-layout";
const esc=(v:string)=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const s=z.object({name:z.string().min(2).max(100),email:z.string().email(),phone:z.string().max(30).optional(),subject:z.string().min(3).max(180),message:z.string().min(10).max(5000),website:z.string().max(0)});
export async function POST(req:Request){
  const f=await req.formData(),p=s.safeParse(Object.fromEntries(f));
  if(!p.success)return NextResponse.json({message:"Vérifiez les champs."},{status:400});
  const h=await headers(),ipHash=hashValue(clientIp(h));
  const recent=await db.contactMessage.count({where:{ipHash,createdAt:{gt:new Date(Date.now()-3600000)}}});
  if(recent>=3)return NextResponse.json({message:"Limite atteinte. Réessayez plus tard."},{status:429});
  const name=cleanText(p.data.name,100),phone=cleanText(p.data.phone||"",30),subject=cleanText(p.data.subject,180),message=cleanText(p.data.message);
  await db.contactMessage.create({data:{name,email:p.data.email,phone:phone||null,subject,message,ipHash}});
  try{
    await sendMail({
      to:mailAddress(),replyTo:p.data.email,subject:`[${site.name}] Contact : ${subject}`,
      text:`Nouveau message depuis le formulaire de contact.\n\nNom : ${name}\nEmail : ${p.data.email}\nTéléphone : ${phone||"—"}\nSujet : ${subject}\n\n${message}\n\n${emailFooterText()}`,
      html:emailLayout({
        heading:"Nouveau message de contact",
        paragraphs:[`<strong>Nom :</strong> ${esc(name)}`,`<strong>Email :</strong> ${esc(p.data.email)}`,`<strong>Téléphone :</strong> ${esc(phone||"—")}`,`<strong>Sujet :</strong> ${esc(subject)}`],
        body:`<div style="margin-top:20px;padding:16px;background:#f9fafb;border-radius:8px;font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${esc(message)}</div>`,
      }),
    });
  }catch(error){console.error("[mail] notification de contact échouée:",error)}
  return NextResponse.json({message:"Votre message a bien été transmis."});
}
