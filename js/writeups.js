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

    const requestedTag = new URLSearchParams(window.location.search).get('tag');
    let activeTag = requestedTag && WRITEUPS.some(function (w) { return (w.tags || []).includes(requestedTag); }) ? requestedTag : null;
    let searchQuery = '';
    const diffClass = { Easy: 'bg-success', Medium: 'bg-warning text-dark', Hard: 'bg-danger' };
    let tagColors = new Map();

    // Keep tag colors identical to the knowledge graph. The complete current
    // tag set is sorted by the same deterministic hash and spread around the
    // hue wheel with the golden angle.
    function tagHash(value) {
      let hash = 2166136261;
      const text = String(value || '').toLowerCase();
      for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }
    function buildTagColors(tags) {
      const GOLDEN_ANGLE = 137.507764;
      const ordered = tags.slice().sort(function (a, b) {
        return tagHash(a) - tagHash(b) || a.localeCompare(b);
      });
      tagColors = new Map();
      ordered.forEach(function (tag, index) {
        const hue = (23 + index * GOLDEN_ANGLE) % 360;
        const saturation = 68 + (tagHash(tag) % 13);
        tagColors.set(tag, `hsl(${hue.toFixed(1)} ${saturation}% 52%)`);
      });
    }
    function tagStyle(tag) {
      return `--tag-color:${tagColors.get(tag) || 'var(--accent)'}`;
    }

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
        return `<span class="tag colored-tag" style="${tagStyle(tag)}" data-tag="${safe}" role="button" tabindex="0" aria-label="Filter by tag: ${safe}">${safe}</span>`;
      }).join('');
    }
    function renderFeatured() {
      const w = WRITEUPS.find(function (x) { return x.featured; });
      if (!w) { $('#featured-section').addClass('d-none'); return; }
      $('#featured-writeup').html(`<div class="featured-card"><div class="row align-items-center"><div class="col-lg-8"><span class="featured-badge mb-1">Featured</span> <span class="badge ${diffClass[w.difficulty] || 'bg-secondary'} mb-2">${escapeHtml(w.difficulty)}</span> <span class="badge bg-secondary ms-1 mb-2">${escapeHtml(w.category)}</span><h3 class="h4 fw-bold mt-1">${escapeHtml(w.title)}</h3><p class="text-muted mb-3">${escapeHtml(w.excerpt)}</p><div class="mb-3">${tagsHtml(w.tags)}</div></div><div class="col-lg-4 text-lg-end"><p class="text-muted small mb-3"><i class="bi bi-calendar3 me-1"></i>${fmtDate(w.date)}</p><a href="${w.slug}" class="btn btn-outline-success">Read Writeup <i class="bi bi-arrow-right ms-1"></i></a></div></div></div>`);
    }
    function buildCard(w) {
      return `<div class="col-12 col-md-6 col-lg-4"><article class="writeup-card card h-100"><div class="card-body d-flex flex-column"><h3 class="card-title h6 fw-bold">${escapeHtml(w.title)}</h3><p class="card-text text-muted small flex-grow-1">${escapeHtml(w.excerpt)}</p><div class="mt-2 mb-3">${tagsHtml(w.tags)}</div><div class="d-flex justify-content-between align-items-center mt-auto"><small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${fmtDate(w.date)}</small><a href="${w.slug}" class="btn btn-sm btn-outline-success">Read →</a></div></div></article></div>`;
    }
    function renderGrid() {
      const results = WRITEUPS.filter(function (w) {
        const tags = w.tags || [];
        return (!activeTag || tags.includes(activeTag)) && (!searchQuery || (w.title || '').toLowerCase().includes(searchQuery) || (w.excerpt || '').toLowerCase().includes(searchQuery) || tags.some(function (t) { return t.toLowerCase().includes(searchQuery); }));
      });
      $('#writeup-grid').html(results.map(buildCard).join(''));
      $('#writeup-empty').toggleClass('d-none', results.length !== 0);
      $('#writeup-count').text(results.length === 1 ? '1 writeup' : results.length + ' writeups');
    }
    function getTagCounts() {
      const counts = {};
      WRITEUPS.forEach(function (w) {
        (w.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
      });
      return Object.entries(counts).sort(function (a, b) {
        return b[1] - a[1] || a[0].localeCompare(b[0]);
      });
    }
    function buildTagFilters() {
      const tags = getTagCounts();
      buildTagColors(tags.map(function (e) { return e[0]; }));
      $('#search-tag-filters').html(
        '<button class="filter-btn active" data-tag="" aria-pressed="true">All</button>' +
        tags.map(function (e) {
          const t = escapeHtml(e[0]);
          return `<button class="filter-btn colored-tag" style="${tagStyle(e[0])}" data-tag="${t}" aria-pressed="false">${t} <span class="tag-count">${e[1]}</span></button>`;
        }).join('')
      );
      $('#tag-cloud').html(tags.map(function (e) {
        const t = escapeHtml(e[0]);
        return `<button class="tag-cloud-item colored-tag" style="${tagStyle(e[0])}" data-tag="${t}" aria-pressed="false">${t} <span class="tag-count">${e[1]}</span></button>`;
      }).join(''));
    }
    function syncTagControls() {
      $('.filter-btn, .tag-cloud-item').removeClass('active').attr('aria-pressed', 'false');
      if (!activeTag) {
        $('.filter-btn[data-tag=""]').addClass('active').attr('aria-pressed', 'true');
        return;
      }
      const selector = `[data-tag="${CSS.escape(String(activeTag))}"]`;
      $('.filter-btn' + selector + ', .tag-cloud-item' + selector).addClass('active').attr('aria-pressed', 'true');
    }

    if (!WRITEUPS.length) {
      $('#featured-section').addClass('d-none');
      $('#writeup-grid').html('');
      $('#writeup-empty').removeClass('d-none').find('p').html('No published writeups yet. Add <code>.md</code> files to <code>posts/</code>; the GitHub Pages workflow will index them automatically.');
      $('#writeup-count').text('0 writeups');
    } else {
      buildTagColors(getTagCounts().map(function (e) { return e[0]; }));
      renderFeatured(); buildTagFilters(); syncTagControls(); renderGrid();
    }

    $(document).on('click', '.filter-btn', function () { activeTag=$(this).data('tag') || null; syncTagControls(); renderGrid(); });
    $(document).on('click', '.tag-cloud-item', function () { const tag=$(this).data('tag'); activeTag=activeTag===tag?null:tag; syncTagControls(); renderGrid(); });
    function activateTag(el) { activeTag=$(el).data('tag') || null; syncTagControls(); renderGrid(); }
    $(document).on('click', '.writeup-card .tag, .featured-card .tag', function(){ activateTag(this); });
    $(document).on('keydown', '.writeup-card .tag, .featured-card .tag', function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();activateTag(this);} });
    $('#writeup-search').on('input', function(){ searchQuery=$(this).val().trim().toLowerCase(); renderGrid(); });
    $('#search-clear').on('click', function(){ searchQuery=''; $('#writeup-search').val('').trigger('focus'); renderGrid(); });
  });
})();
