import Link from "next/link";import {ViewsCount} from "./ViewsCount";
type A={slug:string;title:string;excerpt:string;featuredImage:string|null;publishedAt:Date|null;category:{name:string;slug:string};author?:{name:string};_count?:{views:number}};
export function ArticleCard({article:a}: {article:A}){
  const views=a._count?.views||0;
  return <article className="card">{a.featuredImage&&<Link href={`/article/${a.slug}`}><img loading="lazy" src={a.featuredImage} alt=""/></Link>}<span className="kicker">{a.category.name}</span><h3><Link href={`/article/${a.slug}`}>{a.title}</Link></h3><p>{a.excerpt}</p><div className="meta">{a.publishedAt&&new Intl.DateTimeFormat("fr-CD",{dateStyle:"medium"}).format(a.publishedAt)}{a.author&&` · ${a.author.name}`}{views>0&&<> · <ViewsCount views={views}/></>}</div></article>;
}
