import { expect, it } from 'vitest';
import { mergeTemplateCatalog } from '../../supabase/functions/_shared/template-catalog';

it('keeps new templates and uses current Meta approval/header over older Evolution records', () => {
  const rows = mergeTemplateCatalog([
    { name: 'avaliacao', language: 'pt_BR', status: 'PENDING', components: [] },
    { name: 'avaliacao', language: 'pt_BR', status: 'APPROVED', components: [{ type: 'HEADER', format: 'IMAGE' }] },
    { name: 'dia_da_consciencia_negra', language: 'pt_BR', status: 'APPROVED', components: [{ type: 'HEADER', format: 'IMAGE' }] },
  ]);
  expect(rows).toHaveLength(2);
  expect(rows[0].status).toBe('APPROVED');
  expect(rows[0].components[0].format).toBe('IMAGE');
  expect(rows[1].name).toBe('dia_da_consciencia_negra');
});

it('preserves separate languages and ignores nameless records', () => {
  expect(mergeTemplateCatalog([{ name: 'avaliacao', language: 'pt_BR' }, { name: 'avaliacao', language: 'en_US' }, {}])).toHaveLength(2);
});