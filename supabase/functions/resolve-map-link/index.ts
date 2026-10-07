import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { extractMapCoordinates, findMapLink } from '../_shared/maps-location.ts';

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
const allowed = (url: URL) => url.protocol === 'https:' && !url.username && !url.password
  && (!url.port || url.port === '443') && findMapLink(url.href) === url.href;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return reply({ error: 'Unauthorized' }, 401);
  const client = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_ANON_KEY') || '');
  const { data, error } = await client.auth.getUser(auth.slice(7));
  if (error || !data.user) return reply({ error: 'Unauthorized' }, 401);
  try {
    const body = await req.json();
    if (typeof body.url !== 'string' || body.url.length > 4096) return reply({ error: 'Invalid URL' }, 400);
    let url = new URL(body.url);
    const signal = AbortSignal.timeout(8000);
    for (let hop = 0; hop < 5; hop++) {
      if (!allowed(url)) return reply({ error: 'Invalid map host' }, 400);
      const coordinates = extractMapCoordinates(url.href);
      if (coordinates) return reply({ coordinates });
      const response = await fetch(url.href, { redirect: 'manual', signal });
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        const location = response.headers.get('location');
        if (!location) break;
        url = new URL(location, url);
        continue;
      }
      if (!response.ok || !response.body) { await response.body?.cancel(); break; }
      // Read a bounded page, never proxy its content or follow arbitrary hosts.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let html = '';
      let bytes = 0;
      while (bytes < 512000) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        html += decoder.decode(chunk.value, { stream: true });
      }
      await reader.cancel();
      const pin = html.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
      const resolved = pin ? extractMapCoordinates(pin[0]) : null;
      return reply({ coordinates: resolved });
    }
    return reply({ coordinates: null });
  } catch {
    return reply({ coordinates: null });
  }
});