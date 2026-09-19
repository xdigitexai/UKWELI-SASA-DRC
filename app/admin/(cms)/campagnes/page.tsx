import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import type {Role} from "@prisma/client";
import {db} from "@/lib/db";
import {requireRole} from "@/lib/auth";
import {activeSubscriberEmails,articleUrl,plainText,queueCampaignDelivery} from "@/lib/campaigns";
const ROLES:Role[]=["ADMINISTRATEUR","REDACTEUR_EN_CHEF"];
const BASE="/admin/campagnes";
const STATUS_LABELS:Record<string,string>={DRAFT:"Brouillon",SCHEDULED:"Programmée",SENDING:"En cours d’envoi",SENT:"Envoyée",FAILED:"Échec"};
const notice=(message:string)=>`${BASE}?message=${encodeURIComponent(message)}`;
const parseDate=(value:FormDataEntryValue|null)=>{const raw=String(value||"").trim();if(!raw)return null;const date=new Date(raw);return Number.isNaN(date.getTime())?null:date};
const isFuture=(date:Date|null)=>Boolean(date&&date.getTime()>Date.now());
const isEmail=(value:string)=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
const toInput=(date:Date)=>new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
export default async function Campagnes({searchParams}:{searchParams:Promise<{message?:string}>}){
await requireRole(ROLES);
const noticeText=(await searchParams).message;
async function createCampaign(data:FormData){"use server";
const user=await requireRole(ROLES);
const subject=plainText(String(data.get("subject")||""),200);
if(!subject)redirect(notice("L’objet de la campagne est obligatoire."));
const scheduledAt=parseDate(data.get("scheduledAt"));
const campaign=await db.newsletterCampaign.create({data:{subject,preheader:plainText(String(data.get("preheader")||""),300)||null,intro:plainText(String(data.get("intro")||""),2000)||null,leadArticleId:String(data.get("leadArticleId")||"").trim()||null,scheduledAt,status:isFuture(scheduledAt)?"SCHEDULED":"DRAFT",createdById:user.id}});
await db.auditLog.create({data:{userId:user.id,action:"CAMPAIGN_CREATED",entity:"NewsletterCampaign",entityId:campaign.id,details:{status:campaign.status}}});
revalidatePath(BASE);redirect(notice("Campagne créée. Ajoutez les articles secondaires, puis vérifiez l’aperçu avant l’envoi."));}
async function updateCampaign(data:FormData){"use server";
const user=await requireRole(ROLES);
const id=String(data.get("id")||""),subject=plainText(String(data.get("subject")||""),200);
if(!subject)redirect(notice("L’objet de la campagne est obligatoire."));
await db.newsletterCampaign.update({where:{id},data:{subject,preheader:plainText(String(data.get("preheader")||""),300)||null,intro:plainText(String(data.get("intro")||""),2000)||null,leadArticleId:String(data.get("leadArticleId")||"").trim()||null}});
await db.auditLog.create({data:{userId:user.id,action:"CAMPAIGN_UPDATED",entity:"NewsletterCampaign",entityId:id,details:{subject}}});
revalidatePath(BASE);redirect(notice("Campagne mise à jour."));}
async function addItems(data:FormData){"use server";
const user=await requireRole(ROLES);
const id=String(data.get("id")||"");
const selected=data.getAll("articles").map(value=>String(value)).filter(Boolean);
const campaign=await db.newsletterCampaign.findUnique({where:{id},include:{items:true}});
if(!campaign)redirect(notice("Campagne introuvable."));
const existing=new Set(campaign.items.map(item=>item.articleId));
const highest=await db.newsletterCampaignItem.aggregate({where:{campaignId:id},_max:{position:true}});
let position=(highest._max.position??-1)+1,added=0;
for(const articleId of selected){
if(articleId===campaign.leadArticleId||existing.has(articleId))continue;
await db.newsletterCampaignItem.create({data:{campaignId:id,articleId,position}});
existing.add(articleId);position++;added++}
if(added)await db.auditLog.create({data:{userId:user.id,action:"CAMPAIGN_ITEMS_ADDED",entity:"NewsletterCampaign",entityId:id,details:{added}}});
revalidatePath(BASE);redirect(notice(added?`${added} article(s) ajouté(s) aux articles secondaires.`:"Aucun nouvel article à ajouter (sélection vide, article principal ou article déjà présent)."));}
async function moveItem(data:FormData){"use server";
const user=await requireRole(ROLES);
const id=String(data.get("id")||""),up=String(data.get("direction")||"")==="up";
const item=await db.newsletterCampaignItem.findUnique({where:{id}});
if(!item)redirect(notice("Article introuvable dans cette campagne."));
const rows=await db.newsletterCampaignItem.findMany({where:{campaignId:item.campaignId},orderBy:{position:"asc"}});
const index=rows.findIndex(row=>row.id===id);
const neighbour=up?rows[index-1]:rows[index+1];
if(neighbour)await db.$transaction([db.newsletterCampaignItem.update({where:{id},data:{position:neighbour.position}}),db.newsletterCampaignItem.update({where:{id:neighbour.id},data:{position:item.position}})]);
await db.auditLog.create({data:{userId:user.id,action:"CAMPAIGN_ITEM_MOVED",entity:"NewsletterCampaign",entityId:item.campaignId,details:{direction:up?"up":"down"}}});
revalidatePath(BASE);redirect(notice(neighbour?"Ordre des articles mis à jour.":"Cet article est déjà en première ou dernière position."));}
async function removeItem(data:FormData){"use server";
const user=await requireRole(ROLES);
const id=String(data.get("id")||"");
const item=await db.newsletterCampaignItem.findUnique({where:{id}});
if(!item)redirect(notice("Article introuvable dans cette campagne."));
await db.newsletterCampaignItem.delete({where:{id}});
await db.auditLog.create({data:{userId:user.id,action:"CAMPAIGN_ITEM_REMOVED",entity:"NewsletterCampaign",entityId:item.campaignId,details:{articleId:item.articleId}}});
revalidatePath(BASE);redirect(notice("Article retiré de la campagne."));}
async function setLead(data:FormData){"use server";
const user=await requireRole(ROLES);
const id=String(data.get("id")||""),articleId=String(data.get("articleId")||"").trim();
await db.newsletterCampaign.update({where:{id},data:{leadArticleId:articleId||null}});
if(articleId)await db.newsletterCampaignItem.deleteMany({where:{campaignId:id,articleId}});
await db.auditLog.create({data:{userId:user.id,action:"CAMPAIGN_LEAD_SET",entity:"NewsletterCampaign",entityId:id,details:{articleId}}});
revalidatePath(BASE);redirect(notice(articleId?"Article principal défini. Il a été retiré des articles secondaires pour éviter un doublon.":"Article principal retiré."));}
async function scheduleCampaign(data:FormData){"use server";
const user=await requireRole(ROLES);
const id=String(data.get("id")||""),scheduledAt=parseDate(data.get("scheduledAt"));
if(scheduledAt&&!isFuture(scheduledAt))redirect(notice("La date de programmation doit être dans le futur."));
await db.newsletterCampaign.update({where:{id},data:{scheduledAt,status:scheduledAt?"SCHEDULED":"DRAFT"}});
await db.auditLog.create({data:{userId:user.id,action:scheduledAt?"CAMPAIGN_SCHEDULED":"CAMPAIGN_UNSCHEDULED",entity:"NewsletterCampaign",entityId:id,details:{scheduledAt:scheduledAt?scheduledAt.toISOString():null}}});
revalidatePath(BASE);redirect(notice(scheduledAt?"Programmation enregistrée : aucune livraison n’est créée à ce stade. L’envoi reste à déclencher manuellement.":"Programmation supprimée : la campagne repasse en brouillon."));}
async function deleteCampaign(data:FormData){"use server";
const user=await requireRole(ROLES);
const id=String(data.get("id")||"");
await db.newsletterCampaign.delete({where:{id}});
await db.auditLog.create({data:{userId:user.id,action:"CAMPAIGN_DELETED",entity:"NewsletterCampaign",entityId:id}});
revalidatePath(BASE);redirect(notice("Campagne supprimée."));}
async function sendTest(data:FormData){"use server";
const user=await requireRole(ROLES);
const id=String(data.get("id")||""),email=String(data.get("email")||"").trim();
if(!isEmail(email))redirect(notice("Adresse email de test invalide."));
const queued=await queueCampaignDelivery({campaignId:id,createdById:user.id,recipients:[email]});
await db.auditLog.create({data:{userId:user.id,action:"CAMPAIGN_TEST_QUEUED",entity:"NewsletterCampaign",entityId:id,details:{email,recipients:queued.recipients}}});
revalidatePath(BASE);redirect(notice(`Test mis en file d’attente pour ${email} : ${queued.recipients} livraison(s). Aucun abonné n’a été contacté et le statut de la campagne est inchangé.`));}
async function sendNow(data:FormData){"use server";
const user=await requireRole(ROLES);
const id=String(data.get("id")||"");
if(String(data.get("confirm")||"")!=="confirm")redirect(notice("Envoi annulé : la confirmation explicite est requise."));
const campaign=await db.newsletterCampaign.findUnique({where:{id}});
if(!campaign)redirect(notice("Campagne introuvable."));
if(campaign.status==="SENDING"||campaign.status==="SENT")redirect(notice("Cette campagne a déjà été mise en file d’attente : aucun nouvel envoi n’a été créé."));
if(isFuture(campaign.scheduledAt))redirect(notice("Envoi refusé : cette campagne est programmée dans le futur. Supprimez la programmation pour envoyer immédiatement."));
const emails=await activeSubscriberEmails();
if(!emails.length)redirect(notice("Envoi refusé : aucun abonné actif, aucune livraison créée."));
const queued=await queueCampaignDelivery({campaignId:id,createdById:user.id,recipients:emails});
await db.newsletterCampaign.update({where:{id},data:{status:"SENDING",sentAt:new Date(),scheduledAt:null,recipients:queued.recipients,sentNotificationId:queued.notificationId}});
await db.auditLog.create({data:{userId:user.id,action:"CAMPAIGN_SENT",entity:"NewsletterCampaign",entityId:id,details:{recipients:queued.recipients,notificationId:queued.notificationId}}});
revalidatePath(BASE);redirect(notice(`Campagne mise en file d’attente : ${queued.recipients} livraison(s) créée(s). L’envoi effectif est assuré par le planificateur d’emails existant.`));}
const [campaigns,published,activeSubscribers]=await Promise.all([db.newsletterCampaign.findMany({include:{leadArticle:{select:{title:true,slug:true}},items:{include:{article:{select:{title:true,slug:true}}},orderBy:{position:"asc"}}},orderBy:{createdAt:"desc"},take:50}),db.article.findMany({where:{status:"PUBLISHED"},select:{id:true,title:true,slug:true},orderBy:{publishedAt:"desc"},take:100}),activeSubscriberEmails()]);
return <><h1>Campagnes newsletter</h1>
{noticeText?<div className="empty compact">{noticeText}</div>:null}
<form action={createCampaign} className="form-grid"><label>Objet<input name="subject" required maxLength={200}/></label><label>Preheader<input name="preheader" maxLength={300}/></label><label className="full">Introduction<textarea name="intro" rows={4}/></label><label>Article principal<select name="leadArticleId"><option value="">Aucun</option>{published.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></label><label>Programmer<input name="scheduledAt" type="datetime-local"/></label><p className="full">La programmation est enregistrée telle quelle : elle ne déclenche pas d’envoi automatique. À l’heure prévue, un opérateur doit lancer « Envoyer maintenant ».</p><button className="button">Créer la campagne</button></form>
<section className="admin-panel"><header><h2>Campagnes</h2><span>{activeSubscribers.length} abonné(s) actif(s)</span></header>
{campaigns.length?<div className="table-wrap"><table className="table"><thead><tr><th>Objet</th><th>Statut</th><th>Destinataires</th><th>Créée le</th><th>Actions</th></tr></thead><tbody>
{campaigns.map(c=><tr key={c.id}><td><strong>{c.subject}</strong><br/><small>{c.leadArticle?`Principal : ${c.leadArticle.title}`:"Aucun article principal — destination : page d’accueil du site"}</small><br/><small>{c.leadArticle?articleUrl(c.leadArticle.slug):""}</small></td><td>{STATUS_LABELS[c.status]||c.status}<br/><small>{c.sentAt?`Envoyée le ${c.sentAt.toLocaleString("fr-CD")}`:c.scheduledAt?`Programmée : ${c.scheduledAt.toLocaleString("fr-CD")}`:"Non envoyée"}</small></td><td>{c.recipients}</td><td>{c.createdAt.toLocaleString("fr-CD")}</td><td>
<a className="button secondary" href={`/api/admin/campaigns/preview?id=${c.id}`} target="_blank" rel="noopener noreferrer">Aperçu</a>
<details><summary>Envoyer un test</summary><form action={sendTest}><input type="hidden" name="id" value={c.id}/><label>Adresse de test<input name="email" type="email" required/></label><p>Une seule livraison est créée, pour cette adresse uniquement. Le statut de la campagne ne change pas.</p><button className="button">Envoyer le test</button></form></details>
<details><summary>Envoyer maintenant</summary><form action={sendNow}><input type="hidden" name="id" value={c.id}/><p>Cette action crée une notification et une livraison pour chacun des {activeSubscribers.length} abonné(s) actif(s). L’envoi effectif est assuré par le planificateur d’emails existant.</p><button className="button" name="confirm" value="confirm">Confirmer l’envoi à tous les abonnés actifs</button></form></details>
<details><summary>Programmer ou déprogrammer</summary><form action={scheduleCampaign}><input type="hidden" name="id" value={c.id}/><label>Date et heure<input name="scheduledAt" type="datetime-local" defaultValue={c.scheduledAt?toInput(c.scheduledAt):""}/></label><p>Champ vide = retour en brouillon.</p><button>Enregistrer la programmation</button></form></details>
<form action={deleteCampaign}><input type="hidden" name="id" value={c.id}/><button>Supprimer</button></form>
</td></tr>)}
</tbody></table></div>:<div className="empty compact">Aucune campagne pour le moment.</div>}
</section>
<section className="admin-panel"><header><h2>Composition</h2><span>Article principal, articles secondaires et ordre</span></header>
{campaigns.length?campaigns.map(c=><details key={c.id}><summary>{c.subject} — {c.items.length} article(s) secondaire(s)</summary>
<form action={updateCampaign} className="form-grid"><input type="hidden" name="id" value={c.id}/><label>Objet<input name="subject" defaultValue={c.subject} required maxLength={200}/></label><label>Preheader<input name="preheader" defaultValue={c.preheader||""} maxLength={300}/></label><label className="full">Introduction<textarea name="intro" rows={4} defaultValue={c.intro||""}/></label><label>Article principal<select name="leadArticleId" defaultValue={c.leadArticleId||""}><option value="">Aucun</option>{published.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></label><button className="button">Enregistrer</button></form>
{c.items.length?<div className="table-wrap"><table className="table"><thead><tr><th>Position</th><th>Article secondaire</th><th>Actions</th></tr></thead><tbody>
{c.items.map((item,index)=><tr key={item.id}><td>{index+1}</td><td>{item.article.title}<br/><small>{articleUrl(item.article.slug)}</small></td><td>
<form action={moveItem}><input type="hidden" name="id" value={item.id}/><button name="direction" value="up" disabled={index===0}>Monter</button> <button name="direction" value="down" disabled={index===c.items.length-1}>Descendre</button></form>
<form action={setLead}><input type="hidden" name="id" value={c.id}/><input type="hidden" name="articleId" value={item.articleId}/><button>Définir comme principal</button></form>
<form action={removeItem}><input type="hidden" name="id" value={item.id}/><button>Retirer</button></form>
</td></tr>)}
</tbody></table></div>:<div className="empty compact">Aucun article secondaire. Les articles ajoutés ci-dessous apparaissent dans l’ordre de sélection.</div>}
<form action={addItems}><input type="hidden" name="id" value={c.id}/><fieldset><legend>Ajouter des articles publiés</legend>{published.length?published.filter(a=>a.id!==c.leadArticleId&&!c.items.some(item=>item.articleId===a.id)).map(a=><label key={a.id}><input type="checkbox" name="articles" value={a.id}/> {a.title}</label>):<p>Aucun article publié disponible.</p>}</fieldset><button className="button">Ajouter la sélection</button></form>
</details>):<div className="empty compact">Créez une campagne pour composer son contenu.</div>}
</section></>}
