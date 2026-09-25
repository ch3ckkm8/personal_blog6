(function () {
  'use strict';

  const PAGE_INDEX = [
    { title: 'Home', url: 'index.html', selector: 'main' },
    { title: 'Writeups', url: 'writeups.html', selector: 'main' },
    { title: 'Knowledge Graph', url: 'graph.html', selector: 'main' },
    { title: 'Requests', url: 'tasks.html', selector: 'main' },
    { title: 'About', url: 'about.html', selector: 'main' },
    { title: 'Contact', url: 'contact.html', selector: 'main' }
  ];

  let documentsPromise = null;
  const normalize = value => (value || '').toString().toLocaleLowerCase();
  const escapeHtml = value => $('<div>').text(value || '').html();

  function stripMarkdown(markdown) {
    return (markdown || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s*#{1,6}\s+/gm, '')
      .replace(/[>*_~|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function extractHeadings(markdown) {
    const headings = [];
    const seen = new Map();
    let inFence = false;
    (markdown || '').split(/\r?\n/).forEach(line => {
      if (/^\s*```/.test(line)) { inFence = !inFence; return; }
      if (inFence) return;
      const match = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (!match) return;
      const text = match[2].replace(/[`*_~]/g, '').trim();
      let slug = text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
      slug = slug || 'section';
      const count = seen.get(slug) || 0;
      seen.set(slug, count + 1);
      if (count) slug += '-' + count;
      headings.push({ text, slug });
    });
    return headings;
  }

  function snippetAround(text, terms, maxLength) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    const lower = normalize(clean);
    let at = -1;
    terms.some(term => {
      const found = lower.indexOf(term);
      if (found !== -1) { at = found; return true; }
      return false;
    });
    if (at < 0) return clean.slice(0, maxLength) + (clean.length > maxLength ? '…' : '');
    const start = Math.max(0, at - Math.floor(maxLength * 0.35));
    const end = Math.min(clean.length, start + maxLength);
    return (start ? '…' : '') + clean.slice(start, end) + (end < clean.length ? '…' : '');
  }

  async function loadStaticPage(page) {
    try {
      const response = await fetch(page.url, { cache: 'no-cache' });
      if (!response.ok) return null;
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('script,style,nav,footer').forEach(el => el.remove());
      const root = doc.querySelector(page.selector) || doc.body;
      return { type: 'page', title: page.title, url: page.url, text: root.textContent.replace(/\s+/g, ' ').trim(), tags: [] };
    } catch (_) { return null; }
  }

  async function buildDocuments() {
    const docs = [];
    try {
      const response = await fetch('posts/index.json', { cache: 'no-cache' });
      if (response.ok) {
        const posts = await response.json();
        posts.forEach(post => {
          const content = post.content || '';
          docs.push({
            type: 'post',
            title: post.title || post.file,
            url: 'reader.html?post=' + encodeURIComponent(post.file),
            text: stripMarkdown(content),
            raw: content,
            tags: Array.isArray(post.tags) ? post.tags : [],
            headings: extractHeadings(content)
          });
        });
      }
    } catch (_) {}
    const pages = await Promise.all(PAGE_INDEX.map(loadStaticPage));
    pages.filter(Boolean).forEach(page => docs.push(page));
    return docs;
  }

  function getDocuments() {
    if (!documentsPromise) documentsPromise = buildDocuments();
    return documentsPromise;
  }

  function scoreDocument(doc, terms) {
    const title = normalize(doc.title);
    const tags = normalize((doc.tags || []).join(' '));
    const body = normalize(doc.text);
    let score = 0;
    for (const term of terms) {
      if (!body.includes(term) && !title.includes(term) && !tags.includes(term)) return 0;
      if (title === term) score += 60;
      else if (title.includes(term)) score += 28;
      if (tags.split(/\s+/).includes(term)) score += 22;
      else if (tags.includes(term)) score += 10;
      const occurrences = body.split(term).length - 1;
      score += Math.min(occurrences, 8) * 2;
    }
    return score;
  }

  function bestPostUrl(doc, terms) {
    if (doc.type !== 'post' || !doc.headings) return doc.url;
    let best = null;
    let bestScore = 0;
    doc.headings.forEach(heading => {
      const text = normalize(heading.text);
      let score = 0;
      terms.forEach(term => { if (text.includes(term)) score += term.length + 5; });
      if (score > bestScore) { bestScore = score; best = heading; }
    });
    return best ? doc.url + '#' + encodeURIComponent(best.slug) : doc.url;
  }

  function renderResults(results, terms) {
    const $box = $('#site-search-results');
    if (!results.length) {
      $box.html('<div class="site-search-empty">No matching pages or writeups.</div>').prop('hidden', false);
      return;
    }
    $box.html(results.slice(0, 8).map(({ doc }) => {
      const url = bestPostUrl(doc, terms);
      const snippet = snippetAround(doc.text, terms, 180);
      const kind = doc.type === 'post' ? 'writeup' : 'page';
      return `<a class="site-search-result" href="${escapeHtml(url)}">
        <span class="site-search-result-top"><strong>${escapeHtml(doc.title)}</strong><span>${kind}</span></span>
        <span class="site-search-result-snippet">${escapeHtml(snippet)}</span>
      </a>`;
    }).join('')).prop('hidden', false);
  }

  async function search(query) {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) { $('#site-search-results').prop('hidden', true).empty(); return; }
    $('#site-search-results').html('<div class="site-search-empty">Searching…</div>').prop('hidden', false);
    const docs = await getDocuments();
    const results = docs.map(doc => ({ doc, score: scoreDocument(doc, terms) })).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
    renderResults(results, terms);
  }

  window.SiteSearch = {
    init() {
      const $input = $('#site-search-input');
      if (!$input.length) return;
      let timer;
      $input.on('input', function () { clearTimeout(timer); timer = setTimeout(() => search(this.value), 100); });
      $input.on('focus', function () { if (this.value.trim()) search(this.value); });
      $input.on('keydown', function (event) {
        if (event.key === 'Escape') { $('#site-search-results').prop('hidden', true); this.blur(); }
        if (event.key === 'Enter') {
          const href = $('#site-search-results .site-search-result').first().attr('href');
          if (href) window.location.href = href;
        }
      });
      $(document).on('click.siteSearch', function (event) {
        if (!$(event.target).closest('.site-search').length) $('#site-search-results').prop('hidden', true);
      });
      getDocuments();
    }
  };
})();
