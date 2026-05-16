# zong-mak-consumer

Node.js backend project for fetching values from the `processor` table in the `zong_mak` MySQL database on an hourly schedule.

## Setup

1. Copy `.env.example` to `.env` and update values.
2. Run `npm install`.
3. Start the app with `npm start`.

## Cron Job

The project includes a scheduled task in `src/jobs/processorCron.js` using `node-cron`.

To run just the cron fetch script manually:

```bash
npm run cron
```

## Project structure

- `src/index.js` — application bootstrap
- `src/db.js` — MySQL connection pool
- `src/jobs/processorCron.js` — hourly fetch job
- `src/app.js` — Express app and routes

