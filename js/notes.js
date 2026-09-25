
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
$(document).ready(async function () {
  const $status = $('#reader-status');
  const $content = $('#markdown-content');
  const $meta = $('#post-meta');
  const $layout = $('#reader-layout');
  const $outline = $('#post-outline');
  const file = 'content/notes.md';

  try {
    const notesUrl = new URL(file, window.location.href);
    notesUrl.search = '';
    notesUrl.hash = '';
    const response = await fetch(notesUrl.href, { cache: 'no-cache' });
    if (!response.ok) throw new Error('HTTP ' + response.status + ' loading content/notes.md');
    const notesContent = await response.text();
    const post = { title: 'Notes', content: notesContent, tags: [] };
    if (typeof marked === 'undefined') throw new Error('The Markdown renderer failed to load.');
    if (typeof DOMPurify === 'undefined') throw new Error('The HTML sanitizer failed to load.');

    enableMarkdownHighlights(marked);
    const html = DOMPurify.sanitize(marked.parse(post.content));
    $content.html(html);

    // Give every Markdown heading a stable anchor and build a clickable outline.
    const usedIds = new Set();
    const outlineItems = [];
    $content.find('h1, h2, h3, h4, h5, h6').each(function () {
      const heading = this;
      const level = Number(heading.tagName.substring(1));
      const text = $(heading).text().trim();
      if (!text) return;

      let base = text.toLowerCase()
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section';
      let id = base;
      let n = 2;
      while (usedIds.has(id)) id = base + '-' + n++;
      usedIds.add(id);
      heading.id = id;
      heading.classList.add('outline-heading');
      outlineItems.push({ level: level, text: text, id: id });
    });

    if (outlineItems.length) {
      // Build a real nested tree from Markdown heading levels. If a document
      // skips a level (for example h2 -> h4), attach it to the nearest parent.
      const root = { level: 0, children: [] };
      const stack = [root];
      outlineItems.forEach(function (item) {
        while (stack.length > 1 && stack[stack.length - 1].level >= item.level) stack.pop();
        const node = Object.assign({ children: [] }, item);
        stack[stack.length - 1].children.push(node);
        stack.push(node);
      });

      function renderTree(nodes, depth) {
        return '<ul class="outline-tree outline-depth-' + depth + '">' + nodes.map(function (node) {
          const children = node.children.length ? renderTree(node.children, depth + 1) : '';
          return '<li class="outline-node"><a class="outline-link" data-heading-id="' + node.id + '" href="#' + encodeURIComponent(node.id) + '"><span class="outline-dot" aria-hidden="true"></span><span class="outline-text">' + $('<div>').text(node.text).html() + '</span></a>' + children + '</li>';
        }).join('') + '</ul>';
      }

      $outline.html('<div class="outline-card"><div class="outline-title"><i class="bi bi-diagram-3 me-2"></i>On this page</div><nav class="outline-nav">' + renderTree(root.children, 0) + '</nav></div>');

      // Highlight the section currently nearest the top of the viewport.
      const headingElements = outlineItems.map(function (item) { return document.getElementById(item.id); }).filter(Boolean);
      let ticking = false;
      function updateActiveOutline() {
        ticking = false;
        const threshold = 120;
        let active = headingElements[0] || null;
        headingElements.forEach(function (heading) {
          if (heading.getBoundingClientRect().top <= threshold) active = heading;
        });
        $outline.find('.outline-link').removeClass('active');
        if (active) {
          const $active = $outline.find('.outline-link[data-heading-id="' + CSS.escape(active.id) + '"]').addClass('active');
          const nav = $outline.find('.outline-nav').get(0);
          const link = $active.get(0);
          if (nav && link && (link.offsetTop < nav.scrollTop || link.offsetTop + link.offsetHeight > nav.scrollTop + nav.clientHeight)) {
            link.scrollIntoView({ block: 'nearest' });
          }
        }
      }
      $(window).on('scroll.outline resize.outline', function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateActiveOutline);
        }
      });
      updateActiveOutline();
    } else {
      $outline.addClass('d-none');
    }

    $layout.removeClass('d-none');

    // Syntax highlighting + one-click copy buttons for fenced Markdown code blocks.
    $content.find('pre').each(function () {
      const pre = this;
      const code = pre.querySelector('code');
      if (!code) return;

      if (typeof hljs !== 'undefined') {
        hljs.highlightElement(code);
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-btn';
      button.setAttribute('aria-label', 'Copy code');
      button.setAttribute('title', 'Copy code');
      button.innerHTML = '<i class="bi bi-clipboard"></i><span>Copy</span>';

      button.addEventListener('click', async function () {
        try {
          await navigator.clipboard.writeText(code.textContent);
          button.classList.add('copied');
          button.innerHTML = '<i class="bi bi-check2"></i><span>Copied!</span>';
          setTimeout(function () {
            button.classList.remove('copied');
            button.innerHTML = '<i class="bi bi-clipboard"></i><span>Copy</span>';
          }, 1600);
        } catch (error) {
          console.error('[reader] Could not copy code', error);
        }
      });

      pre.appendChild(button);
    });

    // Assets referenced by Markdown are relative to posts/<filename>.md.
    const postUrl = new URL(file, window.location.href);
    postUrl.search = '';
    postUrl.hash = '';
    $content.find('img').each(function () {
      const src = $(this).attr('src') || '';
      if (src && !/^(?:[a-z]+:|\/|#)/i.test(src)) $(this).attr('src', new URL(src, postUrl.href).href);
    });
    $content.find('a').each(function () {
      const href = $(this).attr('href') || '';
      if (href && !/^(?:[a-z]+:|\/|#)/i.test(href)) $(this).attr('href', new URL(href, postUrl.href).href);
    });

    // Search-result deep links. Search results carry the exact matched term plus
    // its zero-based occurrence within a Markdown section. We reproduce that order
    // against rendered DOM blocks, including <pre><code>, then scroll to that hit.
    const readerParams = new URLSearchParams(window.location.search);
    const searchQuery = (readerParams.get('q') || '').trim();
    const requestedSection = (readerParams.get('section') || '').trim();
    const requestedHit = (readerParams.get('hit') || '').trim();
    const requestedOccurrence = Math.max(0, parseInt(readerParams.get('occurrence') || '0', 10) || 0);

    function sectionElements(heading) {
      if (!heading) return Array.from($content.get(0).children);
      const level = Number(heading.tagName.slice(1));
      const nodes = [heading];
      let node = heading.nextElementSibling;
      while (node) {
        if (/^H[1-6]$/.test(node.tagName) && Number(node.tagName.slice(1)) <= level) break;
        nodes.push(node);
        node = node.nextElementSibling;
      }
      return nodes;
    }

    function highlightInElement(element, term, occurrenceInElement) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          const parent = node.parentElement;
          if (!parent || parent.closest('script, style, .code-copy-btn')) return NodeFilter.FILTER_REJECT;
          return node.nodeValue ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      let remaining = occurrenceInElement;
      let node;
      const needle = term.toLocaleLowerCase();
      while ((node = walker.nextNode())) {
        const haystack = node.nodeValue.toLocaleLowerCase();
        let from = 0;
        while (from <= haystack.length) {
          const at = haystack.indexOf(needle, from);
          if (at === -1) break;
          if (remaining === 0) {
            const range = document.createRange();
            range.setStart(node, at);
            range.setEnd(node, at + term.length);
            const mark = document.createElement('mark');
            mark.className = 'search-hit';
            try { range.surroundContents(mark); return mark; } catch (_) { return element; }
          }
          remaining--;
          from = at + Math.max(term.length, 1);
        }
      }
      return element;
    }

    if (requestedHit || requestedSection || window.location.hash) {
      window.requestAnimationFrame(function () {
        const sectionId = requestedSection || (window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : '');
        const sectionHeading = sectionId ? document.getElementById(sectionId) : null;
        const elements = sectionElements(sectionHeading);
        let destination = sectionHeading;

        if (requestedHit) {
          const needle = requestedHit.toLocaleLowerCase();
          let remaining = requestedOccurrence;
          for (const element of elements) {
            if (element.classList && element.classList.contains('code-copy-btn')) continue;
            const text = (element.textContent || '').toLocaleLowerCase();
            let count = 0;
            let from = 0;
            while (from <= text.length) {
              const at = text.indexOf(needle, from);
              if (at === -1) break;
              count++;
              from = at + Math.max(needle.length, 1);
            }
            if (!count) continue;
            if (remaining < count) {
              destination = highlightInElement(element, requestedHit, remaining);
              element.classList.add('search-hit-container');
              break;
            }
            remaining -= count;
          }
        }

        if (destination) {
          setTimeout(function () { destination.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80);
        }
      });
    }

    $outline.on('click', 'a[href^="#"]', function (event) {
      const id = decodeURIComponent(this.hash.slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + encodeURIComponent(id));
    });

    $status.addClass('d-none');
    document.title = "Notes | Ch3ckm8's Lair";
  } catch (error) {
    console.error('[notes]', error);
    $status.html('The Notes page failed to render. <small class="d-block mt-2 text-muted">' + $('<div>').text(error.message).html() + '</small>');
  }
});
