// trustgraph — app 02. pre-launch countdown shell; the real app grows in here.
// launch date comes from LAUNCH_AT env (iso 8601) so it changes without a deploy.
import express from 'express';
import sharp from 'sharp';

const app = express();
const SERVERLESS = !!process.env.VERCEL;
const PORT = Number(process.env.PORT || 4880);
const LAUNCH_AT = process.env.LAUNCH_AT || '2026-11-01T00:00:00Z';

const baseUrl = req => (process.env.BASE_URL ||
  `${req.headers['x-forwarded-proto'] || req.protocol || 'http'}://${req.headers.host}`).replace(/\/$/, '');

const esc = s => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const FAVICON = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><circle cx='24' cy='10' r='6' fill='%23a5b4fc'/><circle cx='10' cy='36' r='6' fill='%23a5b4fc' opacity='.75'/><circle cx='38' cy='36' r='6' fill='%23a5b4fc' opacity='.75'/><path d='M24 16 L11 31M24 16l13 15M15 36h18' stroke='%23a5b4fc' stroke-width='2.4' opacity='.55'/></svg>`;

app.get('/', (req, res) => {
  const startMs = new Date(LAUNCH_AT).getTime();
  let d = Math.max(0, startMs - Date.now());
  const days = Math.floor(d / 864e5); d -= days * 864e5;
  const hrs = Math.floor(d / 36e5); d -= hrs * 36e5;
  const min = Math.floor(d / 6e4);
  const sec = Math.floor((d - min * 6e4) / 1000);
  const p = n => String(n).padStart(2, '0');
  const dateLabel = new Date(startMs).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const base = baseUrl(req);
  res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>trustgraph · ethereum extitutional</title>
<meta name="description" content="app 02 · governance by earned trust. influence follows the trustgraph, and control stays with the network.">
<link rel="icon" href="${FAVICON}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ethereum extitutional · trust">
<meta property="og:title" content="trustgraph 🕸 governance by earned trust">
<meta property="og:description" content="app 02 of ethereum extitutional. influence follows earned trust — opening ${esc(dateLabel)}.">
<meta property="og:url" content="${base}/">
<meta property="og:image" content="${base}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="trustgraph 🕸 governance by earned trust">
<meta name="twitter:description" content="app 02 of ethereum extitutional — opening ${esc(dateLabel)}.">
<meta name="twitter:image" content="${base}/og.png">
<style>
  :root{--bg:#0c0d12;--panel:#14161f;--line:#262a3a;--ink:#e7e7ee;--ink-dim:#a3a3b4;--ink-faint:#7e7e90;
    --lilac:#a5b4fc;--lilac-dim:#7c8cf0;
    --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
    --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace}
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:radial-gradient(1100px 700px at 85% -220px,#151a2c,var(--bg) 60%) fixed,var(--bg);
    color:var(--ink);font-family:var(--serif);font-size:18px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:clip}
  ::selection{background:var(--lilac);color:#0c0d12}
  .wrap{max-width:1060px;margin:0 auto;padding:0 24px}
  .mono{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:lowercase}
  nav{position:sticky;top:0;z-index:50;background:rgba(12,13,18,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
  nav .wrap{display:flex;align-items:center;justify-content:space-between;height:60px}
  .wordmark{font-family:var(--mono);font-size:13px;letter-spacing:.1em;text-decoration:none;color:var(--ink)}
  .wordmark b{font-weight:600}
  nav a.ext{font-family:var(--mono);font-size:12px;color:var(--ink-dim);text-decoration:none}
  nav a.ext:hover{color:var(--lilac)}
  .hero{min-height:calc(100svh - 60px);display:flex;align-items:center}
  .hero .wrap{text-align:center;padding-top:40px;padding-bottom:60px}
  .eyebrow{display:inline-block;color:var(--lilac);margin-bottom:14px}
  h1{font-size:clamp(28px,4.4vw,44px);font-weight:600;letter-spacing:-.01em}
  .cd{display:flex;justify-content:center;gap:clamp(10px,3vw,28px);margin:38px 0 30px;flex-wrap:wrap}
  .cd-cell{min-width:clamp(70px,18vw,150px);background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:clamp(14px,2.5vw,26px) 8px}
  .cd-cell b{display:block;font-size:clamp(40px,9vw,84px);line-height:1;font-weight:600;color:var(--lilac);font-variant-numeric:tabular-nums;text-shadow:0 0 40px rgba(165,180,252,.35)}
  .cd-cell span{font-family:var(--mono);font-size:11px;letter-spacing:.18em;color:var(--ink-faint);display:block;margin-top:10px;text-transform:lowercase}
  .date{color:var(--ink-dim);font-size:17px}
  .date b{color:var(--ink)}
  .sub{color:var(--ink-faint);font-size:15px;max-width:52ch;margin:18px auto 0}
  .ctas{margin-top:30px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
  .btn{display:inline-block;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:lowercase;
    padding:11px 20px;border:1px solid var(--line);border-radius:8px;text-decoration:none;color:var(--ink);transition:.2s}
  .btn:hover{border-color:var(--lilac-dim);color:var(--lilac)}
  .btn.solid{background:var(--lilac);border-color:var(--lilac);color:#0c0d12;font-weight:600}
  .btn.solid:hover{background:var(--lilac-dim)}
  footer{border-top:1px solid var(--line);padding:26px 0;text-align:center}
  footer p{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--ink-faint)}
  footer a{color:var(--ink-dim)}
</style>
</head>
<body>
<nav><div class="wrap">
  <a class="wordmark" href="/"><b>ethereum extitutional</b> <span style="color:var(--ink-faint)">/ trust</span></a>
  <a class="ext" href="https://grants.extitution.io">grants →</a>
</div></nav>
<header class="hero"><div class="wrap">
  <span class="mono eyebrow">app 02 · trustgraph · governance by earned trust</span>
  <h1>trustgraph opens in</h1>
  <div class="cd">
    <div class="cd-cell"><b id="cdD">${days}</b><span>days</span></div>
    <div class="cd-cell"><b id="cdH">${p(hrs)}</b><span>hours</span></div>
    <div class="cd-cell"><b id="cdM">${p(min)}</b><span>minutes</span></div>
    <div class="cd-cell"><b id="cdS">${p(sec)}</b><span>seconds</span></div>
  </div>
  <p class="date">influence follows earned trust, starting <b>${esc(dateLabel)}</b>.</p>
  <p class="sub">no board seats for funders. peer attestations form a web of trust, and governance weight flows through it — control stays with the network.</p>
  <div class="ctas">
    <a class="btn solid" href="https://www.extitution.io/#/trust">read how it works →</a>
    <a class="btn" href="https://t.me/+YDJcJMtgxjA3ZmQ5" target="_blank" rel="noopener">join the telegram</a>
  </div>
</div></header>
<footer><p>an <a href="https://www.extitution.io">ethereum extitutional</a> app · sibling of <a href="https://grants.extitution.io">grants</a></p></footer>
<script>
(function(){
  var t = ${startMs};
  function p(n){ return String(n).padStart(2,'0'); }
  setInterval(function(){
    var d = t - Date.now();
    if (d <= 0) { location.reload(); return; }
    document.getElementById('cdD').textContent = Math.floor(d/864e5);
    document.getElementById('cdH').textContent = p(Math.floor(d%864e5/36e5));
    document.getElementById('cdM').textContent = p(Math.floor(d%36e5/6e4));
    document.getElementById('cdS').textContent = p(Math.floor(d%6e4/1e3));
  }, 1000);
})();
</script>
</body>
</html>`);
});

let ogCache = null;
app.get('/og.png', async (req, res) => {
  const dateLabel = new Date(LAUNCH_AT).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  if (!ogCache) {
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="g" cx="85%" cy="-20%" r="120%">
    <stop offset="0%" stop-color="#1b2036"/><stop offset="55%" stop-color="#0c0d12"/>
  </radialGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="0" y="0" width="1200" height="6" fill="#a5b4fc"/>
  <g stroke="#a5b4fc" stroke-width="2" opacity=".5">
    <path d="M960 140 L1080 260 M960 140 L840 260 M840 260 L1080 260 M1080 260 L1020 400 M840 260 L900 400 M900 400 L1020 400"/>
  </g>
  <g fill="#a5b4fc">
    <circle cx="960" cy="140" r="16"/><circle cx="1080" cy="260" r="12" opacity=".8"/>
    <circle cx="840" cy="260" r="12" opacity=".8"/><circle cx="1020" cy="400" r="10" opacity=".6"/><circle cx="900" cy="400" r="10" opacity=".6"/>
  </g>
  <text x="80" y="150" font-family="Menlo,monospace" font-size="22" letter-spacing="4" fill="#a5b4fc">app 02 · governance by earned trust</text>
  <text x="80" y="260" font-family="Georgia,serif" font-size="88" font-weight="600" fill="#e7e7ee">trustgraph</text>
  <text x="80" y="330" font-family="Georgia,serif" font-size="30" fill="#a3a3b4">influence follows earned trust —</text>
  <text x="80" y="374" font-family="Georgia,serif" font-size="30" fill="#a3a3b4">control stays with the network.</text>
  <text x="80" y="545" font-family="Menlo,monospace" font-size="34" font-weight="bold" fill="#a5b4fc">opening ${dateLabel.toLowerCase()}</text>
  <text x="1120" y="590" text-anchor="end" font-family="Menlo,monospace" font-size="18" letter-spacing="2" fill="#7e7e90">trust.extitution.io</text>
</svg>`;
    ogCache = await sharp(Buffer.from(svg)).png().toBuffer();
  }
  res.type('png').setHeader('Cache-Control', 'public, max-age=3600').send(ogCache);
});

if (!SERVERLESS) app.listen(PORT, () => console.log(`trustgraph → http://localhost:${PORT}`));
export default app;
