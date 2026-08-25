# TUMCU / TECUMP deployment guide

## Recommended production architecture

- Frontend: Vercel, Netlify, Cloudflare Pages, or the included Nginx Docker image.
- API: a Node 20+ container/VM with HTTPS.
- Database: managed MySQL 8+.
- Redis: managed Redis or the included container for a single-host deployment.
- Email: SMTP provider for membership and system notifications.

## Local production-like test

1. Copy `.env.example` to `.env`.
2. Replace every password/secret with a strong random value.
3. Run `docker compose up --build`.
4. Open `http://localhost:5173`.
5. Verify API readiness at `http://localhost:4000/health/ready`.
6. Create the first administrator from the backend container:
   `docker compose exec backend node dist/database/create-admin.js --email you@example.com --name "Your Name"`
7. Log in, submit a test membership application from a separate browser/incognito window, then approve it from the administrator dashboard.
8. Verify events, attendance, prayer, meetings and finance workflows.

## Separate frontend/API deployment

Set the frontend environment variable:

`VITE_API_URL=https://YOUR-API-DOMAIN/api/v1`

Set the backend:

`CORS_ORIGIN=https://YOUR-FRONTEND-DOMAIN`

Do not leave localhost in `CORS_ORIGIN` in production.

## Database

The backend container runs versioned migrations before starting the API. For managed deployments, it is safer to run migrations as a release step and then deploy the application.

Never delete production data to apply a schema change. Add a new numbered migration instead.

## Important production checks

- HTTPS is mandatory.
- Use unique JWT access and refresh secrets.
- Use a managed database with automated backups.
- Configure SMTP and verify the sender domain.
- Keep `.env` out of git.
- Run `npm run build` for both frontend and backend in CI before deployment.
- Run backend unit/integration tests against a disposable test database.
- Configure monitoring against `/health/live` and `/health/ready`.
- Restrict database and Redis ports from the public internet.


## Shared cloud data and cross-device updates

This deployment uses a single server-side MySQL database as the source of truth. The browser does not store application records as the authoritative data. All dashboards, applications, events, ministries, attendance, prayer requests and administrative records are fetched through the API.

The frontend now automatically refreshes active React Query data every 15 seconds, refetches when the browser regains focus, and refetches after reconnecting to the internet. This means an update made by an administrator on one device becomes visible on other currently-open devices automatically, normally within 15 seconds (and sooner when the page regains focus).

For a production deployment, keep MySQL and Redis private. Only expose the frontend HTTPS port to the internet. The included Nginx configuration proxies `/api/*` to the backend, so the browser can use the same public origin and does not need a separate API domain.

### Recommended production architecture

`Internet -> HTTPS reverse proxy/load balancer -> TUMCU frontend (Nginx) -> TUMCU backend -> MySQL`

Redis is included for future distributed jobs/events and is intentionally not exposed publicly.

### Deploy with Docker on a VPS

1. Copy `.env.production.example` to `.env`.
2. Replace every secret and set `CORS_ORIGIN` to the exact public HTTPS origin.
3. Point your domain DNS record to the server.
4. Put TLS/HTTPS in front of port 80 using Caddy, Traefik, or a cloud load balancer.
5. Run `docker compose up -d --build`.
6. Verify `https://YOUR-DOMAIN/` and `https://YOUR-DOMAIN/api/v1/...` through the same origin.
7. Back up the `mysql_data` volume/database regularly.

### Important deployment rule

Do not deploy separate copies of MySQL for different frontend/backend instances. Every application instance must point to the same production database; otherwise updates will not be shared across devices.
