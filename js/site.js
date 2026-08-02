(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
