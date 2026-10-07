export type MapCoordinates = { lat: number; lng: number };

export function extractMapCoordinates(input: string): MapCoordinates | null {
  let text = input;
  for (let i = 0; i < 2; i++) {
    try { text = decodeURIComponent(text); } catch { break; }
  }
  text = text.replace(/&amp;/g, '&');
  // Prefer the selected place's pin over the map viewport (@lat,lng).
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|destination|center)=\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:[&#\s]|$)/i,
    /geo:(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]mlat=(-?\d+(?:\.\d+)?).*?[?&]mlon=(-?\d+(?:\.\d+)?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

export function findMapLink(content: string): string | null {
  const urls = content.match(/https?:\/\/[^\s<>]+/gi) || [];
  for (const candidate of urls) {
    const cleaned = candidate.replace(/[.,;!?]+$/, '');
    try {
      const url = new URL(cleaned);
      const host = url.hostname.toLowerCase();
      if (host === 'maps.app.goo.gl' || (host === 'goo.gl' && url.pathname.startsWith('/maps'))
        || (/^(?:www\.|maps\.)?google\.(?:com|com\.br|co\.uk|pt|es|fr|de)$/.test(host) && (host.startsWith('maps.') || url.pathname.startsWith('/maps')))
        || /^(?:www\.)?openstreetmap\.org$/.test(host)) return cleaned;
    } catch { /* Not a URL. */ }
  }
  return null;
}