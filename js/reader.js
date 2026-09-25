$(document).ready(async function () {
  const $status = $('#reader-status');
  const $content = $('#markdown-content');
  const file = new URLSearchParams(window.location.search).get('post') || '';

  // Only allow Markdown files from this site's posts directory.
  if (!/^posts\/[A-Za-z0-9._-]+\.md$/i.test(file)) {
    $status.text('Invalid or missing writeup.');
    return;
  }

  try {
    const response = await fetch(file, { cache: 'no-cache' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    let markdown = await response.text();
    markdown = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
    const html = DOMPurify.sanitize(marked.parse(markdown));
    $content.html(html).removeClass('d-none');
    $status.addClass('d-none');
    const heading = $content.find('h1').first().text().trim();
    if (heading) document.title = heading + ' | 0xnotes';
  } catch (error) {
    console.error(error);
    $status.html('This writeup could not be loaded. Check that the Markdown file exists in <code>posts/</code>.');
  }
});
