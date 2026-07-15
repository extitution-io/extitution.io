// dynamic og:image cards — 1200×630 png rendered from an svg template via
// sharp. crawlers get a branded card with live stats; cached briefly in memory.
import sharp from 'sharp';
import { esc } from './md.js';

const cache = new Map(); // key -> {png, at}
const TTL = 5 * 60 * 1000;

const wrapText = (s, max) => {
  const words = String(s).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
};

function svgCard({ eyebrow, title, sub, stats }) {
  const titleLines = wrapText(title, 24);
  const titleSvg = titleLines.map((l, i) =>
    `<text x="80" y="${240 + i * 78}" font-family="Georgia,serif" font-size="64" font-weight="600" fill="#e9e6da">${esc(l)}</text>`).join('');
  const subLines = wrapText(sub || '', 58);
  const subY = 240 + titleLines.length * 78 + 10;
  const subSvg = subLines.map((l, i) =>
    `<text x="80" y="${subY + i * 36}" font-family="Georgia,serif" font-size="26" fill="#a5a294">${esc(l)}</text>`).join('');
  const statSvg = (stats || []).map((s, i) => `
    <text x="${80 + i * 280}" y="545" font-family="Menlo,monospace" font-size="40" font-weight="bold" fill="#b8f05c">${esc(s.v)}</text>
    <text x="${80 + i * 280}" y="580" font-family="Menlo,monospace" font-size="17" letter-spacing="2" fill="#82806f">${esc(s.k)}</text>`).join('');
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="85%" cy="-20%" r="120%">
      <stop offset="0%" stop-color="#1c2412"/><stop offset="55%" stop-color="#0c0e0a"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="0" y="0" width="1200" height="6" fill="#b8f05c"/>
  <g transform="translate(80,92) scale(1.4)">
    <path d="M4.2 25.5C6 12.5 14.5 4.5 24 4.5s18 8 19.8 21c.4 2.8-1.9 5-4.7 5H8.9c-2.8 0-5.1-2.2-4.7-5z" fill="#b8f05c"/>
    <path d="M19.2 30.5c-.6 6.4-.4 11.2 1 15.6.4 1.4 1.6 2.4 3 2.4h1.6c1.4 0 2.6-1 3-2.4 1.4-4.4 1.6-9.2 1-15.6z" fill="#e6f5bd"/>
  </g>
  <text x="180" y="128" font-family="Menlo,monospace" font-size="22" letter-spacing="4" fill="#b8f05c">${esc(eyebrow)}</text>
  ${titleSvg}
  ${subSvg}
  ${statSvg}
  <text x="1120" y="590" text-anchor="end" font-family="Menlo,monospace" font-size="18" letter-spacing="2" fill="#82806f">grants.extitutional.io</text>
</svg>`;
}

export async function ogPng(key, data) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.png;
  const png = await sharp(Buffer.from(svgCard(data))).png().toBuffer();
  cache.set(key, { png, at: Date.now() });
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  return png;
}
