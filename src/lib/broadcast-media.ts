import presentation from '@/assets/broadcast/presentation.png.asset.json';
import solutions from '@/assets/broadcast/solutions.png.asset.json';
import benefits from '@/assets/broadcast/benefits.png.asset.json';
import water from '@/assets/broadcast/water-truck.png.asset.json';
import munck from '@/assets/broadcast/munck.png.asset.json';
import safety from '@/assets/broadcast/safety.png.asset.json';
export const broadcastMedia = [
  { label: '1 Apresentação', image: presentation.url },
  { label: '2 Conheça nossas soluções', image: solutions.url },
  { label: '3 Você sabia? Caminhão pipa', image: water.url },
  { label: '4 Segurança no transporte', image: safety.url },
  { label: '5 Conheça nosso Munck', image: munck.url },
  { label: '6 Disponibilidade da frota', image: benefits.url },
];
// Match approved names explicitly; unrelated templates have no default image.
const templateMediaNames = [
  ['apresentao', 'apresentacao', 'apresetao'],
  ['conhea_nossas_solues', 'conheca_nossas_solucoes'],
  ['voc_sabia_caminho_pipa', 'voce_sabia_caminhao_pipa', 'voce_sabia_caminho_pipa'],
  ['segurana_no_transporte', 'seguranca_no_transporte'],
  ['conhea_nosso_munck', 'conheca_nosso_munck'],
  ['disponibilidade_da_frota'],
];
export function broadcastMediaIndexForTemplate(name: string): number | null {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_?\d+$/, '').replace(/^_|_$/g, '');
  const index = templateMediaNames.findIndex(names => names.includes(normalized));
  return index < 0 ? null : index;
}
