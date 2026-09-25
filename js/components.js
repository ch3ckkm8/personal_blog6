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
              <a class="nav-link" href="tasks.html">Requests</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="about.html">About</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="contact.html">Contact</a>
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
              A cybersecurity writeups &amp; requests template
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
                <a class="footer-link" href="tasks.html">Requests</a>
              </li>
              <li class="list-inline-item ms-3">
                <a class="footer-link" href="about.html">About</a>
              </li>
              <li class="list-inline-item ms-3">
                <a class="footer-link" href="contact.html">Contact</a>
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

  /* ── Sync dark-mode icon now the button is in the DOM ────────── */
  if (window.ThemeManager) {
    window.ThemeManager.updateIcon($('html').attr('data-bs-theme') || 'light');
  }

  if (window.SiteSearch) window.SiteSearch.init();

});
