import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/Sidebar';
import { MobileNavigation } from '@/components/app/MobileNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { broadcastMedia } from '@/lib/broadcast-media';
import { parseRecipients } from '@/lib/broadcast-recipients';
import { broadcastDeliveryStatuses } from '@/lib/broadcast-delivery';
import { Radio, RefreshCw, Send, Upload, FlaskConical, Pause, Play, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type Template = { name:string; language:string; status:string; body:string; variables:number; header_format?:string };
type Run = { id:string; template_name:string; status:string; created_at:string; is_test:boolean };
type Recipient = { id:string; phone:string; status:string; message_id:string|null; error:string|null };
const COMPANY='e3ad9c68-cf12-4e39-a12d-3f3068e975a0';
const statusNames:Record<string,string>={running:'Em andamento',paused:'Pausada',completed:'Processamento concluído',queued:'Na fila',processing:'Processando',accepted:'Aceita pela Meta',review:'Revisar',delivered:'Entregue',read:'Lida',failed:'Falhou',draft:'Preparando'};
async function call(name:string,body:unknown) {
  const {data,error}=await supabase.functions.invoke(name,{body});
  if(error) {
    if(error instanceof FunctionsHttpError) { const text=await error.context.text(); try{throw new Error(JSON.parse(text).error || text);}catch(e){throw e instanceof SyntaxError ? new Error(text) : e;} }
    throw error;
  }
  if(!data?.success) throw new Error(data?.error || 'Não foi possível concluir');
  return data;
}
export default function BroadcastLists() {
  const {company}=useAuth();
  const [params,setParams]=useSearchParams();
  const runId=params.get('run');
  const [templates,setTemplates]=useState<Template[]>([]);
  const [contacts,setContacts]=useState<{id:string;name:string;phone:string|null}[]>([]);
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const [templateKey,setTemplateKey]=useState('');
  const [mediaIndex,setMediaIndex]=useState(0);
  const [numbers,setNumbers]=useState('');
  const [search,setSearch]=useState('');
  const [testPhone,setTestPhone]=useState('');
  const [variables,setVariables]=useState<string[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [validation,setValidation]=useState<{phone:string;status:string}[]>([]);
  const [runs,setRuns]=useState<Run[]>([]);
  const [recipients,setRecipients]=useState<Recipient[]>([]);
  const [delivery,setDelivery]=useState<Record<string,string>>({});
  const fileRef=useRef<HTMLInputElement>(null);
  const sendLock=useRef(false);
  const template=templates.find(t=>`${t.name}|${t.language}`===templateKey);
  const parsed=parseRecipients([numbers,...contacts.filter(c=>selectedIds.includes(c.id)).map(c=>c.phone || '')].join('\n'));
  const allowed=company?.id===COMPANY;
  const loadTemplates=async()=>{
    setBusy(true);setError('');
    try {const data=await call('list-whatsapp-templates',{company_id:COMPANY});setTemplates(data.templates || []);}
    catch(e){setError(String(e));}finally{setBusy(false);}
  };
  useEffect(()=>{
    if(!allowed){setContacts([]);setRuns([]);return;}
    let cancelled=false;
    void loadTemplates();
    void (async()=>{
      const all:typeof contacts=[];
      for(let offset=0;;offset+=1000){
        const {data,error}=await supabase.from('contacts').select('id,name,phone').eq('company_id',COMPANY).not('phone','is',null).order('id').range(offset,offset+999);
        if(error){if(!cancelled)setError(error.message);return;}
        all.push(...(data || []));if(!data || data.length<1000)break;
      }
      if(!cancelled)setContacts(all.sort((a,b)=>a.name.localeCompare(b.name)));
    })();
    return ()=>{cancelled=true;};
  },[allowed]);
  useEffect(()=>{
    if(!allowed)return;
    let cancelled=false;
    const load=async()=>{
      const {data,error}=await supabase.from('broadcast_runs').select('id,template_name,status,created_at,is_test').eq('company_id',COMPANY).order('created_at',{ascending:false}).limit(100);
      if(cancelled)return;if(error){setError(error.message);return;}setRuns(data || []);
      if(runId){
        const {data: rows,error:rError}=await supabase.from('broadcast_recipients').select('id,phone,status,message_id,error').eq('run_id',runId).eq('company_id',COMPANY).order('created_at').limit(500);
        if(cancelled)return;if(rError){setError(rError.message);return;}setRecipients(rows || []);
        const ids=(rows || []).map(r=>r.message_id).filter((v):v is string=>!!v);
        if(ids.length){
          const {data: messages,error:deliveryError}=await supabase.from('messages').select('metadata').in('metadata->>whatsappMessageId',ids);
          if(cancelled)return;
          if(deliveryError){setError(deliveryError.message);return;}
          setDelivery(broadcastDeliveryStatuses(messages || []));
        }else if(!cancelled){setDelivery({});}
      }
    };
    const safelyLoad=async()=>{try{await load();}catch(e){if(!cancelled)setError(`Não foi possível atualizar o histórico: ${String(e)}`);}};
    void safelyLoad();const timer=setInterval(()=>void safelyLoad(),5000);
    return ()=>{cancelled=true;clearInterval(timer);};
  },[allowed,runId]);
  useEffect(()=>{setValidation([]);},[numbers,selectedIds]);
  const absoluteImage=new URL(broadcastMedia[mediaIndex].image,window.location.origin).href;
  const send=async(isTest:boolean)=>{
    if(sendLock.current)return;
    if(!template || template.status!=='APPROVED' || template.header_format!=='IMAGE')return;
    const target=isTest ? parseRecipients(testPhone) : parsed;
    if(target.invalid.length || !target.phones.length || (isTest && target.phones.length!==1)){setError('Informe números válidos; o teste usa somente um destinatário.');return;}
    if(!window.confirm(isTest?`Enviar teste real para ${target.phones[0]}?`:`Enviar ${template.name} com esta imagem para ${target.phones.length} destinatários?`))return;
    sendLock.current=true;setBusy(true);setError('');
    try{const result=await call('broadcast-action',{action:'create',request_id:crypto.randomUUID(),company_id:COMPANY,phones:target.phones,template_name:template.name,language:template.language,image_url:absoluteImage,variables,is_test:isTest});setParams({tab:'history',run:result.run_id});toast.success('Transmissão iniciada. Acompanhe as confirmações da Meta.');}
    catch(e){setError(`${String(e)}. Se persistir, reporte ao suporte com print, empresa, horário e número.`);}finally{sendLock.current=false;setBusy(false);}
  };
  const control=async(action:string)=>{setBusy(true);try{await call('broadcast-action',{action,company_id:COMPANY,run_id:runId});toast.success(action==='pause'?'Transmissão pausada':'Fila retomada');}catch(e){setError(String(e));}finally{setBusy(false);}};
  const selectedRun=runs.find(r=>r.id===runId);
  const finished=recipients.filter(r=>!['queued','processing'].includes(r.status)).length;
  return <SidebarProvider><div className="flex h-screen w-full bg-background"><AppSidebar/><main className="min-w-0 flex-1 overflow-y-auto pb-20"><div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
    <header className="flex items-center gap-3"><Radio className="text-primary"/><h1 className="text-2xl font-semibold">Transmissão · Vialogistic</h1></header>
    {!allowed?<p className="text-muted-foreground">Transmissões disponíveis somente na Vialogistic.</p>:<>
    {error && <div role="alert" className="border-l-4 border-destructive bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-wrap break-words">{error}</div>}
    <Tabs value={params.get('tab') || 'send'} onValueChange={tab=>setParams({tab})}><TabsList><TabsTrigger value="send">Novo envio</TabsTrigger><TabsTrigger value="history">Histórico e progresso</TabsTrigger></TabsList>
    <TabsContent value="send" className="mt-6 space-y-6">
      <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Template e imagem</h2><Button variant="ghost" size="sm" disabled={busy} onClick={loadTemplates}><RefreshCw className="mr-2 h-4 w-4"/>Atualizar Meta</Button></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{broadcastMedia.map((m,i)=><Button key={m.label} variant="outline" onClick={()=>setMediaIndex(i)} className={`h-auto flex-col items-start overflow-hidden p-2 text-left whitespace-normal ${i===mediaIndex?'border-primary ring-1 ring-primary':''}`}><img src={m.image} alt={m.label} className="mb-2 aspect-[4/5] w-full object-contain"/><span className="text-sm">{m.label}</span></Button>)}</div>
      <Label>Template da Meta</Label><Select value={templateKey} onValueChange={key=>{setTemplateKey(key);const t=templates.find(t=>`${t.name}|${t.language}`===key);setVariables(Array(t?.variables || 0).fill(''));}}><SelectTrigger><SelectValue placeholder="Selecionar template com imagem"/></SelectTrigger><SelectContent>{templates.map(t=><SelectItem key={`${t.name}|${t.language}`} value={`${t.name}|${t.language}`} disabled={t.status!=='APPROVED'||t.header_format!=='IMAGE'}>{t.name} · {t.language} · {t.status} · {t.header_format || 'Texto'}</SelectItem>)}</SelectContent></Select>
      {!templates.some(t=>t.header_format==='IMAGE')&&<p className="text-sm text-muted-foreground">Nenhum template com imagem retornado pela Meta nesta conta. Atualize após a aprovação.</p>}
      {template&&<p className="whitespace-pre-wrap text-sm">{template.body}</p>}{variables.map((value,i)=><div key={i}><Label>Variável {i+1}</Label><Input value={value} onChange={e=>setVariables(v=>v.map((old,j)=>j===i?e.target.value:old))}/></div>)}
      </section>
      <section className="space-y-3"><h2 className="font-semibold">Destinatários</h2><Input placeholder="Buscar contatos por nome ou telefone" value={search} onChange={e=>setSearch(e.target.value)}/><div className="max-h-64 overflow-y-auto border-y divide-y">{contacts.filter(c=>`${c.name} ${c.phone}`.toLowerCase().includes(search.toLowerCase())).map(c=><label key={c.id} className="flex cursor-pointer items-center gap-3 py-2"><Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={checked=>setSelectedIds(ids=>checked?[...ids,c.id]:ids.filter(id=>id!==c.id))}/><span className="min-w-0 flex-1 break-words text-sm">{c.name}</span><span className="text-xs text-muted-foreground">{c.phone}</span></label>)}</div>
      <Label>Números separados por vírgula ou uma coluna CSV de celulares</Label><Textarea value={numbers} onChange={e=>setNumbers(e.target.value)} placeholder="11999999999, 11988888888" rows={4}/><input type="file" accept=".csv,text/csv" ref={fileRef} className="hidden" onChange={async e=>{const file=e.target.files?.[0];if(file){if(file.size>2*1024*1024){setError('CSV deve ter até 2 MB');return;}const text=await file.text();setNumbers(v=>`${v}\n${text}`);}e.target.value='';}}/><Button variant="outline" onClick={()=>fileRef.current?.click()}><Upload className="mr-2 h-4 w-4"/>Importar CSV</Button><p className="text-sm">{parsed.phones.length} números únicos · {parsed.invalid.length} inválidos</p>
      <Button variant="outline" disabled={busy||!parsed.phones.length||parsed.phones.length>500} onClick={async()=>{setBusy(true);setError('');try{const data=await call('broadcast-action',{action:'validate',company_id:COMPANY,phones:parsed.phones});setValidation(data.results);}catch(e){setError(String(e));}finally{setBusy(false);}}}>Verificar números no WhatsApp</Button>{validation.length>0&&<div className="max-h-48 overflow-y-auto text-sm">{validation.map(v=><p key={v.phone}>{v.phone} · {v.status==='valid'?'WhatsApp confirmado':v.status==='invalid'?'Não encontrado':'Não confirmado'}</p>)}</div>}
      </section>
      <section className="space-y-3 border-t pt-4"><Label>Número para teste</Label><div className="flex flex-wrap gap-2"><Input className="max-w-xs" value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="Celular com DDD"/><Button variant="outline" disabled={busy||!template||variables.some(v=>!v.trim())} onClick={()=>void send(true)}><FlaskConical className="mr-2 h-4 w-4"/>Enviar teste</Button></div><label className="flex items-center gap-2 text-sm"><Checkbox id="consent" checked={params.get('consent')==='yes'} onCheckedChange={checked=>setParams({tab:'send',...(checked?{consent:'yes'}:{})})}/>Destinatários autorizaram mensagens da Vialogistic</label><Button disabled={busy||!template||!parsed.phones.length||parsed.phones.length>500||parsed.invalid.length>0||params.get('consent')!=='yes'||variables.some(v=>!v.trim())} onClick={()=>void send(false)}><Send className="mr-2 h-4 w-4"/>Iniciar envio ({parsed.phones.length})</Button></section>
    </TabsContent>
    <TabsContent value="history" className="mt-6 space-y-4">{runId?<><Button variant="ghost" onClick={()=>setParams({tab:'history'})}><ArrowLeft className="mr-2 h-4 w-4"/>Voltar ao histórico</Button><h2 className="font-semibold">{selectedRun?.template_name} {selectedRun?.is_test?'· Teste':''}</h2><Badge>{statusNames[selectedRun?.status || ''] || selectedRun?.status}</Badge><Progress value={recipients.length?finished/recipients.length*100:0}/><p className="text-sm">{finished}/{recipients.length} processados</p><div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={()=>void control('pause')}><Pause className="mr-2 h-4 w-4"/>Pausar</Button><Button variant="outline" disabled={busy||selectedRun?.status==='completed'} onClick={()=>void control('resume')}><Play className="mr-2 h-4 w-4"/>Continuar fila</Button></div><div className="divide-y">{recipients.map(r=><div key={r.id} className="py-3 text-sm"><p>{r.phone} · {statusNames[(r.message_id&&delivery[r.message_id])||r.status] || r.status}</p>{r.error&&<p className="mt-1 break-words text-destructive">{r.error} · Reporte ao suporte com print e horário.</p>}<p className="break-all text-xs text-muted-foreground">{r.message_id}</p></div>)}</div></>:runs.length?runs.map(r=><Button key={r.id} variant="outline" className="h-auto w-full flex-wrap justify-between gap-2 py-4" onClick={()=>setParams({tab:'history',run:r.id})}><span>{r.template_name}{r.is_test?' · Teste':''} · {new Date(r.created_at).toLocaleString('pt-BR')}</span><Badge>{statusNames[r.status] || r.status}</Badge></Button>):<p className="text-sm text-muted-foreground">Nenhuma transmissão registrada.</p>}</TabsContent>
    </Tabs></>}
  </div></main><MobileNavigation/></div></SidebarProvider>;
}
