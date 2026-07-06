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
