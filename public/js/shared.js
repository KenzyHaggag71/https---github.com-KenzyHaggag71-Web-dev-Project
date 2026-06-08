(function(){try{var el=document.getElementById("app-i18n-data");if(el&&!window.APP_I18N){window.APP_I18N=JSON.parse(el.textContent||"{}");}}catch(e){}})();

(function () {
  'use strict';

    window.showToast = function (message, isSuccess) {
    var existing = document.querySelector('.toast');
    if (existing) { existing.remove(); }

    var toast = document.createElement('div');
    toast.className = 'toast ' + (isSuccess ? 'toast-success' : 'toast-error');
    toast.innerHTML =
      '<i class="fas ' + (isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle') + '"></i>' +
      '<span>' + message + '</span>';
    document.body.appendChild(toast);

    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  };

    document.addEventListener('DOMContentLoaded', function () {
    var learnMoreBtn = document.getElementById('learnMoreBtn');
    if (learnMoreBtn) {
      learnMoreBtn.addEventListener('click', function () {
        var about = document.getElementById('aboutSection');
        if (about) { about.scrollIntoView({ behavior: 'smooth' }); }
      });
    }

        var langSwitcher = document.getElementById('langSwitcher');
    if (langSwitcher) {
      var trigger = langSwitcher.querySelector('.lang-trigger');
      if (trigger) {
        trigger.addEventListener('click', function (e) {
          e.stopPropagation();
          langSwitcher.classList.toggle('open');
        });
        document.addEventListener('click', function () {
          langSwitcher.classList.remove('open');
        });
      }
    }

        var helpTrigger = document.getElementById('navHelpTrigger');
    if (helpTrigger) {
      helpTrigger.addEventListener('click', function (e) {
        if (e.target.closest('a')) { helpTrigger.classList.remove('open'); return; } 
        e.stopPropagation();
        helpTrigger.classList.toggle('open');
      });
      document.addEventListener('click', function (e) {
        if (!helpTrigger.contains(e.target)) helpTrigger.classList.remove('open');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') helpTrigger.classList.remove('open');
      });
    }

        var i18n = window.APP_I18N;
    if (i18n && i18n.lang && i18n.lang !== 'en') {
      function localizedValidationMessage(input) {
        var v = input.validity;
        if (!v || v.valid) { return ''; }
        if (v.valueMissing)  { return i18n.required; }
        if (v.typeMismatch)  { return input.type === 'email' ? i18n.email : (input.type === 'url' ? i18n.url : i18n.generic); }
        if (v.tooShort)      { return i18n.tooShort; }
        if (v.tooLong)       { return i18n.tooLong; }
        if (v.patternMismatch) { return i18n.pattern; }
        if (v.badInput)      { return i18n.number; }
        if (v.rangeUnderflow || v.rangeOverflow || v.stepMismatch) { return i18n.number; }
        return i18n.generic;
      }
      var fields = document.querySelectorAll('input, select, textarea');
      for (var fi = 0; fi < fields.length; fi++) {
        (function (field) {
          field.addEventListener('invalid', function () {
            field.setCustomValidity('');
            var msg = localizedValidationMessage(field);
            if (msg) { field.setCustomValidity(msg); }
          });
          field.addEventListener('input', function () { field.setCustomValidity(''); });
          field.addEventListener('change', function () { field.setCustomValidity(''); });
        })(fields[fi]);
      }
    }
  });
})();
(function () {
  function initNav() {
    var toggle = document.getElementById('navToggle');
    var navbar = document.querySelector('.navbar');
    var menu = document.getElementById('navLinksCenter');
    if (!toggle || !navbar || !menu) return;
    function close() { navbar.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); }
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = navbar.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('click', function (e) {
      if (navbar.classList.contains('nav-open') && !navbar.contains(e.target)) close();
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 768) close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNav);
  else initNav();
})();

(function () {
  document.addEventListener('click', function (e) {
    var closer = e.target.closest('[data-close-modal]');
    if (closer) { var m = closer.closest('.modal'); if (m) m.style.display = 'none'; return; }
    if (e.target.closest('[data-print]')) { window.print(); }
  });
})();
