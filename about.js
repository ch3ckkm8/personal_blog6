(() => {
  "use strict";

  const quotes = [
    {
      text: "Security is a process, not a product.",
      author: "Bruce Schneier",
      source: "The Process of Security"
    },
    {
      text: "Security is a mix of people, process, and technology.",
      author: "Bruce Schneier",
      source: "The Future of Incident Response"
    },
    {
      text: "There are no secret weapons; there never will be.",
      author: "Bruce Schneier",
      source: "Security Vision"
    },
    {
      text: "Security engineering is about building systems to remain dependable in the face of malice, error or mischance.",
      author: "Ross Anderson",
      source: "Security Engineering"
    },
    {
      text: "You need to figure out not how something works, but how something can be made to not work.",
      author: "Bruce Schneier",
      source: "Foreword to Security Engineering"
    },
    {
      text: "Products are useful for what they do; security products are useful because of what they prevent.",
      author: "Bruce Schneier",
      source: "Security Research and the Future"
    }
  ];

  let current = -1;
  let timer = null;

  function pickNext() {
    if (quotes.length < 2) return 0;
    let next;
    do next = Math.floor(Math.random() * quotes.length); while (next === current);
    return next;
  }

  function render(index = pickNext()) {
    const text = document.getElementById("famous-quote-text");
    const source = document.getElementById("famous-quote-source");
    if (!text || !source) return;
    current = index;
    const quote = quotes[current];
    text.classList.remove("quote-enter");
    void text.offsetWidth;
    text.textContent = `“${quote.text}”`;
    source.textContent = `${quote.author} — ${quote.source}`;
    text.classList.add("quote-enter");
  }

  function restartTimer() {
    clearInterval(timer);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timer = setInterval(() => render(), 14000);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    restartTimer();
    document.getElementById("quote-shuffle")?.addEventListener("click", () => {
      render();
      restartTimer();
    });
  });
})();
