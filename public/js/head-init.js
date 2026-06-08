(function () {
  try { localStorage.removeItem('theme'); } catch (e) {}
  document.documentElement.removeAttribute('data-theme');
})();
