# Coolify production handoff — Crypto Flow Compass

Target domain: `etf-flow-compass.etoro.com` (or whatever the eToro infra owner assigns).

## Resources to create

1. **One application**
   - Source: this GitHub repo (eToro org).
   - Build pack: Dockerfile (already in repo).
   - Port: 3000.
   - Domain: `etf-flow-compass.etoro.com` (or assigned).
   - Environment variables:
     - `NODE_ENV=production`
     - `DATA_DIR=/app/data`
     - `NEXT_TELEMETRY_DISABLED=1`

2. **One scheduled task** (replaces the GitHub Actions cron)
   - Schedule: `30 22 * * 1-5` (daily 22:30 UTC, US weekdays)
   - Container: same as application
   - Command: `node /app/scripts/scrape-flows.js` (or `npm run scrape:flows` if tsx is in image)
   - Writes to: the `data/` volume

3. **One persistent volume**
   - Mount path: `/app/data`
   - Purpose: holds `etf-flows.json`, written by the scheduled task, read by the app on every request.
   - Size: 100 MB is plenty (JSON is ~500 KB).

## Networking egress allow-list

The container must reach:
- `https://public-api.etoro.com` — runtime trade execution + portfolio reads
- `https://api.etorostatic.com` — public catalog (verifier)
- `https://farside.co.uk` — BTC/ETH ETF flow source
- `https://www.etf.com` — category aggregates
- `https://www.ishares.com`, `https://www.vanguard.com` — issuer-page scrapers
- `https://api.sosovalue.xyz` — crypto ETF cross-check

(Add/remove as production scraping is wired in `scripts/scrape-flows.ts`.)

## Verification checklist after first deploy

- [ ] App responds on `https://etf-flow-compass.etoro.com` with 200
- [ ] Page loads in <2s (server-component reads from `/app/data/etf-flows.json`)
- [ ] Hero compass needle renders (light mode + dark mode)
- [ ] Region tabs (US / UCITS) toggle without page reload
- [ ] Theme toggle persists on reload (localStorage)
- [ ] Connect eToro modal opens, scrollbar compensation works (no layout shift)
- [ ] Demo trade through the modal lands an order in the test eToro account
- [ ] Real-money banner appears when env=real
- [ ] CSP / security headers present (`curl -I https://...`):
  - `Strict-Transport-Security`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Content-Security-Policy` with eToro endpoints whitelisted
- [ ] Scheduled task fired, wrote to `/app/data/etf-flows.json`, page reads new data on next request
- [ ] Mobile responsive at 380px (compass needle scales, conviction leaderboard stacks)

## Things that were deliberately not added

- **No third-party analytics** — Crypto Flow Compass is ad-free and tracker-free per eToro AppStore citizenship rules.
- **No marketing-template footer line** ("Data: X · MIT licensed") — explicitly omitted.
- **No `/about` or `/methodology` route** — keeps the AppStore submission tight. Re-add if compliance asks.

## Repo migration (personal → eToro org)

If ranna/etf-flow-compass moved to etoro/etf-flow-compass:
1. Re-grant Vercel preview to the new repo OR archive Vercel and rely on Coolify only.
2. Re-add GitHub Actions secrets (none needed today — all sources are unauthenticated).
3. Update `Settings → Actions → Workflow permissions` to `Read and write` so the daily cron can auto-commit.
