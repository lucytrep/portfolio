# Routing Guide

This repo uses clean folder URLs as the canonical pages and keeps older `.html` files as compatibility redirects.

## Canonical pages to edit

- `/index.html`
  - Canonical landing page for `lucytrep.com`
  - On the GitHub Pages hostname, it redirects visitors to `/case-studies/`
- `/about/index.html`
- `/archive/index.html`
- `/case-studies/index.html`
- `/projects/acuity/index.html`
- `/axsphere/index.html`
  - Canonical Axsphere page for normal site navigation
- `/projects/fanatics/index.html`
- `/projects/figma-design-challenge/index.html`
- `/projects/forage/index.html`
- `/projects/meta-in-app/index.html`
- `/projects/nike/index.html`

## Redirect wrappers: do not edit for content

These files exist only so older URLs keep working:

- `/home.html`
- `/about.html`
- `/archive.html`
- `/case-studies.html`
- `/projects/acuity.html`
- `/projects/axsphere.html`
  - Book-safe redirect for the originally submitted Axsphere link
- `/projects/axsphere/index.html`
  - Compatibility redirect to `/axsphere/`
- `/axsphere.html`
  - Compatibility redirect to `/axsphere/`
- `/projects/fanatics.html`
- `/projects/figma-design-challenge.html`
- `/projects/forage.html`
- `/projects/meta-in-app.html`
- `/projects/nike.html`

They should only contain redirect logic.

## Best practice

- Edit the canonical pages listed above only.
- Axsphere is the one exception: edit `/axsphere/index.html`, not the Axsphere wrappers.
- `/projects/axsphere.html`, `/projects/axsphere/`, and `/axsphere.html` are compatibility redirects to `/axsphere/`.
- Keep the redirect wrapper files in place if you want old links to continue working.
- Do not move the wrappers into another folder, or the original URLs will break.
