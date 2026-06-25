#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/hein-htet-nyan/Desktop/POS_system"
BACKEND_WORKTREE="/home/hein-htet-nyan/Desktop/POS_system_backend"
FRONTEND_WORKTREE="/home/hein-htet-nyan/Desktop/POS_system_frontend"
MOBILE_WORKTREE="/home/hein-htet-nyan/Desktop/POS_system_mobile"

sync_branch() {
  local worktree="$1"
  local branch="$2"
  local label="$3"

  echo "[$label] Syncing $branch branch..."
  cd "$worktree"
  git checkout "$branch"
  git pull --ff-only origin "$branch"

  if git merge-base --is-ancestor main "$branch"; then
    echo "  $branch is already up to date with main; skipping merge."
    return
  fi

  git merge --no-edit main
  git push origin "$branch"
}

cd "$ROOT"
echo "[1/4] Updating main..."
git checkout main
git pull --ff-only origin main

sync_branch "$BACKEND_WORKTREE" "backend" "2/4"
sync_branch "$FRONTEND_WORKTREE" "frontend" "3/4"
sync_branch "$MOBILE_WORKTREE" "mobile" "4/4"

echo "Done."
