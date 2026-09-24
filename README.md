# OS-portfolio

Portfolio personale in forma di piccolo sistema operativo in pixel, con un gioco (Carriera) in cui ogni isola è un progetto. Tutti i contenuti sono raggiungibili anche senza giocare: cartella Progetti, versione classica (`/classica`) e pagine statiche dei progetti.

- Progetto e decisioni: [`PROMPT.md`](PROMPT.md), [`CLAUDE.md`](CLAUDE.md)
- Come aggiornare i contenuti: [`CONTENT.md`](CONTENT.md)
- Cosa manca ancora: [`CONTENT_TODO.md`](CONTENT_TODO.md)

## Comandi

```bash
pnpm install
pnpm dev
pnpm verify
pnpm test:e2e
```

Serve Node 24 LTS (vedi `.nvmrc`) e pnpm 12.

## Pubblicazione (Cloudflare Workers)

Il sito è statico, tranne `/api/contact` che gira su un Worker. Una volta sola:

1. Crea un account Cloudflare e accedi da terminale: `pnpm exec wrangler login`.
2. Imposta i segreti del modulo contatti (restano su Cloudflare, mai nel codice):
   `pnpm exec wrangler secret put RESEND_API_KEY`, poi `CONTACT_TO` (la tua email) e, con un dominio verificato su Resend, `CONTACT_FROM`.
3. Scegli il dominio e usalo come `SITE_URL` al momento della build (URL canonici, sitemap, immagini social).

Poi, a ogni pubblicazione:

In PowerShell:

```powershell
$env:SITE_URL = "https://il-tuo-dominio"; pnpm site:deploy
```

In bash: `SITE_URL=https://il-tuo-dominio pnpm site:deploy`.

`pnpm site:check` fa tutto tranne il caricamento: utile per controllare prima. In alternativa puoi collegare il repository GitHub a Cloudflare (Workers Builds) con comando di build `pnpm build`, comando di deploy `pnpm exec wrangler deploy` e la variabile `SITE_URL`.
