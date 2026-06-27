# SafeMap

SafeMap is a dual-audience public safety platform for citizens and law enforcement.

## Features
- AI incident classification, report summarization, and smart search
- SOS emergency reporting, geofenced alerts, broadcast messaging
- Neighborhood groups, report reactions, comments, safety scoring
- Real-time incident feed, police analytics, heatmap layer, exports
- Region-based data partitioning via `regionId`

## Setup
1. Copy `.env.example` values into `server/.env`.
2. Run `docker compose up --build`.
3. Client available at `http://localhost:3000`, API at `http://localhost:4000`.

## Folders
- `client/` - React front-end
- `server/` - Node.js API and Socket.io backend
- `docker-compose.yml` - local container orchestration
- `nginx.conf` - reverse proxy sample

## API Routes
- POST `/api/ai/classify`
- POST `/api/ai/analyze-patterns`
- POST `/api/ai/smart-search`
- POST `/api/sos`
- GET `/api/alerts/my`
- POST `/api/broadcasts`
- GET `/api/neighborhoods/:id`
- POST `/api/neighborhoods/join`
- POST `/api/reports/:id/react`
- POST `/api/reports/:id/comment`
- GET `/api/analytics/overview`
- GET `/api/analytics/heatmap`
- GET `/api/analytics/trends`
- GET `/api/export/csv`
- GET `/api/export/pdf`

## Notes
- Requires MongoDB and Anthropic API credentials.
- Uses `web-push` notifications and optional Twilio SMS.

## Disclaimer
SafeMap is a community reporting platform intended for public safety awareness and coordination with local authorities. Do not use the platform to attempt to identify private individuals, publish private data (phone numbers, addresses, social security numbers) or to harass or threaten others. False reporting or misuse may result in account suspension and may be unlawful.

## Admin bootstrap
To create an admin user locally, set the following environment variables in `server/.env` and run the seeding script:

```powershell
# in project root
cd server
setx ADMIN_EMAIL "corycaldwell98@gmail.com"
setx ADMIN_PASSWORD "Zoom6969"
node scripts/seedAdmin.js
```

Note: storing credentials in environment variables is more secure than committing them to source control.

See the full legal disclaimer in [LEGAL.md](LEGAL.md).

## Imports & Scheduler
The project includes importer services for NYC, Toronto and UK Police (London example) and a wanted-persons importer from the FBI.

Start the scheduler (runs imports periodically):

```powershell
cd server
node scripts/scheduler.js
```

You can override schedule with `IMPORT_SCHEDULE` (cron format) or set `START_SCHEDULER=true` when running under a process manager.
