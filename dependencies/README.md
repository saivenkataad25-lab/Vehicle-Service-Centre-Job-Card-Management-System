# Dependencies

This directory is the single starting point for dependency setup.

- `versions.json` records the verified tool versions and manifest locations.
- `install.sh` creates `.env` from `.env.example` if needed and installs the Angular packages with `npm ci --prefix frontend`.
- `backend/pom.xml` and `frontend/package.json` / `frontend/package-lock.json` are the committed dependency manifests.
- `runtime/` is optional and ignored. Put portable JDK, Maven, MySQL, and Node binaries there to make `scripts/env.sh` use them automatically.

Run from the project root:

```bash
bash dependencies/install.sh
```

On a clean machine, install Node.js 24.20.0, Java 21, Maven 3.9.16, and MySQL 8.4.13 first, or provide them under `dependencies/runtime/`.
