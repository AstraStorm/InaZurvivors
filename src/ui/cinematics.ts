/**
 * Intro shots, built only from the engine and the project's own text. A `video` shot exists for authorised footage, should
 * that ever be obtained; none is included, and no scene from the games or the anime is used.
 */
export type Shot =
  | { kind: 'text'; text: string; ms: number }
  | { kind: 'cast'; text: string; ms: number }
  | { kind: 'logo'; ms: number }
  | { kind: 'video'; src: string; ms: number };

export const INTRO: Shot[] = [
  { kind: 'text', text: 'Un balón. Un campo de tierra. Un equipo que se niega a rendirse.', ms: 2600 },
  { kind: 'text', text: 'Los rivales llegan en oleadas. Cada supertécnica puede cambiar el partido.', ms: 2600 },
  { kind: 'cast', text: 'Reúne a tus cinco. Sobrevive hasta el pitido final.', ms: 2800 },
  { kind: 'logo', ms: 3400 },
];
