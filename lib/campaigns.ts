import {db} from "@/lib/db";
import {site} from "@/lib/site";
import {cleanText} from "@/lib/security";
import {emailLayout,emailButton,emailNote,emailFooterText,escapeHtml} from "@/lib/email-layout";
export type CampaignArticle={title:string;slug:string;excerpt?:string;featuredImage?:string|null};
export type CampaignContent={subject:string;preheader:string|null;intro:string|null;lead:CampaignArticle|null;items:CampaignArticle[]};
type CampaignRecord={subject:string;preheader:string|null;intro:string|null;leadArticle:CampaignArticle|null;items:{article:CampaignArticle}[]};
export const articleUrl=(slug:string)=>`${site.url}/article/${slug}`;
export const absoluteAsset=(value:string)=>/^https?:\/\//i.test(value)?value:`${site.url}${value.startsWith("/")?"":"/"}${value}`;
const ENTITIES:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
export const decodeEntities=(value:string)=>value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(match,code:string)=>{if(code.startsWith("#")){const hexadecimal=code[1]==="x"||code[1]==="X",point=hexadecimal?parseInt(code.slice(2),16):parseInt(code.slice(1),10);return point>0&&point<=0x10ffff?String.fromCodePoint(point):match}return ENTITIES[code.toLowerCase()]??match});
export const plainText=(value:string,max=2000)=>decodeEntities(cleanText(value,max));
const esc=(value:string)=>escapeHtml(decodeEntities(value));
export const campaignDestination=(content:CampaignContent)=>content.lead?articleUrl(content.lead.slug):site.url;
export function campaignContent(record:CampaignRecord):CampaignContent{return {subject:record.subject,preheader:record.preheader,intro:record.intro,lead:record.leadArticle,items:record.items.map(item=>item.article)}}
export function campaignPlainText(content:CampaignContent){const fallback=content.lead?.excerpt||content.preheader||content.intro||`Nouvelle édition de la newsletter ${site.name}.`;return plainText(fallback,400)}
export function campaignHtml(content:CampaignContent){
  const preheader=content.preheader?`<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f4f5f7;">${esc(content.preheader)}</div>`:"";
  const lead=content.lead?`<div style="margin:0;"><h2 style="margin:0 0 10px;font-size:21px;line-height:1.3;color:#111827;">${esc(content.lead.title)}</h2>${content.lead.featuredImage?`<img src="${escapeHtml(absoluteAsset(content.lead.featuredImage))}" alt="${esc(content.lead.title)}" width="536" style="display:block;width:100%;max-width:536px;border:0;border-radius:8px;"/>`:""}<p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#374151;">${esc(content.lead.excerpt||"")}</p>${emailButton({label:"LIRE L’ARTICLE",url:articleUrl(content.lead.slug)})}</div>`:"";
  const items=content.items.length?`<h2 style="margin:28px 0 12px;font-size:16px;color:#111827;">Aussi au sommaire</h2><ul style="margin:0;padding:0 0 0 18px;">${content.items.map(item=>`<li style="margin:0 0 10px;font-size:15px;line-height:1.6;"><a href="${escapeHtml(articleUrl(item.slug))}" style="color:#b91c1c;font-weight:bold;text-decoration:none;">${esc(item.title)}</a></li>`).join("")}</ul>`:"";
  const footer=`<div style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.6;color:#9ca3af;white-space:pre-line;">${escapeHtml(emailFooterText())}</div>${emailNote("Pour gérer vos préférences ou vous désabonner :",{label:"Mon compte",url:`${site.url}/mon-compte`})}`;
  const paragraphs=content.intro?esc(content.intro).split("\n").map(line=>line.trim()).filter(Boolean):[];
  return emailLayout({heading:decodeEntities(content.subject),paragraphs,body:`${preheader}${lead}${items}${footer}`});
}
export async function activeSubscriberEmails(){const rows=await db.newsletterSubscriber.findMany({where:{status:"ACTIVE"},select:{email:true},orderBy:{subscribedAt:"asc"}});return rows.map(row=>row.email)}
export async function queueCampaignDelivery(options:{campaignId:string;createdById:string;recipients:string[]}){
  const campaign=await db.newsletterCampaign.findUnique({where:{id:options.campaignId},include:{leadArticle:true,items:{include:{article:true},orderBy:{position:"asc"}}}});
  if(!campaign)throw new Error("Campagne introuvable.");
  const content=campaignContent(campaign);
  const notification=await db.notification.create({data:{title:campaign.subject,message:campaignPlainText(content),destinationUrl:campaignDestination(content),audience:"ALL",channel:"EMAIL",emailHtml:campaignHtml(content),articleId:campaign.leadArticleId,createdById:options.createdById}});
  const created=await db.notificationDelivery.createMany({data:options.recipients.map(email=>({notificationId:notification.id,channel:"EMAIL",recipientKey:email,status:"PENDING"})),skipDuplicates:true});
  return {notificationId:notification.id,recipients:created.count};
}
