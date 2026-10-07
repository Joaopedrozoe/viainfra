import { supabase } from '@/integrations/supabase/client';
import { extractMapCoordinates, type MapCoordinates } from '../../supabase/functions/_shared/maps-location';
export { extractMapCoordinates, findMapLink } from '../../supabase/functions/_shared/maps-location';

// Share in-flight lookups across bubbles; bound cache and expire failures.
const cache = new Map<string, { expires: number; result: Promise<MapCoordinates | null> }>();
export function resolveMapCoordinates(url: string): Promise<MapCoordinates | null> {
  const direct = extractMapCoordinates(url);
  if (direct) return Promise.resolve(direct);
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) return cached.result;
  const result = supabase.functions.invoke('resolve-map-link', { body: { url } })
    .then(({ data, error }) => {
      const point = data?.coordinates;
      if (error || !point || typeof point.lat !== 'number' || typeof point.lng !== 'number') return null;
      return extractMapCoordinates(`geo:${point.lat},${point.lng}`);
    }).catch(() => null);
  if (cache.size >= 100) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(url, { expires: Date.now() + 60000, result });
  return result;
}