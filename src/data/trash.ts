import logoDraft from '@/assets/trash/logo-bozza.png?url';
import wallpaperDraft from '@/assets/trash/sfondo-senza-palette.png?url';

/**
 * What the Cestino holds: real material discarded while building this site. Replace or add
 * your own (an old logo, sketches): CONTENT.md explains how, CONTENT_TODO.md lists what is left.
 */
export type TrashItem =
  | {
      name: string;
      kind: 'image';
      src: string;
      width: number;
      height: number;
      alt: string;
      /** Pixel art is enlarged without smoothing. */
      pixelated: boolean;
      note: string;
    }
  | { name: string; kind: 'text'; text: string; note: string };

export const trash: TrashItem[] = [
  {
    name: 'logo_v1_definitivo.png',
    kind: 'image',
    src: logoDraft,
    width: 16,
    height: 16,
    pixelated: true,
    alt: 'Un quadrato scuro con un quadrato arancione al centro, dentro una cornice.',
    note: 'Una versione quadrata del marchio segnaposto. [DA COMPILARE: una vecchia versione vera del tuo logo]',
  },
  {
    name: 'sfondo_prova.png',
    kind: 'image',
    src: wallpaperDraft,
    width: 480,
    height: 270,
    pixelated: false,
    alt: "L'arcipelago di Carriera visto dall'alto con colori sfumati, prima della riduzione a 16 colori.",
    note: 'Il primo render dello sfondo, prima della riduzione ai 16 colori della palette: troppe sfumature per un sistema a pixel.',
  },
  {
    name: 'idee_scartate.txt',
    kind: 'text',
    note: 'Idee scartate durante la costruzione del sito.',
    text: [
      'Idee scartate',
      '',
      '1. Ombre morbide nel gioco. Nella pixel art sembravano sporco: ora sono nette.',
      "2. Uno sfondo in tinta unita per tutti. Il desktop sembrava vuoto: ora c'è l'arcipelago.",
      "3. Il gioco come unica porta d'ingresso. Chi ha fretta deve trovare tutto anche senza giocare: c'è la versione classica.",
      '4. Curve morbide nelle animazioni della cornice. Il sistema ora si muove a scatti di 40 ms.',
    ].join('\n'),
  },
];
