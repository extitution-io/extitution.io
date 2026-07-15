cp ../mirrormirror/processed/drafts/2026-07-14_ethereum_extitutional_landing.html index.html

# deploy: commit + push to github, then ship to vercel prod
# usage: ./deploy.sh ["commit message"]
set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-update}"

# commit + push (same flow as: git add .; gc "update"; gp)
if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "$MSG"
else
  echo "nothing to commit, pushing + deploying anyway"
fi
git push origin master

# deploy to vercel production (first run will create/link the project)
vercel deploy --prod --yes

echo "✅ deployed"
