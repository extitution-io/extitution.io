/* cart + checkout client. loads round data from /api/round, recomputes QF
   match previews locally as the cart changes, and checks out the whole cart
   in ONE mainnet transaction via the gitcoin-era BulkCheckout contract.
   encoding verified byte-for-byte against historical gitcoin checkouts. */
(() => {
  const BULK_CHECKOUT = '0x7d655c57f71464B6f83811C55D84009Cd9f5221C';
  const ETH_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
  const SEL_DONATE = '9120491c'; // donate((address,uint256,address)[])

  const $ = id => document.getElementById(id);
  let R = null;                 // /api/round payload
  let cart = load();            // {grantId: "0.01"}
  let account = null;

  /* ---------- qf (same math as server) ---------- */
  function qfMatches(extraCart) {
    if (!R) return {};
    const perGrant = {};
    const bump = (dest, donor, eth) => {
      const g = perGrant[dest] || (perGrant[dest] = { totals: {}, raised: 0 });
      g.totals[donor] = (g.totals[donor] || 0) + eth;
      g.raised += eth;
    };
    for (const [dest, donors] of Object.entries(R.donorTotals))
      for (const [donor, eth] of Object.entries(donors)) bump(dest, donor, eth);
    if (extraCart) {
      const you = (account || 'you').toLowerCase();
      for (const [id, amt] of Object.entries(extraCart)) {
        const g = R.grants.find(x => x.id === Number(id));
        const eth = parseFloat(amt);
        if (g && g.address && eth >= R.round.min_donation_eth) bump(g.address.toLowerCase(), you, eth);
      }
    }
    const scores = {};
    for (const g of R.grants) {
      const key = g.address ? g.address.toLowerCase() : 'g' + g.id;
      const pg = perGrant[key];
      if (!pg) { scores[key] = 0; continue; }
      let ss = 0;
      for (const c of Object.values(pg.totals)) ss += Math.sqrt(c);
      scores[key] = ss * ss;
    }
    // allocate with cap + redistribution
    const pool = R.round.matching_pool_eth, cap = pool * R.round.match_cap_fraction;
    const matches = {}; for (const k of Object.keys(scores)) matches[k] = 0;
    let uncapped = Object.keys(scores).filter(k => scores[k] > 0), remaining = pool;
    for (let i = 0; i < 25 && remaining > 1e-12 && uncapped.length; i++) {
      const tot = uncapped.reduce((s, k) => s + scores[k], 0);
      if (tot <= 0) break;
      let spill = 0; const next = [];
      for (const k of uncapped) {
        const add = remaining * scores[k] / tot, room = cap - matches[k];
        if (add >= room) { matches[k] += room; spill += add - room; }
        else { matches[k] += add; next.push(k); }
      }
      remaining = spill; uncapped = next;
    }
    return matches;
  }
  const keyOf = g => g.address ? g.address.toLowerCase() : 'g' + g.id;

  /* ---------- utils ---------- */
  function load() { try { return JSON.parse(localStorage.getItem('ext-grants-cart')) || {}; } catch { return {}; } }
  const save = () => localStorage.setItem('ext-grants-cart', JSON.stringify(cart));
  const fmt = x => !x ? 'Ξ 0' : x < 0.0001 ? 'Ξ <0.0001' : 'Ξ ' + (x >= 1 ? x.toFixed(2) : x.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''));
  const short = a => a.slice(0, 6) + '…' + a.slice(-4);
  const escq = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function parseEther(s) {
    s = String(s).trim();
    if (!/^\d*\.?\d*$/.test(s) || s === '' || s === '.') return null;
    const [i, f = ''] = s.split('.');
    return BigInt(i || '0') * (10n ** 18n) + BigInt((f + '0'.repeat(18)).slice(0, 18));
  }

  function encodeDonate(items) {
    const word = h => h.padStart(64, '0');
    const addr = a => word(a.toLowerCase().replace('0x', ''));
    const num = n => word(n.toString(16));
    let data = SEL_DONATE + num(32n) + num(BigInt(items.length));
    for (const it of items) data += addr(ETH_TOKEN) + num(it.wei) + addr(it.dest);
    return '0x' + data;
  }

  /* ---------- render ---------- */
  function renderCart() {
    const ids = Object.keys(cart);
    $('cartFab').style.display = ids.length ? 'block' : 'none';
    $('fabCount').textContent = ids.length;
    if (!R) return;
    const base = qfMatches(null), withCart = qfMatches(cart);
    const grant = id => R.grants.find(g => g.id === Number(id));

    $('cartItems').innerHTML = ids.length ? ids.map(id => {
      const g = grant(id); if (!g) return '';
      const boost = Math.max(0, (withCart[keyOf(g)] || 0) - (base[keyOf(g)] || 0));
      const amt = parseFloat(cart[id]) || 0;
      const belowMin = amt > 0 && amt < R.round.min_donation_eth;
      return `<div class="citem">
        <div class="t"><h4>${escq(g.name)}</h4><button class="rm" data-rm="${g.id}">remove</button></div>
        <div class="amt">
          <input type="text" inputmode="decimal" value="${escq(cart[id])}" data-amt="${g.id}">
          <span class="unit">eth</span>
          <span class="boost">${belowMin ? `<span style="color:var(--red)">below Ξ${R.round.min_donation_eth} min</span>` : `+${fmt(boost)} match`}</span>
        </div>
      </div>`;
    }).join('') : '<div class="empty">cart\'s empty — breadth is the whole game.<br>back a few things you believe in.</div>';

    let give = 0, boost = 0;
    for (const id of ids) {
      const g = grant(id); if (!g) continue;
      give += parseFloat(cart[id]) || 0;
      boost += Math.max(0, (withCart[keyOf(g)] || 0) - (base[keyOf(g)] || 0));
    }
    $('sumGive').textContent = fmt(give);
    $('sumBoost').textContent = '+' + fmt(boost);
    $('sumTotal').textContent = fmt(give + boost);
    $('cartNote').textContent = `min Ξ${R.round.min_donation_eth} per project for matching · one signature covers the whole cart · eth on mainnet`;
    const badAmt = ids.some(id => !(parseFloat(cart[id]) > 0));
    $('checkoutBtn').disabled = !ids.length || badAmt;
    $('checkoutBtn').textContent = account ? 'checkout — one transaction' : 'connect wallet to checkout';

    // reflect "in cart" on any grant cards on the page
    document.querySelectorAll('[data-add]').forEach(btn => {
      const inCart = cart[btn.dataset.add] !== undefined;
      btn.textContent = inCart ? '✓ in cart' : 'add to cart';
    });
  }

  const openCart = on => { $('cart').classList.toggle('open', on); $('scrim').classList.toggle('on', on); };

  /* ---------- events (delegated) ---------- */
  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add && !add.disabled) {
      const id = add.dataset.add;
      if (cart[id] === undefined) cart[id] = '0.01'; else delete cart[id];
      save(); renderCart(); if (cart[id] !== undefined) openCart(true);
      return;
    }
    const rm = e.target.closest('[data-rm]');
    if (rm) { delete cart[rm.dataset.rm]; save(); renderCart(); return; }
    if (e.target.id === 'cartFab') openCart(true);
    if (e.target.id === 'cartClose' || e.target.id === 'scrim') openCart(false);
    if (e.target.id === 'connectBtn') { e.preventDefault(); connect(); }
    if (e.target.id === 'checkoutBtn') checkout();
    if (e.target.id === 'modal') hideModal();
  });
  let amtTimer;
  document.addEventListener('input', e => {
    const inp = e.target.closest('[data-amt]');
    if (!inp) return;
    cart[inp.dataset.amt] = inp.value.replace(/[^0-9.]/g, '');
    save();
    clearTimeout(amtTimer);
    amtTimer = setTimeout(() => { if (!document.activeElement || !document.activeElement.dataset?.amt) renderCart(); else updateSumsOnly(); }, 350);
  });
  function updateSumsOnly() {
    // recompute totals without re-rendering inputs (keeps focus)
    if (!R) return;
    const base = qfMatches(null), withCart = qfMatches(cart);
    let give = 0, boost = 0;
    for (const id of Object.keys(cart)) {
      const g = R.grants.find(x => x.id === Number(id)); if (!g) continue;
      give += parseFloat(cart[id]) || 0;
      boost += Math.max(0, (withCart[keyOf(g)] || 0) - (base[keyOf(g)] || 0));
    }
    $('sumGive').textContent = fmt(give);
    $('sumBoost').textContent = '+' + fmt(boost);
    $('sumTotal').textContent = fmt(give + boost);
  }

  /* ---------- wallet ---------- */
  async function connect() {
    if (!window.ethereum) {
      showModal(`<h3>no wallet found</h3><p>you'll need a browser wallet (rabby, metamask, a mobile wallet's browser) to donate. everything else works without one.</p><div class="ctas"><button class="btn" id="mClose">ok</button></div>`);
      return null;
    }
    const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
    account = accs[0];
    $('connectBtn').textContent = short(account);
    renderCart();
    return account;
  }

  async function checkout() {
    if (!account && !(await connect())) return;
    const items = [];
    for (const [id, amt] of Object.entries(cart)) {
      const g = R.grants.find(x => x.id === Number(id));
      if (!g || !g.address) continue;
      const wei = parseEther(amt);
      if (!wei || wei <= 0n) { showModal(`<h3>bad amount</h3><p>"${escq(amt)}" on ${escq(g.name)} isn't a valid ETH amount.</p><div class="ctas"><button class="btn" id="mClose">fix it</button></div>`); return; }
      items.push({ dest: g.address, wei });
    }
    if (!items.length) return;
    const total = items.reduce((s, i) => s + i.wei, 0n);
    try {
      const cid = await window.ethereum.request({ method: 'eth_chainId' });
      if (cid !== '0x1') await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1' }] });
      showModal(`<h3><span class="spin"></span>confirm in your wallet</h3><p>one transaction: ${items.length} donation${items.length === 1 ? '' : 's'}, ${fmt(Number(total) / 1e18)} total.</p>`);
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: account, to: BULK_CHECKOUT, value: '0x' + total.toString(16), data: encodeDonate(items) }],
      });
      showModal(`<h3><span class="spin"></span>donation in flight</h3><p class="mono" style="font-size:11px"><a href="https://etherscan.io/tx/${txHash}" target="_blank" rel="noopener" style="color:var(--lime)">${txHash.slice(0, 20)}…</a></p><p>waiting for mainnet confirmation…</p>`);
      const boostTxt = $('sumBoost').textContent;
      const rec = await waitForReceipt(txHash);
      if (rec && rec.status === '0x1') {
        celebrate(items.length, Number(total) / 1e18, boostTxt, txHash);
        cart = {}; save(); openCart(false); renderCart();
        fetch('/api/reindex', { method: 'POST' }).catch(() => {});
      } else {
        showModal(`<h3>transaction failed</h3><p class="mono" style="font-size:11px"><a href="https://etherscan.io/tx/${txHash}" target="_blank" rel="noopener" style="color:var(--lime)">view on etherscan</a></p><div class="ctas"><button class="btn" id="mClose">close</button></div>`);
      }
    } catch (e) {
      if (e && (e.code === 4001 || /rejected/i.test(e.message || ''))) { hideModal(); return; }
      showModal(`<h3>something broke</h3><p>${escq((e && e.message || e).toString().slice(0, 200))}</p><div class="ctas"><button class="btn" id="mClose">close</button></div>`);
    }
  }

  async function waitForReceipt(hash) {
    for (let i = 0; i < 90; i++) {
      try {
        const r = await window.ethereum.request({ method: 'eth_getTransactionReceipt', params: [hash] });
        if (r) return r;
      } catch {}
      await new Promise(r => setTimeout(r, 4000));
    }
    return null;
  }

  function celebrate(n, gaveEth, boostTxt, txHash) {
    const text = `i just backed ${n} project${n === 1 ? '' : 's'} in ${R.round.name} 🍄 my ${fmt(gaveEth)} unlocked ${boostTxt} in quadratic matching. breadth beats depth:`;
    const url = location.origin + '/';
    showModal(`<h3>🍄 you just moved the pool</h3>
      <p>your ${fmt(gaveEth)} unlocked <b style="color:var(--lime)">${boostTxt}</b> in matching across ${n} project${n === 1 ? '' : 's'}.</p>
      <p class="mono" style="font-size:11px"><a href="https://etherscan.io/tx/${txHash}" target="_blank" rel="noopener" style="color:var(--lime)">receipt on etherscan ↗</a></p>
      <p style="margin-top:10px">every person you bring raises the match for everyone. tell yours:</p>
      <div class="ctas">
        <a class="btn solid" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}">share on x</a>
        <a class="btn" target="_blank" rel="noopener" href="https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + url)}">cast it</a>
        <button class="btn" id="mClose">done</button>
      </div>`);
    setTimeout(() => location.reload(), 60000);
  }

  function showModal(html) { $('modalBox').innerHTML = html; $('modal').classList.add('on'); const c = $('mClose'); if (c) c.onclick = hideModal; }
  function hideModal() { $('modal').classList.remove('on'); }
  // wire mClose for dynamically injected buttons
  document.addEventListener('click', e => { if (e.target.id === 'mClose') hideModal(); });

  /* ---------- boot ---------- */
  fetch('/api/round').then(r => r.json()).then(data => { R = data; renderCart(); }).catch(() => {});
  renderCart();
  if (window.ethereum?.on) window.ethereum.on('accountsChanged', a => { account = a[0] || null; $('connectBtn').textContent = account ? short(account) : 'connect'; renderCart(); });
})();
