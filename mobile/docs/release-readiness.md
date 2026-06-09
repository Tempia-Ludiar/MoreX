# MoreX Release Readiness

Last checked: 2026-06-09

## Current release stance

MoreX is acceptable for founder testing and limited beta use.

For broad public release, complete the remaining items below.

## Passed checks

- TypeScript check passes with `npm run typecheck`.
- Web export passes with `npm run export:web`.
- Supabase public environment variables are configured locally.
- `.env` is ignored by Git.
- PWA manifest and app icons are present.
- Supabase migrations define user-owned Tips with RLS policies.

## Release blockers to resolve before broad public launch

1. Payment is intentionally not connected yet.
   - The app currently treats every user as Free.
   - Free limits are active: saved Tips 50, MyTips 10, custom categories 5.
   - Plus screens and upgrade messages must keep saying that Plus is preparing, not purchasable.
   - Decision: Plus payment will be implemented after MVP validation.

2. Privacy policy is available.
   - File: `mobile/docs/privacy-policy-ja.md`
   - App route: `/privacy`
   - Before broad public release, confirm whether analytics, ads, and payment providers need provider-specific wording.

3. Manual device QA has been performed by the owner.
   - Sign up / login / logout
   - Save a URL-only Tip
   - Save an image Tip
   - Delete a Tip from Todo
   - Mark a Tip done and return it to todo
   - Add / remove MyTips
   - Manage categories
   - Add to iPhone home screen and confirm icon display

4. Dependency audit has moderate findings from Expo dependency chain.
   - `npm audit --omit=dev` reports moderate vulnerabilities.
   - The available forced fix upgrades Expo to a breaking version, so do not run it blindly.
   - Revisit after Expo SDK upgrade planning.

## Notes

- Link preview API now blocks localhost, private IP ranges, metadata hostname, DNS results that resolve to private addresses, and unsafe redirects before fetching HTML.
- Link previews can still fail for sites that block bots or require authentication. The app should continue using fallback previews in those cases.
