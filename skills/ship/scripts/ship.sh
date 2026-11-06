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

[ -f scripts/skill-index.mjs ] && node scripts/skill-index.mjs
git add -A

# Approval guard: files that are not code need the user's approval first (save-changes skill);
# "@approved" in the subject records it. The generated skill index is exempt.
UNAPPROVED="$(git -c core.quotePath=false diff --cached --name-only | grep -Ev '\.(sh|mjs|js|ts|py)$|^\.agents/skills/index\.md$' || true)"
if [ -n "$UNAPPROVED" ] && ! printf '%s' "$MSG" | grep -q '@approved'; then
  echo "ship: stopped. These non-code files changed:" >&2
  echo "$UNAPPROVED" | sed 's/^/  /' >&2
  echo "ship: show the user these changes (save-changes skill); after they say yes, ship again with @approved in the subject." >&2
  exit 1
fi
if git diff --cached --quiet; then
  echo "ship: nothing new to commit; pushing existing commits"
else
  git commit -m "$MSG"
fi

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
