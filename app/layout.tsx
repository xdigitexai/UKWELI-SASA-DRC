import type {Metadata,Viewport} from "next";import "./globals.css";import {site} from "@/lib/site";
export const metadata:Metadata={metadataBase:new URL(site.url),title:{default:`${site.name} — ${site.slogan}`,template:`%s | ${site.name}`},description:site.description,applicationName:site.name,openGraph:{type:"website",locale:"fr_CD",siteName:site.name},twitter:{card:"summary_large_image"},alternates:{canonical:"/"},manifest:"/manifest.webmanifest"};
export const viewport:Viewport={themeColor:"#102a43"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}<script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`}}/></body></html>}
