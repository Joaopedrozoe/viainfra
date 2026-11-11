import { describe, expect, it } from 'vitest';
import { permitsValidatedRecipients, whatsappValidationUnavailable } from '../../supabase/functions/broadcast-action/validation';

describe('official WhatsApp broadcast validation', () => {
  it('recognizes only the explicit unsupported-method response', () => {
    expect(whatsappValidationUnavailable(400, JSON.stringify({ message: ['Method not available on WhatsApp Business API'] }))).toBe(true);
    expect(whatsappValidationUnavailable(401, JSON.stringify({ message: ['Method not available on WhatsApp Business API'] }))).toBe(false);
    expect(whatsappValidationUnavailable(400, '{invalid')).toBe(false);
    expect(whatsappValidationUnavailable(400, JSON.stringify({ message: ['Invalid credentials'] }))).toBe(false);
  });
  it('allows format-validated recipients when existence lookup is unavailable', () => {
    expect(permitsValidatedRecipients(['unavailable', 'valid'])).toBe(true);
  });
  it('continues to block invalid, unknown and empty recipient sets', () => {
    expect(permitsValidatedRecipients(['valid', 'invalid'])).toBe(false);
    expect(permitsValidatedRecipients(['unknown'])).toBe(false);
    expect(permitsValidatedRecipients([])).toBe(false);
  });
});