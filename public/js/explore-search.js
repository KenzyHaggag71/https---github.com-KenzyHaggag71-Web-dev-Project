(function () {
  'use strict';

  function init() {
    var form = document.getElementById('filterForm');
    var grid = document.getElementById('internshipsGrid');
    var pager = document.getElementById('pager');
    var searchInput = document.getElementById('searchInput');
    if (!form || !grid) return;
    console.log('[InternHub] Live Explore search active (no page reloads).');

    var RESULTS_URL = '/student/explore/results';
    var debounceTimer = null;
    var currentController = null;

        function buildParams(extra) {
      var params = new URLSearchParams();
      var data = new FormData(form);
      data.forEach(function (value, key) {
        if (value !== null && String(value).trim() !== '') params.set(key, value);
      });
      if (extra && extra.page) params.set('page', extra.page);
      return params;
    }

        function loadResults(extra, push) {
      var params = buildParams(extra);

      
      if (currentController) currentController.abort();
      currentController = new AbortController();

      grid.classList.add('is-loading');

      fetch(RESULTS_URL + '?' + params.toString(), {
        headers: { 'X-Requested-With': 'fetch' },
        signal: currentController.signal
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          return res.json();
        })
        .then(function (json) {
          grid.innerHTML = json.gridHtml;
          if (pager) pager.innerHTML = json.pagerHtml || '';
          if (typeof window.exploreMapUpdate === 'function') {
            window.exploreMapUpdate(json.mapData || []);
          }
          grid.classList.remove('is-loading');

          
          if (push !== false) {
            var url = '/student/explore' + (params.toString() ? '?' + params.toString() : '');
            window.history.pushState({ explore: true }, '', url);
          }
          window.scrollTo({ top: grid.offsetTop - 90, behavior: 'smooth' });
        })
        .catch(function (err) {
          if (err.name === 'AbortError') return; 
          grid.classList.remove('is-loading');
          console.error('Explore search error:', err.message);
        });
    }

        if (searchInput) {
      searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () { loadResults(); }, 300);
      });
    }

        form.addEventListener('change', function (e) {
      if (e.target === searchInput) return;
      loadResults();
    });

        form.addEventListener('submit', function (e) {
      e.preventDefault();
      loadResults();
    });

        if (pager) {
      pager.addEventListener('click', function (e) {
        var link = e.target.closest('a');
        if (!link || !pager.contains(link)) return;
        var href = link.getAttribute('href') || '';
        var qm = href.indexOf('?');
        if (qm === -1) return;
        e.preventDefault();
        var page = new URLSearchParams(href.slice(qm + 1)).get('page');
        loadResults({ page: page });
      });
    }

        window.addEventListener('popstate', function () {
      var qs = window.location.search.replace(/^\?/, '');
      var p = new URLSearchParams(qs);
      if (searchInput) searchInput.value = p.get('search') || '';
      form.querySelectorAll('input[name="workMode"]').forEach(function (r) {
        r.checked = (r.value === (p.get('workMode') || ''));
      });
      var catSel = form.querySelector('select[name="category"]');
      if (catSel) catSel.value = p.get('category') || '';
      var sortSel = form.querySelector('select[name="sort"]');
      if (sortSel) sortSel.value = p.get('sort') || 'recent';
      loadResults({ page: p.get('page') }, false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
