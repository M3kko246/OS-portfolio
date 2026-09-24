import { z } from 'astro/zod';

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export const profileSchema = z.object({
  name: z.string().min(1),
  osName: z.string().min(1),
  initials: z.string().min(1).max(3),
  role: z.string().min(1),
  bioShort: z.string().refine((s) => wordCount(s) <= 20, { error: 'Bio breve: massimo 20 parole' }),
  bioLong: z
    .string()
    .refine((s) => wordCount(s) <= 120, { error: 'Bio lunga: massimo 120 parole' }),
  availability: z.object({ available: z.boolean(), label: z.string().min(1) }),
  email: z.email(),
  languages: z.array(z.object({ name: z.string(), level: z.string() })).min(1),
  socials: z.array(z.object({ label: z.string(), url: z.url() })),
  cv: z.object({ it: z.string().startsWith('/cv/'), en: z.string().startsWith('/cv/').optional() }),
  skills: z.array(z.object({ area: z.string(), items: z.array(z.string()).min(1) })).min(1),
});

export type Profile = z.infer<typeof profileSchema>;

/** Every placeholder is marked [DA COMPILARE] and listed in CONTENT_TODO.md. */
export const profile: Profile = profileSchema.parse({
  name: 'Nome Cognome [DA COMPILARE]',
  osName: 'NomeOS [DA COMPILARE]',
  initials: 'NC',
  role: 'Ruolo [DA COMPILARE]',
  bioShort: 'Una frase su cosa fai e per chi, al massimo venti parole. [DA COMPILARE]',
  bioLong:
    'Chi sei, cosa sai fare meglio, come lavori e che tipo di progetti cerchi. Scrivi in prima persona, con frasi semplici e verbi concreti, al massimo centoventi parole. [DA COMPILARE]',
  availability: { available: true, label: 'Disponibile per nuovi progetti [DA COMPILARE]' },
  email: 'nome@example.com',
  languages: [{ name: 'Lingua [DA COMPILARE]', level: 'Livello [DA COMPILARE]' }],
  socials: [],
  cv: { it: '/cv/CV.pdf' },
  skills: [
    { area: 'Area di competenza [DA COMPILARE]', items: ['Competenza [DA COMPILARE]'] },
    { area: 'Seconda area [DA COMPILARE]', items: ['Competenza [DA COMPILARE]'] },
  ],
});
