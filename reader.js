$(document).ready(async function () {
  const $status = $('#reader-status');
  const $content = $('#markdown-content');
  const file = new URLSearchParams(window.location.search).get('post') || '';

  // index.json stores paths like "posts/example.md".
  if (!/^posts\/[A-Za-z0-9._-]+\.md$/i.test(file)) {
    $status.text('Invalid or missing writeup.');
    return;
  }

  try {
    // Resolve from reader.html itself. This preserves the repository prefix on
    // project GitHub Pages sites, e.g. /personal_blog6/posts/example.md.
    const postUrl = new URL(file, window.location.href);
    postUrl.search = '';
    postUrl.hash = '';

    const response = await fetch(postUrl.href, { cache: 'no-cache' });
    if (!response.ok) throw new Error('HTTP ' + response.status + ' loading ' + postUrl.href);

    let markdown = await response.text();
    markdown = markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, '');
    const html = DOMPurify.sanitize(marked.parse(markdown));
    $content.html(html).removeClass('d-none');

    // Resolve relative Markdown assets against the actual Markdown URL.
    $content.find('img').each(function () {
      const src = $(this).attr('src') || '';
      if (src && !/^(?:[a-z]+:|\/|#)/i.test(src)) {
        $(this).attr('src', new URL(src, postUrl.href).href);
      }
    });

    $content.find('a').each(function () {
      const href = $(this).attr('href') || '';
      if (href && !/^(?:[a-z]+:|\/|#)/i.test(href)) {
        $(this).attr('href', new URL(href, postUrl.href).href);
      }
    });

    $status.addClass('d-none');
    const heading = $content.find('h1').first().text().trim();
    if (heading) document.title = heading + ' | 0xnotes';
  } catch (error) {
    console.error(error);
    $status.html('This writeup could not be loaded. Check that the Markdown file exists in <code>posts/</code>.');
  }
});
