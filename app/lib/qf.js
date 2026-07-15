// quadratic funding math — score = (Σ√c_d)² over per-donor totals (the site's
// published formula; unlike strict CLR's −Σc variant it gives a grant's first
// donor a visible nonzero match), proportional allocation with a per-grant cap
// and iterative redistribution of capped surplus.

// donations: [{dest, donor, amount_eth}] with dest = grant payout address (lowercase)
// extra: optional hypothetical cart, [{dest, donor, amount_eth}]
export function qfScores(donations, extra = []) {
  const perGrant = new Map(); // dest -> {donorTotals: Map, raised, donors:Set}
  const bump = (dest, donor, eth) => {
    let g = perGrant.get(dest);
    if (!g) perGrant.set(dest, g = { donorTotals: new Map(), raised: 0, donors: new Set() });
    g.donorTotals.set(donor, (g.donorTotals.get(donor) || 0) + eth);
    g.raised += eth;
    g.donors.add(donor);
  };
  for (const d of donations) bump(d.dest, d.donor, d.amount_eth);
  for (const d of extra) bump(d.dest, d.donor, d.amount_eth);

  const scores = {}, stats = {};
  for (const [dest, g] of perGrant) {
    let sumSqrt = 0;
    for (const c of g.donorTotals.values()) sumSqrt += Math.sqrt(c);
    scores[dest] = sumSqrt * sumSqrt;
    stats[dest] = { raised: g.raised, donors: g.donors.size };
  }
  return { scores, stats };
}

export function allocate(scores, poolEth, capFraction) {
  const cap = poolEth * capFraction;
  const matches = {};
  for (const k of Object.keys(scores)) matches[k] = 0;
  let uncapped = Object.keys(scores).filter(k => scores[k] > 0);
  let remaining = poolEth;
  for (let i = 0; i < 25 && remaining > 1e-12 && uncapped.length; i++) {
    const tot = uncapped.reduce((s, k) => s + scores[k], 0);
    if (tot <= 0) break;
    let spill = 0;
    const next = [];
    for (const k of uncapped) {
      const add = remaining * scores[k] / tot;
      const room = cap - matches[k];
      if (add >= room) { matches[k] += room; spill += add - room; }
      else { matches[k] += add; next.push(k); }
    }
    remaining = spill;
    uncapped = next;
  }
  return matches;
}

// convenience: full result for a round
export function computeRound(round, donations, extra = []) {
  const { scores, stats } = qfScores(donations, extra);
  const matches = allocate(scores, round.matching_pool_eth, round.match_cap_fraction);
  return { scores, stats, matches };
}
