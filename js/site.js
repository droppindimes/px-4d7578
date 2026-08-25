(function () {
  /* Sticky header shadow on scroll */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile hamburger */
  var nav = document.getElementById("primary-nav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Menu");
      document.body.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 639) setOpen(false);
    });
  }

  /* Warm the two pages people actually click next, on intent only */
  var PREFETCH = ["book.html", "work-with-me.html"];
  var prefetched = {};
  var warm = function (href) {
    if (prefetched[href]) return;
    prefetched[href] = true;
    var link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    document.head.appendChild(link);
  };
  PREFETCH.forEach(function (href) {
    document.querySelectorAll('a[href="' + href + '"]').forEach(function (a) {
      var onIntent = function () {
        warm(href);
      };
      a.addEventListener("pointerenter", onIntent, { once: true });
      a.addEventListener("focus", onIntent, { once: true });
    });
  });

  /* Podcast page: fetch episodes, search + tag filter */
  var listEl = document.getElementById("episode-list");
  if (!listEl) return;

  var statusEl = document.getElementById("episode-status");
  var searchEl = document.getElementById("episode-search");
  var chipsEl = document.getElementById("tag-chips");
  var activeTag = "";
  var searchQuery = "";
  var episodes = [];

  var FALLBACK = [
    {
      episode: "99",
      title: "What I’m Rediscovering Right Now: Midlife, Identity, Change & Starting Again",
      link: "https://rediscovering-you.simplecast.com/episodes/what-im-rediscovering-right-now-midlife-identity-change-starting-again-1c3gASrE",
      duration_min: 41.3,
      summary: "After some time away, Laura is back — overcommitment, Iceland, identity, and rediscovering yourself in real time.",
      tags: ["rediscovery", "push-through", "parenting"]
    },
    {
      episode: "98",
      title: "Still a Mother: Jennifer Crouse on Full-Term Stillbirth, Grief, and Remembering Charlotte",
      link: "https://rediscovering-you.simplecast.com/episodes/still-a-mother-jennifer-crouse-on-full-term-stillbirth-grief-and-remembering-charlotte-qjn35Vgf",
      duration_min: 46.1,
      summary: "Laura sits down with Jennifer Crouse to share the story of losing her daughter Charlotte to full-term stillbirth.",
      tags: ["grief-loss", "relationships", "guest"]
    },
    {
      episode: "97",
      title: "Why Environment Changes You: Nervous System Healing, Retreats & Rediscovering Yourself with Jason Westlake and Amy Inzero",
      link: "https://rediscovering-you.simplecast.com/episodes/why-environment-changes-you-nervous-system-healing-retreats-rediscovering-yourself-with-jason-westlake-and-amy-inzero-xEARPynJ",
      duration_min: 39.0,
      summary: "Environment, nervous system regulation, and rediscovering yourself — with Amy Inzero and Jason Westlake.",
      tags: ["nervous-system", "still-stuck", "relationships", "retreats"]
    },
    {
      episode: "96",
      title: "If You’re Still Stuck After Doing the Work… This Is Why",
      link: "https://rediscovering-you.simplecast.com/episodes/if-youre-still-stuck-after-doing-the-work-this-is-why-1TXO3by4",
      duration_min: 12.6,
      summary: "You’ve done the therapy and built self-awareness — but still repeat the same patterns. Why awareness alone isn’t enough.",
      tags: ["nervous-system", "still-stuck"]
    },
    {
      episode: "95",
      title: "Talk Therapy Isn’t Enough: Why You Still Feel Stuck",
      link: "https://rediscovering-you.simplecast.com/episodes/talk-therapy-isnt-enough-why-you-still-feel-stuck-3xbgIw2P",
      duration_min: 13.2,
      summary: "Insight without change — and what else healing may need when talk alone leaves you stuck.",
      tags: ["nervous-system", "still-stuck", "reiki-energy", "guest"]
    },
    {
      episode: "91",
      title: "Stop Pushing Through: Why Your Nervous System Determines Your Success",
      link: "https://rediscovering-you.simplecast.com/episodes/stop-pushing-through-why-your-nervous-system-determines-your-success-w6n52grn",
      duration_min: 18.7,
      summary: "Why the common advice to push harder often backfires — and what your nervous system has to do with it.",
      tags: ["nervous-system", "still-stuck", "push-through", "relationships"]
    }
  ];

  function formatDuration(min) {
    if (min == null || isNaN(min)) return "";
    var rounded = Math.round(min);
    return rounded + " min";
  }

  function tagLabel(tag) {
    var map = {
      "nervous-system": "Nervous system",
      "reiki-energy": "Reiki & energy",
      "still-stuck": "Still stuck",
      "push-through": "Push-through",
      "boundaries": "Boundaries",
      "relationships": "Relationships",
      "parenting": "Parenting",
      "grief-loss": "Grief & loss",
      "retreats": "Retreats",
      "guest": "Guests",
      "rediscovery": "Rediscovery"
    };
    if (map[tag]) return map[tag];
    return String(tag || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Preferred chip order (Matt: NS first, then Reiki/energy, then the rest) */
  var TAG_ORDER = [
    "nervous-system",
    "reiki-energy",
    "still-stuck",
    "push-through",
    "boundaries",
    "relationships",
    "parenting",
    "grief-loss",
    "retreats",
    "guest",
    "rediscovery"
  ];

  function collectTags(list) {
    var seen = {};
    list.forEach(function (ep) {
      (ep.tags || []).forEach(function (t) {
        if (t) seen[t] = true;
      });
    });
    var out = [];
    TAG_ORDER.forEach(function (t) {
      if (seen[t]) {
        out.push(t);
        delete seen[t];
      }
    });
    Object.keys(seen)
      .sort()
      .forEach(function (t) {
        out.push(t);
      });
    return out;
  }

  function buildChips(tags) {
    if (!chipsEl) return;
    var html = '<button type="button" class="tag-chip' + (activeTag === "" ? " is-active" : "") + '" data-tag="">All</button>';
    tags.forEach(function (t) {
      html +=
        '<button type="button" class="tag-chip' +
        (activeTag === t ? " is-active" : "") +
        '" data-tag="' +
        escapeHtml(t) +
        '">' +
        escapeHtml(tagLabel(t)) +
        "</button>";
    });
    chipsEl.innerHTML = html;
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || "";
  }

  function haystack(ep) {
    return (
      String(ep.title || "") +
      " " +
      String(ep.summary || "") +
      " " +
      String(ep.episode || "") +
      " " +
      (ep.tags || []).map(tagLabel).join(" ")
    ).toLowerCase();
  }

  function filtered() {
    var q = searchQuery.trim().toLowerCase();
    return episodes.filter(function (ep) {
      if (activeTag && !(ep.tags || []).includes(activeTag)) return false;
      if (q && haystack(ep).indexOf(q) === -1) return false;
      return true;
    });
  }

  function render() {
    var items = filtered();
    if (!items.length) {
      listEl.innerHTML = "";
      setStatus("No episodes match. Try another tag or clear the search.");
      return;
    }
    setStatus(items.length + " episode" + (items.length === 1 ? "" : "s"));
    listEl.innerHTML = items
      .map(function (ep) {
        var tags = (ep.tags || [])
          .map(function (t) {
            return '<span class="ep-tag">' + escapeHtml(tagLabel(t)) + "</span>";
          })
          .join("");
        var dur = formatDuration(ep.duration_min);
        var summary = ep.summary ? escapeHtml(ep.summary) : "";
        if (summary && summary.length > 180) {
          summary = summary.slice(0, 177).replace(/\s+\S*$/, "") + "…";
        }
        return (
          '<li class="episode-card">' +
          '<div class="ep-meta">' +
          '<span class="ep-num">Ep ' +
          escapeHtml(ep.episode) +
          "</span>" +
          (dur ? ' · <span class="ep-dur">' + dur + "</span>" : "") +
          "</div>" +
          "<h3><a href=\"" +
          escapeHtml(ep.link) +
          '" target="_blank" rel="noopener">' +
          escapeHtml(ep.title) +
          "</a></h3>" +
          (summary ? '<p class="ep-summary">' + summary + "</p>" : "") +
          (tags ? '<div class="ep-tags">' + tags + "</div>" : "") +
          '<a class="text-link ep-listen" href="' +
          escapeHtml(ep.link) +
          '" target="_blank" rel="noopener">Listen →</a>' +
          "</li>"
        );
      })
      .join("");
  }

  function setTag(tag) {
    activeTag = tag || "";
    if (chipsEl) {
      chipsEl.querySelectorAll(".tag-chip").forEach(function (btn) {
        btn.classList.toggle("is-active", (btn.getAttribute("data-tag") || "") === activeTag);
      });
    }
    render();
  }

  if (chipsEl) {
    chipsEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".tag-chip");
      if (!btn) return;
      setTag(btn.getAttribute("data-tag") || "");
    });
  }

  if (searchEl) {
    searchEl.addEventListener("input", function () {
      searchQuery = searchEl.value || "";
      render();
    });
  }

  setStatus("Loading episodes…");

  fetch("data/episodes.json")
    .then(function (res) {
      if (!res.ok) throw new Error("fetch failed");
      return res.json();
    })
    .then(function (data) {
      episodes = (data && data.episodes) || [];
      if (!episodes.length) throw new Error("empty");
      buildChips(collectTags(episodes));
      render();
    })
    .catch(function () {
      episodes = FALLBACK;
      buildChips(collectTags(episodes));
      render();
      setStatus("I can’t load the full list right now — try Apple Podcasts, or these recent episodes.");
    });
})();
