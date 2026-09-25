$(document).ready(function () {

  /* ── Navbar HTML ─────────────────────────────────────────────── */
  const navHTML = `
    <nav class="navbar navbar-expand-lg sticky-top"
         aria-label="Main navigation">
      <div class="container">

        <a class="navbar-brand" href="index.html"
           aria-label="Site home page">
          Ch3ckm8's Lair
        </a>

        <!-- Dark-mode toggle -->
        <button id="dark-mode-toggle"
                type="button"
                class="btn btn-sm ms-auto me-2"
                aria-label="Toggle dark mode"
                title="Toggle dark mode">
          <i class="bi bi-moon-stars-fill" aria-hidden="true"></i>
        </button>

        <!-- Accent palette: cycles the site-wide accent color -->
        <button id="accent-palette-toggle"
                type="button"
                class="btn btn-sm accent-palette-toggle me-2"
                aria-label="Cycle accent color"
                title="Accent: Green">
          <i class="bi bi-palette-fill" aria-hidden="true"></i>
        </button>

        <!-- Background palette: cycles coordinated light/dark page backgrounds -->
        <button id="background-palette-toggle"
                type="button"
                class="btn btn-sm background-palette-toggle me-2"
                aria-label="Cycle page background"
                title="Background: Default">
          <i class="bi bi-display" aria-hidden="true"></i>
        </button>

        <!-- Hamburger — collapses nav on smaller screens -->
        <button class="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#mainNav"
                aria-controls="mainNav"
                aria-expanded="false"
                aria-label="Toggle navigation menu">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="mainNav">
          <div class="site-search ms-lg-3 me-lg-3 my-2 my-lg-0" role="search">
            <div class="site-search-control">
              <i class="bi bi-search" aria-hidden="true"></i>
              <input id="site-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search site…" aria-label="Search all pages and writeups" aria-controls="site-search-results">
              <kbd>/</kbd>
            </div>
            <div id="site-search-results" class="site-search-results" hidden aria-live="polite"></div>
          </div>
          <ul class="navbar-nav ms-auto" role="list">
            <li class="nav-item">
              <a class="nav-link" href="index.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="writeups.html">Writeups</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="graph.html">Graph</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="about.html">About</a>
            </li>
          </ul>
        </div>

      </div>
    </nav>
  `;

  $('#navbar-placeholder').html(navHTML);

  /* ── Active link highlight ───────────────────────────────────── */
  // Compare the filename portion of the current URL to each nav href.
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  $('.nav-link').each(function () {
    const linkPage = ($(this).attr('href') || '').split('/').pop();
    if (linkPage === currentPage) {
      $(this).addClass('active').attr('aria-current', 'page');
    }
  });

  /* ── Footer HTML ─────────────────────────────────────────────── */
  const year = new Date().getFullYear();

  const footerHTML = `
    <footer class="py-4 mt-auto" role="contentinfo" aria-label="Site footer">
      <div class="container">
        <div class="row align-items-center">

          <div class="col-md-5 text-center text-md-start mb-3 mb-md-0">
            <span class="fw-bold">Ch3ckm8's Lair</span>
            <p class="text-muted mb-0" style="font-size:.78rem;">
              Cybersecurity writeups, research &amp; knowledge graph
            </p>
          </div>

          <div class="col-md-4 text-center mb-3 mb-md-0">
            <ul class="list-inline mb-0" aria-label="Footer navigation">
              <li class="list-inline-item">
                <a class="footer-link" href="writeups.html">Writeups</a>
              </li>
              <li class="list-inline-item ms-3">
                <a class="footer-link" href="graph.html">Graph</a>
              </li>
              <li class="list-inline-item ms-3">
                <a class="footer-link" href="about.html">About</a>
              </li>
            </ul>
          </div>

          <div class="col-md-3 text-center text-md-end">
            <a href="#"
               aria-label="GitHub profile placeholder link"
               class="footer-link me-3" title="GitHub">
              <i class="bi bi-github fs-5" aria-hidden="true"></i>
            </a>
            <a href="#"
               aria-label="Twitter / X profile placeholder link"
               class="footer-link me-3" title="Twitter / X">
              <i class="bi bi-twitter-x fs-5" aria-hidden="true"></i>
            </a>
            <span class="text-muted" style="font-size:.78rem;">
              &copy; ${year}
            </span>
          </div>

        </div>
      </div>
    </footer>
  `;

  $('#footer-placeholder').html(footerHTML);

  if (window.AccentManager) window.AccentManager.syncButton();
  if (window.BackgroundManager) window.BackgroundManager.syncButton();

  /* ── Sync dark-mode icon now the button is in the DOM ────────── */
  if (window.ThemeManager) {
    window.ThemeManager.updateIcon($('html').attr('data-bs-theme') || 'light');
  }
  if (window.AccentManager) window.AccentManager.syncButton();

  if (window.SiteSearch) window.SiteSearch.init();


  /* ── Persistent Markdown scratchpad ─────────────────────────── */
  (function initMarkdownScratchpad() {
    if (document.getElementById('markdown-note-toggle')) return;

    const STORAGE_KEY = 'ch3ckm8-markdown-note';
    const OPEN_KEY = 'ch3ckm8-markdown-note-open';

    const noteHTML = `
      <button id="markdown-note-toggle" class="markdown-note-toggle" type="button"
              aria-label="Toggle Markdown notes" aria-controls="markdown-note-panel"
              aria-expanded="false" title="Markdown notes">
        <i class="bi bi-journal-text" aria-hidden="true"></i>
      </button>
      <aside id="markdown-note-panel" class="markdown-note-panel" aria-label="Markdown scratchpad" hidden>
        <div class="markdown-note-header">
          <strong><i class="bi bi-markdown me-1" aria-hidden="true"></i> Notes</strong>
          <div class="markdown-note-actions" role="tablist" aria-label="Note mode">
            <button type="button" class="markdown-note-mode active" data-note-mode="edit" aria-selected="true">Edit</button>
            <button type="button" class="markdown-note-mode" data-note-mode="preview" aria-selected="false">Preview</button>
          </div>
        </div>
        <textarea id="markdown-note-editor" class="markdown-note-editor" spellcheck="true"
                  aria-label="Markdown notes" placeholder="Write Markdown here..."></textarea>
        <div id="markdown-note-preview" class="markdown-note-preview markdown-body" hidden></div>
        <div class="markdown-note-footer"><span>Saved locally</span><span>Markdown supported</span></div>
      </aside>`;

    document.body.insertAdjacentHTML('beforeend', noteHTML);
    const toggle = document.getElementById('markdown-note-toggle');
    const panel = document.getElementById('markdown-note-panel');
    const editor = document.getElementById('markdown-note-editor');
    const preview = document.getElementById('markdown-note-preview');
    const modeButtons = Array.from(panel.querySelectorAll('[data-note-mode]'));

    editor.value = localStorage.getItem(STORAGE_KEY) || '';

    function setOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('is-open', open);
      localStorage.setItem(OPEN_KEY, open ? '1' : '0');
      if (open && !preview.hidden) renderPreview();
    }

    function escapeHtml(value) {
      return value.replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
    }

    let markdownLibrariesPromise = null;

    function loadScriptOnce(src, globalName) {
      if (window[globalName]) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const existing = Array.from(document.scripts).find(script => script.src === src);
        if (existing) {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    function ensureMarkdownLibraries() {
      if (window.marked && window.DOMPurify) return Promise.resolve();
      if (!markdownLibrariesPromise) {
        markdownLibrariesPromise = Promise.all([
          loadScriptOnce('https://cdn.jsdelivr.net/npm/marked/marked.min.js', 'marked'),
          loadScriptOnce('https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js', 'DOMPurify')
        ]).catch(error => {
          markdownLibrariesPromise = null;
          throw error;
        });
      }
      return markdownLibrariesPromise;
    }

    async function renderPreview() {
      const md = editor.value;
      preview.classList.add('is-loading');
      preview.innerHTML = '<p class="markdown-note-status">Rendering preview…</p>';
      try {
        await ensureMarkdownLibraries();
        const html = window.marked.parse(md, { gfm: true, breaks: true });
        preview.innerHTML = window.DOMPurify.sanitize(html);
      } catch (error) {
        console.error('Markdown scratchpad preview failed:', error);
        preview.innerHTML = '<p class="markdown-note-status">Preview could not be rendered. Your note is still saved.</p>';
      } finally {
        preview.classList.remove('is-loading');
      }
    }

    toggle.addEventListener('click', function () { setOpen(panel.hidden); });
    editor.addEventListener('input', function () {
      localStorage.setItem(STORAGE_KEY, editor.value);
      if (!preview.hidden) renderPreview();
    });

    modeButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const previewMode = button.dataset.noteMode === 'preview';
        modeButtons.forEach(b => {
          const active = b === button;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', String(active));
        });
        editor.hidden = previewMode;
        preview.hidden = !previewMode;
        if (previewMode) renderPreview(); else editor.focus();
      });
    });

    // Preserve the user's open/collapsed state while navigating between pages.
    setOpen(localStorage.getItem(OPEN_KEY) === '1');
  })();

});
