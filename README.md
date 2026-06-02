# MoneyPlatform

React + Vite investment dashboard with a Node API server. Market data currently uses server-side sample data. Authentication supports SQLite locally and PostgreSQL in production.

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
npm run test:e2e
```

## Production

```bash
npm run build
npm start
```

The Node server serves `dist`, investment API routes, and authentication routes. Set:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=replace-with-a-long-random-secret
```

When `DATABASE_URL` is empty, the server uses local SQLite. `render.yaml` declares a Render Web Service and PostgreSQL database for deployment.
