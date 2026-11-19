import { describe, expect, it } from 'vitest';
import { broadcastMedia, broadcastMediaIndexForTemplate } from './broadcast-media';
import presentation from '@/assets/broadcast/presentation.png.asset.json';
import solutions from '@/assets/broadcast/solutions.png.asset.json';
import benefits from '@/assets/broadcast/fleet-availability.png.asset.json';
import water from '@/assets/broadcast/water-truck-v2.png.asset.json';
import munck from '@/assets/broadcast/munck.png.asset.json';
import safety from '@/assets/broadcast/transport-image-four.png.asset.json';
import consciousness from '@/assets/broadcast/black-consciousness-day.png.asset.json';
import review from '@/assets/broadcast/customer-review.png.asset.json';

describe('Vialogistic template images', () => {
  const cases = [
    ['apresentao', presentation.url],
    ['conhea_nossas_solues', solutions.url],
    ['voc_sabia_caminho_pipa', water.url],
    ['segurana_no_transporte', safety.url],
    ['conhea_nosso_munck', munck.url],
    ['disponibilidade_da_frota', benefits.url],
    ['dia_da_consciencia_negra', consciousness.url],
    ['avaliacao', review.url],
  ];
  for (const [name, image] of cases) {
    it(`${name} selects its own image`, () => {
      const index = broadcastMediaIndexForTemplate(name);
      expect(index === null ? undefined : broadcastMedia[index]?.image).toBe(image);
    });
  }
  it('recognizes the presentation numbered alias without a first-image fallback', () => {
    expect(broadcastMediaIndexForTemplate('apresetao1')).toBe(0);
    expect(broadcastMediaIndexForTemplate('hello_world')).toBeNull();
  });
});