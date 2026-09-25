/**
 * Interactive knowledge graph.
 *
 * Pure front-end: reads the same static WRITEUPS array used by the
 * writeups page (exposed as window.SITE_WRITEUPS) and turns it into a
 * force-directed graph with D3. No server, no API, no build step —
 * this is why it works as-is on GitHub Pages.
 *
 * Nodes:  one per writeup + one per unique tag
 * Links:  writeup <-> each of its tags
 */
$(document).ready(async function () {

  const stage = document.getElementById('knowledge-graph');
  if (!stage) return; // not on the graph page

  const WRITEUPS = window.SITE_WRITEUPS_READY ? await window.SITE_WRITEUPS_READY : (window.SITE_WRITEUPS || []);

  const WRITEUP_COLOR = '#00d084';

  // Give every tag a deterministic, well-spread color. We use the golden
  // angle instead of Math.random() so colors remain stable across refreshes
  // while still being distributed around the full hue wheel.
  function tagHash(value) {
    let hash = 2166136261;
    const text = String(value || '').toLowerCase();
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function assignTagColors(tagNodes) {
    const GOLDEN_ANGLE = 137.507764;
    const ordered = tagNodes.slice().sort(function (a, b) {
      return tagHash(a.label) - tagHash(b.label) || a.label.localeCompare(b.label);
    });

    ordered.forEach(function (tag, index) {
      const hue = (23 + index * GOLDEN_ANGLE) % 360;
      const saturation = 68 + (tagHash(tag.label) % 13);
      tag.color = `hsl(${hue.toFixed(1)} ${saturation}% 52%)`;
    });
  }

  // Graph labels come from the Markdown filename rather than the post title.
  // Example: posts/ch3ckm8_HTB_Active.md -> HTB_active
  function graphLabelFromFile(file, fallback) {
    const filename = String(file || '').split('/').pop().replace(/\.md$/i, '');
    const withoutAuthorPrefix = filename.replace(/^ch3ckm8_/i, '');
    if (!withoutAuthorPrefix) return fallback || filename || 'writeup';

    const parts = withoutAuthorPrefix.split('_');
    if (parts.length === 1) return parts[0];
    return parts[0].toUpperCase() + '_' + parts.slice(1).join('_').toLowerCase();
  }

  /* ── Build nodes + links from the writeup data ─────────────────── */
  const nodes = [];
  const links = [];
  const tagIndex = new Map(); // tag name -> node object

  WRITEUPS.forEach(function (w, i) {
    const writeupNode = {
      id: 'w' + i,
      type: 'writeup',
      label: graphLabelFromFile(w.file, w.title),
      title: w.title,
      file: w.file,
      excerpt: w.excerpt,
      date: w.date,
      slug: w.slug,
      tags: w.tags,
      radius: 12
    };
    nodes.push(writeupNode);

    w.tags.forEach(function (tag) {
      if (!tagIndex.has(tag)) {
        const tagNode = { id: 'tag:' + tag, type: 'tag', label: tag, count: 0, radius: 6 };
        tagIndex.set(tag, tagNode);
        nodes.push(tagNode);
      }
      const tagNode = tagIndex.get(tag);
      tagNode.count += 1;
      links.push({ source: writeupNode.id, target: tagNode.id });
    });
  });

  // Size tag nodes by how many writeups reference them, then assign each
  // unique tag a balanced color from across the hue spectrum.
  tagIndex.forEach(function (t) { t.radius = 6 + Math.min(t.count * 2, 14); });
  assignTagColors(Array.from(tagIndex.values()));

  /* ── Dynamic tag legend: always reflects the tags in posts/index.json ── */
  const legend = document.getElementById('graph-legend');
  if (legend) {
    const tags = Array.from(tagIndex.values()).sort(function (a, b) {
      return b.count - a.count || a.label.localeCompare(b.label);
    });
    legend.innerHTML = tags.map(function (tag) {
      const item = document.createElement('span');
      const dot = document.createElement('span');
      dot.className = 'legend-dot';
      dot.style.background = tag.color;
      item.appendChild(dot);
      item.appendChild(document.createTextNode('#' + tag.label));
      return item.outerHTML;
    }).join('');
    legend.hidden = tags.length === 0;
  }

  /* ── Build adjacency map for quick highlight lookups ───────────── */
  const neighborMap = new Map();
  nodes.forEach(function (n) { neighborMap.set(n.id, new Set([n.id])); });
  links.forEach(function (l) {
    neighborMap.get(l.source).add(l.target);
    neighborMap.get(l.target).add(l.source);
  });

  /* ── SVG setup ──────────────────────────────────────────────────── */
  const svg = d3.select(stage);
  const container = stage.parentElement;
  let width = container.clientWidth;
  let height = container.clientHeight;

  svg.attr('viewBox', [0, 0, width, height]);

  const zoomLayer = svg.append('g').attr('class', 'zoom-layer');

  const zoom = d3.zoom()
    .scaleExtent([0.3, 4])
    .on('zoom', function (event) { zoomLayer.attr('transform', event.transform); });

  svg.call(zoom);

  const linkSel = zoomLayer.append('g').attr('class', 'links')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('class', 'graph-link');

  const nodeSel = zoomLayer.append('g').attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'graph-node')
    .call(drag());

  nodeSel.append('circle')
    .attr('r', function (d) { return d.radius; })
    .attr('fill', function (d) {
      return d.type === 'tag' ? d.color : WRITEUP_COLOR;
    });

  nodeSel.append('text')
    .attr('dy', function (d) { return d.radius + 10; })
    .attr('text-anchor', 'middle')
    .text(function (d) {
      const label = d.type === 'tag' ? '#' + d.label : d.label;
      return label.length > 22 ? label.slice(0, 20) + '…' : label;
    });

  nodeSel.append('title').text(function (d) { return d.label; });

  /* ── Force simulation ───────────────────────────────────────────── */
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(70).strength(0.6))
    .force('charge', d3.forceManyBody().strength(-160))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(function (d) { return d.radius + 16; }));

  simulation.on('tick', function () {
    linkSel
      .attr('x1', function (d) { return d.source.x; })
      .attr('y1', function (d) { return d.source.y; })
      .attr('x2', function (d) { return d.target.x; })
      .attr('y2', function (d) { return d.target.y; });

    nodeSel.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
  });

  function drag() {
    function started(event, d) {
      if (!event.active) simulation.alphaTarget(0.25).restart();
      d.fx = d.x; d.fy = d.y;
    }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
    function ended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    }
    return d3.drag().on('start', started).on('drag', dragged).on('end', ended);
  }

  /* ── Resize handling ─────────────────────────────────────────────── */
  window.addEventListener('resize', function () {
    width = container.clientWidth;
    height = container.clientHeight;
    svg.attr('viewBox', [0, 0, width, height]);
    simulation.force('center', d3.forceCenter(width / 2, height / 2));
    simulation.alpha(0.3).restart();
  });

  /* ── Selection / highlight / info panel ───────────────────────────── */
  const $panel = $('#graph-panel-body');

  function clearSelection() {
    nodeSel.classed('is-dim', false).classed('is-active', false);
    linkSel.classed('is-dim', false).classed('is-active', false);
    renderEmptyPanel();
  }

  function renderEmptyPanel() {
    $panel.html(`
      <div class="graph-panel-empty">
        <i class="bi bi-diagram-3 fs-3 d-block mb-2" aria-hidden="true"></i>
        Click a writeup or a tag node to explore its connections.
      </div>
    `);
  }

  function selectNode(d) {
    const related = neighborMap.get(d.id);

    nodeSel
      .classed('is-dim', function (n) { return !related.has(n.id); })
      .classed('is-active', function (n) { return n.id === d.id; });

    linkSel
      .classed('is-dim', function (l) { return !(related.has(l.source.id) && related.has(l.target.id)); })
      .classed('is-active', function (l) { return l.source.id === d.id || l.target.id === d.id; });

    if (d.type === 'writeup') {
      renderWriteupPanel(d);
    } else {
      renderTagPanel(d);
    }
  }

  function renderWriteupPanel(d) {
    const tagsHTML = d.tags.map(function (t) {
      return `<span class="tag" style="cursor:pointer;" data-jump-tag="${t}">#${t}</span>`;
    }).join('');

    $panel.html(`
      <h3 class="h6 fw-bold mb-1">${d.title || d.label}</h3>
      <div class="graph-file-label mb-2">${d.label}</div>
      <p class="text-muted small mb-2">${d.excerpt}</p>
      <div class="panel-tag-list">${tagsHTML}</div>
      <a href="${d.slug}" class="btn btn-sm btn-outline-success mt-2">
        Read Writeup <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
      </a>
    `);
  }

  function renderTagPanel(d) {
    const related = nodes.filter(function (n) {
      return n.type === 'writeup' && n.tags.includes(d.label);
    });

    const listHTML = related.map(function (w) {
      return `<li><a href="${w.slug}">${w.label}</a></li>`;
    }).join('');

    $panel.html(`
      <span class="panel-eyebrow">Tag</span>
      <h3 class="h6 fw-bold mb-2">#${d.label}</h3>
      <p class="text-muted small mb-2">${related.length} writeup${related.length === 1 ? '' : 's'} tagged with this.</p>
      <ul class="related-list">${listHTML}</ul>
    `);
  }

  nodeSel.on('click', function (event, d) { selectNode(d); });

  // Jump to a tag node from inside the info panel
  $(document).on('click', '[data-jump-tag]', function () {
    const tagLabel = $(this).data('jump-tag');
    const target = tagIndex.get(String(tagLabel));
    if (target) selectNode(target);
  });

  renderEmptyPanel();

  /* ── Search: highlights + focuses matching nodes ───────────────── */
  $('#graph-search').on('input', function () {
    const q = $(this).val().trim().toLowerCase();

    if (!q) { clearSelection(); return; }

    const matches = new Set();
    nodes.forEach(function (n) {
      if (n.label.toLowerCase().includes(q)) matches.add(n.id);
    });

    nodeSel.classed('is-dim', function (n) { return !matches.has(n.id); });
    nodeSel.classed('is-active', function (n) { return matches.has(n.id); });
    linkSel.classed('is-dim', function (l) {
      return !(matches.has(l.source.id) || matches.has(l.target.id));
    });
  });

  /* ── Toolbar buttons ──────────────────────────────────────────── */
  $('#graph-reset').on('click', function () {
    $('#graph-search').val('');
    clearSelection();
    svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
  });

  $('#graph-zoom-in').on('click', function () {
    svg.transition().duration(200).call(zoom.scaleBy, 1.3);
  });

  $('#graph-zoom-out').on('click', function () {
    svg.transition().duration(200).call(zoom.scaleBy, 0.75);
  });

});
