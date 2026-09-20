const nf=new Intl.NumberFormat("fr-FR");
const Eye=({size=14}:{size?:number})=><svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>;
export function ViewsCount({views,label=true,className=""}:{views:number;label?:boolean;className?:string}){
  if(!Number.isFinite(views)||views<=0)return null;
  return <span className={`views ${className}`.trim()} title={`${nf.format(views)} vues`}><Eye/>{nf.format(views)}{label&&" vues"}</span>;
}
export function viewsLabel(views:number){return Number.isFinite(views)&&views>0?`${nf.format(views)} vues`:""}
