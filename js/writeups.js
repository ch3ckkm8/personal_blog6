(function () {
  function postUrl(file) {
    return 'reader.html?post=' + encodeURIComponent(file);
  }

  async function loadWriteups() {
    const response = await fetch('posts/index.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Could not load posts/index.json');
    const items = await response.json();
    return items.map(function (w) {
      return Object.assign({}, w, { slug: postUrl(w.file) });
    });
  }

  window.SITE_WRITEUPS_READY = loadWriteups().then(function (items) {
    window.SITE_WRITEUPS = items;
    return items;
  }).catch(function (error) {
    console.error(error);
    window.SITE_WRITEUPS = [];
    return [];
  });

  $(document).ready(async function () {
    const WRITEUPS = await window.SITE_WRITEUPS_READY;
    if (!document.getElementById('writeup-grid')) return;

    let activeCategory = 'all';
    let activeTag = null;
    let searchQuery = '';
    const diffClass = { Easy: 'bg-success', Medium: 'bg-warning text-dark', Hard: 'bg-danger' };

    function escapeHtml(value) {
      return $('<div>').text(String(value == null ? '' : value)).html();
    }
    function fmtDate(iso) {
      const d = new Date(iso + (/^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? 'T00:00:00' : ''));
      return isNaN(d) ? escapeHtml(iso || '') : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    function tagsHtml(tags) {
      return (tags || []).map(function (tag) {
        const safe = escapeHtml(tag);
        return `<span class="tag" data-tag="${safe}" role="button" tabindex="0" aria-label="Filter by tag: ${safe}">${safe}</span>`;
      }).join('');
    }
    function renderFeatured() {
      const w = WRITEUPS.find(function (x) { return x.featured; });
      if (!w) { $('#featured-section').addClass('d-none'); return; }
      $('#featured-writeup').html(`<div class="featured-card"><div class="row align-items-center"><div class="col-lg-8"><span class="featured-badge mb-1">Featured</span> <span class="badge ${diffClass[w.difficulty] || 'bg-secondary'} mb-2">${escapeHtml(w.difficulty)}</span> <span class="badge bg-secondary ms-1 mb-2">${escapeHtml(w.category)}</span><h3 class="h4 fw-bold mt-1">${escapeHtml(w.title)}</h3><p class="text-muted mb-3">${escapeHtml(w.excerpt)}</p><div class="mb-3">${tagsHtml(w.tags)}</div></div><div class="col-lg-4 text-lg-end"><p class="text-muted small mb-3"><i class="bi bi-calendar3 me-1"></i>${fmtDate(w.date)}</p><a href="${w.slug}" class="btn btn-outline-success">Read Writeup <i class="bi bi-arrow-right ms-1"></i></a></div></div></div>`);
    }
    function buildCard(w) {
      return `<div class="col-12 col-md-6 col-lg-4"><article class="writeup-card card h-100"><div class="card-body d-flex flex-column"><div class="mb-2"><span class="badge ${diffClass[w.difficulty] || 'bg-secondary'}">${escapeHtml(w.difficulty)}</span><span class="badge bg-secondary ms-1">${escapeHtml(w.category)}</span></div><h3 class="card-title h6 fw-bold">${escapeHtml(w.title)}</h3><p class="card-text text-muted small flex-grow-1">${escapeHtml(w.excerpt)}</p><div class="mt-2 mb-3">${tagsHtml(w.tags)}</div><div class="d-flex justify-content-between align-items-center mt-auto"><small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${fmtDate(w.date)}</small><a href="${w.slug}" class="btn btn-sm btn-outline-success">Read →</a></div></div></article></div>`;
    }
    function renderGrid() {
      const results = WRITEUPS.filter(function (w) {
        const tags = w.tags || [];
        return (activeCategory === 'all' || w.category === activeCategory) && (!activeTag || tags.includes(activeTag)) && (!searchQuery || (w.title || '').toLowerCase().includes(searchQuery) || (w.excerpt || '').toLowerCase().includes(searchQuery) || tags.some(function (t) { return t.toLowerCase().includes(searchQuery); }));
      });
      $('#writeup-grid').html(results.map(buildCard).join(''));
      $('#writeup-empty').toggleClass('d-none', results.length !== 0);
      $('#writeup-count').text(results.length === 1 ? '1 writeup' : results.length + ' writeups');
    }
    function buildTagCloud() {
      const counts = {};
      WRITEUPS.forEach(function (w) { (w.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
      $('#tag-cloud').html(Object.entries(counts).sort(function (a,b) { return b[1]-a[1]; }).map(function (e) { const t=escapeHtml(e[0]); return `<button class="tag-cloud-item" data-tag="${t}" aria-pressed="false">${t} <span class="tag-count">${e[1]}</span></button>`; }).join(''));
    }

    if (!WRITEUPS.length) {
      $('#featured-section').addClass('d-none');
      $('#writeup-grid').html('');
      $('#writeup-empty').removeClass('d-none').find('p').html('No published writeups yet. Add <code>.md</code> files to <code>posts/</code>; the GitHub Pages workflow will index them automatically.');
      $('#writeup-count').text('0 writeups');
    } else { renderFeatured(); buildTagCloud(); renderGrid(); }

    $(document).on('click', '.filter-btn', function () { activeCategory=$(this).data('filter'); activeTag=null; $('.filter-btn').removeClass('active').attr('aria-pressed','false'); $(this).addClass('active').attr('aria-pressed','true'); $('.tag-cloud-item').removeClass('active').attr('aria-pressed','false'); renderGrid(); });
    $(document).on('click', '.tag-cloud-item', function () { const tag=$(this).data('tag'); activeTag=activeTag===tag?null:tag; $('.tag-cloud-item').removeClass('active').attr('aria-pressed','false'); if(activeTag) $(this).addClass('active').attr('aria-pressed','true'); renderGrid(); });
    function activateTag(el) { activeTag=$(el).data('tag') || null; $('.tag-cloud-item').removeClass('active').attr('aria-pressed','false'); if(activeTag) $(`.tag-cloud-item[data-tag="${CSS.escape(String(activeTag))}"]`).addClass('active').attr('aria-pressed','true'); renderGrid(); }
    $(document).on('click', '.writeup-card .tag, .featured-card .tag', function(){ activateTag(this); });
    $(document).on('keydown', '.writeup-card .tag, .featured-card .tag', function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();activateTag(this);} });
    $('#writeup-search').on('input', function(){ searchQuery=$(this).val().trim().toLowerCase(); renderGrid(); });
    $('#search-clear').on('click', function(){ searchQuery=''; $('#writeup-search').val('').trigger('focus'); renderGrid(); });
  });
})();
