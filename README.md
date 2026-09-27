# Ch3ckm8's Lair

A personal cybersecurity knowledge base, writeup archive, and interactive playground built as a lightweight static website.

The site is designed around Markdown-first content: writeups and notes can be maintained as Markdown while the frontend handles rendering, navigation, search, visualization, themes, and other interactive features.

---

## Features

### Markdown Writeups

Writeups are stored as Markdown files inside:

```text
/posts/
```

Adding a new `.md` file to this directory is enough for the build process to discover it automatically.

GitHub Actions automatically rebuilds the post index when changes are pushed.

No manual modification of `posts/index.json` is required.

---

## Post Metadata & Tags

Posts do not require YAML frontmatter.

Tags can simply be written anywhere in the Markdown using:

```md
Tags: #windows #Kerberoasting #ActiveDirectory #OSCPpath
```

The build process extracts these tags automatically.

Tags are then used throughout the site for:

- Writeup filtering
- Browse by Tag
- Writeup cards
- Knowledge Graph relationships
- Dynamic tag colors
- Search
- Reader metadata

Posts without tags are still published normally.

---

## Writeups Page

The Writeups page provides a searchable and filterable overview of all published Markdown posts.

Features include:

- Dynamic published-writeup counter
- Full-text writeup search
- Dynamic tag filters
- Toggleable tag selection
- Browse by Tag
- Colored tags
- Post publication dates
- Direct links to the Markdown reader
- View-as-Graph navigation

Tag colors are generated dynamically and remain consistent between the Writeups page and Knowledge Graph.

---

## Markdown Reader

Each writeup is rendered through a dedicated Markdown reader.

Supported features include:

- Headings
- Tables
- Lists
- Links
- Images
- Blockquotes
- Inline code
- Fenced code blocks
- Obsidian-style highlighting
- Syntax highlighting
- One-click code copying

Obsidian-style highlighting is supported:

```md
This is ==important text==.
```

The reader also provides a floating tree-style outline on the right side of the article.

The outline automatically reflects the Markdown heading hierarchy and selecting an outline entry scrolls directly to that section.

---

## Syntax Highlighting

Fenced Markdown code blocks are highlighted using Highlight.js.

Common aliases are normalized automatically, including languages such as:

- Bash
- Shell
- PowerShell
- Python
- JavaScript
- JSON
- HTML/XML
- CSS
- PHP

When a specified language is not recognized, automatic language detection is used as a fallback.

Every code block also includes a one-click **Copy** button.

---

## Site-Wide Search

A global search bar is available directly from the navigation bar.

Search covers:

- Writeup titles
- Writeup tags
- Full Markdown writeup content
- Code blocks
- Notes
- Site pages
- Markdown headings

Results display contextual previews around the matching text.

Matching terms are highlighted directly inside the result preview.

For Markdown posts, search results retain information about the exact occurrence and section containing the match.

Selecting a result opens the relevant page and attempts to scroll directly to the matching content, including matches inside code blocks.

---

## Knowledge Graph

The Knowledge Graph provides an interactive visualization of relationships between writeups and tags.

Writeup node names are automatically generated from filenames.

For example:

```text
ch3ckm8_HTB_Active.md
```

becomes:

```text
HTB_active
```

Tag nodes are generated dynamically from Markdown metadata.

Features include:

- Interactive nodes
- Dragging
- Zooming
- Node selection
- Post navigation
- Tag relationships
- Dynamic tag legend
- Keyboard navigation

No graph tags need to be manually configured.

---

## Dynamic Tag Colors

Every tag receives a deterministic color.

The color-generation algorithm distributes tags across the hue spectrum to avoid excessive color repetition.

The same tag keeps the same color across:

- Knowledge Graph nodes
- Graph legend
- Writeup cards
- Search/tag filters
- Browse by Tag

Future tags automatically receive colors without requiring code changes.

---

## Notes

The site contains a dedicated **Notes** page for reusable cybersecurity references, commands, tools, methodologies, and cheat sheets.

The Notes page is Markdown-driven and supports the same rendering features as writeups:

- Syntax highlighting
- Copyable code blocks
- Tables
- Links
- `==highlighting==`
- Heading navigation
- Search integration
- Keyboard navigation

---

## Homepage Markdown

The homepage can also contain Markdown-driven content.

Homepage Markdown is stored separately from the HTML layout, allowing additional content to be added without modifying the homepage structure.

Markdown links can point directly to writeups and are automatically routed through the Markdown reader.

---

## Keyboard Navigation

The website supports spatial keyboard navigation in addition to normal mouse, touch, and Tab navigation.

### Controls

| Key | Action |
|---|---|
| `←` | Navigate left |
| `→` | Navigate right |
| `↑` | Navigate upward |
| `↓` | Navigate downward |
| `Enter` | Activate the selected element |
| `Esc` | Exit the current interaction / return to navigation |

Keyboard navigation works across navbar links, buttons, search fields, theme controls, writeup controls, tags, reader outline, Knowledge Graph nodes, Notes, and the Markdown scratchpad.

Interactive elements receive a visible focus indicator.

### Reading Writeups

Inside a writeup, the article and outline have dedicated keyboard behavior.

`↑` / `↓` scroll through the article, `→` can move toward the outline, and `←` can return from the outline to the article.

---

## Keyboard Navigation HUD

A floating keyboard indicator appears in the bottom-left corner.

The HUD lights up whenever the site successfully handles a keyboard-navigation command and follows the currently selected site accent.

---

## Markdown Scratchpad

A persistent Markdown scratchpad is available from the floating 📝 button in the bottom-right corner.

The scratchpad provides:

- Markdown editing
- Markdown preview
- Persistent local storage
- Theme integration
- Keyboard navigation

The note is continuously saved using browser `localStorage`.

Notes survive closing the panel, navigating between pages, and refreshing the website.

Notes remain entirely local to the current browser/device and are not uploaded to the website or GitHub.

---

## Light & Dark Mode

The entire website supports light and dark themes.

The selected theme persists between pages using `localStorage`.

Theme-aware styling is provided for Markdown, code blocks, syntax highlighting, search, graph, notes, scratchpad, navigation, cards, and backgrounds.

---

## Accent Colors

The 🎨 palette control allows the site's primary accent color to be changed.

Available accents include variations such as:

- Green
- Red
- Cyan
- Orange
- Light Purple

The selected accent affects links, buttons, active navigation, borders, focus indicators, search highlights, reader accents, graph writeup nodes, and the keyboard HUD.

Dynamic tag colors remain independent from the global accent.

---

## Background Themes

The 🖥 background selector provides multiple site-wide background styles.

Available themes include:

- Default
- Slate
- Midnight
- Violet
- Warm
- Forest
- Night City

Each background has coordinated light and dark variants.

The original website background remains the default.

Background preference is stored locally and persists across navigation and refreshes.

---

## Night City

The **Night City** background provides an ambient city scene behind the website.

It includes room/window framing, a distant skyline, skyscrapers, illuminated windows, atmospheric depth, and slowly changing building lights.

In dark mode, the scene becomes a nighttime city.

In light mode, it uses a brighter golden-hour interpretation to maintain sufficient contrast with dark text.

Users with `prefers-reduced-motion: reduce` do not receive the animated light changes.

---

## Famous Quotes

The About page includes a **Famous Quotes** section containing curated quotes related to security, privacy, computing, and technology.

Quotes are stored locally rather than retrieved from an external API.

A quote is selected when the page loads and can rotate periodically.

A shuffle control allows another quote to be displayed immediately.

---

## About

The About page contains:

- Personal introduction
- Social links
- Famous Quotes
- Career/learning journey

External profile links can be configured directly in `about.html`.

---

## Automatic Post Discovery

The website is deployed using GitHub Actions.

When a Markdown file is added under `/posts/` and pushed to `main`, the deployment workflow:

```text
Push to main
      │
      ▼
Scan /posts/
      │
      ▼
Discover Markdown files
      │
      ▼
Extract metadata and tags
      │
      ▼
Generate post catalog
      │
      ▼
Verify discovered posts
      │
      ▼
Deploy GitHub Pages
```

The post catalog is a generated artifact and should not need to be maintained manually.

---

## Writeup Dates

Writeup publication dates are derived from Git history.

For new posts, the build uses the date of the **first Git commit that added the Markdown file**.

This prevents GitHub Actions checkout/build timestamps from changing publication dates on every deployment.

---

## Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── pages.yml
├── assets/
├── content/
│   ├── home.md
│   └── notes.md
├── css/
├── js/
├── posts/
│   ├── *.md
│   └── index.json
├── scripts/
│   └── build_posts.py
├── index.html
├── writeups.html
├── graph.html
├── notes.html
├── reader.html
└── about.html
```

---

## Adding a Writeup

Create a Markdown file:

```text
posts/ch3ckm8_HTB_MachineName.md
```

Optionally include:

```md
Tags: #windows #ActiveDirectory #Kerberos
```

Commit and push:

```bash
git add posts/
git commit -m "Add new writeup"
git push origin main
```

GitHub Actions handles the rest.

---

## Updating Notes

Edit:

```text
content/notes.md
```

and push the change.

---

## Updating Homepage Markdown

Edit:

```text
content/home.md
```

to add Markdown content underneath the normal homepage sections.

---

## Deployment

GitHub Pages should use:

```text
Settings
→ Pages
→ Build and deployment
→ Source
→ GitHub Actions
```

The workflow is located at:

```text
.github/workflows/pages.yml
```

---

## Design Goals

Ch3ckm8's Lair is intentionally built around a few principles:

- **Markdown-first** — writing content should not require editing HTML.
- **Static-first** — no backend is required for normal operation.
- **Lightweight** — interactive functionality is implemented client-side without unnecessary services.
- **Discoverable** — search, tags, graph relationships, and outlines make large amounts of content navigable.
- **Keyboard-friendly** — the site should remain usable without relying entirely on a mouse.
- **Customizable** — themes, accents, and backgrounds can be changed independently.
- **Progressive** — new writeups and tags should integrate automatically without requiring manual frontend changes.

---

## Privacy

Most interactive preferences are stored using browser `localStorage`, including:

- Theme
- Accent
- Background selection
- Markdown scratchpad content

The scratchpad is local to the visitor's browser and is not submitted to the website.

---

## Tech Stack

The site is primarily built with:

- HTML
- CSS
- JavaScript
- Bootstrap 5
- Bootstrap Icons
- Markdown
- Marked
- DOMPurify
- Highlight.js
- D3.js
- Python build scripts
- GitHub Actions
- GitHub Pages

---

## Ch3ckm8's Lair

Writeups, notes, commands, lessons learned, and connections between them.

Built to turn a growing collection of Markdown files into an interactive cybersecurity knowledge base.
