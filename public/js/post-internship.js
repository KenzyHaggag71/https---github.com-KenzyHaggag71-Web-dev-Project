(function () {
  var el = document.getElementById('pickMap');
  if (el && typeof L !== 'undefined') {
    var latIn = document.getElementById('latInput');
    var lngIn = document.getElementById('lngInput');
    var coordsEl = document.getElementById('pickCoords');
    var clearBtn = document.getElementById('clearPin');
    var start = [30.0444, 31.2357], zoom = 6, marker = null;
    var hasPin = latIn.value && lngIn.value;
    if (hasPin) { start = [parseFloat(latIn.value), parseFloat(lngIn.value)]; zoom = 13; }
    var map = L.map('pickMap', { scrollWheelZoom: false }).setView(start, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(map);
    function setPin(lat, lng) {
      if (marker) { marker.setLatLng([lat, lng]); } else { marker = L.marker([lat, lng]).addTo(map); }
      latIn.value = lat.toFixed(6); lngIn.value = lng.toFixed(6);
      coordsEl.textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
    }
    if (hasPin) setPin(start[0], start[1]);
    map.on('click', function (e) { setPin(e.latlng.lat, e.latlng.lng); });
    clearBtn.addEventListener('click', function () {
      if (marker) { map.removeLayer(marker); marker = null; }
      latIn.value = ''; lngIn.value = '';
      coordsEl.textContent = clearBtn.getAttribute('data-none') || '';
    });
    setTimeout(function () { map.invalidateSize(); }, 200);
  }

  var typeSel = document.getElementById('typeSelect');
  var curSel = document.getElementById('currencySelect');
  var price = document.getElementById('priceInput');
  if (typeSel && curSel && price) {
    function symbol() { return curSel.value === 'USD' ? '$' : 'EGP'; }
    function refresh() {
      var paid = typeSel.value === 'Paid';
      price.disabled = !paid; curSel.disabled = !paid; price.required = paid;
      if (!paid) { price.value = ''; }
      price.placeholder = paid ? (symbol() + ' amount per month, e.g. 4500') : 'Not applicable for unpaid roles';
    }
    typeSel.addEventListener('change', refresh);
    curSel.addEventListener('change', refresh);
    refresh();
  }
})();
