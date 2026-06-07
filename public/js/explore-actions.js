

(function () {
  'use strict';

  var I18N = window.__EXPLORE_I18N || {};
  function L(key, fallback) { return I18N[key] || fallback; }

  function notify(message, ok) {
    if (typeof window.showToast === 'function') window.showToast(message, !!ok);
  }

  function init() {
   
    var applyForm = document.getElementById('applyForm');
    var applyModal = document.getElementById('applyModal');

    if (applyForm) {
      applyForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var submitBtn = applyForm.querySelector('button[type="submit"]');
        var idField = document.getElementById('applyInternshipId');
        var internshipId = idField ? idField.value : '';
        var data = new FormData(applyForm); // includes the CV file + internshipId

        if (submitBtn) submitBtn.disabled = true;

        fetch('/student/apply', {
          method: 'POST',
          headers: { 'X-Requested-With': 'fetch' }, // do NOT set Content-Type; browser adds the multipart boundary
          body: data
        })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); })
          .then(function (res) {
            if (submitBtn) submitBtn.disabled = false;
            if (res.status >= 200 && res.status < 300 && res.body.ok) {
              if (applyModal) applyModal.style.display = 'none';
              applyForm.reset();
              notify(res.body.message || L('appliedMsg', 'Application submitted!'), true);
              // Turn that card's Apply button into a non-clickable "Applied" badge.
              var btn = document.querySelector('.btn-primary.btn-sm[data-id="' + internshipId + '"]');
              if (btn) {
                var done = document.createElement('span');
                done.className = 'btn-sm btn-saved';
                done.innerHTML = '<i class="fas fa-check"></i> ' + L('applied', 'Applied');
                btn.parentNode.replaceChild(done, btn);
              }
            } else {
              notify((res.body && res.body.message) || L('genericError', 'Something went wrong.'), false);
            }
          })
          .catch(function () {
            if (submitBtn) submitBtn.disabled = false;
            notify(L('genericError', 'Something went wrong.'), false);
          });
      });
    }

   
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form || !form.matches || !form.matches('form[action^="/student/save-internship/"]')) return;
      e.preventDefault();

      var btn = form.querySelector('button');
      if (btn) btn.disabled = true;

      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'X-Requested-With': 'fetch' }
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (res) {
          if (res.status >= 200 && res.status < 300 && res.body.ok) {
            var done = document.createElement('span');
            done.className = 'btn-sm btn-saved';
            done.innerHTML = '<i class="fas fa-bookmark"></i> ' + L('saved', 'Saved');
            form.parentNode.replaceChild(done, form);
            notify(res.body.message || L('savedMsg', 'Internship saved!'), true);
          } else {
            if (btn) btn.disabled = false;
            notify((res.body && res.body.message) || L('genericError', 'Something went wrong.'), false);
          }
        })
        .catch(function () {
          if (btn) btn.disabled = false;
          notify(L('genericError', 'Something went wrong.'), false);
        });
    });

    console.log('[InternHub] Live apply & save active (no page reloads).');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
