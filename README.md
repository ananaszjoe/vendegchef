# Vendég Chef

A zero-build, mobile-first interest survey for a weekly premium lunch delivery concept. The form runs in demo mode by default and stores submissions only in the current browser.

## Preview locally

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Publish on GitHub Pages

1. Push `main` to GitHub.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.

The included workflow deploys the site on every push to `main`.

## Airtable table schema

Create these fields exactly as written:

| Field | Airtable type |
| --- | --- |
| Name | Single line text (primary field) |
| Email | Email |
| Location | Single line text |
| People count | Number (integer) |
| Portion size | Single select |
| Price bracket | Single select |
| Order frequency | Single select |
| Cuisines | Multiple select |
| Disliked foods | Long text |
| Allergies and intolerances | Long text |
| Spice tolerance | Rating (1–5) |
| Ingredient quality | Rating (1–5) |
| Nutrient balance | Rating (1–5) |
| Packaging quality | Rating (1–5) |
| Finish-at-home kit | Rating (1–5) |
| Menu diversity | Rating (1–5) |
| Price importance | Rating (1–5) |
| Delivery convenience | Rating (1–5) |
| Ideas | Long text |
| Consent | Checkbox |
| Submitted at | Date with time |
| Source | Single line text |

## Connect Airtable safely

Do not put an Airtable Personal Access Token in frontend code. GitHub Pages is public, so the repository includes a Cloudflare Worker relay in `airtable-relay/`.

1. Update `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_ID`, and `ALLOWED_ORIGIN` in `airtable-relay/wrangler.toml`.
2. Create an Airtable Personal Access Token with `data.records:write` access limited to this base.
3. From `airtable-relay/`, deploy the Worker:

   ```bash
   npx wrangler login
   npx wrangler secret put AIRTABLE_TOKEN
   npx wrangler deploy
   ```

4. Copy the deployed Worker URL into `config.js` and switch off demo mode:

   ```js
   window.VENDEGCHEF_CONFIG = Object.freeze({
     submissionEndpoint: "https://vendegchef-airtable-relay.YOUR-SUBDOMAIN.workers.dev",
     demoMode: false,
   });
   ```

The relay validates the survey payload, restricts browser requests to the configured GitHub Pages origin, and keeps the Airtable token server-side.
