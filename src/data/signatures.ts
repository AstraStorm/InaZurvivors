/**
 * Fix 1.22: the technique each footballer is known for, shown in the gacha cinematic. By default it is the most
 * powerful one of their kind (stops for goalkeepers, shots for the rest); this table only corrects the cases where
 * the numbers do not match the saga (keyed by name, so every version of the player follows it).
 */
export const SIGNATURE: Record<string, string> = {
  'Paolo Bianchi': 'Espada de Odín',
};
