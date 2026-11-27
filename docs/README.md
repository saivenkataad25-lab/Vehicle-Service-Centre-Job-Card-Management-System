# Documentation

Project documentation for the API, verification evidence, and decisions still awaiting faculty confirmation.

## Contents

- [`api-contract.md`](api-contract.md) — endpoints, request/response shapes, validation, and HTTP status conventions
- [`api-summary.md`](api-summary.md) — short endpoint and workflow reference
- [`postman_collection.json`](postman_collection.json) — importable collection with test scripts for CRUD, conflicts, validation, and status rules
- [`test-matrix.md`](test-matrix.md) — requirement-by-requirement test results and evidence index
- [`database-checks.md`](database-checks.md) — SQL constraint checks
- [`er-diagram.md`](er-diagram.md) — five-table relationship diagram
- [`supervisor-confirmations.md`](supervisor-confirmations.md) — decisions explicitly requiring supervisor/faculty confirmation
- [`evidence/`](evidence/) — eight required screenshots, API/browser transcripts, Newman run, clean-start transcript, constraint-failure transcript, and setup/database evidence pages

## Use

Import `postman_collection.json` into Postman, keep `baseUrl` as `http://localhost:8080/api`, and run the folders in order; the collection sets resource IDs from create responses. The same checks are runnable from the repository root with `npm run test:api`; after restarting the backend, run `npm run test:api -- verify` to confirm persistence. Run `npm run evidence:newman` for the Postman collection transcript, `npm run test:e2e` for the browser workflow, and `npm run evidence:pages` / `npm run evidence:screenshots` to regenerate the visual evidence. Use the test matrix to map results to requirements and the evidence folder for screenshots. The highest-level setup and run instructions are in [`../README.md`](../README.md).
