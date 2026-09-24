# Controllo finale (PROMPT.md, sezione 6)

Stato al 24 settembre 2026, a fine T8. Ogni voce ha la sua prova; le due voci aperte richiedono un dispositivo o un account che solo tu hai.

| Voce                                                          | Stato                | Prova                                                                                                                                                 |
| ------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nome, ruolo, contatto e CV visibili entro 5 secondi           | Fatto                | La schermata di avvio è HTML statico: LCP 1,4-1,6 s su mobile simulato; `e2e/static.spec.ts`                                                          |
| Contenuti essenziali raggiungibili senza giocare              | Fatto                | Versione classica, cartella Progetti, pagine dei progetti, in italiano e in inglese; `e2e/static.spec.ts`, `e2e/english.spec.ts`                      |
| Soglie Lighthouse e Core Web Vitals (1.3)                     | Fatto in laboratorio | `pnpm lighthouse`: `/` 98-99, pagine statiche 100; LCP sotto 2,0 s, CLS 0. L'INP si misura solo sul campo, dopo la pubblicazione                      |
| Budget JavaScript                                             | Fatto                | `pnpm budgets`: 104 KB iniziali (limite 180), Carriera 251 KB (limite 450)                                                                            |
| Zero errori in console, CSP e axe                             | Fatto                | `e2e/sweep.spec.ts`: ogni applicazione, in tema chiaro e scuro, senza errori in console (le violazioni CSP comparirebbero lì) né violazioni axe gravi |
| Tastiera, focus visibile e ritorno del focus                  | Fatto                | `e2e/os.spec.ts`, `e2e/apps.spec.ts`, `e2e/handheld.spec.ts`                                                                                          |
| Movimento ridotto ovunque, gioco incluso                      | Fatto                | `data-motion="reduced"`; nel gioco acqua e mulino fermi e teletrasporto al posto della camminata; `e2e/career.spec.ts` gira con movimento ridotto     |
| Un tema per volta, entrambi verificati                        | Fatto                | `e2e/static.spec.ts` e `e2e/sweep.spec.ts` in chiaro e scuro                                                                                          |
| Un solo accento, mai per il focus su chiaro                   | Fatto                | Token `focus`: `ink` su chiaro, `sun` su scuro; il terminale e il palmare seguono la stessa regola                                                    |
| Una sola regola di forme                                      | Fatto                | Nessun `border-radius` nel codice; pulsanti smussati di 1 unità                                                                                       |
| Pixel su multipli di `--u`, nitidi a scala 1, 1,25, 1,5, 2, 3 | Fatto                | `tests/design/pixel.test.ts`; sfondi e canvas a scala intera in pixel del dispositivo                                                                 |
| Departure Mono solo a multipli di 11 px                       | Fatto                | `e2e/sweep.spec.ts` misura ogni testo in Departure Mono alle cinque scale                                                                             |
| Zero lineette lunghe o medie                                  | Fatto                | `tests/content/copy.test.ts` su contenuti, dizionari e pagine                                                                                         |
| Niente maiuscolo spaziato sopra i titoli                      | Fatto                | Nessun `text-transform: uppercase` né `letter-spacing` nel codice                                                                                     |
| Un'etichetta per intento, pulsanti su una riga su desktop     | Fatto                | Rilettura dei dizionari; `px-btn` non va a capo                                                                                                       |
| Contrasto solo con le coppie della tabella 4.3                | Fatto                | `tests/design/tokens.test.ts`; le coppie nuove (terminale, palmare, avvisi) sono tutte in tabella                                                     |
| Nessun logo, nome o suono di sistemi reali                    | Fatto                | Marchio, sprite e suoni ZzFX originali                                                                                                                |
| Nessun dato inventato non marcato                             | Fatto                | Segnaposto marcati `[DA COMPILARE]`, elenco in `CONTENT_TODO.md`                                                                                      |
| Stati vuoto, caricamento ed errore in ogni app                | Fatto                | Ogni app caricata da dati li ha; il Cestino ora ha anche lo stato vuoto                                                                               |
| Pulizia di effetti, listener e risorse 3D                     | Fatto                | `e2e/career.spec.ts`: cinque aperture e chiusure di Carriera senza crescita della memoria                                                             |
| Palmare provato su dispositivi reali                          | **Da fare (tu)**     | Checklist in `CONTENT_TODO.md`, sezione "Prove sui dispositivi reali"                                                                                 |
| Rilettura di ogni stringa visibile                            | Fatto                | Dizionari `it` e `en` riletti per intero in T8                                                                                                        |

## Pubblicazione

Pronta ma non eseguita: serve il tuo account Cloudflare. Istruzioni nel `README.md`, sezione "Pubblicazione". La CI verifica a ogni push che il Worker si compili (`wrangler deploy --dry-run`) e conserva i report di Lighthouse e Playwright.
