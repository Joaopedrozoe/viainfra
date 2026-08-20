Deno.serve(() => new Response(JSON.stringify({ probe: 'v1' }), {
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
}));
