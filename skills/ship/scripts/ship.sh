#!/usr/bin/env bash
# ship.sh "commit message" — stage everything, commit, push the current branch (with retry).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

MSG="${1:-}"
[ -z "$MSG" ] && { echo "ship: commit message required" >&2; exit 2; }

BR="$(git branch --show-current)"
case "$BR" in
  ""|main) echo "ship: refusing to ship from '${BR:-detached HEAD}'; switch to a feature branch" >&2; exit 2;;
esac

git add -A
git diff --cached --quiet && { echo "ship: nothing to commit"; exit 0; }
git commit -m "$MSG"

for delay in 0 2 4 8 16; do
  sleep "$delay"
  if git push -u origin "$BR"; then
    echo "ship: pushed $(git rev-parse --short HEAD) to $BR (not main)"
    exit 0
  fi
  echo "ship: push failed, retrying..." >&2
done
echo "ship: push failed after retries" >&2
exit 1
