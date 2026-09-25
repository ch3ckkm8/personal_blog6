$(document).ready(async function () {
  const $status = $('#reader-status');
  const $content = $('#markdown-content');
  const file = new URLSearchParams(window.location.search).get('post') || '';

  if (!/^posts\/[A-Za-z0-9._-]+\.md$/i.test(file)) {
    $status.text('Invalid or missing writeup.');
    return;
  }

  try {
    // Use the same index that powers the Writeups page. This avoids a second
    // GitHub Pages request for the raw .md file and works on project/custom domains.
    const indexUrl = new URL('posts/index.json', window.location.href);
    indexUrl.search = '';
    indexUrl.hash = '';
    const response = await fetch(indexUrl.href, { cache: 'no-cache' });
    if (!response.ok) throw new Error('HTTP ' + response.status + ' loading posts/index.json');

    const posts = await response.json();
    const post = posts.find(function (item) { return item.file === file; });
    if (!post) throw new Error('Post is not present in posts/index.json: ' + file);
    if (typeof post.content !== 'string') throw new Error('Post content is missing from posts/index.json. Rebuild the site index.');
    if (typeof marked === 'undefined') throw new Error('The Markdown renderer failed to load.');
    if (typeof DOMPurify === 'undefined') throw new Error('The HTML sanitizer failed to load.');

    const html = DOMPurify.sanitize(marked.parse(post.content));
    $content.html(html).removeClass('d-none');

    // Syntax highlighting + one-click copy buttons for fenced Markdown code blocks.
    $content.find('pre').each(function () {
      const pre = this;
      const code = pre.querySelector('code');
      if (!code) return;

      if (typeof hljs !== 'undefined') {
        hljs.highlightElement(code);
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-btn';
      button.setAttribute('aria-label', 'Copy code');
      button.setAttribute('title', 'Copy code');
      button.innerHTML = '<i class="bi bi-clipboard"></i><span>Copy</span>';

      button.addEventListener('click', async function () {
        try {
          await navigator.clipboard.writeText(code.textContent);
          button.classList.add('copied');
          button.innerHTML = '<i class="bi bi-check2"></i><span>Copied!</span>';
          setTimeout(function () {
            button.classList.remove('copied');
            button.innerHTML = '<i class="bi bi-clipboard"></i><span>Copy</span>';
          }, 1600);
        } catch (error) {
          console.error('[reader] Could not copy code', error);
        }
      });

      pre.appendChild(button);
    });

    // Assets referenced by Markdown are relative to posts/<filename>.md.
    const postUrl = new URL(file, window.location.href);
    postUrl.search = '';
    postUrl.hash = '';
    $content.find('img').each(function () {
      const src = $(this).attr('src') || '';
      if (src && !/^(?:[a-z]+:|\/|#)/i.test(src)) $(this).attr('src', new URL(src, postUrl.href).href);
    });
    $content.find('a').each(function () {
      const href = $(this).attr('href') || '';
      if (href && !/^(?:[a-z]+:|\/|#)/i.test(href)) $(this).attr('href', new URL(href, postUrl.href).href);
    });

    $status.addClass('d-none');
    document.title = (post.title || 'Writeup') + ' | 0xnotes';
  } catch (error) {
    console.error('[reader]', error);
    $status.html('The writeup is indexed, but the reader failed to render it. <small class="d-block mt-2 text-muted">' + $('<div>').text(error.message).html() + '</small>');
  }
});
