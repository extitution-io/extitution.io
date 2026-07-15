// shared layout: site aesthetic (dark / lime / serif+mono), nav, cart drawer,
// per-page og/twitter meta for social unfurls. every page is server-rendered
// so crawlers see real content.
import { esc } from './md.js';

export const FAVICON = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 60'><circle cx='24' cy='28' r='23' fill='%23b8f05c' opacity='.22'/><path d='M4.2 25.5C6 12.5 14.5 4.5 24 4.5s18 8 19.8 21c.4 2.8-1.9 5-4.7 5H8.9c-2.8 0-5.1-2.2-4.7-5z' fill='%23b8f05c'/><path d='M19.2 30.5c-.6 6.4-.4 11.2 1 15.6.4 1.4 1.6 2.4 3 2.4h1.6c1.4 0 2.6-1 3-2.4 1.4-4.4 1.6-9.2 1-15.6z' fill='%23e6f5bd'/></svg>`;

export function fmtEth(x) {
  if (!x) return 'Ξ 0';
  if (x < 0.0001) return 'Ξ <0.0001';
  return 'Ξ ' + (x >= 100 ? x.toFixed(1) : x >= 1 ? x.toFixed(2) : x.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''));
}
export const shortAddr = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';
export const timeAgo = t => {
  if (!t) return '';
  const ms = t instanceof Date ? t.getTime() : new Date(t).getTime();
  if (!Number.isFinite(ms)) return '';
  const s = (Date.now() - ms) / 1000;
  if (s < 90) return 'just now';
  if (s < 5400) return Math.round(s / 60) + 'm ago';
  if (s < 129600) return Math.round(s / 3600) + 'h ago';
  return Math.round(s / 86400) + 'd ago';
};

const CSS = `
  :root{--bg:#0c0e0a;--bg2:#12150e;--panel:#161a11;--line:#2a2f22;--ink:#e9e6da;--ink-dim:#a5a294;--ink-faint:#82806f;
    --lime:#b8f05c;--lime-dim:#8fc23e;--red:#f08c8c;
    --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
    --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace;--maxw:1060px}
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{background:radial-gradient(1100px 700px at 85% -220px,#141a0d,var(--bg) 60%) fixed,var(--bg);
    color:var(--ink);font-family:var(--serif);font-size:18px;line-height:1.6;-webkit-font-smoothing:antialiased;
    overflow-x:clip}
  ::selection{background:var(--lime);color:#0c0e0a}
  a{color:inherit}
  .wrap{max-width:var(--maxw);margin:0 auto;padding:0 24px}
  .mono{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:lowercase}
  nav{position:sticky;top:0;z-index:50;background:rgba(12,14,10,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
  nav .wrap{display:flex;align-items:center;justify-content:space-between;height:60px;gap:10px}
  .wordmark{font-family:var(--mono);font-size:13px;letter-spacing:.1em;text-decoration:none;white-space:nowrap}
  .wordmark b{font-weight:600}
  nav .links{display:flex;gap:18px;align-items:center}
  nav .links a{font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-decoration:none;color:var(--ink-dim)}
  nav .links a:hover,nav .links a.active{color:var(--lime)}
  .btn{display:inline-block;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:lowercase;
    padding:10px 18px;border:1px solid var(--line);border-radius:8px;text-decoration:none;color:var(--ink);
    background:transparent;cursor:pointer;transition:border-color .2s,color .2s,background .2s}
  .btn:hover{border-color:var(--lime-dim);color:var(--lime)}
  .btn.solid{background:var(--lime);border-color:var(--lime);color:#0c0e0a;font-weight:600}
  .btn.solid:hover{background:var(--lime-dim);color:#0c0e0a}
  .btn:disabled{opacity:.4;cursor:not-allowed}
  .btn.sm{padding:6px 12px;font-size:11px}
  header.hero{padding:64px 0 36px;border-bottom:1px solid var(--line)}
  .backlink{color:var(--ink-faint);text-decoration:none}
  .backlink:hover{color:var(--lime)}
  .eyebrow{display:inline-block;color:var(--lime);margin:0 0 14px}
  h1{font-size:clamp(28px,4.4vw,44px);line-height:1.12;font-weight:600;letter-spacing:-.01em;max-width:22ch}
  .lede{color:var(--ink-dim);max-width:62ch;margin-top:14px}
  .statuspill{display:inline-flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;letter-spacing:.14em;
    border:1px solid var(--line);border-radius:99px;padding:6px 14px;vertical-align:middle;white-space:nowrap}
  .statuspill i{width:7px;height:7px;border-radius:99px;background:var(--ink-faint)}
  .statuspill.live i{background:var(--lime);box-shadow:0 0 8px var(--lime);animation:blink 1.6s infinite}
  @keyframes blink{50%{opacity:.4}}
  .statrow{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:30px 0 0}
  .stat{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
  .stat .v{font-size:24px;font-weight:600}
  .stat .v small{font-size:13px;color:var(--ink-faint);font-weight:400}
  .stat .k{font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--ink-faint);margin-top:4px}
  section.block{padding:48px 0}
  h2{font-size:clamp(22px,3vw,30px);font-weight:600;margin-bottom:8px}
  .sub{color:var(--ink-dim);max-width:64ch}
  .banner{background:var(--panel);border:1px solid var(--lime-dim);border-radius:12px;padding:14px 18px;margin:22px 0 0;font-size:15px;color:var(--ink-dim)}
  .banner b{color:var(--lime)}
  .grants{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:26px}
  .grant{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:10px;transition:border-color .2s}
  .grant:hover{border-color:var(--lime-dim)}
  .grant .cat{font-family:var(--mono);font-size:10px;letter-spacing:.16em;color:var(--lime-dim)}
  .grant h3{font-size:19px;font-weight:600;line-height:1.25}
  .grant h3 a{text-decoration:none}
  .grant h3 a:hover{color:var(--lime)}
  .grant p{font-size:14.5px;color:var(--ink-dim);flex:1}
  .grant .meta{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--ink-faint)}
  .grant .meta b{color:var(--lime);font-weight:600}
  .grant .track{height:4px;background:var(--line);border-radius:99px;overflow:hidden}
  .grant .track i{display:block;height:100%;background:var(--lime);border-radius:99px;transition:width .6s ease}
  .grant .row{display:flex;gap:8px;align-items:center;justify-content:space-between}
  .grant .incart{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--lime)}
  input[type=text],input[type=email],input[type=url],textarea,select{
    width:100%;background:var(--panel);border:1px solid var(--line);border-radius:8px;color:var(--ink);
    font-family:var(--serif);font-size:15px;padding:11px 13px;outline:none}
  input:focus,textarea:focus,select:focus{border-color:var(--lime-dim)}
  label{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--ink-dim);margin:18px 0 6px;text-transform:lowercase}
  .prose{max-width:68ch}
  .prose h3,.prose h4,.prose h5{margin:26px 0 8px;font-weight:600}
  .prose p{margin:12px 0;color:var(--ink-dim)}
  .prose ul{margin:12px 0 12px 22px;color:var(--ink-dim)}
  .prose a{color:var(--lime);text-decoration-color:var(--lime-dim)}
  .prose code{font-family:var(--mono);font-size:.85em;background:var(--panel);padding:2px 6px;border-radius:5px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{font-family:var(--mono);font-size:10px;letter-spacing:.14em;color:var(--ink-faint);text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);text-transform:lowercase}
  td{padding:9px 10px;border-bottom:1px solid var(--line);color:var(--ink-dim)}
  td b{color:var(--ink)}
  .feed{margin-top:26px;border-left:1px solid var(--line)}
  .fitem{position:relative;padding:12px 0 12px 26px}
  .fitem::before{content:"";position:absolute;left:-4px;top:22px;width:7px;height:7px;border-radius:99px;background:var(--lime-dim)}
  .fitem .when{font-family:var(--mono);font-size:10px;letter-spacing:.12em;color:var(--ink-faint)}
  .fitem .what{font-size:15px;color:var(--ink-dim)}
  .fitem .what a{color:var(--ink);text-decoration-color:var(--lime-dim)}
  .fitem .what b{color:var(--lime)}
  .cart-fab{position:fixed;right:22px;bottom:22px;z-index:60;background:var(--lime);color:#0c0e0a;border:none;border-radius:99px;
    font-family:var(--mono);font-size:13px;font-weight:600;letter-spacing:.08em;padding:14px 22px;cursor:pointer;box-shadow:0 4px 30px rgba(184,240,92,.35)}
  .cart{position:fixed;right:0;top:0;bottom:0;width:min(420px,100vw);z-index:70;background:var(--bg2);border-left:1px solid var(--line);
    transform:translateX(105%);transition:transform .35s cubic-bezier(.22,1,.36,1);display:flex;flex-direction:column}
  .cart.open{transform:none}
  .cart .head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--line)}
  .cart .head h3{font-size:18px;font-weight:600}
  .cart .close{background:none;border:none;color:var(--ink-dim);font-size:22px;cursor:pointer;line-height:1}
  .cart .items{flex:1;overflow-y:auto;padding:10px 22px}
  .citem{padding:14px 0;border-bottom:1px solid var(--line)}
  .citem .t{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
  .citem .t h4{font-size:15px;font-weight:600}
  .citem .rm{background:none;border:none;color:var(--ink-faint);font-family:var(--mono);font-size:11px;cursor:pointer}
  .citem .rm:hover{color:var(--red)}
  .citem .amt{display:flex;align-items:center;gap:8px;margin-top:8px}
  .citem input{width:110px;font-family:var(--mono);font-size:13px;padding:8px 10px}
  .citem .unit{font-family:var(--mono);font-size:11px;color:var(--ink-faint)}
  .citem .boost{font-family:var(--mono);font-size:11px;color:var(--lime);margin-left:auto;text-align:right}
  .citem .boost small{display:block;color:var(--ink-faint)}
  .cart .foot{border-top:1px solid var(--line);padding:18px 22px;background:var(--panel)}
  .cart .sumline{display:flex;justify-content:space-between;font-family:var(--mono);font-size:12px;letter-spacing:.08em;color:var(--ink-dim);padding:3px 0}
  .cart .sumline.big{color:var(--ink);font-size:14px}
  .cart .sumline.big b{color:var(--lime)}
  .cart .foot .btn{width:100%;text-align:center;margin-top:12px}
  .cart .note{font-family:var(--mono);font-size:10px;color:var(--ink-faint);margin-top:10px;letter-spacing:.06em;line-height:1.7}
  .cart .empty{color:var(--ink-faint);font-size:14px;padding:30px 0;text-align:center}
  .scrim{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:65;opacity:0;pointer-events:none;transition:opacity .3s}
  .scrim.on{opacity:1;pointer-events:auto}
  .modal{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.6)}
  .modal.on{display:flex}
  .modal .box{background:var(--bg2);border:1px solid var(--line);border-radius:16px;max-width:460px;width:100%;padding:30px}
  .modal h3{font-size:22px;font-weight:600;margin-bottom:10px}
  .modal p{color:var(--ink-dim);font-size:15px;margin-bottom:8px}
  .modal .ctas{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}
  .spin{display:inline-block;width:14px;height:14px;border:2px solid var(--line);border-top-color:var(--lime);border-radius:99px;animation:spin .8s linear infinite;vertical-align:-2px;margin-right:8px}
  @keyframes spin{to{transform:rotate(360deg)}}
  footer{border-top:1px solid var(--line);padding:40px 0 60px;margin-top:40px}
  footer .cols{display:grid;grid-template-columns:1fr 1fr;gap:30px}
  footer h4{font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:var(--lime);margin-bottom:10px}
  footer p{font-size:14px;color:var(--ink-dim)}
  footer a{color:var(--ink-dim);text-decoration-color:var(--lime-dim)}
  footer a:hover{color:var(--lime)}
  .filters{display:flex;gap:10px;margin-top:22px;flex-wrap:wrap;align-items:center}
  .filters input[type=text]{max-width:280px}
  .chip{font-family:var(--mono);font-size:11px;letter-spacing:.1em;padding:7px 14px;border:1px solid var(--line);border-radius:99px;text-decoration:none;color:var(--ink-dim)}
  .chip.on,.chip:hover{border-color:var(--lime-dim);color:var(--lime)}
  .sharebar{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
  .spark{margin-top:16px}
  .wm-short{display:none}
  @media(max-width:760px){
    .statrow{grid-template-columns:1fr 1fr}
    footer .cols{grid-template-columns:1fr}
    header.hero{padding:44px 0 28px}
    nav .links{gap:10px}
    nav .links a.hide-m{display:none}
    nav .links a#connectBtn{padding:5px 9px}
    .wm-full{display:none}
    .wm-short{display:inline}
    h1 .statuspill{display:inline-flex;margin-top:8px}
    .wrap{padding:0 18px}
    table{display:block;overflow-x:auto}
  }
`;

// meta: {title, desc, image, url, type}
export function layout(meta, body, { active = '', clientData = null } = {}) {
  const title = esc(meta.title);
  const desc = esc(meta.desc || '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="icon" href="${FAVICON}">
<meta property="og:type" content="${meta.type || 'website'}">
<meta property="og:site_name" content="ethereum extitutional · grants">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
${meta.url ? `<meta property="og:url" content="${esc(meta.url)}">` : ''}
${meta.image ? `<meta property="og:image" content="${esc(meta.image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(meta.image)}">` : `<meta name="twitter:card" content="summary">`}
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<style>${CSS}</style>
</head>
<body>
<nav>
  <div class="wrap">
    <a class="wordmark" href="/"><b class="wm-full">ethereum extitutional</b><b class="wm-short">e·e</b> <span style="color:var(--ink-faint)">/ grants</span></a>
    <div class="links">
      <a href="/grants" class="${active === 'grants' ? 'active' : ''}">grants</a>
      <a href="/feed" class="${active === 'feed' ? 'active' : ''}">feed</a>
      <a href="/stats" class="${active === 'stats' ? 'active' : ''} hide-m">stats</a>
      <a href="/apply" class="${active === 'apply' ? 'active' : ''}">apply</a>
      <a href="#" id="connectBtn" style="border:1px solid var(--line);border-radius:8px;padding:6px 12px">connect</a>
    </div>
  </div>
</nav>
${body}
<footer>
  <div class="wrap cols">
    <div>
      <h4>how matching works</h4>
      <p>match ∝ (Σ √cᵢ)² — breadth of support beats depth of pockets. per-project cap applies; one donor giving twice counts once. sybil note: v1 counts one wallet as one voice.</p>
    </div>
    <div>
      <h4>audit it yourself</h4>
      <p>every donation is an on-chain <span class="mono" style="font-size:11px">DonationSent</span> event on the <a href="https://etherscan.io/address/0x7d655c57f71464B6f83811C55D84009Cd9f5221C" target="_blank" rel="noopener">gitcoin-era bulkcheckout contract</a>. this site only indexes what the chain already proves. <a href="/index.html">← back to extitutional.io</a></p>
    </div>
  </div>
</footer>

<button class="cart-fab" id="cartFab" style="display:none">cart · <span id="fabCount">0</span></button>
<div class="scrim" id="scrim"></div>
<aside class="cart" id="cart">
  <div class="head"><h3>your cart</h3><button class="close" id="cartClose">×</button></div>
  <div class="items" id="cartItems"></div>
  <div class="foot">
    <div class="sumline"><span>you give</span><span id="sumGive">Ξ 0</span></div>
    <div class="sumline"><span>est. matching unlocked</span><span id="sumBoost" style="color:var(--lime)">+Ξ 0</span></div>
    <div class="sumline big"><span>total impact</span><b id="sumTotal">Ξ 0</b></div>
    <button class="btn solid" id="checkoutBtn">checkout — one transaction</button>
    <div class="note" id="cartNote"></div>
  </div>
</aside>
<div class="modal" id="modal"><div class="box" id="modalBox"></div></div>
${clientData ? `<script>window.__ROUND__=${JSON.stringify(clientData).replaceAll('<', '\\u003c')}</script>` : ''}
<script src="/public/cart.js" defer></script>
</body>
</html>`;
}
