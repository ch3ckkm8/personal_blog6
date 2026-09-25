$(document).ready(function () {

  const $activityList = $('#activity-list');
  if (!$activityList.length) return;

  let tasks = [];
  try {
    tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  } catch (e) {
    tasks = [];
  }

  // Show the 4 most recently created requests
  const recent = tasks
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
    .slice(0, 4);

  if (recent.length === 0) {
    $activityList.html(`
      <p class="text-muted small">
        No requests yet. <a href="tasks.html">Be the first to add one!</a>
      </p>
    `);
    return;
  }

  const statusLabel = { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed' };
  const statusColour = { pending: 'secondary', 'in-progress': 'warning', completed: 'success' };

  const html = recent.map(function (t) {
    const label  = statusLabel[t.status] || 'Pending';
    const colour = statusColour[t.status] || 'secondary';
    return `
      <div class="activity-item">
        <div class="activity-dot" aria-hidden="true"></div>
        <div class="flex-grow-1">
          <span class="fw-semibold small">${t.title}</span>
          <span class="badge bg-${colour} ms-2" style="font-size:.65rem;">${label}</span>
          <p class="text-muted mb-0" style="font-size:.75rem;font-family:var(--font-mono);">
            ${t.category} &middot; ${t.createdAt ? t.createdAt.slice(0, 10) : ''}
          </p>
        </div>
      </div>
    `;
  }).join('');

  $activityList.html(html);

});

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
