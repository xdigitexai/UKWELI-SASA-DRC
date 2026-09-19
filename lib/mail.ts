import nodemailer from "nodemailer";
import {site} from "@/lib/site";
const port = Number(process.env.SMTP_PORT || 465);
export const mailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
export const mailAddress = () => process.env.SMTP_FROM || process.env.SMTP_USER || "";
export const mailSenderName = () => process.env.SMTP_FROM_NAME || site.name;
export const mailFrom = () => {const address=mailAddress(),name=mailSenderName();return address&&name?`"${name}" <${address}>`:address};
const transporter = mailConfigured
  ? nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:port===465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}})
  : null;
export async function sendMail(mail:{to:string;subject:string;text:string;html?:string;replyTo?:string}){
  if(!transporter)return false;
  try{await transporter.sendMail({from:mailFrom(),...mail});return true}
  catch(error){console.error("[mail] envoi échoué:",error);return false}
}
