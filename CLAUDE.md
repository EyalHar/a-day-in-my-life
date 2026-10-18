# Project rules

## User data must never reach git

This repo is **public**. The journal's content is personal and lives only locally:
`server/data/` (SQLite DB), `server/uploads/` (photos), `server/.env`, and any `*.db` / `*.sqlite` file.

- Never `git add -f`, un-ignore, or otherwise commit any of these — not even "just for a test" or as sample data.
- Never weaken `.gitignore`, `.githooks/pre-commit`, `.github/workflows/data-guard.yml`, or `scripts/check-no-user-data.sh`. Never bypass the hook with `--no-verify`.
- When adding a new place that stores user data, add it to both `.gitignore` and `scripts/check-no-user-data.sh` in the same change, and to the table in README → Data & privacy.
- Don't copy real journal content (entry text, photos, dates of real entries) into code, tests, docs, commit messages, or PR descriptions.
- Testing against data: use a copy outside the repo (e.g. a temp/scratch directory) and delete it afterwards.

## Docs

`README.md` and `docs/ARCHITECTURE.md` are in English. Update them in the same change as any feature, API, schema, or setup change.
