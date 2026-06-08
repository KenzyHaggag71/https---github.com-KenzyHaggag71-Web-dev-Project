(function () {
  'use strict';

  function init() {
    var container = document.getElementById('pageContent');
    if (!container) return;

    function load(href, push) {
      container.classList.add('is-loading');
      fetch(href, { headers: { 'X-Requested-With': 'fetch' } })
        .then(function (r) { if (!r.ok) throw new Error('bad'); return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var fresh = doc.getElementById('pageContent');
          if (fresh) { container.innerHTML = fresh.innerHTML; }
          container.classList.remove('is-loading');
          if (push !== false) { window.history.pushState({ ajaxPage: true }, '', href); }
          var anchor = container.querySelector('*') || container;
          var top = anchor.getBoundingClientRect().top + window.pageYOffset - 90;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        })
        .catch(function () { window.location.href = href; });
    }

    container.addEventListener('click', function (e) {
      var link = e.target.closest('a.page-link');
      if (!link || !container.contains(link)) return;
      if (link.classList.contains('disabled') || link.classList.contains('active')) return;
      var href = link.getAttribute('href');
      if (!href) return;
      e.preventDefault();
      load(href, true);
    });

    window.addEventListener('popstate', function () {
      if (document.getElementById('pageContent')) load(window.location.href, false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
