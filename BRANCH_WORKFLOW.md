# Branch workflow

## Daily workflow

1. Work on main
   ```bash
   cd /home/hein-htet-nyan/Desktop/POS_system
   # make changes
   git add .
   git commit -m "your message"
   git push origin main
   ```

2. Sync backend, frontend, and mobile from main
   ```bash
   cd /home/hein-htet-nyan/Desktop/POS_system
   ./sync_branches.sh
   ```

## Work in a specific area

- Backend worktree: /home/hein-htet-nyan/Desktop/POS_system_backend
- Frontend worktree: /home/hein-htet-nyan/Desktop/POS_system_frontend
- Mobile worktree: /home/hein-htet-nyan/Desktop/POS_system_mobile

## If you want to work directly in a branch

```bash
cd /home/hein-htet-nyan/Desktop/POS_system_backend
git checkout backend
# work, commit, push
```

```bash
cd /home/hein-htet-nyan/Desktop/POS_system_frontend
git checkout frontend
# work, commit, push
```

```bash
cd /home/hein-htet-nyan/Desktop/POS_system_mobile
git checkout mobile
# work, commit, push
```
