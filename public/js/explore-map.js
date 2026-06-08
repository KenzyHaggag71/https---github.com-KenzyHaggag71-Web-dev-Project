(function(){try{var el=document.getElementById("internships-data");if(el&&!window.__INTERNSHIPS){window.__INTERNSHIPS=JSON.parse(el.textContent||"[]");}}catch(e){}})();
(function () {
  var COORDS = {
    'AUC Avenue, New Cairo': [30.018, 31.499],
    'Cairo Festival City, Cairo': [30.029, 31.408],
    'Dokki, Giza': [30.038, 31.212],
    'Downtown, Cairo': [30.0444, 31.2357],
    'Garden City, Cairo': [30.037, 31.230],
    'Heliopolis, Cairo': [30.088, 31.324],
    'Helwan, Cairo': [29.849, 31.334],
    'Maadi, Cairo': [29.960, 31.257],
    'Media Production City, Giza': [29.98, 30.95],
    'Mohandessin, Giza': [30.056, 31.200],
    'Nasr City, Cairo': [30.056, 31.330],
    'New Administrative Capital, Cairo': [30.020, 31.740],
    'New Cairo, Cairo': [30.030, 31.470],
    'Obour City, Cairo': [30.228, 31.470],
    'Smart Village, Giza': [30.071, 30.971],
    'Zamalek, Cairo': [30.061, 31.224]
  };

  function coordsFor(loc) {
    if (!loc) return null;
    if (COORDS[loc]) return COORDS[loc];
    var l = String(loc).toLowerCase();
    if (l.indexOf('giza') > -1) return [30.0131, 31.2089];
    if (l.indexOf('cairo') > -1) return [30.0444, 31.2357];
    if (l.indexOf('alexandria') > -1) return [31.2001, 29.9187];
    return null;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var el = document.getElementById('exploreMap');
    if (!el || typeof L === 'undefined') return;

    var DEFAULT_CENTER = [30.0444, 31.2357];
    var DEFAULT_ZOOM = 6;

    var map = L.map('exploreMap', { scrollWheelZoom: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    
    var markersLayer = L.layerGroup().addTo(map);
    
    var emptyNote = document.getElementById('exploreMapEmpty');

    function render(data) {
      markersLayer.clearLayers();
      data = Array.isArray(data) ? data : [];
      var bounds = [];

      data.forEach(function (it) {
        var lat, lng;
        if (it.lat != null && it.lng != null) {
          lat = it.lat; lng = it.lng;               
        } else {
          var c = coordsFor(it.location);
          if (!c) return;                            
          lat = c[0] + (Math.random() - 0.5) * 0.012; 
          lng = c[1] + (Math.random() - 0.5) * 0.012;
        }
        L.marker([lat, lng]).addTo(markersLayer).bindPopup(
          '<strong>' + escapeHtml(it.title) + '</strong><br>' +
          escapeHtml(it.company) + '<br><small>' + escapeHtml(it.location) + '</small>'
        );
        bounds.push([lat, lng]);
      });

      if (bounds.length) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 });
        if (emptyNote) emptyNote.classList.add('u-hidden');
      } else {
        
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        if (emptyNote) emptyNote.classList.remove('u-hidden');
      }
      
      setTimeout(function () { map.invalidateSize(); }, 50);
    }

    
    render(window.__INTERNSHIPS || []);

    
    window.exploreMapUpdate = render;
  });
})();
