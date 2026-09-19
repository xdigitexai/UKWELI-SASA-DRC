export const site = {
  name: "UKWELISASA.DRC.CD", slogan: "L’info au cœur de l’action",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.ukwelisasa.drc.cd",
  description: "Média congolais indépendant : actualités, enquêtes, analyses et reportages au cœur de la République Démocratique du Congo."
};
export const nav = ["RDC","Politique","Société","Économie","Sécurité","Justice","Santé","Éducation","Environnement","Culture","Sport","Afrique","International","Enquêtes","Interviews","Analyses","Vidéos"];
export function slugify(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
