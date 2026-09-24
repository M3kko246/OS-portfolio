# Contenuti da compilare

Ogni voce qui corrisponde a un segnaposto `[DA COMPILARE]` nel sito o nel codice. Quando la compili, cancella la riga.

## Dati personali (PROMPT.md, sezione 0)

- [ ] Nome e cognome
- [ ] Nome del sistema operativo (`[Nome]OS`)
- [ ] Iniziali per il monogramma
- [ ] Ruolo
- [ ] Bio breve (massimo 20 parole)
- [ ] Bio lunga (massimo 120 parole)
- [ ] Disponibilità
- [ ] Email
- [ ] Social (LinkedIn, GitHub, altro)
- [ ] CV in PDF, italiano (e inglese, opzionale)
- [ ] Lingue parlate
- [ ] Foto reale per Chi sono e per l'avatar (oggi la finestra Benvenuto mostra il marchio al posto dell'avatar)

## Contenuti

- [ ] Progetti (da 4 a 8), con i campi della sezione 3.3. Oggi ci sono 6 progetti segnaposto (`src/content/projects/progetto-*.md`) con anni, stato e isole di esempio
- [ ] Copertine e gallerie vere dei progetti (oggi le copertine sono isole disegnate da `scripts/make-placeholders.ts`)
- [ ] Esperienze e formazione
- [ ] Competenze raggruppate per area
- [ ] Album e foto, ognuna con testo alternativo (oggi c'è un album segnaposto con 3 immagini disegnate)
- [ ] CV vero al posto di `public/cv/CV.pdf` (oggi è un PDF segnaposto)
- [ ] Monogramma definitivo sulla griglia 16x16 (`src/design/brand.ts`): serve sapere le iniziali
- [ ] Email vera nel profilo (oggi `nome@example.com`)
- [ ] Testimonianze (opzionali)
- [ ] Materiale scartato vero per il Cestino: una vecchia versione del tuo logo al posto di `logo_v1_definitivo.png` (oggi è una bozza del marchio segnaposto, `src/data/trash.ts`)
- [ ] Dopo aver messo i progetti veri: `pnpm wallpapers` per ridisegnare gli sfondi con le isole giuste

## Prove sui dispositivi reali (T6)

Gli e2e girano su un telefono emulato. Serve una prova vera, da annotare qui con data e modello:

- [ ] iOS Safari: schermata iniziale, dock, app a tutto schermo, tasto Indietro (gesto da bordo sinistro), aree sicure con notch e barra Home
- [ ] Chrome Android: le stesse voci, più il tasto Indietro di sistema
- [ ] Carriera su entrambi: joystick, pulsante Apri o Salta, tocco per camminare, pizzico per lo zoom, fps con `?debug=perf` (obiettivo 30 su un Android medio)
- [ ] Suoni attivi dalla barra di stato: si sentono dopo il primo tocco

## Inglese (T7)

- [ ] Testi inglesi dei progetti in `src/content/projects/en/` (oggi sono segnaposto tradotti)
- [ ] Blocco `en` del profilo in `src/data/profile.ts`
- [ ] Campi `en` di esperienze (`experience.json`) e foto (`photos.json`)
- [ ] CV in inglese, facoltativo (`cv.en` nel profilo)

## Pubblicazione

- [ ] Dominio: impostare `SITE_URL` sull'hosting (oggi URL canonici, sitemap e immagini social puntano a `https://example.com`)
- [ ] Hosting: proposta Cloudflare, da confermare
- [ ] Account Resend e chiave API: `wrangler secret put RESEND_API_KEY`, poi `CONTACT_TO` (la tua email) e, con un dominio verificato, `CONTACT_FROM`. Fino ad allora il modulo Contatti risponde "L'invio dal sito non è ancora attivo" e propone email e `mailto:`
- [ ] Repository GitHub remoto per far girare la CI
