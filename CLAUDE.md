# CLAUDE.md — Nette Artes Florais

---

## What this repo is

A static marketing site (plain HTML/CSS/JS, no framework, no build step, no backend) for a real florist/craft business, deployed to Netlify. No forms, no database, no auth, no payments — customer contact is entirely via WhatsApp deep links (`wa.me/...`). No CI configured (`.github/workflows/` doesn't exist). Pushing to the deploy branch is a live production release of a real, currently-operating small business's public site — there's no staging gate and no automated test to catch a mistake before a real customer sees it.

## Operating rules for this repo

Because there's no CI and no automated safety net, be more careful here than in a repo that has one, not less:

- **Small, focused changes.** A copy fix, an image swap, a broken-link fix — one thing at a time, easy to review and easy to revert.
- **Before pushing anything, actually open the changed page(s) and look at them** — read the HTML rendered, not just the diff. This is the entire verification surface for a static site; there's no test suite to lean on instead.
- **Check the CSP in `_headers` before adding any new external resource** (script, font, image host, embed). It currently locks `script-src`/`connect-src`/`font-src` to `'self'` and `form-action` to `'none'` — a new external dependency needs a matching CSP update in the same change, or it'll silently fail to load/execute for real visitors with no error visible to you locally unless you check the browser console.
- **Customer-facing copy is customer-facing copy — same as anywhere else.** Keep it accurate to what the business actually offers; don't invent claims, pricing, or availability that could mislead a real customer who then contacts them expecting it.
- **This is Portuguese-language content for a Brazilian small business.** Don't machine-translate or rewrite copy without being confident the result still reads naturally — a subtly-wrong translation on a public storefront is a real (if low-severity) customer-facing defect, not just a style nit.

## 🎖️ Operating Mandate — scoped down for this repo's actual risk surface

The canonical Security Review checklist, Future-Risk Review checklist, and Final Report Format live in `SentaraAI/Flue-Pipe-AI-Expert`'s `CLAUDE.md` — most of it doesn't apply here (no auth, no DB, no API, no customer data collected by the site itself) so it isn't duplicated. What does carry over: **honest, non-overpromising customer-facing wording** (this site's entire purpose is customer-facing wording) and **small-change discipline** (per above). Skip the rest rather than force-fitting a checklist that assumes a backend this repo doesn't have.

**Escalate to Isa** (or whoever owns this business relationship) for: any change to pricing/service claims you're not certain is accurate, a redesign or restructure beyond a single-page fix, or anything that would change what the business is representing itself as offering.
