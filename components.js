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

        <!-- Terminal color theme picker -->
        <div class="d-flex gap-2 align-items-center ms-auto me-3" aria-label="Terminal color theme">
          <button class="theme-swatch theme-swatch--green" data-theme="green" aria-label="Green theme" title="Green theme"></button>
          <button class="theme-swatch theme-swatch--blue"  data-theme="blue"  aria-label="Blue theme"  title="Blue theme"></button>
          <button class="theme-swatch theme-swatch--amber" data-theme="amber" aria-label="Amber theme" title="Amber theme"></button>
        </div>

        <!-- Dark-mode toggle -->
        <button id="dark-mode-toggle"
                type="button"
                class="btn btn-sm me-2"
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

  /* ── Sync dark-mode icon and color-theme swatches now they're in
     the DOM (ThemeManager sets the <html> attributes on page load,
     before these controls exist) ─────────────────────────────── */
  if (window.ThemeManager) {
    window.ThemeManager.updateIcon($('html').attr('data-bs-theme') || 'light');
    window.ThemeManager.updateSwatches($('html').attr('data-terminal-theme') || 'green');
  }

});
