import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import directoryData from "./directory-data.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DirectoryRow {
  phone: string;
  source: string;
  display_name: string | null;
  saved_name: string | null;
  is_my_contact: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const rows = directoryData as DirectoryRow[];
    let inserted = 0;
    const chunkSize = 500;

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase
        .from("contact_directory")
        .upsert(chunk, { onConflict: "phone,source" });
      if (error) {
        console.error(`Chunk ${i} error:`, error.message);
        return new Response(JSON.stringify({ error: error.message, inserted }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      inserted += chunk.length;
    }

    const { count } = await supabase
      .from("contact_directory")
      .select("id", { count: "exact", head: true });

    console.log(`✅ Directory loaded: ${inserted} rows, total ${count}`);

    return new Response(JSON.stringify({ success: true, upserted: inserted, total: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
