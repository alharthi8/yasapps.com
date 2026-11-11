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

## Experimental Mac Browser availability

Only Yas Browser macOS 0.4.7 (Apple Silicon) is currently enabled on the website. It is clearly labeled experimental, lacks Windows feature parity, and is not Apple notarized. Windows 1.0 remains held for security review. Yas Mail and other products remain Coming soon. Windows launch preparation is retained separately in codex/browser-v1-launch.

## Stripe support payments

The integration is a one-time, customer-chosen-amount Stripe Payment Link paid directly to Appana Technologies. Connect is excluded. There are no paid app entitlements or automatic marketing subscriptions. The sandbox link is real: https://buy.stripe.com/test_eVq6oJ0CUbUU07pfmT1ck00 (payment link `plink_1UagcQQURZVeJIpYCFRIwQPS`, Appana sandbox `acct_1UaPklQURZVeJIpY`). Suggested support is AED 25, with AED 5–1,000 limits. A simulated AED 25 card payment and both amount limits were checked in Stripe on 11 November 2026. These are test settings for review, not live charges.

Implementation plan: use Stripe-hosted Checkout through Payment Links; publish the support page; verify signed payment events; finish business/payout verification and review the payment purpose, support terms and applicable VAT/tax treatment; configure a separate live Payment Link and live webhook; test before enabling public checkout. Stripe's current official `stripe-best-practices` skill was installed using the requested fallback. The implementation planner was discoverable on the connected MCP server, but could not be invoked from this active chat. This plan is based on the official skill and documentation, not a claimed planner response.

`/support.html` fetches `/api/support`. Checkout defaults to coming soon. To preview the real sandbox locally, set `STRIPE_SUPPORT_ENABLED=true`, `STRIPE_SUPPORT_MODE=test`, `STRIPE_SUPPORT_URL`, and `STRIPE_SUPPORT_PAYMENT_LINK_ID` in the ignored `.env.local`. A production deployment refuses sandbox links. Live checkout also requires `STRIPE_WEBHOOK_SECRET`; keep it in a sensitive Vercel environment variable. Payment Links need no secret API key in the website. No Stripe.js or embedded card form is loaded by Yas Apps, so the existing CSP can stay restrictive.

Before launch, register `/api/stripe-webhook` as a snapshot event destination for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`. Use a separate webhook/signing secret for each environment. The handler preserves the raw request bytes, validates Stripe's signature and timestamp, checks the configured payment-link ID and environment, and logs only the event ID/type/payment state. An unpaid completed session is pending. Repeated deliveries cause no fulfillment side effects. Stripe remains the payment system of record; no supporter email, card details, customer record, or mailing-list consent is stored by this integration. Configure Stripe's operational payment/fraud notifications and use its Dashboard for reconciliation, refunds, and disputes.

Remaining before live use: configure and verify a real webhook delivery, complete Stripe business activation and Wio payouts, confirm permitted support-payment purpose and applicable tax treatment, create the live link, and check the public flow. A test checkout success alone does not complete those steps. No recurring Billing integration has been enabled; adding one requires explicit recurring-price disclosure, a customer cancellation portal, and subscription/invoice/risk webhook handling.

The sandbox snapshot webhook destination is registered as `we_1Uagv4QURZVeJIpYbxOg9AK9` (`Yas Apps support sandbox`) at `https://yasapps.com/api/stripe-webhook`, with the three Checkout events above and API version `2026-10-28.endive`. Its signing secret still needs secure Vercel configuration before a real delivery can be verified. Keep public support checkout disabled during this setup.

## CAPTCHA protection

Cloudflare Turnstile Managed mode protects website downloads and product-update registration. The widget is named `Yas Apps downloads and registration` and allows `yasapps.com` and `www.yasapps.com`. Its site and secret keys are configured as sensitive production variables `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. Only the site key is returned by `/api/captcha-config`; never commit the secret. Production rejects Cloudflare's documented dummy keys. No DNS or nameserver migration is needed.

Registration uses action `register`. Available website download buttons go to `/download.html?product=browser&platform=macos`, where action `download` and custom data `browser-macos` are bound to a token. `/api/download` only returns a pinned, validated release after Siteverify confirms success, the expected hostname, the expected action, and the selected package. Missing, forged, expired, wrong-purpose, or rejected tokens fail closed; verification outages also keep the gate closed. Windows and Mail stay unavailable. The CSP permits only Cloudflare's challenge origin for its required script and iframe.

Cloudflare tokens expire after five minutes and are intended for single use; replay detection has documented global propagation delays. The UI resets the widget after each submission. Public GitHub releases and repository source remain directly accessible; this protects the website's download flow rather than making open-source release files private. Signed desktop updates continue to use GitHub directly and do not encounter a CAPTCHA.

Production verification on 11 November 2026: both real widgets completed verification; the download API accepted the purpose-bound browser token, and the downloaded Mac ZIP matched SHA-256 `6e21d9c93a58c7be1b769ac1a36fddc6f73ce0889bc2c417582ff65d6775e757`. A genuine registration token progressed to email-domain validation; the reserved `example.invalid` address was rejected before registration storage. Missing-token calls returned HTTP 400 and a forged-token download returned HTTP 403. All 24 current automated checks passed. The async script loader uses its load event, rather than calling `turnstile.ready()` on an async script.
