# Vehicle Service Centre Angular UI

Angular 22.3.0 frontend for the Vehicle Service Centre Job Card Management System. It uses Angular Router, Reactive Forms, a shared UI kit, and a dev-server proxy to the Spring Boot API.

See the root `README.md` for complete setup and troubleshooting.

## Start

From the project root, in a new shell:

```bash
source scripts/env.sh
npm --prefix frontend install
npm --prefix frontend start -- --host 127.0.0.1
```

Open `http://localhost:4200/`. The backend must be running at `http://localhost:8080`; `frontend/proxy.conf.json` proxies `/api` to it.

## Build

```bash
source scripts/env.sh
npm --prefix frontend run build
```

Output goes to `frontend/dist/`.

## Screens

- `dashboard/` — live counts, overdue/upcoming jobs, status chart
- `customers/` — list, search, create, detail, edit
- `vehicles/` — list, filter, create, detail, edit
- `bookings/` — list, filter, create, detail, edit, cancel
- `job-cards/` — list, filter, create from booking, detail, edit, status changes
- `technicians/` — list, filter, create, detail, edit
- `reports/` — completed-job report with date/status filters

## Notes

- All data comes from the Spring Boot API; there is no JSON Server or mock data.
- Customer and technician phone fields require exactly 10 characters.
- Status history and service-task amounts are backend-calculated and read-only in the UI.
- `src/styles.css` and `src/app/shared/ui.ts` define the Dark Workshop visual system.
