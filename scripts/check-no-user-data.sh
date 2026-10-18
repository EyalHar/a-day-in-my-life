#!/bin/sh
# Fails if any user data (journal database, uploaded photos, env files) is about to be committed.
# Used by .githooks/pre-commit (staged files) and the data-guard GitHub workflow (all tracked files).
#
#   scripts/check-no-user-data.sh           check every tracked file
#   scripts/check-no-user-data.sh --staged  check only files staged for commit

if [ "$1" = "--staged" ]; then
  files=$(git diff --cached --name-only --diff-filter=ACMR)
else
  files=$(git ls-files)
fi

forbidden=$(printf '%s\n' "$files" \
  | grep -E '^server/data/|^server/uploads/|\.(db|db-wal|db-shm|db-journal|sqlite|sqlite3)$|(^|/)\.env($|\.)' \
  | grep -v -E '^server/uploads/\.gitkeep$|(^|/)\.env\.example$')

if [ -n "$forbidden" ]; then
  echo "✖ User data must never be committed (see README → Data & privacy). Remove these from git:" >&2
  printf '  %s\n' $forbidden >&2
  echo "  e.g.: git rm --cached <file>" >&2
  exit 1
fi
