import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";
const key=()=>new TextEncoder().encode(process.env.AUTH_SECRET || "development-secret-change-me-now-32chars");
export async function createSession(user:{id:string;role:Role}){const token=await new SignJWT({role:user.role}).setProtectedHeader({alg:"HS256"}).setSubject(user.id).setIssuedAt().setExpirationTime("12h").sign(key());(await cookies()).set("ukweli_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:43200});}
export async function destroySession(){(await cookies()).delete("ukweli_session");}
export async function getSession(){try{const token=(await cookies()).get("ukweli_session")?.value;if(!token)return null;const {payload}=await jwtVerify(token,key());if(!payload.sub)return null;return db.user.findFirst({where:{id:payload.sub,active:true},select:{id:true,name:true,email:true,role:true,slug:true}});}catch{return null;}}
export async function requireRole(roles:Role[]){const user=await getSession();if(!user||!roles.includes(user.role))throw new Error("FORBIDDEN");return user;}
export const canPublish=(role:Role)=>role==="ADMINISTRATEUR"||role==="REDACTEUR_EN_CHEF";
