(function(){try{var el=document.getElementById("category-labels-data");if(el&&!window.CATEGORY_LABELS){window.CATEGORY_LABELS=JSON.parse(el.textContent||"{}");}}catch(e){}})();

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

        var d = document.getElementById('cbDays');
    var h = document.getElementById('cbHrs');
    var m = document.getElementById('cbMins');
    var s = document.getElementById('cbSecs');

    if (d && h && m && s) {
      var target = new Date();
      target.setDate(target.getDate() + 4);
      target.setHours(target.getHours() + 12);
      target.setMinutes(target.getMinutes() + 37);

      function pad(n) {
        var str = String(n);
        return str.length < 2 ? '0' + str : str;
      }

      function tick() {
        var diff = target - new Date();
        if (diff < 0) { diff = 0; }
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var mins = Math.floor((diff % 3600000) / 60000);
        var secs = Math.floor((diff % 60000) / 1000);
        d.textContent = pad(days);
        h.textContent = pad(hours);
        m.textContent = pad(mins);
        s.textContent = pad(secs);
      }
      tick();
      setInterval(tick, 1000);
    }

        var video = document.getElementById('spotlightVideo');
    if (video) {
      video.addEventListener('error', function () { video.style.display = 'none'; });
      setTimeout(function () {
        if (video.readyState < 2) { video.style.display = 'none'; }
      }, 4000);
    }

        var categories = [
      { name: 'Computer Science',   icon: 'fa-laptop-code',         desc: 'Software, AI, Cloud, Cybersecurity' },
      { name: 'Engineering',        icon: 'fa-cogs',                desc: 'Mechanical, Electrical, Civil' },
      { name: 'Business',           icon: 'fa-chart-pie',           desc: 'Marketing, Finance, Consulting' },
      { name: 'Law',                icon: 'fa-gavel',               desc: 'Corporate Law, Legal Research' },
      { name: 'Pharmacy',           icon: 'fa-prescription-bottle', desc: 'Clinical Research, Pharma' },
      { name: 'Architecture',       icon: 'fa-drafting-compass',    desc: 'Design, Urban Planning' },
      { name: 'Mass Communication', icon: 'fa-newspaper',           desc: 'Journalism, PR, Media' },
      { name: 'Arts & Design',      icon: 'fa-palette',             desc: 'Graphic Design, UI/UX' },
      { name: 'Science',            icon: 'fa-flask',               desc: 'Biology, Chemistry, Physics' }
    ];

    var track = document.getElementById('categoryWheelTrack');
    if (track) {
      var labels = window.CATEGORY_LABELS || {};
      var html = '';
      for (var pass = 0; pass < 2; pass++) {
        for (var i = 0; i < categories.length; i++) {
          var cat = categories[i];
          var label = labels[cat.name] || {};
          var displayName = label.name || cat.name;
          var displayDesc = label.desc || cat.desc;
          html += '<div class="category-card" data-category="' + encodeURIComponent(cat.name) + '">';
          html += '<i class="fas ' + cat.icon + '"></i>';
          html += '<h3>' + displayName + '</h3>';
          html += '<p>' + displayDesc + '</p>';
          html += '</div>';
        }
      }
      track.innerHTML = html;

      var cards = track.querySelectorAll('.category-card');
      for (var c = 0; c < cards.length; c++) {
        cards[c].addEventListener('click', function () {
          window.location.href = '/student/explore?category=' + this.getAttribute('data-category');
        });
      }

      track.addEventListener('mouseenter', function () { track.style.animationPlayState = 'paused'; });
      track.addEventListener('mouseleave', function () { track.style.animationPlayState = 'running'; });
    }
  });
})();
