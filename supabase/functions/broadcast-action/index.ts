import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { authorizeCompany } from '../_shared/company-auth.ts';

const COMPANY = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';
const db = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
const schema = z.object({
  action: z.enum(['validate','create','process','pause','resume']), company_id: z.literal(COMPANY),
  run_id: z.string().uuid().optional(), phones: z.array(z.string().regex(/^[1-9]\d{9,14}$/)).max(500).optional(),
  template_name: z.string().regex(/^[a-z0-9_]+$/).max(512).optional(), language: z.string().max(20).optional(),
  image_url: z.string().url().max(2048).optional(), body_preview: z.string().max(4096).optional(),
  variables: z.array(z.string().max(1024)).max(20).optional(), is_test: z.boolean().optional(),
  budget: z.number().int().min(0).max(100).optional(),
});
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers: {...corsHeaders,'Content-Type':'application/json'} });
async function invoke(req: Request, name: string, body: unknown) {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${name}`, {
    method:'POST', headers:{ Authorization:req.headers.get('Authorization') || '', apikey:Deno.env.get('SUPABASE_ANON_KEY') || '', 'Content-Type':'application/json' }, body:JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) throw new Error(data.error || `Erro ${response.status}`);
  return data;
}
async function validate(phones: string[]) {
  const url = Deno.env.get('EVOLUTION_API_URL'); const key = Deno.env.get('EVOLUTION_API_KEY');
  if (!url || !key) throw new Error('Validação WhatsApp indisponível');
  const response = await fetch(`${url.replace(/\/$/,'')}/chat/whatsappNumbers/VIALOGISTIC`, {
    method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify({numbers:phones}),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Validação WhatsApp (${response.status}): ${text.slice(0,300)}`);
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('Não foi possível confirmar os números no WhatsApp');
  return phones.map(phone => { const found = data.find(v => String(v.number).replace(/\D/g,'')===phone); return {phone, status:found ? (found.exists ? 'valid' : 'invalid') : 'unknown'}; });
}
async function process(req: Request, id: string, budget: number) {
  const { data: run } = await db.from('broadcast_runs').select('*').eq('id',id).eq('company_id',COMPANY).single();
  if (!run || run.status !== 'running' || budget <= 0) return;
  const {data: rows, error} = await db.rpc('claim_broadcast_recipients',{p_run:id});
  if (error) throw error;
  for (const row of rows || []) {
    const {data: state} = await db.from('broadcast_runs').select('status').eq('id',id).single();
    if (state?.status !== 'running') { await db.from('broadcast_recipients').update({status:'queued'}).eq('id',row.id); continue; }
    try {
      const {data: contact} = await db.from('contacts').select('id').eq('company_id',COMPANY).eq('phone',row.phone).maybeSingle();
      let contactId = contact?.id;
      if (!contactId) {
        const {data: created,error: creationError} = await db.from('contacts').insert({company_id:COMPANY,name:row.phone,phone:row.phone,metadata:{source:'broadcast'}}).select('id').single();
        if (creationError) { const {data: existing}=await db.from('contacts').select('id').eq('company_id',COMPANY).eq('phone',row.phone).single(); contactId=existing?.id; }
        else contactId=created?.id;
      }
      if (!contactId) throw new Error('Não foi possível identificar o contato');
      const {data: existing} = await db.from('conversations').select('id').eq('company_id',COMPANY).eq('contact_id',contactId).eq('channel','whatsapp').order('created_at',{ascending:false}).limit(1).maybeSingle();
      let conversationId=existing?.id;
      if (!conversationId) {
        const {data: created,error} = await db.from('conversations').insert({company_id:COMPANY,contact_id:contactId,channel:'whatsapp',status:'open',bot_active:false,metadata:{source:'broadcast',instance_name:'VIALOGISTIC'}}).select('id').single();
        if(error) throw error; conversationId=created?.id;
      }
      const result=await invoke(req,'send-whatsapp-template',{conversation_id:conversationId,template_name:run.template_name,language:run.language,variables:run.variables,body_preview:run.body_preview,image_url:run.image_url});
      await db.from('broadcast_recipients').update({status:'accepted',message_id:result.messageId,conversation_id:conversationId}).eq('id',row.id);
    } catch(e) {
      // A timeout may have sent a message: retain uncertainty rather than duplicate it.
      await db.from('broadcast_recipients').update({status:'review',error:String(e)}).eq('id',row.id);
      await db.from('broadcast_runs').update({status:'paused'}).eq('id',id);
    }
  }
  const {count} = await db.from('broadcast_recipients').select('id',{count:'exact',head:true}).eq('run_id',id).eq('status','queued');
  if (!count) { await db.from('broadcast_runs').update({status:'completed'}).eq('id',id).eq('status','running'); return; }
  if (budget > 1) {
    await new Promise(r => setTimeout(r,1000));
    await invoke(req,'broadcast-action',{action:'process',company_id:COMPANY,run_id:id,budget:budget-1});
  }
}
Deno.serve(async req => {
  if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
  try {
    const parsed=schema.safeParse(await req.json()); if(!parsed.success) return reply({success:false,error:'Dados inválidos'},400);
    const input=parsed.data; const userId=await authorizeCompany(req,COMPANY);
    if(input.action==='validate') return reply({success:true,results:await validate(input.phones || [])});
    if(input.action==='create') {
      if(!input.phones?.length || !input.template_name || !input.language || !input.image_url || !input.image_url.startsWith('https://')) return reply({success:false,error:'Escolha template, imagem e destinatários'},400);
      if(input.is_test && input.phones.length!==1) return reply({success:false,error:'O teste envia somente para um número'},400);
      const templates=await invoke(req,'list-whatsapp-templates',{company_id:COMPANY});
      const template=templates.templates.find((t: any)=>t.name===input.template_name&&t.language===input.language);
      if(!template || template.status!=='APPROVED' || template.header_format!=='IMAGE') return reply({success:false,error:'Selecione um template aprovado com cabeçalho de imagem'},400);
      if(template.variables !== (input.variables || []).length) return reply({success:false,error:'Preencha as variáveis do template'},400);
      const checked=await validate([...new Set(input.phones)]);
      if(checked.some(p=>p.status!=='valid')) return reply({success:false,error:'Existem números inválidos ou não confirmados no WhatsApp'},400);
      const {data: run,error} = await db.from('broadcast_runs').insert({company_id:COMPANY,created_by:userId,template_name:input.template_name,language:input.language,image_url:input.image_url,body_preview:template.body,variables:input.variables || [],status:'draft',is_test:input.is_test || false}).select().single();
      if(error) throw error;
      const {error: recipientError}=await db.from('broadcast_recipients').insert(checked.map(p=>({run_id:run.id,company_id:COMPANY,phone:p.phone})));
      if(recipientError) throw recipientError;
      await db.from('broadcast_runs').update({status:'running'}).eq('id',run.id);
      EdgeRuntime.waitUntil(process(req,run.id,100).catch(async e=>{ await db.from('broadcast_runs').update({status:'paused'}).eq('id',run.id); console.error('Broadcast paused',String(e)); }));
      return reply({success:true,run_id:run.id});
    }
    if(!input.run_id) return reply({success:false,error:'Transmissão não informada'},400);
    if(input.action==='pause' || input.action==='resume') {
      await db.from('broadcast_runs').update({status:input.action==='pause'?'paused':'running'}).eq('id',input.run_id).eq('company_id',COMPANY);
    }
    if(input.action!=='pause') EdgeRuntime.waitUntil(process(req,input.run_id,input.budget ?? 100).catch(e=>console.error(String(e))));
    return reply({success:true});
  }catch(e){ return reply({success:false,error:String(e)},String(e).includes('AUTH_REQUIRED')?401:String(e).includes('COMPANY_FORBIDDEN')?403:400); }
});