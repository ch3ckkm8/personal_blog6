# Ch3ckm8's Lair — Static Cybersecurity Blog Template

## Publishing Markdown writeups

1. Put each post in the `posts/` directory with a `.md` extension.
2. Add optional YAML-style metadata at the top (see `posts/README.md.example`).
3. Push to `main`.
4. In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

The included Pages workflow runs `scripts/build_posts.py`, creates `posts/index.json`, and deploys the site. The Writeups page then lists every indexed Markdown file and opens it through `reader.html` with Markdown rendering.

Important: the archive supplied for this repair did not contain any actual post `.md` files (only this `README.md`), so no missing writeup content could be restored automatically. Add/copy your real posts into `posts/` before pushing.
