# Event + Landing Page Fix

## Landing page photos
The five supplied TUMCU photos are now bundled under `frontend/src/assets/community/`.
The hero carousel cross-fades between all five photos every **4 seconds**, with accessible
manual indicators. The landing page also has a responsive photo mosaic so the supplied
images are visible beyond the hero.

## Event page
The public events API has been hardened:
- Uses explicit public columns rather than `SELECT *`.
- Limits public page size to 50.
- Returns only upcoming/ongoing public events when the event status column exists.
- Gracefully falls back to the base `events` schema if an older local database has not yet
  received the optional event columns, avoiding a generic 500 on the public page.
- The UI retries twice automatically and provides a visible Retry button.

## Database
Run the normal migrations:

```powershell
cd backend
npm run migrate
```

If your database already has `schema_migrations` and the operational migration is marked
as applied, migration `003_event_schema_repair.sql` will add any missing event columns/indexes.

If migration `002_operational_modules.sql` is still failing before it can reach migration 003,
do not drop the database. Use the public event fallback while the migration chain is repaired;
the backend now tells the public event page how to operate against the older base schema.

## Verify locally

Backend:
```powershell
cd backend
npm run build
npm run dev
```

Frontend, in a second terminal:
```powershell
cd frontend
npm run build
npm run dev
```

Then open:
`http://localhost:5173/events`

The public endpoint is:
`http://localhost:4000/api/v1/events/public`
