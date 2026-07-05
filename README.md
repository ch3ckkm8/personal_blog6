# 0xnotes — Static Cybersecurity Blog Template

A front-end-only cybersecurity blog template: writeups, a requests board, an
about/contact page, and an interactive **knowledge graph** connecting writeups
to tags. No backend, no build step — deploy it straight to GitHub Pages.

**Live demo of this template's structure:** point GitHub Pages at this repo's
root (or a `/docs` folder) and it just works.

---

## Table of Contents

- [Quick start](#quick-start)
- [Pages](#pages)
- [The Knowledge Graph](#the-knowledge-graph)
- [Customizing it as your own site](#customizing-it-as-your-own-site)
- [How persistence works with no backend](#how-persistence-works-with-no-backend)
- [Deploying to GitHub Pages](#deploying-to-github-pages)

---

## Quick start

1. Clone or download this repo.
2. Open `index.html` directly in a browser, or serve the folder with any static
   server (`python3 -m http.server`, `npx serve`, the VS Code Live Server
   extension, etc.).
3. Edit the placeholder content (see [Customizing](#customizing-it-as-your-own-site)) and push to GitHub Pages.

There is nothing to install and nothing to build — every page is plain HTML,
CSS, and vanilla/jQuery JS loaded from CDNs.

## Pages

| Page | What it does |
|---|---|
| `index.html` | Hero, feature highlights, and a live preview of your 4 most recent requests. |
| `writeups.html` | Searchable, filterable card grid of writeups with a tag-cloud sidebar. Data lives in `js/writeups.js` as a plain array — no CMS needed. |
| `graph.html` | **New.** An interactive D3 force-directed graph connecting every writeup to its tags. See below. |
| `tasks.html` | A "requests board" — visitors can suggest topics, tracked as tasks with a status, priority, and a Chart.js doughnut chart. Backed by `localStorage`. |
| `about.html` | Bio, collaborator cards, testimonials carousel, and a timeline — all placeholder content, ready to replace. |
| `contact.html` | A validated contact form (front-end only — wire it to a form backend like Formspree if you want real submissions) and social links. |

## The Knowledge Graph

`graph.html` + `js/graph.js` render an interactive graph where:

- **Writeup nodes** are colored by category (HTB / CTF / Malware / other).
- **Tag nodes** are sized by how many writeups reference them.
- Edges connect each writeup to its tags.

It's built with [D3.js](https://d3js.org/) (`forceSimulation`, `forceLink`,
`forceManyBody`, `forceCollide`) and reads the exact same data array that
powers the writeups page (`window.SITE_WRITEUPS`, exposed by `js/writeups.js`).
That means:

- **No duplicated content.** Add a writeup once in `js/writeups.js` and it
  shows up in both the grid and the graph.
- **No backend.** The whole thing is computed and rendered in the visitor's
  browser on page load — this is exactly the kind of feature that works fine
  on GitHub Pages (or any static host) despite there being no server.

Interactions:

- **Drag** any node to reposition it.
- **Scroll / pinch** to zoom, or use the `+`/`−` buttons.
- **Click** a writeup node to see its excerpt, tags, and a "Read Writeup" link
  in the side panel; click a tag node to see every writeup that uses it.
- **Search** the box in the top-left to highlight matching titles/tags.
- **Reset** clears the selection and re-centers the view.

If you'd rather generate the graph data from real files instead of a hardcoded
array, swap the array in `js/writeups.js` for a `fetch()` call to a static
`writeups.json` file — the rest of `graph.js` and `writeups.js` don't need to
change, since they only care about the shape of the objects, not where they
came from.

## Customizing it as your own site

Everything personal in the original template has been stripped out and
replaced with placeholders so this reads as a starting point, not a copy of
someone's real blog. Things to change before you publish:

- **Branding**: the `0xnotes` name/logo in `js/components.js` (navbar + footer),
  page `<title>` tags, and `assets/favicon.svg`.
- **Bio, collaborators, timeline, testimonials**: all in `about.html`.
- **Social links**: currently `href="#"` in `js/components.js`, `about.html`,
  and `contact.html` — replace with your real profiles.
- **Contact form backend**: the form only shows a confirmation modal locally.
  Point it at a real backend (Formspree, Getform, a Cloudflare Worker, your
  own API, etc.) if you want to actually receive messages.
- **Writeups data**: replace the sample entries in `js/writeups.js` with your
  own — the graph updates automatically since it reads the same array.
- **Location section** on `contact.html`: currently a placeholder box —
  drop in a real map embed or remove it.

## How persistence works with no backend

The requests board (`tasks.html`) stores everything in the browser's
`localStorage` under the key `tasks`, as a JSON array. `loadTasks()` reads and
parses it on page load; `saveTasks()` re-serializes and writes it back on every
add/edit/delete. `localStorage` belongs to the domain, not a single page, so
`index.html`'s "Latest Requests" preview reads the same key. The trade-off:
data is per-browser and doesn't sync across devices — there's no server to
sync it through.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo settings, enable **Pages** and point it at the branch/folder
   containing `index.html` (root, or `/docs` if you move things there).
3. That's it — every page here is static and every "dynamic" feature (theme
   toggle, requests board, knowledge graph) runs entirely in the browser.
