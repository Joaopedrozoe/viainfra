import { describe, it, expect } from 'vitest';
import { parseRecipients } from './broadcast-recipients';
describe('broadcast recipient import', () => {
  it('accepts comma-separated numbers and deduplicates normalized phones', () => {
    expect(parseRecipients('11918752320,+55 (11) 91875-2320').phones).toEqual(['5511918752320']);
  });
  it('imports CSV phone column including quoted numbers', () => {
    expect(parseRecipients('celular\n"11918752320"\n"11970748166"').phones).toEqual(['5511918752320','5511970748166']);
  });
  it('rejects invalid phone strings', () => {
    expect(parseRecipients('123,sem número').invalid).toEqual(['123','sem número']);
  });
});