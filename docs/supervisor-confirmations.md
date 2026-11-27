# Supervisor / faculty confirmations

The original requirements recommend implementation defaults for the items below but explicitly ask for supervisor or faculty confirmation. The application currently follows those defaults; no approval is claimed here.

| Decision | Requirement basis | Current implementation | Status | Faculty sign-off | Date |
|---|---|---|---|---|---|
| JSON `service_tasks` column inside `job_cards` under the five-entity rule | Section 3 asks to confirm that a JSON column is acceptable instead of a sixth task table | `service_tasks` is a MySQL JSON column; task amounts and labour estimate are calculated by the backend | Pending faculty confirmation | ____________________ | YYYY-MM-DD |
| Allowed booking statuses | Section 2 recommends `PENDING`, `CONFIRMED`, `CANCELLED`, `CONVERTED`; Section 12 says booking status values need supervisor confirmation | Those four values are enforced in the API and database | Pending faculty confirmation | ____________________ | YYYY-MM-DD |
| Allowed job statuses and transitions | Phase 0 asks for supervisor confirmation of permitted status values; Section 2 lists `OPEN`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `DELIVERED` and their transitions | The listed values and transitions are enforced by the backend | Pending faculty confirmation | ____________________ | YYYY-MM-DD |
| Deletion rules | Sections 4 and 12 require supervisor agreement on restricted deletion and extra soft-delete fields; Phase 0 asks for confirmation of deletion rules | Hard delete only when no dependants exist; protected deletes return `409`; no soft-delete fields | Pending faculty confirmation | ____________________ | YYYY-MM-DD |
| Exact Angular folder tree | Section 6 lists `core/services/`, `core/interceptors/`, `shared/components/`, `shared/pipes/`, and `models/` | Layered architecture is preserved with consolidated files `core/api.service.ts`, `core/models.ts`, and `shared/ui.ts`; feature folders match the requirement | Pending faculty confirmation | ____________________ | YYYY-MM-DD |
| MySQL Workbench GUI constraint testing | Phase 1 asks for direct constraint testing in MySQL Workbench | Constraints are tested directly against MySQL with CLI queries in `docs/evidence/08-database.png` and conflict tests in `docs/evidence/07-api.png` | Pending faculty confirmation | ____________________ | YYYY-MM-DD |
| ZIP submission requirement | Phase 7 says to create a ZIP if required; Section 10 allows a GitHub URL or source ZIP | GitHub repository URL is provided; a ZIP can be supplied on request | Pending faculty confirmation | ____________________ | YYYY-MM-DD |

Record the decision and sign-off in the last two columns once confirmation is actually received.
