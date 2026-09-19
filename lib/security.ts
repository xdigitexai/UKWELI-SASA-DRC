import crypto from "node:crypto";
import sanitizeHtml from "sanitize-html";
export const cleanText=(v:string,max=5000)=>sanitizeHtml(v,{allowedTags:[],allowedAttributes:{}}).trim().slice(0,max);
export const cleanArticle=(v:string)=>sanitizeHtml(v,{allowedTags:["h2","h3","p","strong","em","a","ul","ol","li","blockquote","img","figure","figcaption","iframe","table","thead","tbody","tr","th","td","hr","br"],allowedAttributes:{a:["href","target","rel"],img:["src","alt","loading","width","height"],iframe:["src","title","loading","allowfullscreen"],td:["colspan","rowspan"],th:["colspan","rowspan"]},allowedIframeHostnames:["www.youtube.com","player.vimeo.com"],transformTags:{a:sanitizeHtml.simpleTransform("a",{rel:"noopener noreferrer"})}});
export const hashValue=(v:string)=>crypto.createHash("sha256").update(`${process.env.AUTH_SECRET || "dev"}:${v}`).digest("hex");
export function clientIp(headers:Headers){return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";}
