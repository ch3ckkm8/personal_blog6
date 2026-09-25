
function enableMarkdownHighlights(markedApi) {
  if (!markedApi || markedApi.__checkm8HighlightEnabled) return;
  markedApi.use({
    extensions: [{
      name: 'checkm8Highlight',
      level: 'inline',
      start(src) { return src.indexOf('=='); },
      tokenizer(src) {
        const match = /^==(?=\S)([\s\S]*?\S)==/.exec(src);
        if (!match) return;
        return { type: 'checkm8Highlight', raw: match[0], text: match[1], tokens: this.lexer.inlineTokens(match[1]) };
      },
      renderer(token) {
        return '<mark class=\"md-highlight\">' + this.parser.parseInline(token.tokens) + '</mark>';
      }
    }]
  });
  markedApi.__checkm8HighlightEnabled = true;
}
$(document).ready(function () {});

/* ── Editable homepage Markdown ───────────────────────────────── */
(function () {
  const target = document.getElementById('home-markdown');
  if (!target) return;

  function routePostLinks(container) {
    container.querySelectorAll('a[href]').forEach(function (link) {
      const rawHref = link.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#')) return;

      // Keep external/protocol links untouched. Only local Markdown files in
      // posts/ are writeups and should be opened through reader.html.
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(rawHref)) return;

      const cleanHref = rawHref.split('#')[0].split('?')[0];
      const normalized = cleanHref.replace(/^\.\//, '');
      if (/^posts\/.*\.md$/i.test(normalized)) {
        link.href = 'reader.html?post=' + encodeURIComponent(normalized);
      }
    });
  }

  async function loadHomeMarkdown() {
    try {
      if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
        throw new Error('Markdown renderer did not load.');
      }

      const response = await fetch('content/home.md', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error('content/home.md returned HTTP ' + response.status + '.');
      }

      const markdown = await response.text();
      enableMarkdownHighlights(marked);
      const rendered = marked.parse(markdown, { gfm: true, breaks: false });
      target.innerHTML = DOMPurify.sanitize(rendered, { USE_PROFILES: { html: true } });
      routePostLinks(target);
    } catch (error) {
      console.error('[HomeMarkdown]', error);
      target.innerHTML = '<p class="text-muted small mb-0">Homepage notes could not be loaded.</p>';
    }
  }

  loadHomeMarkdown();
})();
