# MoreX Billing Plan

This file is the shared billing memo for Codex, Claude Code, and future implementation work.

## Current Decision

- Free: JPY 0
- Plus: JPY 680/month
- Annual plan: not offered at launch
- Pro: future plan, not implemented at launch

The first Plus plan should be simple. It unlocks limits for users who use MoreX seriously.

## Product Philosophy

Free should let users understand the core loop:

1. Save a Tip
2. Execute it
3. Mark it Done
4. Keep valuable ones in MyTips
5. Reuse the knowledge later

Plus should not be a random bundle of many features. The first version of Plus is about removing limits.

## Free Limits

- Saved Tips: 100
- MyTips: 20
- Custom categories: 5

Important:

- Existing user data should never be deleted when the user reaches a limit.
- If a user is already above a limit, keep their existing data and block only new additions.
- Sample Tips may count as saved Tips for now. If this feels too strict later, revisit this decision.

## Plus

Price:

- JPY 680/month

Unlocks:

- Unlimited saved Tips
- Unlimited MyTips
- Unlimited custom categories

Launch positioning:

> Keep building your personal execution knowledge base without limits.

Good copy ideas:

- Save without worrying about limits
- Keep unlimited MyTips
- Create unlimited custom categories
- Build your personal knowledge base

## Future Plus Candidates

These are not required for the first billing release.

### Collections

Collections are user-created shelves/playlists for MyTips.

Examples:

- Posting ideas
- Sales prompts
- UI improvement
- Claude workflows
- Personal work systems

Collections are broader than categories. A category is a label. A collection is a curated shelf.

### Resurfacing Reminders

Resurfacing reminders bring useful Tips back later.

Examples:

- "You saved this 7 days ago. Want to try it today?"
- "This MyTip has not been used recently. Could it help this week?"

The purpose is to prevent "saved and forgotten".

## Pro Plan, Future Only

Pro should focus on AI-powered automation.

Possible Pro features:

- AI title generation
- AI category/tag suggestion
- AI summarization
- Automatic Tip creation from URLs
- Bulk AI organization
- Weekly AI review
- Generate posts or implementation plans from MyTips

Do not mix heavy AI automation into the first Plus plan. It blurs the distinction between Plus and Pro and can create cost issues.

## Current Implementation Plan

1. Keep plan and limits in shared constants.
2. Treat every user as Free until payment integration exists.
3. Add a Plus landing screen.
4. Show usage in Settings.
5. Enforce limits when:
   - saving a new Tip
   - adding a Tip to MyTips
   - adding a custom category
6. Use friendly upgrade prompts instead of scary error messages.

## Payment Integration Notes

Payment is not implemented yet.

When payment is added, replace the temporary plan source with a real subscription source such as RevenueCat, Stripe, or app-store subscriptions.

Do not scatter payment checks across screens. Keep plan access behind shared helpers.
