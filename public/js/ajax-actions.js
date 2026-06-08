(function () {
  'use strict';

  function toast(message, ok) {
    if (typeof window.showToast === 'function') window.showToast(message, !!ok);
  }
  function closestItem(el) {
    return el.closest('[data-ajax-item]') || el.closest('tr') || el.closest('li') || el.parentElement;
  }
  function makeBadge(text) {
    var span = document.createElement('span');
    span.className = 'status-badge ajax-done';
    span.textContent = text;
    return span;
  }

  function handle(form) {
    var behavior = form.getAttribute('data-ajax') || 'toast';

    var confirmMsg = form.getAttribute('data-ajax-confirm');
    if (confirmMsg && !window.confirm(confirmMsg)) return; 

    var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]') || form.querySelector('button');

    
    function nativeSubmit() {
      form.removeAttribute('data-ajax');           
      if (submitBtn) submitBtn.disabled = false;
      HTMLFormElement.prototype.submit.call(form); 
    }

    if (submitBtn) submitBtn.disabled = true;

    var method = (form.getAttribute('method') || 'POST').toUpperCase();
    var opts = { method: method, headers: { 'X-Requested-With': 'fetch' }, credentials: 'same-origin' };
    if (method !== 'GET') {
      var hasFile = !!form.querySelector('input[type="file"]');
      
      
      
      opts.body = hasFile ? new FormData(form) : new URLSearchParams(new FormData(form));
    }

    fetch(form.getAttribute('action'), opts)
      .then(function (r) {
        return r.text().then(function (txt) {
          var body = null;
          try { body = JSON.parse(txt); } catch (e) { body = null; }
          return { status: r.status, body: body };
        });
      })
      .then(function (res) {
        
        if (res.body === null) {
          console.warn('[InternHub] No-reload unavailable: the server returned a page instead of JSON. ' +
                       'You are likely running an old server — stop it and run "node app.js" again. Check /__buildcheck.');
          nativeSubmit();
          return;
        }

        var ok = res.status >= 200 && res.status < 300 && res.body.ok;
        if (!ok) {
          if (submitBtn) submitBtn.disabled = false;
          toast(res.body.message || 'Something went wrong.', false);
          return;
        }

        toast(res.body.message || 'Done.', true);

        if (behavior === 'remove') {
          var item = closestItem(form);
          if (item) { item.style.transition = 'opacity .25s ease'; item.style.opacity = '0'; setTimeout(function () { item.remove(); }, 250); }
        } else if (behavior === 'status') {
          var label = form.getAttribute('data-ajax-done') || res.body.status || 'Done';
          var box = form.closest('[data-ajax-actions]');
          if (box) { box.innerHTML = ''; box.appendChild(makeBadge(label)); }
          else if (form.parentNode) { form.parentNode.replaceChild(makeBadge(label), form); }
        } else if (behavior === 'toggle') {
          if (submitBtn) {
            submitBtn.disabled = false;
            var blocked = res.body.status === 'blocked';
            submitBtn.textContent = blocked ? (form.getAttribute('data-label-unblock') || 'Unblock')
                                            : (form.getAttribute('data-label-block') || 'Block');
          }
          var row = closestItem(form);
          var statusCell = row && row.querySelector('[data-ajax-status]');
          if (statusCell) statusCell.innerHTML = '<span class="status-badge status-' + res.body.status + '">' + res.body.status + '</span>';
        } else if (behavior === 'reset') {
          form.reset();
          var modalSel = form.getAttribute('data-ajax-modal');
          if (modalSel) { var m = document.querySelector(modalSel); if (m) m.style.display = 'none'; }
          if (submitBtn) submitBtn.disabled = false;
        } else {
          if (submitBtn) submitBtn.disabled = false;
        }
      })
      .catch(function () { nativeSubmit(); }); 
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || typeof form.matches !== 'function' || !form.matches('form[data-ajax]')) return;
    e.preventDefault();
    try { handle(form); }
    catch (err) {
      console.error('[InternHub] ajax-actions error, submitting normally:', err);
      form.removeAttribute('data-ajax');
      HTMLFormElement.prototype.submit.call(form);
    }
  });

  console.log('[InternHub] AJAX actions ready (fail-safe: falls back to normal submit).');
})();
