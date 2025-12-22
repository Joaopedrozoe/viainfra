import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')!
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')!
  const instanceName = 'VIAINFRAOFICIAL'

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { phones, groupJids } = await req.json()
    
    const results: any[] = []
    
    // Audit each phone number
    for (const phone of phones || []) {
      console.log(`\n📱 Auditing phone: ${phone}`)
      
      // Get DB conversation
      const { data: dbConv } = await supabase
        .from('conversations')
        .select(`
          id,
          metadata,
          updated_at,
          contacts!inner(name, phone)
        `)
        .eq('contacts.phone', phone)
        .maybeSingle()
      
      // Get DB messages count
      let dbMessages: any[] = []
      let dbMsgCount = 0
      if (dbConv) {
        const { data: msgs, count } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_type, metadata', { count: 'exact' })
          .eq('conversation_id', dbConv.id)
          .order('created_at', { ascending: false })
          .limit(10)
        
        dbMessages = msgs || []
        dbMsgCount = count || 0
      }
      
      // Try multiple JID formats to find messages in API
      const jidFormats = [
        `${phone}@s.whatsapp.net`,
        phone
      ]
      
      let apiMessages: any[] = []
      let apiMsgCount = 0
      let workingJid = ''
      
      for (const jid of jidFormats) {
        try {
          const response = await fetch(
            `${evolutionApiUrl}/chat/findMessages/${instanceName}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
              },
              body: JSON.stringify({
                where: { key: { remoteJid: jid } },
                limit: 50
              }),
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            if (Array.isArray(data) && data.length > 0) {
              apiMessages = data
              apiMsgCount = data.length
              workingJid = jid
              console.log(`  ✅ Found ${data.length} messages via JID: ${jid}`)
              break
            }
          }
        } catch (e) {
          console.log(`  ❌ Error with JID ${jid}: ${e.message}`)
        }
      }
      
      // Compare newest messages
      const newestApiMsg = apiMessages[0]
      const newestDbMsg = dbMessages[0]
      
      // Calculate missing
      const apiNewestDate = newestApiMsg?.messageTimestamp 
        ? new Date(Number(newestApiMsg.messageTimestamp) * 1000)
        : null
      const dbNewestDate = newestDbMsg?.created_at 
        ? new Date(newestDbMsg.created_at)
        : null
      
      const getContent = (msg: any) => {
        if (!msg) return null
        if (msg.message?.conversation) return msg.message.conversation
        if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text
        if (msg.message?.imageMessage) return '[Imagem]'
        if (msg.message?.videoMessage) return '[Vídeo]'
        if (msg.message?.audioMessage) return '[Áudio]'
        if (msg.message?.documentMessage) return '[Documento]'
        return '[Outro tipo]'
      }
      
      results.push({
        phone,
        contactName: dbConv?.contacts?.name || 'NÃO ENCONTRADO',
        conversationId: dbConv?.id || null,
        remoteJid: dbConv?.metadata?.remoteJid || workingJid,
        db: {
          messageCount: dbMsgCount,
          newestMessage: newestDbMsg?.content?.substring(0, 100) || null,
          newestDate: dbNewestDate?.toISOString() || null
        },
        api: {
          messageCount: apiMsgCount,
          newestMessage: getContent(newestApiMsg)?.substring(0, 100) || null,
          newestDate: apiNewestDate?.toISOString() || null,
          workingJid
        },
        status: apiMsgCount > dbMsgCount ? '⚠️ FALTAM MENSAGENS' : 
                apiNewestDate && dbNewestDate && apiNewestDate > dbNewestDate ? '⚠️ DESATUALIZADO' :
                '✅ OK',
        missingCount: Math.max(0, apiMsgCount - dbMsgCount)
      })
    }
    
    // Audit each group
    for (const groupJid of groupJids || []) {
      console.log(`\n👥 Auditing group: ${groupJid}`)
      
      // Get DB conversation
      const { data: dbConv } = await supabase
        .from('conversations')
        .select(`
          id,
          metadata,
          updated_at,
          contacts(name)
        `)
        .eq('metadata->>remoteJid', groupJid)
        .maybeSingle()
      
      // Get DB messages
      let dbMessages: any[] = []
      let dbMsgCount = 0
      if (dbConv) {
        const { data: msgs, count } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_type', { count: 'exact' })
          .eq('conversation_id', dbConv.id)
          .order('created_at', { ascending: false })
          .limit(10)
        
        dbMessages = msgs || []
        dbMsgCount = count || 0
      }
      
      // Get API messages
      let apiMessages: any[] = []
      try {
        const response = await fetch(
          `${evolutionApiUrl}/chat/findMessages/${instanceName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
              where: { key: { remoteJid: groupJid } },
              limit: 50
            }),
          }
        )
        
        if (response.ok) {
          apiMessages = await response.json()
          console.log(`  ✅ Found ${apiMessages.length} messages in group`)
        }
      } catch (e) {
        console.log(`  ❌ Error fetching group: ${e.message}`)
      }
      
      const newestApiMsg = apiMessages[0]
      const newestDbMsg = dbMessages[0]
      
      const apiNewestDate = newestApiMsg?.messageTimestamp 
        ? new Date(Number(newestApiMsg.messageTimestamp) * 1000)
        : null
      const dbNewestDate = newestDbMsg?.created_at 
        ? new Date(newestDbMsg.created_at)
        : null
      
      const getContent = (msg: any) => {
        if (!msg) return null
        if (msg.message?.conversation) return msg.message.conversation
        if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text
        if (msg.message?.imageMessage) return '[Imagem]'
        return '[Outro]'
      }
      
      results.push({
        phone: null,
        groupJid,
        contactName: dbConv?.contacts?.name || 'GRUPO NÃO ENCONTRADO',
        conversationId: dbConv?.id || null,
        db: {
          messageCount: dbMsgCount,
          newestMessage: newestDbMsg?.content?.substring(0, 100) || null,
          newestDate: dbNewestDate?.toISOString() || null
        },
        api: {
          messageCount: apiMessages.length,
          newestMessage: getContent(newestApiMsg)?.substring(0, 100) || null,
          newestDate: apiNewestDate?.toISOString() || null
        },
        status: apiMessages.length > dbMsgCount ? '⚠️ FALTAM MENSAGENS' :
                apiNewestDate && dbNewestDate && apiNewestDate > dbNewestDate ? '⚠️ DESATUALIZADO' :
                '✅ OK',
        missingCount: Math.max(0, apiMessages.length - dbMsgCount)
      })
    }
    
    // Summary
    const problems = results.filter(r => r.status !== '✅ OK')
    
    return new Response(JSON.stringify({
      success: true,
      totalAudited: results.length,
      problemsFound: problems.length,
      results,
      summary: {
        ok: results.filter(r => r.status === '✅ OK').length,
        missing: results.filter(r => r.status.includes('FALTAM')).length,
        outdated: results.filter(r => r.status.includes('DESATUALIZADO')).length
      }
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
