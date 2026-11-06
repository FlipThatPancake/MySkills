#!/usr/bin/env bash
# ship.sh — keep this copy and GitHub in step.
#   ship.sh start       fetch; bring in new commits when no file changed on both sides; report the rest
#   ship.sh "message"   run every ship-checks/ file, commit, combine with GitHub, push
# A cloud session (CLAUDE_CODE_REMOTE=true or SHIP_CLOUD=1) never pushes main; a local one pushes the branch it is on.
# Exit codes: 0 done · 1 git or network failure · 2 usage, check failed · 3 both sides changed the same files
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

CLOUD=0
if [ "${CLAUDE_CODE_REMOTE:-}" = true ] || [ -n "${SHIP_CLOUD:-}" ]; then CLOUD=1; fi
BR="$(git branch --show-current)"
[ -z "$BR" ] && { echo "ship: detached HEAD; switch to a branch first" >&2; exit 2; }
WHEN='format:%b %d %H:%M'

fetch() { for d in 0 2 4 8; do sleep "$d"; git fetch -q --prune origin 2>/dev/null && return 0; done; return 1; }

# The ref this branch syncs with: its upstream, else origin/<branch> when that exists.
upstream() {
  local u
  if u=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null) && git rev-parse -q --verify "$u" >/dev/null; then
    echo "$u"; return
  fi
  git rev-parse -q --verify "refs/remotes/origin/$BR" >/dev/null && echo "origin/$BR"
  true
}

# Files changed here since the split: local commits, uncommitted edits, new files.
changed_here() { { git diff --name-only "$1"; git ls-files --others --exclude-standard; } | sort -u; }

# Date and commit that last changed a file on a ref since the split; a merge shows as the merge.
last_change() { git log -1 --first-parent --date="$WHEN" --format='%cd, "%s"' "$1..$2" -- "$3"; }

# Prints a table and returns 0 when files changed both here and on $1.
clash_table() {
  local base both f here
  base=$(git merge-base HEAD "$1")
  both=$(comm -12 <(changed_here "$base") <(git diff --name-only "$base" "$1" | sort -u))
  [ -z "$both" ] && return 1
  echo "These files changed both here and on $1. Nothing was combined."
  echo "| File | This copy | $1 |"
  echo "|---|---|---|"
  while IFS= read -r f; do
    if [ -n "$(git status --porcelain -- "$f")" ]; then
      if [ -e "$f" ]; then here="saved $(date -r "$f" '+%b %d %H:%M') (not committed)"; else here="deleted (not committed)"; fi
    else
      here=$(last_change "$base" HEAD "$f")
    fi
    echo "| $f | $here | $(last_change "$base" "$1" "$f") |"
  done <<< "$both"
  return 0
}

# Lists the files a merge of $1 brought in, with the date and commit of each.
list_incoming() {
  local base=$1 ref=$2 f
  git diff --name-only "$base" "$ref" | head -40 | while IFS= read -r f; do
    echo "  $f — $(last_change "$base" "$ref" "$f")"
  done
}

# Brings in $1 when nothing clashes. Returns 3 after printing a clash table.
bring_in() {
  local ref=$1 n base
  n=$(git rev-list --count "HEAD..$ref")
  [ "$n" = 0 ] && return 0
  if clash_table "$ref"; then return 3; fi
  base=$(git merge-base HEAD "$ref")
  git merge -q --no-edit "$ref" >/dev/null || { git merge --abort 2>/dev/null; echo "ship: merging $ref failed; nothing was changed" >&2; return 1; }
  echo "Brought in $n commit(s) from $ref:"
  list_incoming "$base" "$ref"
}

run_checks() {
  local bad=0 seen="" c real run
  for c in skills/*/ship-checks/* .agents/skills/*/ship-checks/* .claude/skills/*/ship-checks/* scripts/ship-checks/*; do
    [ -f "$c" ] || continue
    real="$(cd "$(dirname "$c")" && pwd -P)/$(basename "$c")"
    case "$seen" in *"|$real|"*) continue;; esac
    seen="$seen|$real|"
    case "$c" in *.mjs|*.js) run=node;; *.py) run=python3;; *.sh) run=bash;; *) continue;; esac
    "$run" "$c" --msg "$1" || bad=1
  done
  return "$bad"
}

start() {
  git rev-parse -q --verify HEAD >/dev/null || { echo "Sync check skipped: no commits yet."; exit 0; }
  fetch || { echo "Sync check skipped: fetching from GitHub failed."; exit 0; }
  local up rc=0 ref
  up=$(upstream)
  for ref in $up $([ "$BR" != main ] && git rev-parse -q --verify origin/main >/dev/null && echo origin/main); do
    bring_in "$ref" || rc=$?
  done
  [ -n "$up" ] && [ "$(git rev-list --count "$up..HEAD")" != 0 ] &&
    echo "$(git rev-list --count "$up..HEAD") local commit(s) on $BR are not on GitHub yet."
  [ -n "$(git status --porcelain)" ] && echo "This copy has uncommitted changes."
  local rows
  rows=$(git for-each-ref --sort=-committerdate --no-merged=origin/main refs/remotes/origin \
    --format='%(refname:short)|%(committerdate:relative)|%(subject)' 2>/dev/null |
    while IFS='|' read -r r when subj; do
      case "$r" in origin|origin/HEAD|origin/main|"origin/$BR") continue;; esac
      echo "  ${r#origin/} — last commit $when: $subj"
    done | head -10)
  [ -n "$rows" ] && printf 'Branches with work not on main yet:\n%s\n' "$rows"
  [ "$rc" = 0 ] && echo "Sync: $BR is up to date with GitHub."
  exit "$rc"
}

save() {
  local msg=$1 up rc=0
  [ "$CLOUD" = 1 ] && [ "$BR" = main ] && { echo "ship: a cloud session never pushes main; switch to a branch" >&2; exit 2; }
  git add -A
  run_checks "$(printf '%s\n' "$msg" | head -1)" || { echo "ship: a check failed; nothing was committed" >&2; exit 2; }
  git add -A
  if git diff --cached --quiet; then echo "ship: nothing new to commit"; else git commit -q -m "$msg"; fi
  fetch || { echo "ship: fetching from GitHub failed; the commit is saved here only" >&2; exit 1; }
  up=$(upstream)
  if [ -n "$up" ]; then
    bring_in "$up" || rc=$?
    [ "$rc" = 3 ] && echo "ship: your commit is saved here but not pushed. Choose a side per file, then ship again." >&2
    [ "$rc" != 0 ] && exit "$rc"
  fi
  for d in 0 2 4 8 16; do
    sleep "$d"
    if git push -q -u origin "$BR" 2>/dev/null; then
      echo "ship: pushed $(git rev-parse --short HEAD) to $BR$([ "$BR" != main ] && echo ' (not main)')"
      exit 0
    fi
    echo "ship: push failed, retrying..." >&2
  done
  echo "ship: push failed after retries; the commit is saved here only" >&2
  exit 1
}

case "${1:-}" in
  "") echo "usage: ship.sh start | ship.sh \"commit message\"" >&2; exit 2;;
  start) start;;
  *) save "$1";;
esac
