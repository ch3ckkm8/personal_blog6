(function () {
  'use strict';

  const PAGE_INDEX = [
    { title: 'Home', url: 'index.html', selector: 'main' },
    { title: 'Writeups', url: 'writeups.html', selector: 'main' },
    { title: 'Knowledge Graph', url: 'graph.html', selector: 'main' },
    { title: 'About', url: 'about.html', selector: 'main' }
  ];

  let documentsPromise = null;
  const normalize = value => (value || '').toString().toLocaleLowerCase();
  const escapeHtml = value => $('<div>').text(value || '').html();

  function stripMarkdown(markdown) {
    // Keep fenced-code CONTENT searchable; remove only the fence markers/language.
    return (markdown || '')
      .replace(/^\s*```[^\n]*$/gm, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s*#{1,6}\s+/gm, '')
      .replace(/[>*_~|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function slugifyHeading(text, seen) {
    let slug = (text || '').toLowerCase()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section';
    const count = seen.get(slug) || 0;
    seen.set(slug, count + 1);
    if (count) slug += '-' + (count + 1);
    return slug;
  }

  function extractSections(markdown) {
    const sections = [];
    const seen = new Map();
    let current = { heading: '', slug: '', lines: [] };
    let inFence = false;

    function pushCurrent() {
      const text = stripMarkdown(current.lines.join('\n'));
      if (text) sections.push({ heading: current.heading, slug: current.slug, text });
    }

    (markdown || '').split(/\r?\n/).forEach(line => {
      if (/^\s*```/.test(line)) { inFence = !inFence; current.lines.push(line); return; }
      if (!inFence) {
        const match = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
        if (match) {
          pushCurrent();
          const heading = match[2].replace(/[`*_~]/g, '').trim();
          current = { heading, slug: slugifyHeading(heading, seen), lines: [heading] };
          return;
        }
      }
      current.lines.push(line);
    });
    pushCurrent();
    return sections;
  }

  function findBestMatch(text, terms) {
    const lower = normalize(text);
    let best = null;
    terms.forEach(term => {
      let from = 0;
      while (term && from < lower.length) {
        const at = lower.indexOf(term, from);
        if (at === -1) break;
        if (!best || at < best.at || (at === best.at && term.length > best.term.length)) best = { at, term };
        from = at + Math.max(term.length, 1);
      }
    });
    return best;
  }

  function snippetAround(text, terms, maxLength) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return { text: '', start: 0 };
    const match = findBestMatch(clean, terms);
    if (!match) return { text: clean.slice(0, maxLength) + (clean.length > maxLength ? '…' : ''), start: 0 };
    let start = Math.max(0, match.at - Math.floor(maxLength * .35));
    let end = Math.min(clean.length, start + maxLength);
    if (end === clean.length) start = Math.max(0, end - maxLength);
    return { text: (start ? '…' : '') + clean.slice(start, end) + (end < clean.length ? '…' : ''), start };
  }

  function highlightTerms(text, terms) {
    if (!text) return '';
    const escaped = escapeHtml(text);
    const safeTerms = terms.filter(Boolean).sort((a,b) => b.length-a.length).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!safeTerms.length) return escaped;
    return escaped.replace(new RegExp('(' + safeTerms.join('|') + ')', 'gi'), '<mark>$1</mark>');
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
            sections: extractSections(content)
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

  function scoreText(title, tags, body, terms) {
    title = normalize(title); tags = normalize(tags); body = normalize(body);
    let score = 0;
    for (const term of terms) {
      if (!body.includes(term) && !title.includes(term) && !tags.includes(term)) return 0;
      if (title === term) score += 60;
      else if (title.includes(term)) score += 28;
      if (tags.split(/\s+/).includes(term)) score += 22;
      else if (tags.includes(term)) score += 10;
      score += Math.min(body.split(term).length - 1, 8) * 2;
    }
    return score;
  }

  function buildSearchResults(docs, terms) {
    const results = [];
    docs.forEach(doc => {
      if (doc.type !== 'post') {
        const score = scoreDocument(doc, terms);
        if (score) results.push({ doc, score, text: doc.text, section: '' });
        return;
      }

      const tagText = (doc.tags || []).join(' ');
      const titleScore = scoreText(doc.title, tagText, '', terms);
      if (titleScore) results.push({ doc, score: titleScore + 10, text: doc.text, section: '' });

      (doc.sections || []).forEach(section => {
        const score = scoreText(section.heading, tagText, section.text, terms);
        if (!score) return;
        const match = findBestMatch(section.text, terms);
        let occurrence = 0;
        if (match) {
          const before = normalize(section.text).slice(0, match.at);
          occurrence = before.split(match.term).length - 1;
        }
        results.push({ doc, score, text: section.text, section: section.heading, slug: section.slug,
          hitTerm: match ? match.term : '', hitOccurrence: occurrence });
      });
    });
    return results.sort((a,b) => b.score-a.score || a.doc.title.localeCompare(b.doc.title));
  }

  function resultUrl(result, query) {
    if (result.doc.type !== 'post') return result.doc.url;
    const joiner = result.doc.url.includes('?') ? '&' : '?';
    let url = result.doc.url + joiner + 'q=' + encodeURIComponent(query);
    if (result.slug) url += '&section=' + encodeURIComponent(result.slug);
    if (result.hitTerm) {
      url += '&hit=' + encodeURIComponent(result.hitTerm);
      url += '&occurrence=' + encodeURIComponent(String(result.hitOccurrence || 0));
    }
    if (result.slug) url += '#' + encodeURIComponent(result.slug);
    return url;
  }

  function renderResults(results, terms, query) {
    const $box = $('#site-search-results');
    if (!results.length) {
      $box.html('<div class="site-search-empty">No matching pages or writeups.</div>').prop('hidden', false);
      return;
    }
    $box.html(results.slice(0, 10).map(result => {
      const doc = result.doc;
      const url = resultUrl(result, query);
      const preview = snippetAround(result.text, terms, 220).text;
      const kind = doc.type === 'post' ? 'writeup' : 'page';
      const section = result.section ? `<span class="site-search-result-section"><i class="bi bi-arrow-return-right"></i>${escapeHtml(result.section)}</span>` : '';
      return `<a class="site-search-result" href="${escapeHtml(url)}">
        <span class="site-search-result-top"><strong>${highlightTerms(doc.title, terms)}</strong><span>${kind}</span></span>
        ${section}
        <span class="site-search-result-snippet">${highlightTerms(preview, terms)}</span>
      </a>`;
    }).join('')).prop('hidden', false);
  }

  async function search(query) {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) { $('#site-search-results').prop('hidden', true).empty(); return; }
    $('#site-search-results').html('<div class="site-search-empty">Searching…</div>').prop('hidden', false);
    const docs = await getDocuments();
    const results = buildSearchResults(docs, terms);
    renderResults(results, terms, query.trim());
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
