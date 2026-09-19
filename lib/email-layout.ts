import {site} from "@/lib/site";
export const escapeHtml=(v:string)=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
type Button={label:string;url:string};
export const emailButton=(b:Button)=>`<p style="margin:28px 0;"><a href="${escapeHtml(b.url)}" style="background:#b91c1c;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:15px;font-weight:bold;display:inline-block;">${escapeHtml(b.label)}</a></p>`;
export const emailNote=(text:string,link:Button)=>`<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">${text} <a href="${escapeHtml(link.url)}" style="color:#6b7280;text-decoration:underline;">${escapeHtml(link.label)}</a></p>`;
export function emailLayout(o:{heading:string;paragraphs:string[];body?:string}){
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(o.heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
<tr><td style="background:#111827;padding:28px 32px;">
<div style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:.5px;">${escapeHtml(site.name)}</div>
<div style="color:#9ca3af;font-size:13px;margin-top:6px;">${escapeHtml(site.slogan)}</div>
</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 20px;font-size:22px;color:#111827;">${escapeHtml(o.heading)}</h1>
${o.paragraphs.map(p=>`<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">${p}</p>`).join("")}
${o.body||""}
</td></tr>
<tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:22px 32px;">
<div style="font-size:14px;font-weight:bold;color:#111827;">${escapeHtml(site.name)}</div>
<div style="font-size:13px;color:#6b7280;margin-top:4px;">${escapeHtml(site.slogan)}</div>
<div style="font-size:13px;margin-top:8px;"><a href="${escapeHtml(site.url)}" style="color:#b91c1c;text-decoration:none;">${escapeHtml(site.url)}</a></div>
</td></tr>
</table></td></tr></table></body></html>`;
}
export function emailFooterText(){return `${site.name}\n${site.slogan}\n${site.url}`;}
