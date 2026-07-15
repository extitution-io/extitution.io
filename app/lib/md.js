// tiny safe markdown: escapes ALL html first, then applies a small subset
// (headings, bold, italics, links, lists, paragraphs). no raw html passes
// through, so user-submitted grant descriptions can't inject markup.
export function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

function inline(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<i>$1</i>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) =>
      SAFE_URL.test(url) ? `<a href="${url}" target="_blank" rel="noopener nofollow">${text}</a>` : text);
}

export function md(src) {
  const lines = esc(src).replaceAll('\r', '').split('\n');
  const out = [];
  let list = false, para = [];
  const flush = () => {
    if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
  };
  const endList = () => { if (list) { out.push('</ul>'); list = false; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) { flush(); endList(); out.push(`<h${h[1].length + 2}>${inline(h[2])}</h${h[1].length + 2}>`); continue; }
    const li = line.match(/^[-*]\s+(.*)/);
    if (li) { flush(); if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(li[1])}</li>`); continue; }
    if (line.trim() === '') { flush(); endList(); continue; }
    para.push(line.trim());
  }
  flush(); endList();
  return out.join('\n');
}
