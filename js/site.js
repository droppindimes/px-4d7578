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
    return String(tag || "").replace(/-/g, " ");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function collectTags(list) {
    var seen = {};
    var out = [];
    list.forEach(function (ep) {
      (ep.tags || []).forEach(function (t) {
        if (!seen[t]) {
          seen[t] = true;
          out.push(t);
        }
      });
    });
    out.sort();
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

  function filtered() {
    var q = searchQuery.trim().toLowerCase();
    return episodes.filter(function (ep) {
      if (activeTag && !(ep.tags || []).includes(activeTag)) return false;
      if (q && String(ep.title || "").toLowerCase().indexOf(q) === -1) return false;
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
          (dur ? " · " + dur : "") +
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
          '" target="_blank" rel="noopener">Listen on Simplecast →</a>' +
          "</li>"
        );
      })
      .join("");
  }

  function syncThemeButtons() {
    document.querySelectorAll(".theme-filter").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tag") === activeTag);
    });
  }

  function setTag(tag) {
    activeTag = tag || "";
    if (chipsEl) {
      chipsEl.querySelectorAll(".tag-chip").forEach(function (btn) {
        btn.classList.toggle("is-active", (btn.getAttribute("data-tag") || "") === activeTag);
      });
    }
    syncThemeButtons();
    render();
  }

  if (chipsEl) {
    chipsEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".tag-chip");
      if (!btn) return;
      setTag(btn.getAttribute("data-tag") || "");
    });
  }

  document.querySelectorAll(".theme-filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tag = btn.getAttribute("data-tag") || "";
      setTag(activeTag === tag ? "" : tag);
      var target = document.getElementById("episodes");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

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
      setStatus("Showing a few recent episodes (full list unavailable offline).");
      render();
    });
})();
