$(document).ready(function () {

  // Sample data — replace with your own writeups.
  // Each object needs: title, slug, category, tags, date, difficulty, excerpt, featured
  const WRITEUPS = [
    {
      title:    'HackTheBox — Machine: Sample Box One',
      slug:     '#',
      category: 'HTB',
      tags:     ['linux', 'web', 'privesc'],
      date:     '2025-08-02',
      difficulty: 'Easy',
      excerpt:  'Placeholder excerpt describing the initial foothold and how a misconfigured service led to a low-privilege shell on the box.',
      featured: false
    },
    {
      title:    'CTF — Web Challenge: Broken Auth',
      slug:     '#',
      category: 'CTF',
      tags:     ['web', 'auth', 'jwt'],
      date:     '2025-10-30',
      difficulty: 'Medium',
      excerpt:  'Placeholder excerpt covering a JWT signature confusion bug that allowed forging arbitrary session tokens.',
      featured: false
    },
    {
      title:    'Malware Sample Analysis — Generic RAT',
      slug:     '#',
      category: 'Malware',
      tags:     ['windows', 'rat', 'network'],
      date:     '2025-12-05',
      difficulty: 'Hard',
      excerpt:  'Placeholder excerpt walking through static and dynamic analysis of a remote access trojan sample.',
      featured: false
    },
    {
      title:    'HackTheBox — Machine: Sample Box Two',
      slug:     '#',
      category: 'HTB',
      tags:     ['windows', 'ad', 'kerberos', 'privesc'],
      date:     '2026-01-20',
      difficulty: 'Medium',
      excerpt:  'Placeholder excerpt describing an Active Directory box: an unauthenticated file write leads to code execution, followed by a credential find that unlocks Kerberos authentication, and a privilege escalation path involving Group Policy abuse.',
      featured: false
    },
    {
      title:    'CTF — Forensics: Memory Dump',
      slug:     '#',
      category: 'CTF',
      tags:     ['forensics', 'volatility', 'windows'],
      date:     '2026-02-01',
      difficulty: 'Medium',
      excerpt:  'Placeholder excerpt on extracting indicators of compromise from a memory image using Volatility.',
      featured: false
    },
    {
      title:    'Malware Analysis — Generic C2 Beacon',
      slug:     '#',
      category: 'Malware',
      tags:     ['c2', 'network', 'reversing'],
      date:     '2026-04-15',
      difficulty: 'Hard',
      excerpt:  'Placeholder excerpt reverse engineering a command-and-control beacon and mapping its traffic patterns.',
      featured: false
    },
    {
      title:    'HackTheBox — Sherlock: Sample Investigation',
      slug:     '#',
      category: 'HTB',
      tags:     ['forensics', 'sherlock', 'MFT', 'prefetch'],
      date:     '2026-05-23',
      difficulty: 'Medium',
      excerpt:  'Placeholder excerpt reconstructing an attack chain from Windows artifacts (UserAssist, Prefetch, PowerShell logs, MFT) after a user executes a malicious shortcut.',
      featured: true
    },
    {
      title:    'CTF — Crypto: Easy RSA',
      slug:     '#',
      category: 'CTF',
      tags:     ['crypto', 'rsa', 'python'],
      date:     '2026-06-01',
      difficulty: 'Hard',
      excerpt:  'Placeholder excerpt exploiting weak RSA parameters to recover the private key.',
      featured: false
    }
  ];

  // Expose the data so other pages (e.g. the knowledge graph) can reuse it
  // without duplicating the array. Swap this for a fetch() to a JSON file
  // once you have real content.
  window.SITE_WRITEUPS = WRITEUPS;

  /* ── State ───────────────────────────────────────────────────── */
  let activeCategory = 'all';
  let activeTag      = null;
  let searchQuery    = '';

  /* ── Difficulty badge colours ─────────────────────────────────── */
  const diffClass = {
    Easy:   'bg-success',
    Medium: 'bg-warning text-dark',
    Hard:   'bg-danger'
  };

  /* ── Date formatter ──────────────────────────────────────────── */
  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

/* featured writeup card */

  function renderFeatured() {
    const featured = WRITEUPS.find(function (w) { return w.featured; });
    if (!featured) {
      $('#featured-writeup').addClass('d-none');
      return;
    }

    const tagsHTML = featured.tags.map(function (tag) {
      return `<span class="tag" data-tag="${tag}" role="button"
                    tabindex="0" aria-label="Filter by tag: ${tag}">${tag}</span>`;
    }).join('');

    $('#featured-writeup').html(`
      <div class="featured-card" aria-label="Featured writeup">
        <div class="row align-items-center">
          <div class="col-lg-8">
            <span class="featured-badge mb-1">Featured</span>
            <span class="badge ${diffClass[featured.difficulty] || 'bg-secondary'} mb-2">
              ${featured.difficulty}
            </span>
            <span class="badge bg-secondary ms-1 mb-2">${featured.category}</span>
            <h3 class="h4 fw-bold mt-1">${featured.title}</h3>
            <p class="text-muted mb-3">${featured.excerpt}</p>
            <div class="mb-3">${tagsHTML}</div>
          </div>
          <div class="col-lg-4 text-lg-end">
            <p class="text-muted small mb-3">
              <i class="bi bi-calendar3 me-1" aria-hidden="true"></i>
              ${fmtDate(featured.date)}
            </p>
            <a href="${featured.slug}" class="btn btn-outline-success">
              Read Writeup
              <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
    `);
  }

  /* WRITEUP GRID */

  function buildCard(w) {
    const tagsHTML = w.tags.map(function (tag) {
      return `<span class="tag" data-tag="${tag}" role="button"
                    tabindex="0" aria-label="Filter by tag: ${tag}">${tag}</span>`;
    }).join('');

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <article class="writeup-card card h-100"
                 aria-label="Writeup: ${w.title}">
          <div class="card-body d-flex flex-column">
            <div class="mb-2">
              <span class="badge ${diffClass[w.difficulty] || 'bg-secondary'}">
                ${w.difficulty}
              </span>
              <span class="badge bg-secondary ms-1">${w.category}</span>
            </div>
            <h3 class="card-title h6 fw-bold">${w.title}</h3>
            <p class="card-text text-muted small flex-grow-1">${w.excerpt}</p>
            <div class="mt-2 mb-3">${tagsHTML}</div>
            <div class="d-flex justify-content-between align-items-center mt-auto">
              <small class="text-muted">
                <i class="bi bi-calendar3 me-1" aria-hidden="true"></i>
                ${fmtDate(w.date)}
              </small>
              <a href="${w.slug}"
                 class="btn btn-sm btn-outline-success"
                 aria-label="Read writeup: ${w.title}">
                Read →
              </a>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function renderGrid() {
    // Apply all active filters together
    const results = WRITEUPS.filter(function (w) {
      const matchCat    = activeCategory === 'all' || w.category === activeCategory;
      const matchTag    = !activeTag || w.tags.includes(activeTag);
      const matchSearch = !searchQuery ||
        w.title.toLowerCase().includes(searchQuery) ||
        w.excerpt.toLowerCase().includes(searchQuery) ||
        w.tags.some(function (t) { return t.includes(searchQuery); });
      return matchCat && matchTag && matchSearch;
    });

    if (results.length === 0) {
      $('#writeup-grid').html('');
      $('#writeup-empty').removeClass('d-none');
    } else {
      $('#writeup-empty').addClass('d-none');
      $('#writeup-grid').html(results.map(buildCard).join(''));
    }

    // Update live region count for screen readers
    $('#writeup-count').text(
      results.length === 1 ? '1 writeup' : results.length + ' writeups'
    );
  }

  /* TAG CLOUD */

  function buildTagCloud() {
    // Collect all unique tags with a count
    const tagMap = {};
    WRITEUPS.forEach(function (w) {
      w.tags.forEach(function (tag) {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });

    // Sort by frequency
    const tags = Object.entries(tagMap).sort(function (a, b) {
      return b[1] - a[1];
    });

    const html = tags.map(function (entry) {
      const tag   = entry[0];
      const count = entry[1];
      return `
        <button class="tag-cloud-item"
                data-tag="${tag}"
                aria-pressed="false"
                aria-label="Filter by tag: ${tag} (${count} writeup${count > 1 ? 's' : ''})">
          ${tag} <span class="tag-count">${count}</span>
        </button>
      `;
    }).join('');

    $('#tag-cloud').html(html);
  }

  /* EVENT HANDLERS*/

  // Category filter chips
  $(document).on('click', '.filter-btn', function () {
    activeCategory = $(this).data('filter');
    activeTag      = null;   // clear tag filter when switching category

    $('.filter-btn').removeClass('active').attr('aria-pressed', 'false');
    $(this).addClass('active').attr('aria-pressed', 'true');

    // Reset tag cloud selections
    $('.tag-cloud-item').removeClass('active').attr('aria-pressed', 'false');

    renderGrid();
  });

  // Tag cloud clicks
  $(document).on('click', '.tag-cloud-item', function () {
    const tag = $(this).data('tag');

    if (activeTag === tag) {
      // Deselect: clear tag filter
      activeTag = null;
      $(this).removeClass('active').attr('aria-pressed', 'false');
    } else {
      activeTag = tag;
      $('.tag-cloud-item').removeClass('active').attr('aria-pressed', 'false');
      $(this).addClass('active').attr('aria-pressed', 'true');
    }

    renderGrid();
  });

  // Inline tag clicks inside cards (delegate from document)
  function activateCardTag(el) {
    const tag = $(el).data('tag');
    if (!tag) return;
    activeTag = tag;
    $('.tag-cloud-item').removeClass('active').attr('aria-pressed', 'false');
    $(`.tag-cloud-item[data-tag="${tag}"]`).addClass('active').attr('aria-pressed', 'true');
    renderGrid();
  }

  $(document).on('click', '.writeup-card .tag, .featured-card .tag', function () {
    activateCardTag(this);
  });

  $(document).on('keydown', '.writeup-card .tag, .featured-card .tag', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activateCardTag(this);
    }
  });

  // Live search
  $('#writeup-search').on('input', function () {
    searchQuery = $(this).val().trim().toLowerCase();
    renderGrid();
  });

  // Clear search button
  $('#search-clear').on('click', function () {
    searchQuery = '';
    $('#writeup-search').val('').trigger('focus');
    renderGrid();
  });

  /* ── Initial render ──────────────────────────────────────────── */
  renderFeatured();
  buildTagCloud();
  renderGrid();

});
