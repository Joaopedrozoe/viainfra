import { describe, expect, it } from 'vitest';
import { broadcastDeliveryStatuses } from './broadcast-delivery';

describe('broadcast delivery metadata', () => {
  it('ignores missing or malformed metadata without losing valid delivery statuses', () => {
    expect(broadcastDeliveryStatuses([
      { metadata: null },
      { metadata: undefined },
      { metadata: 'invalid' },
      { metadata: {} },
      { metadata: { whatsappMessageId: 'wamid.1', whatsappStatus: 'delivered' } },
    ])).toEqual({ 'wamid.1': 'delivered' });
  });
  it('does not retain a status from a previous empty result', () => {
    expect(broadcastDeliveryStatuses([])).toEqual({});
  });
});