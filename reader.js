
function enableMarkdownHighlights(markedApi) {
  if (!markedApi || markedApi.__checkm8HighlightEnabled) return;
  markedApi.use({
    extensions: [{
      name: 'checkm8Highlight',
      level: 'inline',
      start(src) { return src.indexOf('=='); },
      tokenizer(src) {
        const match = /^==(?=\S)([\s\S]*?\S)==/.exec(src);
        if (!match) return;
        return { type: 'checkm8Highlight', raw: match[0], text: match[1], tokens: this.lexer.inlineTokens(match[1]) };
      },
      renderer(token) {
        return '<mark class=\"md-highlight\">' + this.parser.parseInline(token.tokens) + '</mark>';
      }
    }]
  });
  markedApi.__checkm8HighlightEnabled = true;
}
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

    enableMarkdownHighlights(marked);
    const html = DOMPurify.sanitize(marked.parse(post.content));
    $content.html(html).removeClass('d-none');

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
    document.title = (post.title || 'Writeup') + " | Ch3ckm8's Lair";
  } catch (error) {
    console.error('[reader]', error);
    $status.html('The writeup is indexed, but the reader failed to render it. <small class="d-block mt-2 text-muted">' + $('<div>').text(error.message).html() + '</small>');
  }
});
