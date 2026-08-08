# MoneyPlatform

React + Vite investment dashboard with a Node API server. Market data uses public live APIs with local fallback data. Authentication, community posts, favorites, and portfolio holdings support SQLite locally and PostgreSQL in production.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

`npm run dev` starts:

- Vite frontend server on port `5173`
- Node API server on port `3001`
- Local SQLite database at `data/money-platform.sqlite`

## Verification

```bash
npm run lint
npm run build
npm run verify
npm run test:e2e
```

## Production

```bash
npm run build
npm start
```

The Node server serves `dist`, investment API routes, and authentication routes. Set:

```bash
DATABASE_URL=
JWT_SECRET=replace-with-a-long-random-secret
DATABASE_SSL=true
```

When `DATABASE_URL` is empty, the server uses local SQLite. `render.yaml` declares a Render Web Service and PostgreSQL database for deployment.

## Deployment checklist

1. Commit all local changes.
2. Push the repository to GitHub.
3. Create the Render service from `render.yaml`.
4. Confirm these environment variables in Render:

- `DATABASE_URL`: provided by the Render PostgreSQL database
- `DATABASE_SSL`: `true`
- `JWT_SECRET`: generated secret value
- `NODE_VERSION`: `24.16.0`

5. Open `/api/auth/health` on the deployed URL and confirm `{ "ok": true }`.
6. Test signup, login, favorites, portfolio holdings, and market data on the deployed URL.

## Data sources

The API server tries public live data first and falls back to local sample data when an external provider is unavailable.

- Crypto: CoinGecko public markets API
- US stocks and market indices: Stooq quote CSV
- News: GDELT DOC API
- Community: database-backed local posts

## View the local DB without installing a program

List recent users without showing password hashes:

```bash
node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync('data/money-platform.sqlite'); console.table(db.prepare('SELECT id, username, name, email, phone, birth_date AS birthDate, created_at AS createdAt FROM users ORDER BY id DESC LIMIT 20').all()); db.close();"
```

Count users:

```bash
node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync('data/money-platform.sqlite'); console.table(db.prepare('SELECT COUNT(*) AS users FROM users').all()); db.close();"
```

List community posts:

```bash
node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync('data/money-platform.sqlite'); console.table(db.prepare('SELECT id, title, likes, views FROM community_posts ORDER BY id LIMIT 20').all()); db.close();"
```

List saved favorites:

```bash
node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync('data/money-platform.sqlite'); console.table(db.prepare('SELECT users.username, favorite_assets.item_key AS itemKey, favorite_assets.created_at AS createdAt FROM favorite_assets JOIN users ON users.id = favorite_assets.user_id ORDER BY favorite_assets.created_at DESC LIMIT 20').all()); db.close();"
```

List portfolio holdings:

```bash
node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync('data/money-platform.sqlite'); console.table(db.prepare('SELECT users.username, portfolio_holdings.symbol, portfolio_holdings.name, portfolio_holdings.quantity, portfolio_holdings.average_price AS averagePrice FROM portfolio_holdings JOIN users ON users.id = portfolio_holdings.user_id ORDER BY portfolio_holdings.updated_at DESC LIMIT 20').all()); db.close();"
```
