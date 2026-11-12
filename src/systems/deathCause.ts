/**
 * Defeat screen: what beat the captain, from the hit the scene really recorded (RunResult.death). Nothing is guessed:
 * without a recorded hit there is no cause to show.
 */
import { tr } from '../i18n/i18n';
export interface Death { by: string; attack: string; dmg: number; still?: boolean; at: number }

export function deathCause(d: Death | undefined): { line: string; tip: string } | null {
  if (!d) return null;
  if (d.still) {
    return { line: tr('Has sufrido demasiado daño al permanecer inmóvil: la lluvia de balones te ha alcanzado.'),
      tip: tr('Si te quedas más de 6 segundos en el mismo sitio, llueven balones sobre ti. Muévete aunque no haya rivales cerca.') };
  }
  const who = d.by || tr('un rival');
  switch (d.attack) {
    case 'entrada':
      return { line: tr('Te ha derribado una entrada de {who}.', { who }), tip: tr('Los rivales hacen daño al tocar al capitán: aléjate de los grupos y la formación defensiva reduce un 18% el daño que recibes.') };
    case 'choque':
      return { line: tr('{who} ha arrollado a tu capitán.', { who }), tip: tr('Los jefes y minijefes golpean fuerte al contacto: mantén la distancia y deja que tus compañeros los castiguen.') };
    case 'disparo':
      return { line: tr('Un disparo de {who} ha acabado con tu capitán.', { who }), tip: tr('Los tiradores avisan con una línea roja antes de disparar: sal de ella. Tus compañeros no paran los balones: la formación defensiva reduce el daño que recibes.') };
    case 'explosión':
      return { line: tr('La explosión de {who} ha acabado con tu capitán.', { who }), tip: tr('Los rivales con mecha parpadean antes de explotar: sal del círculo naranja.') };
    case 'lluvia de balones':
      return { line: tr('La lluvia de balones ha acabado con tu capitán.'), tip: tr('Las sombras con borde rojo marcan dónde caerá cada balón.') };
    default:
      return { line: tr('«{attack}» de {who} ha acabado con tu capitán.', { attack: tr(d.attack), who }), tip: tr('Cada ataque de jefe se anuncia con su nombre y una marca en el suelo: aléjate de la zona marcada.') };
  }
}
