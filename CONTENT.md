# Come aggiornare i contenuti

Tutto quello che il sito mostra viene da pochi file. Non serve toccare il codice: modifica i file qui sotto, poi esegui `pnpm verify` per controllare che sia tutto valido. Se qualcosa non va, la build si ferma e ti dice quale campo correggere.

## Profilo

File: `src/data/profile.ts`.

Contiene nome, nome del sistema, iniziali, ruolo, bio breve (massimo 20 parole), bio lunga (massimo 120 parole), disponibilità, email, lingue, social e competenze raggruppate per area. Scrivi solo il testo tra virgolette. Le competenze sono elenchi semplici: niente livelli o percentuali.

## Progetti

Ogni progetto è un file in `src/content/projects/`. Il nome del file diventa l'indirizzo: `app-meteo.md` sarà `/progetti/app-meteo`.

1. Copia un file esistente e rinominalo.
2. Metti le immagini in `src/assets/projects/<nome-del-file>/` (mai in `public/`).
3. Compila i campi in alto, tra le due righe `---`:
   - `title` (massimo 60 caratteri), `tagline` (massimo 90), `summary` (massimo 200);
   - `year`, `role` e, se vuoi, `client`, `duration`, `team`;
   - `status`: `live`, `archived` oppure `in-progress`;
   - `stack`: l'elenco delle tecnologie;
   - `problem` e `approach`: due o tre frasi ciascuno;
   - `outcomes`: al massimo 4 risultati, ognuno con `value`, `label` e, se c'è, `source`. Mai numeri inventati;
   - `cover` (percorso dell'immagine) e `coverAlt` (descrizione per chi non vede l'immagine);
   - `gallery`: altre immagini, ognuna con `src`, `alt` e una `caption` facoltativa;
   - `links.live` e `links.repo`: indirizzi completi, facoltativi;
   - `demo`: `kind: none`, oppure `kind: external` con `url`, oppure `kind: embed` con `url` solo se il sito della demo permette di essere incorporato;
   - `island`: aspetto dell'isola nel gioco. `biome` può essere `meadow`, `sand`, `rock` o `grove`; `landmark` può essere `lighthouse`, `tower`, `workshop`, `observatory`, `windmill` o `dock`;
   - `order`: posizione nella rotta del gioco, 1 per il progetto più vecchio;
   - `featured: true` per metterlo in evidenza, `draft: true` per nasconderlo online.
4. Sotto la seconda riga `---` scrivi il caso studio completo in Markdown, usando titoli `##`. Le immagini mettile nel campo `gallery`, non dentro il testo: il Lettore del sistema mostra il testo, la galleria la mostrano la scheda progetto e l'app Foto.

## Esperienze e formazione

File: `src/content/experience.json`. Ogni voce ha un `id` unico, `kind` (`work` o `education`), `title`, `org`, `start` e `end` nel formato `2024-03` (`end: null` se è in corso), e una `description` di una o due righe.

## Foto

1. Crea una cartella per l'album in `src/assets/photos/`, per esempio `src/assets/photos/viaggi/`.
2. Mettici le immagini.
3. Aggiungi l'album e ogni foto in `src/assets/photos/photos.json`, con `file`, `alt` (obbligatorio) e `caption` (facoltativa).

La build si ferma se una foto non ha il testo alternativo o se il file non esiste. Le versioni pubblicate vengono ricalcolate e perdono i metadati EXIF, comprese le coordinate GPS.

## Testimonianze

File: `src/content/testimonials.json`. È un elenco, vuoto per ora. Ogni voce ha `quote` (al massimo tre righe), `name`, `role` e `company`. Se l'elenco è vuoto la sezione non compare.

## CV

Sostituisci `public/cv/CV.pdf` con il tuo CV. Per aggiungere la versione inglese, metti `public/cv/CV-en.pdf` e compila `cv.en` nel profilo.

## Regole di scrittura

- Niente lineette lunghe o medie: usa punto, virgola, due punti o parentesi. Un test controlla tutti i testi.
- Un'etichetta per ogni azione: `Contattami`, `Scarica CV`, `Avvia Carriera`, `Prova la demo`, `Leggi il caso studio`.
- I segnaposto sono marcati `[DA COMPILARE]` e sono elencati in `CONTENT_TODO.md`.
