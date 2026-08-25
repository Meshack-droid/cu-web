# TUMCU Platform — Release Readiness

## Included
- Data-driven dashboard using live membership, event, attendance and prayer APIs.
- Administrative application queue with submitted + under-review states, search, refresh and automatic polling.
- Improved responsive navigation and account controls.
- Server-backed logout with safe local fallback.
- Concurrent JWT refresh protection to prevent multiple refresh requests on simultaneous 401 responses.
- Registration validation before the application can be submitted.
- SPA fallback/404 handling.
- Docker production configuration with environment-driven secrets, service health checks and persistent Redis.
- Deployment guide and environment template.

## Validation
The source package was inspected and the application build commands are configured. A full dependency-based TypeScript/Vite build could not be completed in this sandbox because the uploaded archive's dependency installation did not finish within the available execution window; no source-level build result is being claimed as passed.
