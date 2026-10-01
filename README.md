# ff-dashboard

Next.js 16 dashboard for the ff-pipeline output. Static: every page is prebuilt from `data/*.json` at deploy time,
so a pipeline push = a fresh deploy. Password-protected via `proxy.ts` when `DASHBOARD_PASSWORD` is set.

Pages: War Room (lineup holes, fixes, trade targets) · Moneyball (xFP vs FP, buy/sell, role changes, ESPN disagreement) ·
Waivers · Players (explorer + per-player pages) · Team Context · Method.

## Deploy (one time)
1. github.com/new → private repo `ff-dashboard`, no README.
2. Terminal: `bash ~/Claude/ff-dashboard/scripts/connect_github.sh https://github.com/<you>/ff-dashboard.git`
   (first push may ask you to sign in; `gh auth login` or GitHub Desktop sets up credentials once).
3. vercel.com → Add New → Project → import `ff-dashboard` → Environment Variables: `DASHBOARD_PASSWORD=<pick one>` → Deploy.
4. In `~/Claude/ff-pipeline/.env`: `FF_PUBLISH_DIR=~/Claude/ff-dashboard/data` and `FF_PUBLISH_GIT=1`.

Login prompt: any username, the password you set.

## Local preview
    npm install && npm run build && npm start   # http://localhost:3000

`data/` ships with SAMPLE data (real NFL metrics, synthetic league) until the first live pipeline publish.
