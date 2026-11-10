# Yas Apps website

Vercel-ready marketing website for Yas Browser and Yas Mail. Plain HTML/CSS/JavaScript keeps the public pages small and buildless. A Node.js Vercel Function stores explicit email registrations in Neon PostgreSQL.

## Local development

Use Node 22 or later. Run `npm ci`, copy `.env.example` to `.env.local`, configure a direct `DATABASE_URL` and random `RATE_LIMIT_SALT`, run `npm run db:migrate`, then `npm run dev`. Preview at http://localhost:4173. `npm test` checks validation; `npm run build` checks release files and entry points. Environment files and Vercel credentials are ignored by Git.

## Vercel

Deploy this directory with framework preset **Other**. `vercel.json` sets the build command and public output. Add `DATABASE_URL`, `RATE_LIMIT_SALT`, and `SITE_URL=https://yasapps.com` as sensitive production environment variables. Run the tracked migration before enabling the registration endpoint. Attach `yasapps.com` and `www.yasapps.com` to the Vercel project; redirect www to the apex domain. Set the Node runtime to 22 or newer.

## Releases

Windows installers and experimental Apple Silicon macOS ZIPs are hosted as pinned, versioned GitHub Release assets in alharthi8/yas-browser and alharthi8/yas-mail. public/downloads/SHA256SUMS.txt records download hashes. Mac previews use separate macos-vVERSION prereleases and signed full-bundle updates. They are ad-hoc signed, not Apple notarized. Intel is not available. Native launch, Mail Keychain, signed installation, and damaged-package rejection checks passed before linking these packages. public/macos.html describes installation and remaining testing limits.

Public app source is published at https://github.com/alharthi8/yas-browser and https://github.com/alharthi8/yas-mail. macos/ contains each separate Mac implementation; Windows source remains in the repository root. The website links Windows Browser 0.4.6/Mail 0.3.1 and Mac Browser 0.4.7/Mail 0.3.2. Marketing does not claim a quantified performance advantage. The performance page explains architecture and benchmark limitations.

## Email registration

The form is not an account or mailbox service. It validates consent, products, platform, email syntax and MX records; deduplicates normalized addresses; and rate limits by a keyed hourly IP hash. Rate-limit rows expire logically but need scheduled cleanup (`DELETE FROM registration_rate_limits WHERE expires_at < now()`). Only the server reads DATABASE_URL. No private registration list is exposed. Successful registration saves a record; no email is sent. Configure a verified sender, confirmation/opt-out flow, and a direct private privacy contact before starting campaigns.

## App updates

See `UPDATE-PLAN.md` for the planned signed release pipeline. Website updates and desktop app updates are separate: redeploying this site does not replace installed app code.

## Privacy requests

The privacy page stores private access, deletion, and unsubscribe requests in `privacy_requests`. Review pending requests in the Neon console and verify ownership as appropriate before disclosing or changing personal data. No public list or automatic email is exposed.

## Download hold

All website downloads are marked Coming soon while release testing is completed. Download buttons are disabled, release dialogs contain no installer links, and legacy website installer URLs redirect to release status. Email registration remains available. GitHub source and existing release infrastructure are retained. Re-enable downloads only after testing is finished and release is authorized.
