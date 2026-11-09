import { neon } from '@neondatabase/serverless';
import { createHmac } from 'node:crypto';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Please use the privacy request form.'});}
  const allowed=new Set(['https://yasapps.com','https://www.yasapps.com',process.env.SITE_URL]);
  if(process.env.VERCEL_URL)allowed.add(`https://${process.env.VERCEL_URL}`);
  if(process.env.NODE_ENV!=='production')allowed.add('http://localhost:4173');
  if(req.headers.origin&&!allowed.has(req.headers.origin))return res.status(403).json({error:'Please submit the form on yasapps.com.'});
  if(Number(req.headers['content-length']||0)>2048)return res.status(413).json({error:'The request is too large.'});
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return res.status(400).json({error:'Please complete the form.'});}
  if(!body||typeof body!=='object')return res.status(400).json({error:'Please complete the form.'});
  if(body.website)return res.status(200).json({message:'Your privacy request has been received.'});
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  if(email.length>254||!/^[^\s@\x00-\x1f]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)||!['delete','unsubscribe','access'].includes(body.requestType))return res.status(400).json({error:'Enter your email and choose a request type.'});
  if(!process.env.DATABASE_URL||!process.env.RATE_LIMIT_SALT)return res.status(503).json({error:'Requests are temporarily unavailable. Please try again shortly.'});
  try{
    const sql=neon(process.env.DATABASE_URL);
    const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown').split(',')[0];
    const bucket=createHmac('sha256',process.env.RATE_LIMIT_SALT).update(`privacy:${ip}:${Math.floor(Date.now()/3600000)}`).digest('hex');
    const count=await sql`INSERT INTO registration_rate_limits (bucket,attempts,expires_at) VALUES (${bucket},1,now()+interval '2 hours') ON CONFLICT (bucket) DO UPDATE SET attempts=registration_rate_limits.attempts+1 RETURNING attempts`;
    if(count[0].attempts>5){res.setHeader('Retry-After','3600');return res.status(429).json({error:'Please try again in an hour.'});}
    await sql`INSERT INTO privacy_requests (email,request_type) VALUES (${email},${body.requestType})`;
    return res.status(200).json({message:'Your request is saved privately for the Yas Apps owner to review. This form does not send an automatic email.'});
  }catch{console.error('Yas privacy request storage failed.');return res.status(503).json({error:'We couldn’t save the request. Please try again shortly.'});}
}
