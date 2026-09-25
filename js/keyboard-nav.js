(function () {
  'use strict';

  const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape']);
  const INTERACTIVE = [
    'a[href]', 'button:not([disabled])', '[role="button"]',
    'input:not([disabled]):not([type="hidden"])', 'textarea:not([disabled])', 'select:not([disabled])',
    '.graph-node[tabindex]', '.tag[tabindex]', '.site-search-result[href]', '#markdown-content'
  ].join(',');

  let current = null;
  let flashTimer = null;

  function isTypingTarget(el) {
    return !!el && (el.matches('input, textarea, select') || el.isContentEditable);
  }

  function visible(el) {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom >= 0 && r.right >= 0 && r.top <= innerHeight && r.left <= innerWidth;
  }

  function candidates() {
    return Array.from(document.querySelectorAll(INTERACTIVE)).filter(function (el) {
      if (!visible(el)) return false;
      if (el.closest('#footer-placeholder')) return false; // keep arrow navigation focused on the working UI
      return true;
    });
  }

  function center(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function setCurrent(el, scroll) {
    if (!el) return false;
    if (current && current !== el) current.classList.remove('keyboard-nav-current');
    current = el;
    current.classList.add('keyboard-nav-current');
    // Search/text controls are selectable with arrows, but only receive real
    // editing focus after Enter. This prevents the first arrow landing on an
    // input from immediately trapping the user in text-editing behavior.
    if (!isTypingTarget(current)) {
      try { current.focus({ preventScroll: true }); } catch (_) { current.focus(); }
    }
    if (scroll) current.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    return true;
  }

  function nearest(direction) {
    const list = candidates();
    if (!list.length) return null;
    if (!current || !visible(current) || !list.includes(current)) return list[0];

    const a = center(current);
    let best = null;
    let bestScore = Infinity;

    list.forEach(function (el) {
      if (el === current) return;
      const b = center(el);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      let primary, cross;
      if (direction === 'ArrowRight' && dx > 3) { primary = dx; cross = Math.abs(dy); }
      else if (direction === 'ArrowLeft' && dx < -3) { primary = -dx; cross = Math.abs(dy); }
      else if (direction === 'ArrowDown' && dy > 3) { primary = dy; cross = Math.abs(dx); }
      else if (direction === 'ArrowUp' && dy < -3) { primary = -dy; cross = Math.abs(dx); }
      else return;

      // Favor the intended direction while still allowing natural movement between rows/columns.
      const score = primary + cross * 2.35;
      if (score < bestScore) { bestScore = score; best = el; }
    });
    return best;
  }

  function readerArticle() {
    return document.getElementById('markdown-content');
  }

  function readerOutlineLink() {
    const outline = document.getElementById('post-outline');
    if (!outline) return null;
    return outline.querySelector('.outline-link.active') || outline.querySelector('.outline-link');
  }

  function handleReaderArrow(key) {
    const article = readerArticle();
    if (!article || !visible(article)) return false;
    const inOutline = current && current.closest && current.closest('#post-outline');

    // Left from the outline enters article-reading mode. Right from the article
    // returns to the active outline entry, keeping the tree fully accessible.
    if (key === 'ArrowLeft' && inOutline) return setCurrent(article, false);
    if (key === 'ArrowRight' && current === article) {
      const link = readerOutlineLink();
      return link ? setCurrent(link, true) : false;
    }

    // In article-reading mode, vertical arrows scroll the actual post instead of
    // being captured by the outline/sidebar navigation.
    if ((key === 'ArrowDown' || key === 'ArrowUp') && current === article) {
      const amount = Math.max(180, Math.round(window.innerHeight * 0.62));
      window.scrollBy({ top: key === 'ArrowDown' ? amount : -amount, behavior: 'smooth' });
      return true;
    }

    // With no current keyboard target on a reader page, Up/Down starts in the
    // article and scrolls immediately, which matches normal reading behavior.
    if ((key === 'ArrowDown' || key === 'ArrowUp') && (!current || !visible(current))) {
      setCurrent(article, false);
      const amount = Math.max(180, Math.round(window.innerHeight * 0.62));
      window.scrollBy({ top: key === 'ArrowDown' ? amount : -amount, behavior: 'smooth' });
      return true;
    }
    return false;
  }

  function activate(el) {
    if (!el) return false;
    if (isTypingTarget(el)) {
      try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); }
      return true;
    }
    el.click();
    return true;
  }

  function clearCurrent() {
    if (current) current.classList.remove('keyboard-nav-current');
    current = null;
    if (document.activeElement && !isTypingTarget(document.activeElement)) document.activeElement.blur();
  }

  function ensureHud() {
    if (document.getElementById('keyboard-nav-hud')) return;
    const hud = document.createElement('div');
    hud.id = 'keyboard-nav-hud';
    hud.className = 'keyboard-nav-hud';
    hud.setAttribute('aria-hidden', 'true');
    hud.innerHTML = '<i class="bi bi-keyboard-fill"></i><span class="keyboard-nav-key">KEY</span>';
    document.body.appendChild(hud);
  }

  function flash(key) {
    ensureHud();
    const hud = document.getElementById('keyboard-nav-hud');
    const label = hud.querySelector('.keyboard-nav-key');
    const names = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Enter: 'ENTER', Escape: 'ESC' };
    label.textContent = names[key] || key;
    hud.classList.remove('is-active');
    void hud.offsetWidth;
    hud.classList.add('is-active');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { hud.classList.remove('is-active'); }, 360);
  }

  document.addEventListener('keydown', function (event) {
    if (!NAV_KEYS.has(event.key)) return;

    // While actually editing a field, leave normal typing/navigation alone.
    // Escape exits editing mode and returns control to spatial navigation.
    if (isTypingTarget(event.target)) {
      if (event.key === 'Escape') {
        event.target.blur();
        if (current) current.classList.add('keyboard-nav-current');
        event.preventDefault();
        flash(event.key);
      }
      return;
    }

    let handled = false;
    if (event.key.startsWith('Arrow')) {
      handled = handleReaderArrow(event.key);
      if (!handled) {
        const target = nearest(event.key);
        if (target) handled = setCurrent(target, true);
      }
    } else if (event.key === 'Enter') {
      if (current && visible(current)) handled = activate(current);
      else if (document.activeElement && document.activeElement.matches(INTERACTIVE)) handled = activate(document.activeElement);
    } else if (event.key === 'Escape') {
      if (current) { clearCurrent(); handled = true; }
      const results = document.getElementById('site-search-results');
      if (results && !results.hidden) { results.hidden = true; handled = true; }
    }

    if (handled) {
      event.preventDefault();
      flash(event.key);
    }
  }, true);

  document.addEventListener('focusin', function (event) {
    if (event.target.matches && event.target.matches(INTERACTIVE)) {
      if (current && current !== event.target) current.classList.remove('keyboard-nav-current');
      current = event.target;
    }
  });

  document.addEventListener('pointerdown', function () {
    if (current) current.classList.remove('keyboard-nav-current');
    current = null;
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureHud);
  else ensureHud();
})();
