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
- `/projects/axsphere.html`
  - Special case: keep this as the real page because older submitted links point here
- `/axsphere.html`
  - Alias redirect for the shorter Axsphere URL
- `/projects/fanatics/index.html`
- `/projects/figma-design-systems-challenge/index.html`
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
- `/projects/axsphere/index.html`
  - Compatibility redirect to `/projects/axsphere.html`
- `/axsphere/index.html`
  - Compatibility redirect to `/projects/axsphere.html`
- `/projects/fanatics.html`
- `/projects/figma-design-systems-challenge.html`
- `/projects/forage.html`
- `/projects/meta-in-app.html`
- `/projects/nike.html`

They should only contain redirect logic.

## Best practice

- Edit the canonical pages listed above only.
- Axsphere is the one exception: edit `/projects/axsphere.html`, not `/projects/axsphere/index.html`.
- Axsphere sync rule: any change intended for both `/projects/axsphere.html` and `/projects/axsphere/` must be made only in `/projects/axsphere.html`.
- `/projects/axsphere/`, `/axsphere.html`, and `/axsphere/` must remain redirect wrappers to `/projects/axsphere.html`, so all Axsphere URLs always show the same page without duplicate maintenance.
- Keep the redirect wrapper files in place if you want old links to continue working.
- Do not move the wrappers into another folder, or the original URLs will break.
