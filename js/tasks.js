$(document).ready(function () {

  // ── Load and save tasks from/to browser storage ──────────────────
  // localStorage is like a small database built into the browser.
  // It keeps your data even after you refresh or close the page.

  function loadTasks() {
    try {
      return JSON.parse(localStorage.getItem('tasks') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // ── App state ────────────────────────────────────────────────────

  let tasks        = loadTasks(); // all tasks loaded from storage
  let activeFilter = 'all'; // which status filter button is currently active
  let activePriorityFilter = 'all'; // which priority filter button is currently active
  let sortKey      = 'createdAt'; // which column the table is sorted by
  let sortDir      = 'desc';      // sort direction: 'asc' (A→Z) or 'desc' (Z→A)
  let editingId    = null;        // id of the task currently open in the edit modal
  let chart        = null;        // the Chart.js doughnut chart instance

  // ── Lookup tables ────────────────────────────────────────────────

  let priorityClass = {
    High:          'priority-high',
    Medium:        'priority-medium',
    Low:           'priority-low'
  };

  let statusLabel = {
    pending:       'Pending',
    'in-progress': 'In Progress',
    completed:     'Completed'
  };

  let statusClass = {
    pending:       'status-pending',
    'in-progress': 'status-in-progress',
    completed:     'status-completed'
  };

  // ── Main render function ─────────────────────────────────────────
  // Call render() any time the task list changes (add, edit, delete).
  // It updates the stats, chart, and table all at once.

  function render() {
    updateStats();
    updateChart();
    renderTable();
  }

  // ── Update the 4 stat number cards ───────────────────────────────
  // Counts how many tasks are in each status and puts the numbers on screen.

  function updateStats() {
    let total   = tasks.length;
    let done    = tasks.filter(function (t) { return t.status === 'completed';   }).length;
    let pending = tasks.filter(function (t) { return t.status === 'pending';     }).length;
    let inProg  = tasks.filter(function (t) { return t.status === 'in-progress'; }).length;

    $('#stat-total').text(total);
    $('#stat-pending').text(pending);
    $('#stat-in-progress').text(inProg);
    $('#stat-completed').text(done);
  }

  // ── Update (or create) the doughnut chart ────────────────────────
  // If the chart already exists, we just update its numbers.
  // If it doesn't exist yet, we create it for the first time.

  function updateChart() {
    let done    = tasks.filter(function (t) { return t.status === 'completed';   }).length;
    let pending = tasks.filter(function (t) { return t.status === 'pending';     }).length;
    let inProg  = tasks.filter(function (t) { return t.status === 'in-progress'; }).length;

    let canvas = $('#analytics-chart')[0];
    if (!canvas || typeof Chart === 'undefined') return;

    let chartData = {
      labels: ['Pending', 'In Progress', 'Completed'],
      datasets: [{
        data:            [pending, inProg, done],
        backgroundColor: ['#6b7280', '#fbbf24', '#22c55e'],
        borderWidth:     0,
        hoverOffset:     6
      }]
    };

    if (chart) {
      // Chart already exists — just update the data
      chart.data = chartData;
      chart.update();
    } else {
      // First time — create the chart from scratch
      chart = new Chart(canvas, {
        type: 'doughnut',
        data: chartData,
        options: {
          responsive:          true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, padding: 16, font: { size: 12 } }
            },
            tooltip: {
              callbacks: {
                // Show "Label: count (xx%)" in the tooltip
                label: function (ctx) {
                  let total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                  let pct   = total > 0 ? Math.round(ctx.parsed / total * 100) : 0;
                  return ' ' + ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
                }
              }
            }
          }
        }
      });
    }
  }

  // ── Render the table ─────────────────────────────────────────────
  // Steps: 1) filter tasks, 2) sort them, 3) build HTML rows, 4) inject into page.

  function renderTable() {

    // Step 1 — Filter: keep only tasks that match both active filter buttons
    let filtered = tasks.filter(function (t) {
      let statusMatch   = activeFilter === 'all'         || t.status   === activeFilter;
      let priorityMatch = activePriorityFilter === 'all' || t.priority === activePriorityFilter;
      return statusMatch && priorityMatch;
    });

    // Step 2 — Sort: make a copy (.slice()) so we don't change the original array
    let sorted = filtered.slice().sort(function (a, b) {
      let va = a[sortKey] || '';
      let vb = b[sortKey] || '';

      if (sortKey === 'dueDate' || sortKey === 'createdAt') {
        // Date columns: convert to Date objects so they compare correctly
        va = new Date(va || 0);
        vb = new Date(vb || 0);
      } else {
        // Text columns: lowercase both so 'Apple' and 'apple' sort the same
        va = va.toLowerCase();
        vb = vb.toLowerCase();
      }

      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    // Step 3 — Empty state: show a message if nothing matches the filter
    if (sorted.length === 0) {
      $('#task-tbody').html('');
      $('#empty-state').removeClass('d-none');
      return;
    }

    $('#empty-state').addClass('d-none');

    // Step 4 — Build one HTML row per task, then join them all into one string
    let rows = sorted.map(function (t) {
      let isDone        = t.status === 'completed';
      let rowClass      = isDone ? 'completed-row' : '';
      let completeLabel = isDone ? 'Undo'            : 'Complete';
      let completeTip   = isDone ? 'Mark as pending' : 'Mark as completed';

      return `
        <tr class="${rowClass}" data-id="${t.id}">
          <td>
            <span class="task-title">${t.title}</span>
            ${t.description
              ? `<br><span class="text-muted small">${t.description.slice(0, 80)}${t.description.length > 80 ? '…' : ''}</span>`
              : ''}
          </td>
          <td><span class="badge bg-secondary">${t.category}</span></td>
          <td><span class="${priorityClass[t.priority] || ''}">${t.priority}</span></td>
          <td>${t.dueDate || '—'}</td>
          <td><span class="${statusClass[t.status] || ''}">${statusLabel[t.status] || t.status}</span></td>
          <td class="text-nowrap">
            <button class="btn-complete btn btn-sm btn-outline-success me-1" data-id="${t.id}" title="${completeTip}">
              ${completeLabel}
            </button>
            <button class="btn-edit btn btn-sm btn-outline-secondary me-1" data-id="${t.id}" title="Edit">
              Edit
            </button>
            <button class="btn-delete btn btn-sm btn-outline-danger" data-id="${t.id}" title="Delete">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');

    $('#task-tbody').html(rows);
  }

  // ── Add a new task (form submit) ─────────────────────────────────
  // Runs when the user submits the "New Request" form.

  $('#add-task-form').on('submit', function (e) {
    e.preventDefault(); // stop the page from reloading on submit

    let title    = $('#task-title').val().trim();
    let desc     = $('#task-desc').val().trim();
    let category = $('#task-category').val();
    let priority = $('#task-priority').val();
    let dueDate  = $('#task-due').val();

    // Make sure required fields are filled in
    if (!title || !category || !priority) {
      showAlert('Please fill in the required fields.', 'danger');
      return;
    }

    // Build the new task object
    let newTask = {
      id:          Date.now(),          // unique id: current time in milliseconds
      title:       title,
      description: desc,
      category:    category,
      priority:    priority,
      dueDate:     dueDate,
      status:      'pending',           // all new tasks start as pending
      createdAt:   new Date().toISOString()
    };

    tasks.unshift(newTask); // add to the start of the list (shows up first)
    saveTasks(tasks);
    render();

    this.reset(); // clear the form fields
    showAlert('Request added successfully!', 'success');
  });

  // Show a small dismissable alert below the form
  function showAlert(msg, type) {
    let $el = $('#add-form-alert');
    $el.html(
      '<div class="alert alert-' + type + ' alert-dismissible fade show mt-2 py-2" role="alert">' +
        msg +
        '<button type="button" class="btn-close btn-close-sm" data-bs-dismiss="alert" aria-label="Dismiss"></button>' +
      '</div>'
    );
    // Auto-dismiss after 3 seconds
    setTimeout(function () { $el.find('.alert').alert('close'); }, 3000);
  }

  // ── Delete a task ────────────────────────────────────────────────
  // Opens a Bootstrap modal for confirmation instead of window.confirm().

  let deletingId = null;

  $(document).on('click', '.btn-delete', function () {
    let id   = parseInt($(this).data('id'), 10);
    let task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    deletingId = id;
    $('#delete-task-title').text(task.title);
    bootstrap.Modal.getOrCreateInstance($('#deleteModal')[0]).show();
  });

  $('#confirm-delete-btn').on('click', function () {
    if (deletingId === null) return;

    // Keep every task EXCEPT the one being deleted
    tasks = tasks.filter(function (t) { return t.id !== deletingId; });
    saveTasks(tasks);
    render();

    bootstrap.Modal.getInstance($('#deleteModal')[0]).hide();
    deletingId = null;
  });

  // ── Toggle a task between completed and pending ───────────────────
  // The same button acts as "Complete" or "Undo" depending on current status.

  $(document).on('click', '.btn-complete', function () {
    let id   = parseInt($(this).data('id'), 10);
    let task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    // Flip the status
    task.status = task.status === 'completed' ? 'pending' : 'completed';
    saveTasks(tasks);
    render();
  });

  // ── Edit a task — open the modal pre-filled with current values ───

  $(document).on('click', '.btn-edit', function () {
    let id   = parseInt($(this).data('id'), 10);
    let task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    editingId = id; // remember which task we're editing

    // Fill the modal input fields with the task's current values
    $('#edit-title').val(task.title);
    $('#edit-desc').val(task.description);
    $('#edit-category').val(task.category);
    $('#edit-priority').val(task.priority);
    $('#edit-due').val(task.dueDate);
    $('#edit-status').val(task.status);

    // Open the Bootstrap modal
    bootstrap.Modal.getOrCreateInstance($('#editModal')[0]).show();
  });

  // Save changes when the user clicks "Save Changes" inside the modal
  $('#save-edit-btn').on('click', function () {
    if (editingId === null) return;

    let task = tasks.find(function (t) { return t.id === editingId; });
    if (!task) return;

    let newTitle = $('#edit-title').val().trim();
    if (!newTitle) {
      alert('Title is required.');
      return;
    }

    // Overwrite the task's fields with the new values from the modal
    task.title       = newTitle;
    task.description = $('#edit-desc').val().trim();
    task.category    = $('#edit-category').val();
    task.priority    = $('#edit-priority').val();
    task.dueDate     = $('#edit-due').val();
    task.status      = $('#edit-status').val();

    saveTasks(tasks);
    render();

    // Close the modal and clear editingId
    bootstrap.Modal.getInstance($('#editModal')[0]).hide();
    editingId = null;
  });

  // ── Status filter buttons (All / Pending / In Progress / Completed) ─

  $(document).on('click', '.filter-btn', function () {
    activeFilter = $(this).data('filter');
    $('.filter-btn').removeClass('active').attr('aria-pressed', 'false');
    $(this).addClass('active').attr('aria-pressed', 'true');
    renderTable();
  });

  // ── Priority filter buttons (All Priorities / High / Medium / Low) ──

  $(document).on('click', '.priority-btn', function () {
    activePriorityFilter = $(this).data('priority');
    $('.priority-btn').removeClass('active').attr('aria-pressed', 'false');
    $(this).addClass('active').attr('aria-pressed', 'true');
    renderTable();
  });

  // ── Sort by clicking a table column header ────────────────────────
  // Clicking the same column again flips between ascending and descending.

  $(document).on('click', '[data-sort]', function () {
    let key = $(this).data('sort');

    if (sortKey === key) {
      // Same column: flip direction
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      // New column: start ascending
      sortKey = key;
      sortDir = 'asc';
    }

    // Update the arrow icons in the header row
    $('[data-sort] .sort-icon').text('⇅');
    $(this).find('.sort-icon').text(sortDir === 'asc' ? '↑' : '↓');

    renderTable();
  });

  // ── Run on page load ─────────────────────────────────────────────
  // Draw everything the first time the page opens.
  render();

});
