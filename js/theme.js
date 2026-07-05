window.ThemeManager = (function () {

  /**
   * Swap the toggle button icon to match the current theme.
   * Safe to call before the button exists — silently no-ops.
   *
   * @param {string} theme – 'dark' | 'light'
   */
  function updateIcon(theme) {
    const $icon = $('#dark-mode-toggle i');
    if (!$icon.length) return;

    if (theme === 'dark') {
      $icon.removeClass('bi-moon-stars-fill').addClass('bi-sun-fill');
    } else {
      $icon.removeClass('bi-sun-fill').addClass('bi-moon-stars-fill');
    }
  }

  /**
   * Apply a theme to <html> and persist it.
   *
   * @param {string} theme – 'dark' | 'light'
   */
  function applyTheme(theme) {
    $('html').attr('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
    updateIcon(theme);
  }

  /* ── Init ────────────────────────────────────────────────────── */
  $(document).ready(function () {

    // Event delegation: works even though the button is injected
    // asynchronously by components.js (which runs after this file).
    $(document).on('click', '#dark-mode-toggle', function () {
      const current = $('html').attr('data-bs-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

  });

  // Public API used by components.js
  return { updateIcon, applyTheme };

}());
