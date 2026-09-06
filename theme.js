window.ThemeManager = (function () {
  const COLOR_KEY = 'terminal-theme';
  const COLOR_THEMES = ['green', 'blue', 'amber'];
  const DEFAULT_COLOR_THEME = 'green';

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

  /**
   * Mark the active swatch button, if any are on the page.
   * Safe to call before swatches exist — silently no-ops.
   *
   * @param {string} theme – 'green' | 'blue' | 'amber'
   */
  function updateSwatches(theme) {
    const $swatches = $('.theme-swatch');
    if (!$swatches.length) return;
    $swatches.removeClass('active');
    $swatches.filter(`[data-theme="${theme}"]`).addClass('active');
  }

  /**
   * Apply a color theme to <html> and persist it.
   *
   * @param {string} theme – 'green' | 'blue' | 'amber'
   */
  function applyColorTheme(theme) {
    if (COLOR_THEMES.indexOf(theme) === -1) theme = DEFAULT_COLOR_THEME;
    $('html').attr('data-terminal-theme', theme);
    localStorage.setItem(COLOR_KEY, theme);
    updateSwatches(theme);
  }

  /* ── Init ────────────────────────────────────────────────────── */
  $(document).ready(function () {
    // Event delegation: works even though the button/swatches are
    // injected asynchronously by components.js (which runs after
    // this file).
    $(document).on('click', '#dark-mode-toggle', function () {
      const current = $('html').attr('data-bs-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    $(document).on('click', '.theme-swatch', function () {
      applyColorTheme($(this).data('theme'));
    });

    // Color theme has no <html> default the way data-bs-theme does,
    // so set it on load — falls back to green if nothing's saved.
    applyColorTheme(localStorage.getItem(COLOR_KEY) || DEFAULT_COLOR_THEME);
  });

  // Public API used by components.js
  return { updateIcon, applyTheme, applyColorTheme, updateSwatches };
}());
