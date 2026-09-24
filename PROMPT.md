# [NOME_OS]: portfolio come sistema operativo pixel giocabile

Prompt di progetto per Claude Code. Salvalo nella radice del repository come `PROMPT.md`.

Lingue di lavoro: rispondimi in italiano. Codice, nomi di file, identificatori, commenti e messaggi di commit in inglese. Tutti i testi visibili nell'interfaccia in italiano (con struttura pronta per l'inglese).

---

## 0. Dati da compilare prima di iniziare

Tutto ciò che è tra parentesi quadre è un segnaposto. Se un dato manca, non inventarlo: usa un segnaposto realistico marcato `[DA COMPILARE]` e registralo in `CONTENT_TODO.md`.

| Chiave | Valore |
|---|---|
| NOME_COGNOME | [Nome Cognome] |
| NOME_OS | [Nome]OS (nome del sistema operativo, usato in boot, menu Avvio, titolo pagina) |
| RUOLO | [es. Frontend developer, Product designer, 3D artist] |
| BIO_BREVE | [massimo 20 parole] |
| BIO_LUNGA | [massimo 120 parole] |
| DISPONIBILITÀ | [Disponibile per nuovi progetti / Non disponibile fino a mese anno] |
| EMAIL | [indirizzo] |
| SOCIAL | [LinkedIn, GitHub, Dribbble, Behance, altro: URL] |
| CV | [percorso PDF italiano] e [percorso PDF inglese, opzionale] |
| PROGETTI | da 4 a 8, ognuno con i campi della sezione 3.3 |
| FOTO | album e immagini, ognuna con testo alternativo |
| ESPERIENZE e FORMAZIONE | ruolo, organizzazione, periodo, 1-2 righe |
| COMPETENZE | raggruppate per area |
| TESTIMONIANZE | opzionali, massimo 3 righe ciascuna, con nome, ruolo, azienda |
| DOMINIO e HOSTING | [es. nome.it su Netlify, Vercel o Cloudflare Pages] |

---

## 1. Ruolo, obiettivo, regole di lavoro

### 1.1 Chi sei
Sei un senior creative developer e design engineer. Scrivi codice di produzione, tipizzato, testato e accessibile, e hai gusto visivo. Quando una scelta tecnica e una scelta estetica sono in conflitto, trovi la soluzione che non sacrifica nessuna delle due, e se non esiste me la segnali.

### 1.2 Obiettivo
Costruire il mio portfolio come una pagina web che si comporta come un piccolo sistema operativo in stile pixel, quasi un videogioco: si usa come un vero OS (desktop, icone, finestre, cartelle Foto, Progetti, CV, Contatti, Terminale). I progetti si esplorano avviando il gioco **Carriera**: un omino in 3D a basso numero di poligoni cammina tra isole, e ogni isola è un progetto. Chi apre il sito deve pensare "questo ne sa", ma deve anche trovare in pochi secondi tutto ciò che un portfolio serio deve dare.

### 1.3 Criteri di successo misurabili
1. Entro 5 secondi dall'apertura sono visibili nome, ruolo, un modo per contattarmi e il pulsante per il CV, senza dover interagire.
2. Ogni informazione del gioco è raggiungibile anche senza giocare (cartella Progetti, versione classica, pagine statiche dei progetti).
3. Lighthouse su `/classica` e `/progetti/[slug]`: Performance ≥ 95, Accessibilità 100, Best Practices ≥ 95, SEO 100. Su `/` (sistema): Performance ≥ 85, Accessibilità ≥ 95.
4. Core Web Vitals su `/`: LCP < 2,0 s (profilo mobile 4G simulato), CLS < 0,05, INP < 200 ms.
5. Carriera: 60 fps stabili su un portatile con GPU integrata di fascia media, almeno 30 fps su un Android di fascia media.
6. Usabile interamente da tastiera, con lettore di schermo sulle parti non 3D, e con `prefers-reduced-motion` rispettato ovunque.
7. Zero errori in console, zero avvisi di TypeScript in modalità strict, zero violazioni axe critiche o serie.

### 1.4 Come lavori
1. **Fase 0, solo pianificazione.** Leggi tutto questo file. Poi rispondimi con: piano per tappe (sezione 5), albero delle cartelle, elenco delle dipendenze con versione verificata, rischi tecnici, massimo 5 domande aperte. Non scrivere codice finché non confermo.
2. **Versioni verificate, non ricordate.** Prima di installare qualunque pacchetto controlla l'ultima versione stabile (`npm view <pacchetto> version`) e la compatibilità tra pacchetti (React, React Three Fiber, drei, Astro). Se la major installata differisce da quella citata qui, segui la documentazione ufficiale di quella versione, non gli snippet di questo file. Gli snippet indicano l'intento, i documenti ufficiali indicano la sintassi.
3. **Una tappa alla volta.** Alla fine di ogni tappa esegui typecheck, lint, test e build, poi mandami un resoconto breve: cosa è fatto, cosa manca, come verificarlo a mano. Un commit per tappa con Conventional Commits.
4. **Crea e mantieni `CLAUDE.md`** con convenzioni, comandi, struttura e decisioni prese, così le sessioni future partono allineate.
5. **Crea `CONTENT.md`**: guida per me su come aggiungere un progetto, una foto o un'esperienza senza toccare il codice.
6. **Nessuna invenzione sui miei dati.** Numeri, clienti e risultati finti vanno marcati come segnaposto sia nel contenuto sia in `CONTENT_TODO.md`.
7. **Niente lavoro a metà nascosto.** Nessun `TODO` nel codice senza voce corrispondente in `CONTENT_TODO.md` o nel resoconto di tappa.

### 1.5 Skill
Se nel tuo ambiente sono installate queste skill, leggi il loro `SKILL.md` prima della tappa corrispondente: `frontend-design`, `design-taste-frontend`, `high-end-visual-design` (prima della parte visiva), `imagegen-frontend-web`, `imagegen-frontend-mobile`, `brandkit` (prima di generare immagini o il marchio). La sezione 4 riassume già le regole che si applicano a questo progetto. Dove questo file e una skill divergono, vince questo file: il brief vince sempre sulle impostazioni predefinite di una skill.

---

## 2. Esperienza utente

### 2.1 Principi non negoziabili
1. **Doppio binario.** Il gioco è il secondo livello, mai l'unica porta. Chi ha fretta usa cartelle, menu Avvio o versione classica.
2. **Mai bloccare.** Avvio saltabile con qualunque tasto o clic. Nessun audio senza consenso. Nessuna schermata di accesso con password.
3. **Ogni contenuto ha un indirizzo.** Ogni progetto e ogni applicazione si può aprire da un link condivisibile.
4. **Un solo mondo.** Sistema e gioco condividono palette, tipografia, suoni e idea portante (sezione 4.2), così sembrano la stessa cosa.
5. **Il dettaglio è il messaggio.** Il "wow" nasce dalla cura: finestre che si agganciano ai bordi, animazioni che partono dall'icona, terminale che funziona davvero, stato che si ricorda.

### 2.2 Contenuti essenziali di un portfolio (tutti obbligatori salvo indicazione)
Identità (nome, ruolo, foto o avatar), proposta di valore in una frase, progetti selezionati con caso studio (problema, approccio, risultato, ruolo, stack, link), competenze raggruppate, percorso (esperienze e formazione), CV scaricabile, contatti e social, disponibilità, foto, lingue parlate. Opzionali: testimonianze, riconoscimenti, scritti o talk.

### 2.3 Avvio
- Prima visita della sessione: schermata di avvio di massimo 1,8 s. Dal primo fotogramma mostra il marchio personale, `[NOME_COGNOME]` e `[RUOLO]` come testo HTML reale (è anche l'elemento LCP). Poi 3 o 4 righe di diagnostica generate dai contenuti veri, ad esempio "Progetti trovati: 6", "Foto trovate: 42", "Avvio del desktop". Nessuna battuta forzata.
- Qualunque tasto, clic o tocco salta l'avvio. Link sempre visibile "Vai alla versione classica".
- Visite successive nella stessa sessione (`sessionStorage`): solo una dissolvenza a scatti di 300 ms. Con movimento ridotto: nessuna animazione.
- Questa è l'unica sequenza orchestrata del sito. Tutto il resto del movimento risponde ad azioni dell'utente.

### 2.4 Desktop
- Icone: `Leggimi.txt`, `Carriera`, `Progetti`, `Foto`, `Chi sono`, `CV.pdf`, `Contatti`, `Terminale`, e `Cestino` in basso a destra.
- Alla prima visita si apre da sola la finestra **Benvenuto** (da `Leggimi.txt`): avatar, "Ciao, sono [Nome].", ruolo, bio breve, tre pulsanti in quest'ordine: `Avvia Carriera` (primario), `Scarica CV`, `Contattami`. Sotto, un suggerimento: "Doppio clic sulle icone per aprirle. Ctrl+K per cercare." Casella "Mostra all'avvio".
- Mouse: clic singolo seleziona, doppio clic apre. Tastiera: frecce per muoversi tra le icone (roving tabindex), Invio apre. Touch: tocco singolo apre.
- Trascinando su un'area vuota compare il rettangolo di selezione multipla. Le icone si trascinano e si agganciano a una griglia; la posizione viene salvata.
- Menu contestuale del desktop (clic destro o tasto Menu): `Cambia sfondo`, `Disponi icone`, `Impostazioni`, `Informazioni su [NOME_OS]`.
- Sfondo in pixel art che rappresenta l'arcipelago di Carriera visto da lontano, con 4 varianti per momento della giornata (sezione 4.10).

### 2.5 Barra delle applicazioni e menu Avvio
- Barra in basso: pulsante `Avvio` con il marchio personale, pulsanti delle finestre aperte (clic: porta in primo piano o riduce), area di sistema con indicatore di disponibilità (unico pallino colorato ammesso, perché è uno stato reale), audio, lingua, orologio locale del visitatore.
- Menu Avvio: applicazioni, poi `Scarica CV`, `Contattami`, `Versione classica`, `Impostazioni`, `Spegni`.
- `Spegni`: dissolvenza a scatti, messaggio "Ora puoi chiudere la scheda in sicurezza." e pulsante `Riaccendi`. Nessun effetto sull'URL.
- `Ctrl+K` o `Cmd+K`: finestra **Esegui**, una ricerca unica su applicazioni, progetti, foto e comandi, navigabile da tastiera.

### 2.6 Gestore finestre
- Trascinamento dalla barra del titolo, ridimensionamento da 8 maniglie, dimensione minima per applicazione, barra del titolo mai fuori dallo schermo.
- Pulsanti `Riduci a icona`, `Ingrandisci` o `Ripristina`, `Chiudi`, con nome accessibile. Doppio clic sulla barra del titolo ingrandisce o ripristina.
- Aggancio: trascinando al bordo sinistro o destro la finestra occupa metà schermo, al bordo superiore si ingrandisce. Durante il trascinamento compare un contorno di anteprima.
- Clic su una finestra la porta in primo piano. La finestra attiva ha la barra del titolo scura, le altre chiara.
- Apertura e chiusura con animazione "a rettangoli" dall'icona di origine alla finestra (sezione 4.9).
- Applicazioni singole (Impostazioni, Terminale, Chi sono) si riaprono al posto di duplicarsi. I progetti hanno una finestra per progetto.
- Nessuna scorciatoia che il browser o il sistema intercettano (niente Alt+F4, Ctrl+W, Ctrl+Shift+W, F6). Esc chiude solo menu e dialoghi transitori.

### 2.7 Applicazioni

| Id | Nome visibile | Cosa fa |
|---|---|---|
| `welcome` | Benvenuto | Sezione 2.4. |
| `career` | Carriera | Il gioco, sezione 2.8. |
| `explorer` | Progetti | Esplora risorse sul file system virtuale (sezione 3.8). |
| `project` | nome del progetto | Scheda del progetto. |
| `reader` | Lettore | Mostra documenti in Markdown già convertiti in HTML (casi studio). |
| `demo` | Navigatore | Browser retrò che incorpora la demo di un progetto. |
| `photos` | Foto | Galleria e visualizzatore. |
| `about` | Chi sono | Profilo, competenze, percorso. |
| `cv` | CV.pdf | Visualizzatore PDF e download. |
| `mail` | Contatti | Modulo di contatto e link. |
| `terminal` | Terminale | Shell con comandi reali sul file system virtuale. |
| `settings` | Impostazioni | Preferenze del sistema. |
| `trash` | Cestino | Piccole sorprese. |
| `pixel` | Pixel | Opzionale, tappa bonus: mini editor 32x32 con esportazione PNG. |
| `mines` | Campo minato | Opzionale, tappa bonus. |

Dettagli:

- **Progetti (explorer).** Barra dell'indirizzo con percorso stile `~/progetti/nome`, pannello laterale con posizioni rapide, viste Icone, Elenco, Dettagli, ordinamento per anno o nome. Ogni progetto è una cartella con: `Leggimi.md` (apre il caso studio nel Lettore), `demo.lnk` (apre il Navigatore, se esiste una demo), `foto/` (apre Foto sull'album del progetto), `codice.url` (apre il repository in una nuova scheda con `rel="noopener noreferrer"`). Doppio clic sulla cartella apre la scheda `project`.
- **Scheda progetto (project).** Copertina, titolo, sottotitolo, dati raggruppati (anno, ruolo, cliente, durata, team), stack come etichette, sezioni Problema, Approccio, Risultati (massimo 4, con fonte se disponibile), galleria. Azioni, una per intento: `Prova la demo`, `Leggi il caso studio`, `Visita l'isola` (apre Carriera e ci porta l'omino), `Codice`, `Copia link`.
- **Navigatore (demo).** Cornice da browser retrò: indirizzo in sola lettura, `Ricarica`, `Apri in una nuova scheda`. Incorpora la demo con `iframe` solo se il contenuto la dichiara incorporabile, altrimenti mostra un'anteprima e il pulsante per aprirla fuori.
- **Foto.** Album come cartelle, griglia, visualizzatore con frecce, scorrimento su touch, zoom, didascalia. Ogni immagine si carica prima come versione minuscola ingrandita a pixel (segnaposto coerente con lo stile), poi passa alla versione piena. Le foto vere restano nitide: il contrasto tra cornice pixel e contenuto reale è voluto.
- **Chi sono.** Finestra a schede come un pannello "Proprietà": `Generale` (avatar, foto reale, nome, ruolo, bio lunga, disponibilità, lingue), `Competenze` (albero espandibile per area, stile "gestione dispositivi"; niente barre di livello), `Percorso` (esperienze e formazione in ordine cronologico inverso), `Riconoscimenti` solo se ci sono contenuti.
- **CV.** Su desktop incorpora il PDF con il visualizzatore del browser, su mobile offre direttamente il download. Pulsante `Scarica CV` sempre visibile.
- **Contatti.** Finestra stile client di posta: campi Nome, Email, Oggetto, Messaggio con etichetta sopra il campo ed errore sotto. Stati: vuoto, invio in corso, inviato, errore con spiegazione e alternativa (`Copia email`, link `mailto:`). A lato: email con pulsante copia, social.
- **Terminale.** Comandi: `help`, `whoami`, `ls`, `cd`, `pwd`, `cat`, `open <app|file>`, `progetti`, `cv`, `contatti`, `info` (scheda stile "neofetch" con il marchio in ASCII e i miei dati), `theme giorno|notte|auto`, `lang it|en`, `history`, `clear`, `date`, `echo`, `exit`, `sudo` (risponde "Permesso negato."). Completamento con Tab su comandi e percorsi, cronologia con frecce, Ctrl+L pulisce, Ctrl+C annulla la riga. I nomi di file nell'output sono cliccabili.
- **Impostazioni.** Tema (Auto, Giorno, Notte), Sfondo, Suoni (spenti di default) e volume, Scala dell'interfaccia (Auto, Grande), Movimento (Auto, Ridotto), Effetto CRT (spento di default), Retinatura nel gioco, Qualità grafica (Auto, Alta, Bassa), Lingua, Cursore pixel (spento di default), `Ripristina tutto`.
- **Cestino.** Due o tre file con materiale scartato vero (una vecchia versione del logo, bozze). `Svuota cestino` apre un dialogo che rifiuta con garbo. Aprirlo sblocca un traguardo.

### 2.8 Carriera, il gioco
**Idea.** Un arcipelago visto dall'alto in prospettiva isometrica. L'omino parte dall'isola **Porto** e il percorso segue la mia carriera: le isole sono disposte in ordine cronologico lungo una rotta, collegate da ponti di legno. L'ultima isola è in costruzione e porta ai contatti. Il percorso è quindi anche una sequenza narrativa: aggancio, prove, azione.

**Isole.**
- `Porto` (partenza): cartello con i controlli, capanna che apre `Chi sono`, cassetta delle lettere che apre `Contatti`.
- Una isola per progetto, generata in modo deterministico dal contenuto: bioma (prato, sabbia, roccia, boschetto), monumento che rappresenta il tipo di progetto (faro, torre, officina, osservatorio, mulino, molo), un totem con uno schermo che mostra la copertina del progetto come texture a pixel.
- `Prossima isola`: impalcature, cartello "Il prossimo progetto potrebbe essere il tuo" e pulsante `Contattami`.

**Controlli.**
- Tastiera: WASD o frecce (relative alla camera), Maiusc per correre, Spazio per saltare, E o Invio per interagire, Z e C (oppure pulsanti a schermo) per ruotare la camera di 90°, rotella per lo zoom a scatti, Esc per chiudere il pannello o aprire la pausa.
- Mouse: clic su un punto calpestabile, l'omino ci va seguendo ponti e isole.
- Touch: joystick virtuale in basso a sinistra, pulsante azione in basso a destra, tocco per camminare, pizzico per lo zoom.
- Gamepad (opzionale): levetta sinistra e tasto A.

**Interfaccia di gioco (HTML sopra il canvas, stile pixel).**
- In alto a sinistra: "Carriera" e "Isole visitate 2/6".
- In alto a destra: `Mappa`, audio, `Impostazioni`, `Schermo intero`, `Esci`.
- In basso a sinistra: suggerimento sui controlli che scompare dopo il primo movimento.
- In basso al centro: avviso di prossimità "Premi E per aprire [Progetto]" (su touch diventa il pulsante `Apri`).
- Pannello del progetto: foglio laterale a destra su desktop (il mondo resta visibile), foglio dal basso su mobile. Contiene titolo, anno, ruolo, sintesi in 2 righe, fino a 3 risultati, copertina, azioni `Prova la demo`, `Leggi il caso studio`, `Codice`. Le azioni che aprono finestre del sistema escono prima dallo schermo intero.
- `Mappa`: elenco di isole con anno e titolo, navigabile da tastiera. Scegliendo un'isola l'omino ci cammina da solo; con movimento ridotto, o se il percorso è lungo, avviene un teletrasporto con dissolvenza a scatti.
- Pausa: `Riprendi`, `Mappa`, `Impostazioni grafiche`, `Esci al desktop`.

**Caricamento.** Il gioco è in un pacchetto separato caricato solo all'avvio di Carriera, con barra di avanzamento pixel basata sull'avanzamento reale.

**Ripiego.** Se WebGL non è disponibile o il contesto si perde, la finestra mostra: "Questo dispositivo non riesce a mostrare la grafica 3D. Puoi vedere gli stessi progetti nella cartella Progetti." con il pulsante `Apri Progetti`.

### 2.9 Collegamenti tra sistema e gioco, traguardi
- `Visita l'isola` nella scheda progetto apre Carriera con l'omino davanti a quell'isola.
- Di notte, sullo sfondo del desktop, le isole già visitate hanno una luce accesa.
- Traguardi (massimo 5), notificati con un avviso pixel in basso a destra e salvati localmente: `Esploratore` (tutte le isole visitate), `Curioso` (primo comando nel Terminale), `Archeologo` (Cestino aperto), `Nottambulo` (visita di notte), `Veterano` (terza visita). Ogni traguardo sblocca un oggetto cosmetico: uno sfondo, un cappello per l'omino, un tema del terminale.

### 2.10 Modalità palmare (viewport sotto 768 px)
- Il sistema diventa un palmare retrò: barra di stato in alto (ora, audio, disponibilità), schermata iniziale a griglia di icone in 4 colonne, dock con `Carriera`, `Progetti`, `Contatti`, `Chi sono`.
- Le applicazioni si aprono a tutto schermo con barra superiore (`Indietro`, titolo). Aprire un'applicazione esegue `history.pushState`, quindi il tasto Indietro del telefono la chiude.
- Carriera suggerisce l'orientamento orizzontale ma funziona anche in verticale.
- Rispetto delle aree sicure con `env(safe-area-inset-*)` e `viewport-fit=cover`, altezze con `100dvh`, mai `100vh`. Bersagli di tocco di almeno 44x44 px.
- Da tablet in su si usa il desktop anche con il touch. In Impostazioni si può forzare una delle due modalità.

### 2.11 Versione classica e pagine statiche
- `/classica`: tutto il portfolio in una pagina semantica, leggibile, stampabile (CSS di stampa), senza JavaScript necessario. Stessa palette e tipografia, zero effetti. È la versione per chi ha fretta, per i lettori di schermo e per i motori di ricerca.
- `/progetti/[slug]`: una pagina statica per progetto con caso studio completo, dati strutturati e immagine per la condivisione. Pulsante `Apri in [NOME_OS]` che porta a `/?progetto=slug`.
- `404`: finestra di errore di sistema "File non trovato" con pulsanti `Torna al desktop` e `Versione classica`.
- `<noscript>` su `/` con link alla versione classica.

### 2.12 Indirizzi e condivisione
- `/?app=<id>` apre un'applicazione, `/?progetto=<slug>` apre la scheda del progetto, `/?app=career&isola=<slug>` apre il gioco su un'isola.
- Su desktop l'URL si aggiorna con `history.replaceState` quando cambia la finestra principale in primo piano. Su palmare con `pushState` (sezione 2.10).
- `Copia link` copia sempre l'URL della pagina statica `/progetti/[slug]`, che ha l'anteprima per i social.

---

## 3. Architettura tecnica

### 3.1 Stack e motivazioni

| Livello | Scelta | Perché |
|---|---|---|
| Framework | **Astro** (major stabile corrente) con output statico e integrazione React | Sito ricco di contenuti con una sola grande isola interattiva; pagine statiche per SEO; collezioni di contenuti tipizzate; pipeline immagini inclusa. |
| UI del sistema | **React** (major corrente) montato con `client:only="react"` | Il sistema dipende da finestra, dimensioni e memoria locale: non ha senso renderizzarlo sul server. |
| Linguaggio | **TypeScript** in modalità `strict`, `noUncheckedIndexedAccess` attivo | Correttezza. |
| Stato | **Zustand** con middleware `persist` versionato | Leggero, selettori granulari, niente re-render a cascata. |
| Stili | **CSS nativo con token semantici** + **Tailwind v4** per layout (plugin Vite `@tailwindcss/vite`, token esposti con `@theme inline`) | Un solo sistema di token per chiaro e scuro; nessun uso del variant `dark:`. |
| Animazioni UI | **Motion** (`motion/react`) con `LazyMotion` e `m`, oppure CSS con `steps()` | Animazioni a scatti coerenti con lo stile, bundle contenuto. |
| 3D | **three**, **@react-three/fiber**, **@react-three/drei** (versioni compatibili tra loro e con React: verifica) | Ecosistema maturo, componibile con React. |
| Post-processing | `EffectComposer`, `RenderPixelatedPass`, `OutputPass`, `ShaderPass` da `three/addons` | Look pixel con bordi, controllo totale della pipeline. |
| Audio | **ZzFX** (suoni sintetizzati in codice, nessun file audio) | Pochi byte, stile chiptune. |
| Icone UI | **pixelarticons** (una sola famiglia) | Libreria pixel, niente icone disegnate a mano. |
| Modulo contatti | Endpoint Astro su richiesta + **Resend** | Nessun servizio terzo lato client, chiavi solo sul server. |
| Qualità | ESLint (typescript-eslint), Prettier, Vitest, Playwright, @axe-core/playwright, Lighthouse CI | Sezione 3.17. |
| Package manager | pnpm, Node LTS attiva fissata in `.nvmrc` e `engines` | Riproducibilità. |

### 3.2 Struttura del repository
```
.
├─ CLAUDE.md  CONTENT.md  CONTENT_TODO.md  PROMPT.md
├─ astro.config.mjs  tsconfig.json  package.json  .nvmrc
├─ public/
│  ├─ cv/                      # PDF del CV
│  ├─ sprites/                 # PNG pixel art già quantizzati (output dello script)
│  └─ fonts/                   # woff2 in sottoinsieme
├─ scripts/
│  ├─ quantize-sprites.ts      # forza la palette a 16 colori sugli sprite
│  └─ check-photos.ts          # ogni foto deve avere alt text
├─ src/
│  ├─ content.config.ts
│  ├─ content/
│  │  ├─ projects/*.md
│  │  ├─ experience.json
│  │  └─ testimonials.json
│  ├─ data/profile.ts          # profilo tipizzato e validato
│  ├─ assets/                  # immagini sorgente (mai in public/)
│  ├─ design/palette.ts        # unica fonte della palette (CSS e shader)
│  ├─ styles/tokens.css  global.css
│  ├─ pages/
│  │  ├─ index.astro           # sistema operativo
│  │  ├─ classica.astro
│  │  ├─ progetti/[slug].astro
│  │  ├─ data/projects/[slug].json.ts   # dettaglio progetto per il sistema
│  │  ├─ data/photos.json.ts
│  │  ├─ api/contact.ts        # prerender = false
│  │  └─ 404.astro
│  ├─ os/
│  │  ├─ kernel/               # store, registro app, file system virtuale, url sync, hotkeys
│  │  ├─ shell/                # Boot, Desktop, Taskbar, StartMenu, Window, ContextMenu, RunDialog, Handheld
│  │  ├─ apps/<id>/            # manifest.ts + componente
│  │  ├─ ui/                   # primitive pixel: Button, Bevel, Field, Tabs, ScrollArea, Toast
│  │  └─ lib/                  # sound, i18n, pixel-scale, a11y
│  └─ game/
│     ├─ CareerGame.tsx        # radice Canvas
│     ├─ world/                # Islands, Bridges, Water, Sky, Landmarks
│     ├─ player/               # Omino, controller, camera
│     ├─ fx/                   # PixelPipeline, PaletteQuantizePass
│     ├─ logic/                # walkable.ts, layout.ts, pathfinding.ts, input.ts
│     └─ hud/
└─ tests/  e2e/
```

### 3.3 Modello dei contenuti
Schema indicativo con la Content Layer API di Astro 5. Se la versione installata ha un'API diversa, adatta la sintassi mantenendo i campi e i vincoli.

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(60),
      tagline: z.string().max(90),
      summary: z.string().max(200),
      year: z.number().int(),
      role: z.string(),
      client: z.string().optional(),
      duration: z.string().optional(),
      team: z.string().optional(),
      status: z.enum(['live', 'archived', 'in-progress']),
      stack: z.array(z.string()).min(1),
      problem: z.string(),
      approach: z.string(),
      outcomes: z
        .array(z.object({ value: z.string(), label: z.string(), source: z.string().optional() }))
        .max(4)
        .default([]),
      cover: image(),
      coverAlt: z.string().min(5),
      gallery: z
        .array(z.object({ src: image(), alt: z.string().min(5), caption: z.string().optional() }))
        .default([]),
      links: z
        .object({
          live: z.string().url().optional(),
          repo: z.string().url().optional(),
        })
        .default({}),
      demo: z
        .discriminatedUnion('kind', [
          z.object({ kind: z.literal('embed'), url: z.string().url(), aspect: z.string().default('16/10') }),
          z.object({ kind: z.literal('external'), url: z.string().url() }),
          z.object({ kind: z.literal('none') }),
        ])
        .default({ kind: 'none' }),
      island: z.object({
        biome: z.enum(['meadow', 'sand', 'rock', 'grove']),
        landmark: z.enum(['lighthouse', 'tower', 'workshop', 'observatory', 'windmill', 'dock']),
        seed: z.number().int().optional(),
      }),
      order: z.number().int(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const experience = defineCollection({
  loader: file('src/content/experience.json'),
  schema: z.object({
    kind: z.enum(['work', 'education']),
    title: z.string(),
    org: z.string(),
    start: z.string().regex(/^\d{4}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
    description: z.string().max(240),
  }),
});

export const collections = { projects, experience };
```

Regole:
- Lo slug di un progetto è il nome del suo file Markdown. Ogni voce di `experience.json` ha un campo `id` univoco (richiesto dal loader `file`).
- Il corpo Markdown di ogni progetto è il caso studio completo. I campi del frontmatter alimentano schede, gioco e pagine statiche.
- `draft: true` esclude il progetto da tutto in produzione.
- Le foto vivono in `src/assets/photos/<album>/`, caricate con `import.meta.glob(..., { eager: true })`, con un file `photos.json` che associa nome file, alt e didascalia. `scripts/check-photos.ts` fa fallire la build se una foto non ha alt.
- Nessuna immagine sorgente in `public/`: le versioni ottimizzate generate dalla build non contengono metadati EXIF, gli originali potrebbero contenere coordinate GPS.

### 3.4 Flusso dei dati dal build all'isola React
1. `index.astro` costruisce un indice leggero (profilo, elenco app, riepilogo progetti con copertine ottimizzate tramite `getImage()`, riepilogo foto) e lo passa come prop serializzabile a `<OS client:only="react" data={osIndex} />`.
2. I dettagli pesanti si caricano su richiesta da endpoint statici prerenderizzati: `/data/projects/[slug].json` (con `getStaticPaths`, contiene l'HTML del caso studio già convertito e le varianti immagine) e `/data/photos.json`.
3. L'HTML del caso studio proviene solo dai miei file Markdown al momento della build: è l'unico punto in cui si usa `dangerouslySetInnerHTML`, documentalo con un commento.
4. Nella pagina `index.astro` il markup statico iniziale contiene la schermata di avvio con nome, ruolo e link (CV, contatti, versione classica): è ciò che vedono i crawler e chi non ha JavaScript.

### 3.5 Stato
Tre store Zustand indipendenti:
- `useWindows`: `windows: Record<WindowId, WindowState>`, `order: WindowId[]`, `focusedId`, azioni `open(appId, params)`, `close`, `focus`, `minimize`, `toggleMaximize`, `setRect`, `snap`. `WindowId` deterministico per le app singole e per i progetti (`project:<slug>`), così aprire due volte porta in primo piano invece di duplicare. Invarianti coperte da test: un solo `focusedId`, `order` senza duplicati, rettangoli sempre dentro l'area utile.
- `useSettings` (persistito, `version` e `migrate`): tema, sfondo, suoni, volume, scala, movimento, CRT, retinatura, qualità, lingua, cursore, modalità (auto, desktop, palmare).
- `useSession` (persistito): traguardi, isole visitate, posizioni icone, `showWelcome`, contatore visite.
Lo storage persistente è avvolto in un adattatore con `try/catch` (navigazione privata, quota piena). Se lo storage fallisce il sito funziona comunque, senza memoria.

### 3.6 Registro applicazioni
```ts
type AppManifest = {
  id: AppId;
  titleKey: MessageKey;
  icon: SpriteId;
  singleton: boolean;
  defaultRect: { w: number; h: number };
  minSize: { w: number; h: number };
  handheld: 'fullscreen' | 'hidden';
  load: () => Promise<{ default: React.ComponentType<AppProps> }>;
};
```
- I componenti `React.lazy` si creano una volta sola a livello di modulo per ogni app, mai dentro un render.
- Ogni finestra ha `Suspense` con uno scheletro della stessa forma del contenuto finale (nessuno spinner circolare) e un error boundary che mostra "Questa applicazione si è chiusa per un errore." con `Riapri` e `Segnala` (apre Contatti con l'errore precompilato).

### 3.7 Gestore finestre: implementazione
- Eventi pointer con `setPointerCapture` sulla barra del titolo e sulle maniglie, `touch-action: none` solo su quegli elementi.
- Durante il trascinamento la posizione si applica direttamente al nodo con `transform: translate3d()` tramite ref e `requestAnimationFrame`; lo store si aggiorna solo al rilascio. Nessun `useState` aggiornato a ogni movimento del puntatore.
- Posizioni e dimensioni arrotondate a multipli dell'unità pixel (sezione 4.5) per restare nitide.
- Z-index: le finestre stanno in un livello dedicato e l'ordine deriva dall'indice in `order`. Tutti gli z-index del progetto stanno in `src/os/kernel/layers.ts`.
- Ridimensionamento della viewport: le finestre vengono riportate dentro l'area utile, quelle ingrandite si adattano.
- Finestre come `<section role="dialog" aria-modal="false" aria-labelledby>`; i dialoghi bloccanti usano l'elemento nativo `<dialog>` con `showModal()`.
- All'apertura il focus va al primo elemento utile della finestra; alla chiusura torna all'elemento che l'aveva aperta. Una regione `aria-live="polite"` annuncia apertura e chiusura.

### 3.8 File system virtuale e terminale
- Albero generato dai contenuti: nodi `folder`, `file`, `shortcut`, ognuno con nome, icona e azione di apertura (`{ appId, params }`). Esplora risorse, Terminale ed Esegui leggono lo stesso albero: una sola fonte.
- Il parser del terminale è una funzione pura (input, stato, albero) che restituisce output ed effetti, testata con Vitest. L'area di output ha `role="log"`, l'input ha un'etichetta accessibile.

### 3.9 Motore di Carriera
**Pipeline di rendering**
1. `<Canvas>` con camera ortografica, `dpr` limitato a 2, `gl={{ antialias: false }}`.
2. `EffectComposer` creato in `useMemo`, ridimensionato quando cambia `useThree(s => s.size)` insieme a `setPixelRatio`, liberato con `dispose()` allo smontaggio.
3. Passaggi in ordine: `RenderPixelatedPass(pixelSize, scene, camera, { normalEdgeStrength, depthEdgeStrength })`, poi `OutputPass` (conversione colore e tone mapping), poi `PaletteQuantizePass` (ultimo, disegna a schermo).
4. Rendering in `useFrame((_, delta) => composer.render(delta), 1)`: con priorità maggiore di zero R3F smette di renderizzare da solo.
5. `pixelSize` in pixel del dispositivo: `Math.max(2, Math.round(altezzaDispositivo / 270))`, aggiornato con `setPixelSize` al ridimensionamento. Circa 270 righe di pixel di gioco a qualunque risoluzione.

**Quantizzazione alla palette.** Tutto il mondo vive negli stessi 16 colori del sistema. Lo shader riceve la palette già convertita in OKLab dalla CPU (da `src/design/palette.ts`) e quella in sRGB, converte il colore del fotogramma (già sRGB dopo `OutputPass`) in lineare e poi in OKLab, sceglie il colore più vicino e scrive direttamente il valore sRGB della palette. Non includere `colorspace_fragment` in questo passaggio. Retinatura opzionale con matrice di Bayer 4x4 indicizzata sul pixel di gioco (`floor(gl_FragCoord.xy / pixelSize)`), non sul pixel del dispositivo.

```glsl
// cuore della conversione (Ottosson), colore lineare in ingresso
vec3 linearToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(l, 1.0 / 3.0); m = pow(m, 1.0 / 3.0); s = pow(s, 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  );
}
```
Un test Vitest verifica che `palette.ts` e le variabili in `tokens.css` coincidano e che la versione TypeScript della conversione dia gli stessi risultati dello shader su colori campione.

**Camera**
- Ortografica isometrica vera (elevazione di circa 35,26°, cioè `atan(1/√2)`), segue l'omino con smorzamento.
- Aggancio alla griglia dei pixel di gioco: proietta la posizione della camera sugli assi destro e alto della camera, arrotonda a multipli della dimensione di un pixel di gioco nel mondo (`(top - bottom) / zoom / righeDiGioco`), ricostruisci la posizione. Elimina lo sfarfallio tipico della pixel art 3D in movimento.
- Rotazione a scatti di 90°, zoom a livelli discreti.

**Movimento e collisioni (senza motore fisico)**
- Area calpestabile nel piano XZ come unione di forme: cerchi per le isole, capsule (segmento più raggio) per i ponti. Ostacoli come cerchi (alberi, monumenti).
- Un punto è valido se la distanza con segno da almeno una forma calpestabile è minore o uguale a meno il raggio dell'omino e se è fuori da tutti gli ostacoli.
- Movimento: prova lo spostamento completo; se non valido prova solo l'asse X, poi solo l'asse Z; altrimenti resta fermo. Si ottiene lo scivolamento lungo i bordi.
- La direzione dell'input deriva da vettori avanti e destra della camera proiettati sul piano XZ e normalizzati, mai costanti scritte a mano (la camera ruota).
- Salto solo visivo: gravità semplice sull'asse Y, compressione e allungamento all'atterraggio.
- `delta` limitato (ad esempio 1/30 s) per evitare salti dopo un cambio di scheda.

**Percorso automatico.** Grafo con isole come nodi e ponti come archi pesati dalla lunghezza, Dijkstra, punti di passaggio: centro dell'isola corrente, estremi dei ponti, punto davanti al monumento di destinazione. Il clic su un punto usa lo stesso sistema.

**Disposizione.** Isole ordinate per `order` lungo una curva Catmull-Rom con passo fisso e scarto laterale alternato, calcolata in modo deterministico. Stesso contenuto, stesso mondo, sempre.

**Omino.** Voxel procedurale (testa, busto, braccia, gambe come parallelepipedi), camminata con rotazione degli arti basata su seno e velocità, respiro da fermo, rotazione verso la direzione di marcia con interpolazione sull'angolo più breve. Passi sonori ai passaggi per lo zero del ciclo. Accessori cosmetici dai traguardi.

**Mondo.** Isole in poligoni bassi generate da seme, acqua con onde nel vertex shader, alberi e rocce con `InstancedMesh`, geometrie statiche di ogni isola unite, materiali `MeshToonMaterial` con mappa a 3 toni e filtro `NearestFilter`, ombre da luce direzionale con mappa piccola. Texture delle copertine con `NearestFilter`, senza mipmap, `colorSpace = SRGBColorSpace`. Cielo e luce seguono il momento della giornata del visitatore.

**Qualità e ciclo di vita**
- `PerformanceMonitor` di drei per scendere di qualità (ombre, densità vegetazione, retinatura) se gli fps calano.
- Finestra ridotta a icona o non visibile: `frameloop="never"`; ritorno visibile: `"always"`.
- Evento `webglcontextlost`: mostra il ripiego, `webglcontextrestored`: ricostruisci.
- Allo smontaggio libera composer, render target, texture e materiali creati a mano.
- Obiettivo draw call: sotto 150.

### 3.10 Audio
Suoni ZzFX definiti come parametri in `src/os/lib/sound.ts`: clic, apri, chiudi, errore, traguardo, avvio, passi, tuffo. Spenti di default; attivabili dall'area di sistema. Il contesto audio si crea solo dopo un gesto dell'utente. Volume globale dalle impostazioni.

### 3.11 Internazionalizzazione
Tutti i testi dell'interfaccia in dizionari tipizzati (`it` completo, `en` con le stesse chiavi; una chiave mancante è un errore di tipo). I contenuti hanno campi traducibili opzionali. L'inglese completo è una tappa successiva, ma l'architettura è pronta dal primo giorno.

### 3.12 SEO e metadati
- `site` impostato in `astro.config.mjs`, `@astrojs/sitemap`, `robots.txt`, URL canonici.
- Titolo "[NOME_COGNOME], [RUOLO]" e descrizione su ogni pagina; Open Graph e Twitter card con immagine 1200x630 (cattura del desktop in pixel art per la home, immagine per progetto generata alla build con Satori e resvg).
- JSON-LD `Person` (nome, ruolo, `sameAs` con i social, `url`) su home e classica, `CreativeWork` su ogni progetto.
- `lang="it"` su `<html>`, gerarchia dei titoli corretta nelle pagine statiche.

### 3.13 Modulo contatti
- `src/pages/api/contact.ts` con `export const prerender = false` e l'adapter dell'hosting scelto; tutto il resto resta statico.
- Variabili d'ambiente dichiarate con lo schema `astro:env` (`RESEND_API_KEY` e `CONTACT_TO` come segreti lato server).
- Validazione con Zod sul server (lunghezze massime, email valida), campo trappola nascosto, tempo minimo di compilazione, risposta JSON con errori per campo. Limitazione di frequenza tramite la piattaforma di hosting o un servizio dedicato se serve.
- Lato client: stessi vincoli per un riscontro immediato, stati chiari, alternativa `mailto:` in caso di errore.

### 3.14 Accessibilità
- Primo elemento focalizzabile: link "Vai alla versione classica".
- Anello di focus sempre visibile: contorno tratteggiato di 1 unità in colore inchiostro sulle superfici chiare, sole su quelle scure (sezione 4.3).
- Menu contestuali con `role="menu"`, navigazione con frecce, Esc chiude.
- Il canvas 3D ha un'etichetta e il suo equivalente accessibile è la `Mappa` (elenco di pulsanti). Gli avvisi di prossimità passano anche da `aria-live`.
- `prefers-reduced-motion`: nessuna animazione a rettangoli, nessuna sequenza di avvio, teletrasporto al posto della camminata automatica, niente scuotimento della camera. Anche l'impostazione manuale `Movimento: Ridotto` lo attiva.
- Contrasto verificato (tabella in 4.3). Testo mai sotto 11 px CSS.

### 3.15 Sicurezza e privacy
- Content Security Policy tramite header dell'hosting. Se la versione di Astro installata supporta la generazione della CSP con hash degli script inline, usala; altrimenti includi gli hash a mano e verifica con un test e2e che non ci siano violazioni.
- `frame-src` limitato ai domini delle demo dichiarate nei contenuti.
- `iframe` delle demo con `sandbox` minimo necessario, `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`.
- Nessun cookie e nessun tracciamento invasivo. Se servono statistiche, uno strumento senza cookie (Plausible o Umami) con eventi: apertura app, apertura progetto, avvio Carriera, invio contatto.
- `pnpm audit` nella CI.

### 3.16 Budget di performance
- `/` senza gioco: JavaScript iniziale massimo 180 KB compressi gzip.
- Pacchetto di Carriera caricato su richiesta: massimo 450 KB gzip.
- Font: solo woff2 in sottoinsieme latino più accenti italiani, precaricato solo quello dell'interfaccia.
- Immagini: AVIF e WebP con `srcset`; gli sprite pixel restano PNG senza perdita, mostrati con `image-rendering: pixelated` a multipli interi.
- Rumore, righe CRT e sovrapposizioni solo su elementi fissi con `pointer-events: none`.
- Animare solo `transform` e `opacity`.

### 3.17 Test, qualità, CI
- **Vitest:** invarianti dello store finestre, geometria calpestabile, Dijkstra, disposizione deterministica delle isole, parser del terminale, conversione OKLab, coincidenza palette e token, schemi dei contenuti.
- **Playwright:** salto dell'avvio; apertura app con doppio clic e con tastiera; link diretto `/?progetto=slug`; trascinamento e aggancio di una finestra; modulo contatti con API simulata (errori e successo); palmare con tasto Indietro; Carriera che si monta e `Mappa` che porta a un'isola; nessuna violazione CSP in console.
- **axe** su `/`, `/classica`, una pagina progetto, con finestre aperte.
- **Regressione visiva** della shell in tema chiaro e scuro, desktop e palmare.
- **Lighthouse CI** con le soglie della sezione 1.3.
- **GitHub Actions:** install, `astro check`, lint, unit, build, e2e, Lighthouse.

### 3.18 Deploy
Hosting statico con funzione per il solo endpoint dei contatti (Netlify, Vercel o Cloudflare Pages: chiedimelo in Fase 0). Header di sicurezza e cache (asset con hash: cache lunga immutabile; HTML: breve).

---

## 4. Direzione visiva

### 4.1 Lettura del brief e manopole
Lettura: portfolio personale di [RUOLO] per recruiter, clienti e colleghi, con il linguaggio di un sistema operativo pixel giocabile, orientato ad Astro più React più React Three Fiber, token CSS nativi, animazioni a scatti.

Manopole: `DESIGN_VARIANCE: 6` (un sistema operativo è strutturato per natura, la varietà nasce da finestre, sfondi e gioco), `MOTION_INTENSITY: 6` (movimento che risponde alle azioni, una sola sequenza orchestrata), `VISUAL_DENSITY: 4` (finestre ariose, niente cruscotti).

### 4.2 Idea portante
**Un arcipelago dentro un computer.** Il desktop è il porto, Carriera è il mare. Lo sfondo del desktop mostra le stesse isole del gioco viste da lontano, il marchio personale è una rotta, e tutto (interfaccia, sprite, mondo 3D) usa la stessa palette di 16 colori. L'audacia si spende in un solo punto: il mondo di Carriera quantizzato alla palette. La cornice del sistema resta disciplinata e silenziosa.

Il sistema ha un'identità propria: niente loghi, nomi, suoni o schermate riconoscibili di Microsoft, Apple o altri sistemi reali. Il riferimento è l'epoca, non un prodotto.

### 4.3 Palette di sistema (16 colori, unica per sistema e gioco)

| Token | Hex | Ruolo |
|---|---|---|
| `ink` | `#1c1b29` | Testo principale su chiaro, contorni, fondo contenuti in tema scuro |
| `night` | `#2b2d42` | Barra del titolo attiva (chiaro), superfici in tema scuro |
| `slate` | `#4b5268` | Testo secondario su chiaro, ombra dei rilievi |
| `fog` | `#8b93a7` | Barra del titolo inattiva, testo secondario solo su `ink` |
| `chalk` | `#d8dce4` | Superficie delle cornici (chiaro) |
| `paper` | `#f3f5f7` | Fondo contenuti (chiaro), luce dei rilievi |
| `abyss` | `#0f3857` | Barra del titolo attiva (scuro), acqua profonda |
| `sea` | `#1d6fa3` | Mare, link su chiaro solo se sottolineati |
| `lagoon` | `#37b4c6` | Acqua bassa |
| `foam` | `#b3ece6` | Schiuma, riflessi |
| `olive` | `#57763a` | Vegetazione in ombra |
| `meadow` | `#93c255` | Prati |
| `sand` | `#ecc86f` | Spiagge |
| `sun` | **`#f6a93b`** | **Unico colore d'accento dell'interfaccia**: pulsante primario, selezione, focus su scuro |
| `brick` | `#b5443a` | Errori, tetti |
| `plum` | `#6a3e6e` | Ombre del tramonto e della notte nel gioco |

Coppie verificate (rapporto di contrasto WCAG): `ink` su `paper` 15,5; `ink` su `chalk` 12,3; `paper` su `night` 12,3; `ink` su `sun` 8,6; `sun` su `night` 6,9; `paper` su `abyss` 11,2; `slate` su `paper` 7,1; `slate` su `chalk` 5,7; `fog` su `ink` 5,5; `paper` su `brick` 5,0; `paper` su `sea` 5,0.
Coppie vietate per il testo: `fog` su `night` (4,4), `fog` su `chalk` (2,2, ammesso solo per elementi disabilitati), `sun` su `chalk` (1,4: quindi il focus su superfici chiare è in `ink`, mai in `sun`).

Nell'interfaccia l'accento è solo `sun`. I colori del mondo (mare, prati, sabbia) compaiono nell'interfaccia solo dentro sfondi, sprite e anteprime, mai come colore di pulsanti o etichette.

### 4.4 Token e temi
```css
/* src/styles/tokens.css: valori generati o verificati da src/design/palette.ts */
:root {
  --c-ink: #1c1b29; --c-night: #2b2d42; --c-slate: #4b5268; --c-fog: #8b93a7;
  --c-chalk: #d8dce4; --c-paper: #f3f5f7; --c-abyss: #0f3857; --c-sea: #1d6fa3;
  --c-lagoon: #37b4c6; --c-foam: #b3ece6; --c-olive: #57763a; --c-meadow: #93c255;
  --c-sand: #ecc86f; --c-sun: #f6a93b; --c-brick: #b5443a; --c-plum: #6a3e6e;
}

:root,
:root[data-theme='light'] {
  --face: var(--c-chalk);
  --face-hi: var(--c-paper);
  --face-lo: var(--c-slate);
  --edge: var(--c-ink);
  --well: var(--c-paper);
  --text: var(--c-ink);
  --text-muted: var(--c-slate);
  --title-bg: var(--c-night);
  --title-fg: var(--c-paper);
  --title-idle-bg: var(--c-fog);
  --title-idle-fg: var(--c-ink);
  --accent: var(--c-sun);
  --on-accent: var(--c-ink);
  --danger: var(--c-brick);
  --on-danger: var(--c-paper);
  --focus: var(--c-ink);
  --shadow: color-mix(in oklab, var(--c-ink) 35%, transparent);
}

:root[data-theme='dark'] {
  --face: var(--c-night);
  --face-hi: var(--c-slate);
  --face-lo: var(--c-ink);
  --edge: var(--c-ink);
  --well: var(--c-ink);
  --text: var(--c-paper);
  --text-muted: var(--c-fog);
  --title-bg: var(--c-abyss);
  --title-fg: var(--c-paper);
  --title-idle-bg: var(--c-slate);
  --title-idle-fg: var(--c-paper);
  --accent: var(--c-sun);
  --on-accent: var(--c-ink);
  --danger: var(--c-brick);
  --on-danger: var(--c-paper);
  --focus: var(--c-sun);
  --shadow: color-mix(in oklab, var(--c-ink) 60%, transparent);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* stessi valori di [data-theme='dark']: genera entrambi i blocchi dalla stessa sorgente, non copiarli a mano */
  }
}
```
Il tema Auto segue `prefers-color-scheme` (nessun attributo); Giorno e Notte impostano `data-theme`. Nessun uso di `#000000` o `#ffffff`. Un solo tema per volta su tutta la pagina.

### 4.5 Griglia pixel e scala
Tutto ciò che è pixel art deve cadere su pixel fisici interi, altrimenti diventa sfocato.
```ts
// src/os/lib/pixel-scale.ts
const TARGET_ART_PX = 1.375;                          // dimensione desiderata di un pixel d'arte in px CSS
const dpr = window.devicePixelRatio || 1;
const k = Math.max(1, Math.round(dpr * TARGET_ART_PX * userScale)); // pixel del dispositivo per pixel d'arte
const unit = k / dpr;                                  // px CSS
root.style.setProperty('--u', `${unit}px`);
root.style.setProperty('--ui-font-size', `${11 * unit}px`);
```
- `userScale` vale 1 (Auto) o 1.5 (Grande). Ricalcola al ridimensionamento e al cambio di `devicePixelRatio` (ascolta `matchMedia('(resolution: Xdppx)')` e registra di nuovo il listener a ogni cambio).
- Bordi, rilievi, spaziature della cornice, icone e posizioni delle finestre sono multipli di `--u`.
- Spaziature: scala in multipli di `--u` (2, 4, 6, 8, 12, 16, 24).
- Il testo di lettura (sezione 4.6) non segue `--u`: usa `rem`.

### 4.6 Tipografia
Due famiglie, con ruoli distinti.
- **Departure Mono** (SIL OFL, font pixel monospaziato): cornice del sistema (barre del titolo, menu, etichette delle icone, barra delle applicazioni), terminale, interfaccia di gioco, schermata di avvio. Solo a multipli di 11 px (come indicato nel README ufficiale), quindi sempre `calc(var(--ui-font-size) * n)`. Scaricala dalle release ufficiali, verifica la copertura degli accenti italiani (à è é ì ò ù È) e del simbolo €, fai un sottoinsieme.
- **Atkinson Hyperlegible Next** (SIL OFL): testo di lettura (casi studio, Chi sono, versione classica, modulo contatti). Scelta per la leggibilità dentro finestre piccole. Corpo 17 px, interlinea 1,55, righe al massimo di 68 caratteri, titoli nello stesso carattere con peso maggiore.
- Niente maiuscolo spaziato come etichetta sopra i titoli. Frasi in minuscolo normale (sentence case). Enfasi solo con il peso della stessa famiglia.
- `font-display: swap` con fallback monospaziato e `size-adjust` per evitare spostamenti delle finestre.

### 4.7 Materiali: rilievi, cornici, ombre, forme
- **Doppia cornice adattata al pixel.** Ogni finestra è un guscio esterno (bordo `edge` di 1 unità, luce `face-hi` in alto a sinistra, ombra `face-lo` in basso a destra) che contiene un pozzo interno incassato (`well`, rilievo invertito). Stesso principio per campi di testo, pannelli e riquadri.
- Rilievi con `box-shadow` inset a offset intero di `--u`, mai sfocati. Due livelli: esterno e interno.
- Ombra delle finestre: pixel netta, offset di 3 unità, colore `--shadow`, nessuna sfocatura.
- **Forme:** tutto squadrato, raggio zero. Unica regola eccezionale e documentata: i pulsanti hanno gli angoli smussati di 1 unità con `clip-path` a poligono. Nessun'altra variante.
- Stati dei pulsanti: premuto inverte il rilievo e sposta il contenuto di 1 unità in basso a destra; disabilitato usa `fog` e nessun rilievo.
- Selezione (icone, elementi di elenco): fondo `sun`, testo `ink`.
- Effetto CRT opzionale: righe orizzontali e leggera vignetta su un livello fisso, spento di default.

### 4.8 Icone e sprite
- Glifi dell'interfaccia: `pixelarticons`, una sola famiglia, mai icone disegnate a mano.
- Icone delle applicazioni del desktop: sprite originali 32x32 nella palette di sistema, esportati a 1x e mostrati a multipli interi.
- `scripts/quantize-sprites.ts` (con `sharp`): porta ogni pixel al colore della palette più vicino in OKLab, rende l'alfa binaria, rifiuta immagini con colori fuori palette dopo la conversione, scrive in `public/sprites/`. Vale per icone, sfondi e texture del gioco.
- Cursore pixel opzionale solo via CSS `cursor: url(...) x y, auto`, mai un elemento che insegue il mouse con JavaScript. Disattivato su dispositivi touch.

### 4.9 Movimento
- Linguaggio: **a scatti**. Durate come multipli di un passo di 40 ms, easing `steps()`. Nessuna curva morbida nella cornice del sistema.
- Apertura finestra: 4 rettangoli di contorno che vanno dall'icona di origine alla posizione finale (160 ms), poi compare la finestra. Chiusura: al contrario, verso la barra delle applicazioni. È un movimento che spiega da dove arriva la finestra.
- Menu: comparsa in 2 scatti. Avvisi dei traguardi: entrata in 3 scatti, uscita dopo 4 s.
- Nel gioco il movimento è fluido nel mondo (camera smorzata, camminata) ma la resa resta a pixel grazie all'aggancio della camera.
- Nessuna animazione infinita decorativa nella cornice. Le uniche animazioni continue sono nel gioco e nel lampeggio del cursore del terminale.
- Movimento ridotto: tutto istantaneo.

### 4.10 Sfondi e momenti della giornata
Quattro sfondi in pixel art 16:9 dell'arcipelago (alba 5-8, giorno 8-18, tramonto 18-21, notte 21-5, ora locale del visitatore), quantizzati alla palette. Stesso punto di vista, stessa composizione, cambia solo la luce. Di notte le isole visitate hanno una luce accesa (sprite sovrapposto). Il cielo di Carriera segue la stessa fascia oraria. Uno sfondo in tinta unita `night` o `chalk` è sempre disponibile per chi preferisce calma.

### 4.11 Direzione artistica di Carriera
- Diorama isometrico, poligoni bassi, toni a scatti, contorni dal passaggio pixel, tutto nella palette.
- Isole leggibili a colpo d'occhio: ogni monumento ha una sagoma unica e riconoscibile anche a 270 righe di risoluzione.
- Il totem di ogni isola mostra la copertina del progetto: è il punto in cui il contenuto reale entra nel mondo.
- Particelle minime: polvere ai passi, schizzi d'acqua, qualche gabbiano. Nulla che competa con le isole.
- La `Prossima isola` è l'unica non finita: impalcature, sagoma incompleta, luce calda.

### 4.12 Marchio personale
- Monogramma delle mie iniziali unito all'idea di rotta o approdo (metodo "monogramma più significato", costruito su griglia 16x16).
- Deve funzionare come pulsante Avvio, favicon (16, 32, SVG), logo di avvio, bandiera sull'isola Porto, simbolo ASCII nel comando `info`.
- Esplorazione iniziale con una tavola di marchio generata (Appendice A.4), versione finale disegnata pixel per pixel e passata dallo script di quantizzazione.

### 4.13 Testi e tono
- Frasi semplici, verbi concreti, forma attiva. Un'etichetta per intento su tutto il sito: `Contattami`, `Scarica CV`, `Avvia Carriera`, `Prova la demo`, `Leggi il caso studio`. Mai sinonimi.
- Pulsanti che dicono cosa succede. Il riscontro usa la stessa parola dell'azione (`Invia` porta a "Messaggio inviato").
- Errori che spiegano cosa è successo e come rimediare, con la voce del sistema, senza scuse.
- Al massimo una battuta per applicazione. Il tono è ironico nella cornice, serio nei casi studio.
- Nomi di file realistici (`CV.pdf`, `Leggimi.txt`, `logo_v1_definitivo.png`).
- **Zero lineette lunghe o medie nel testo visibile**: usa punto, virgola, due punti o parentesi. Trattino normale solo in parole composte e intervalli (`2021-2024`).
- Nessun nome segnaposto banale (niente "Mario Rossi", niente "Acme"), nessun numero finto preciso non marcato come esempio.
- Prima di consegnare, rileggi ogni stringa visibile e riscrivi quelle vaghe, sgrammaticate o "carine" senza significato.

### 4.14 Cosa adottiamo dalle skill e cosa scartiamo

| Skill | Adottato | Scartato e perché |
|---|---|---|
| frontend-design | Piano dei token prima del codice, revisione del piano contro il brief, audacia in un solo punto, quota minima di qualità (focus, movimento ridotto, responsive), testi funzionali | Nessun conflitto |
| design-taste-frontend | Lettura del brief, manopole, un solo accento, forme coerenti, niente sopracciglia in maiuscolo, niente lineette lunghe, etichetta unica per intento, contrasto verificato, movimento ridotto, budget prestazioni, controllo finale | React e Next come base (scegliamo Astro per contenuti statici e SEO, React resta per il sistema); regola "no finte UI costruite con div" non si applica perché qui l'interfaccia è reale e funzionante; regola sul monospaziato per le etichette superata dal brief pixel |
| high-end-visual-design | Doppia cornice (diventa il rilievo pixel), animare solo transform e opacity, sfocature e rumore solo su livelli fissi, scala degli z-index, cura ossessiva dei micro dettagli | Pillole arrotondate, vetro smerigliato, curve di easing morbide, ingressi allo scorrimento: in conflitto con il brief pixel |
| imagegen-frontend-web e imagegen-frontend-mobile | Un'immagine per schermata, bibbia di design comune, varietà di composizione, leggibilità prima di tutto, aree sicure su mobile | Nessun conflitto; le immagini sono riferimenti, non asset da pubblicare (tranne sfondi e sprite dopo quantizzazione) |
| brandkit | Strategia prima del segno, metodo monogramma più significato, marchio ripetuto su più supporti | Tavola scura cinematografica solo per l'esplorazione, non per il sito |

---

## 5. Piano di lavoro a tappe
Ogni tappa è finita solo quando i suoi criteri sono verificati.

**T0. Fondamenta.** Astro, React, TypeScript strict, Tailwind v4, ESLint, Prettier, Vitest, Playwright, CI minima, `CLAUDE.md`, font self-hosted, `palette.ts` e `tokens.css` con test di coincidenza.
Fatto quando: build pulita, CI verde, pagina vuota con i token in entrambi i temi.

**T1. Contenuti e pagine statiche.** Collezioni, profilo, foto con controllo alt, `/classica`, `/progetti/[slug]`, 404, SEO completo, immagini social.
Fatto quando: la versione classica contiene tutti i contenuti essenziali della sezione 2.2, Lighthouse rispetta le soglie, axe senza violazioni. Da qui il sito è già pubblicabile.

**T2. Shell del sistema.** Avvio, desktop, icone, selezione multipla, barra delle applicazioni, menu Avvio, gestore finestre completo, Esegui, sincronizzazione URL, scala pixel.
Fatto quando: test di invarianti verdi, e2e su apertura, trascinamento, aggancio, link diretti; navigazione completa da tastiera.

**T3. Applicazioni essenziali.** Benvenuto, Progetti, scheda progetto, Lettore, Navigatore, Foto, Chi sono, CV, Contatti (con endpoint), Impostazioni.
Fatto quando: ogni app ha stati vuoto, caricamento ed errore; modulo contatti testato in successo ed errore.

**T4. Carriera.** Mondo, omino, controlli, pipeline pixel e quantizzazione, camera agganciata, percorso automatico, interfaccia di gioco, Mappa, collegamenti con il sistema, ripiego senza WebGL.
Fatto quando: 60 fps sul profilo desktop indicato, budget del pacchetto rispettato, e2e della Mappa verde, nessuna perdita di memoria dopo 5 aperture e chiusure (verifica con il pannello Memory).

**T5. Anima.** Terminale, Cestino, traguardi, suoni, sfondi per momento della giornata, luci notturne sulle isole visitate, spegnimento.
Fatto quando: parser del terminale coperto da test, traguardi persistiti e ripristinati.

**T6. Palmare.** Schermata iniziale, dock, app a tutto schermo, Indietro del telefono, joystick e pulsante azione, aree sicure.
Fatto quando: e2e su viewport mobile verdi, prova reale su iOS Safari e Chrome Android documentata.

**T7. Inglese.** Dizionario `en` completo, contenuti tradotti, selettore lingua, `hreflang`.

**T8. Rifinitura e consegna.** Controllo finale (sezione 6), Lighthouse CI, header di sicurezza, deploy, `CONTENT.md` aggiornato.

**Bonus (solo dopo T8):** Pixel, Campo minato, supporto gamepad, filtro "16 colori" nell'app Foto.

---

## 6. Controllo finale prima di consegnare
Ogni voce va spuntata onestamente. Se una non passa, la tappa non è finita.

- [ ] Nome, ruolo, contatto e CV visibili entro 5 secondi senza interazione
- [ ] Tutti i contenuti essenziali raggiungibili senza giocare
- [ ] Soglie Lighthouse e Core Web Vitals della sezione 1.3 rispettate
- [ ] Budget JavaScript rispettati (180 KB iniziale, 450 KB gioco)
- [ ] Zero errori in console, zero violazioni CSP, zero violazioni axe critiche o serie
- [ ] Navigazione completa da tastiera, focus sempre visibile, ritorno del focus corretto
- [ ] `prefers-reduced-motion` e impostazione manuale rispettati ovunque, gioco incluso
- [ ] Un solo tema per volta, entrambi i temi verificati
- [ ] Un solo accento (`sun`), mai usato per il focus su superfici chiare
- [ ] Una sola regola di forme (raggio zero, pulsanti smussati di 1 unità)
- [ ] Tutti gli elementi pixel su multipli di `--u`, nessuna sfocatura su schermi con scala 1, 1,25, 1,5, 2 e 3
- [ ] Departure Mono solo a multipli di 11 px
- [ ] Zero lineette lunghe o medie nel testo visibile e negli alt
- [ ] Nessuna etichetta in maiuscolo spaziato sopra i titoli
- [ ] Un'etichetta per intento, nessun pulsante che va a capo su desktop
- [ ] Contrasto: solo coppie della tabella 4.3
- [ ] Nessun logo, nome o suono di sistemi operativi reali
- [ ] Nessun dato inventato non marcato; `CONTENT_TODO.md` aggiornato
- [ ] Stati vuoto, caricamento ed errore presenti in ogni applicazione
- [ ] `useEffect` con pulizia, listener rimossi, risorse 3D liberate
- [ ] Palmare provato su dispositivi reali, tasto Indietro coerente
- [ ] Rilettura di ogni stringa visibile completata

---

## 7. Da non fare mai
- Bloccare l'accesso ai contenuti dietro al gioco o all'avvio.
- Riprodurre audio senza un gesto dell'utente.
- Usare `100vh`, `window.addEventListener('scroll')`, `useState` aggiornato a ogni movimento del puntatore.
- Animare `top`, `left`, `width` o `height`.
- Z-index arbitrari fuori da `layers.ts`.
- Immagini sorgente in `public/`.
- Scorciatoie che il browser o il sistema intercettano.
- Icone disegnate a mano, finti screenshot, barre di competenza con traccia di sfondo.
- Colori fuori palette nell'interfaccia o nel gioco.
- Chiavi o segreti nel codice client.
- Scrivere API a memoria quando la versione installata è diversa: controlla i documenti.

---

## Appendice A. Prompt per le immagini di riferimento
Da usare con uno strumento di generazione immagini prima della tappa T2, per fissare la direzione. Le immagini sono riferimenti: il codice le interpreta, non le copia. Solo sfondi, icone e texture possono diventare asset, e solo dopo pulizia a mano e quantizzazione.

### A.1 Bibbia di design (da anteporre a ogni prompt)
> Original retro operating system and game world for a personal portfolio called [NOME_OS]. Late-90s pixel art GUI language, but an original identity: no Microsoft, Apple or other real OS logos, names or layouts copied. Strict 16-color palette only: #1c1b29 ink, #2b2d42 night, #4b5268 slate, #8b93a7 fog, #d8dce4 chalk, #f3f5f7 paper, #0f3857 abyss, #1d6fa3 sea, #37b4c6 lagoon, #b3ece6 foam, #57763a olive, #93c255 meadow, #ecc86f sand, #f6a93b sun (the only UI accent), #b5443a brick, #6a3e6e plum. Crisp integer pixel art, no anti-aliasing, no gradients except dithered ones, no blur, no glow. Square corners everywhere, buttons with 1-pixel notched corners, two-level bevels, hard pixel drop shadows. UI font: a monospaced pixel font. Reading text: a clean humanist sans. Concept: an archipelago inside a computer, the desktop is the harbor and the game is the sea. Calm, precise, playful, readable. Every label must be legible.

### A.2 Desktop (una immagine orizzontale 16:9 per voce)
1. **Avvio.** Full-screen boot on ink background: pixel monogram mark at left-center, the name "[NOME_COGNOME]" and role "[RUOLO]" in the pixel font, three short diagnostic lines below ("Progetti trovati: 6", "Foto trovate: 42", "Avvio del desktop"), a small link at bottom-left "Vai alla versione classica". Generous empty space, left-aligned composition.
2. **Desktop con Benvenuto.** Pixel art wallpaper of a small archipelago seen from far away at midday, wooden bridges between islands, a lighthouse. Column of desktop icons on the left (Leggimi.txt, Carriera, Progetti, Foto, Chi sono, CV.pdf, Contatti, Terminale), trash at bottom-right. One open window "Benvenuto" slightly right of center: avatar, "Ciao, sono [Nome].", role, one-line bio, three buttons with the primary one in sun color. Taskbar at bottom with Start button showing the monogram, a window button, tray with availability indicator, sound icon, clock.
3. **Progetti e caso studio.** Two overlapping windows: a file explorer with project folders in icon view and a path bar, and in front a document reader window showing a case study with a cover image, title, meta rows and readable body text in the humanist sans.
4. **Carriera, vista d'insieme.** Isometric low-poly 3D world rendered as pixel art: six small islands along a curving route, wooden bridges, a tiny voxel character walking on a bridge, each island with a unique landmark (lighthouse, tower, windmill, observatory, workshop, dock), shallow lagoon water around islands and deep sea further out, crisp pixel outlines. Pixel UI overlay: top-left "Carriera" and "Isole visitate 2/6", top-right small square buttons.
5. **Carriera, isola aperta.** Closer isometric view on one island with a totem screen showing a project cover as pixel texture, the character standing in front, a side panel on the right styled as an OS window with project title, year, role, two-line summary, three results, and buttons "Prova la demo", "Leggi il caso studio".
6. **Contatti.** Mail-client style window with labeled fields above inputs (Nome, Email, Oggetto, Messaggio), one field showing an inline error below it in brick color, a primary "Invia" button in sun, on the side an email address with a copy button and social icons.
7. **Notte.** Same desktop as image 2 but the wallpaper at night, with warm lights on three islands, dark theme windows (night surfaces, abyss active title bar), terminal window showing an `info` command output with an ASCII monogram.

### A.3 Palmare (schermate in cornice di telefono discreta, stessa bibbia)
1. **Schermata iniziale.** Status bar at top within safe area, 4-column grid of pixel app icons, dock with Carriera, Progetti, Contatti, Chi sono, wallpaper of the archipelago cropped vertically. Large readable labels.
2. **Scheda progetto a tutto schermo.** Top bar with back button and title, cover image, meta rows, readable text, primary button reachable by thumb.
3. **Carriera in orizzontale.** Pixel isometric world, virtual joystick bottom-left, action button bottom-right, proximity prompt "Apri" centered at bottom, all inside safe areas.

### A.4 Tavola del marchio (brandkit, griglia 2x3 su fondo ink)
> Premium personal identity board for "[NOME_OS]", the portfolio of [NOME_COGNOME], [RUOLO]. Strategy: category personal portfolio; audience recruiters, clients, peers; personality precise, playful, curious; core metaphor a route between islands. Logo idea: monogram of the initials [INIZIALI] fused with a route or landing point, built on a 16x16 pixel grid, works at 16 px. Panels: logo cover, construction on pixel grid, start button and favicon application, boot screen application, color system with the 16-color palette and sun as the only UI accent, typography pairing pixel mono plus humanist sans. Sparse text, no copied real-world logos, strong gutters.
