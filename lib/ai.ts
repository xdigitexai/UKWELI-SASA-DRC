const base=()=>process.env.DEEPSEEK_BASE_URL||"https://api.deepseek.com";
const key=()=>process.env.DEEPSEEK_API_KEY||"";
const model=()=>process.env.DEEPSEEK_MODEL||"deepseek-flash";
export const aiConfigured=()=>Boolean(key());
export const aiModel=()=>model();
export type Msg={role:"system"|"user"|"assistant";content:string};
export async function chat(messages:Msg[],opts:{maxTokens?:number;temperature?:number}={}):Promise<{text:string;usage?:unknown;model?:string}>{
  if(!aiConfigured())throw new Error("AI_NOT_CONFIGURED");
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),120000);
  try{
    const r=await fetch(`${base()}/chat/completions`,{
      method:"POST",signal:controller.signal,
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${key()}`},
      body:JSON.stringify({model:model(),messages,max_tokens:opts.maxTokens??4000,temperature:opts.temperature??0.7,stream:false}),
    });
    if(!r.ok){const t=await r.text();throw new Error(`AI_HTTP_${r.status}: ${t.slice(0,300)}`)}
    const d=await r.json() as {choices?:{message?:{content?:string}}[];usage?:unknown;model?:string};
    return {text:String(d?.choices?.[0]?.message?.content||""),usage:d?.usage,model:d?.model};
  } finally { clearTimeout(timer) }
}
export function extractJSON(text:string):Record<string,unknown>{
  const fenced=text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw=(fenced?fenced[1]:text).trim();
  const start=raw.indexOf("{"),end=raw.lastIndexOf("}");
  if(start<0||end<0)throw new Error("AI_NO_JSON");
  return JSON.parse(raw.slice(start,end+1)) as Record<string,unknown>;
}
