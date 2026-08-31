# github-contributions

Serves the GitHub contribution calendar for siwat.me as JSON.

GitHub has no embed for the calendar, and the only API that exposes it is
GraphQL, which requires a token. A static page cannot hold a token, so this
Worker keeps it server-side — the same shape as the visitor counter.

## Deploy

```bash
cd workers/github-contributions
npx wrangler secret put GITHUB_TOKEN   # classic PAT; public data needs no scopes
npx wrangler deploy
```

Then point `GITHUB_API` in `script.js` at the deployed URL.

## Response

```json
{
  "login": "sjsiwat",
  "total": 507,
  "weeks": 53,
  "from": "2025-08-31",
  "to": "2026-08-31",
  "days": [[weekIndex, weekday, count, level]]
}
```

`level` is GitHub's own quartile bucket, 0–4.

## Notes

- Cached for an hour at the edge; the calendar only moves once a day.
- `ALLOWED_ORIGINS` in `wrangler.toml` gates CORS. Add any new origin there.
- If the Worker is unreachable, the page hides the Activity section entirely
  rather than showing an empty grid.
