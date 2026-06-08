(function () {
  if (typeof Chart === 'undefined') return;
  var holder = document.getElementById('admin-charts-data');
  if (!holder) return;
  var C;
  try { C = JSON.parse(holder.textContent || '{}'); } catch (e) { return; }

  var palette = ['#3457DC','#16A34A','#D97706','#DC2626','#9333EA','#0891B2','#DB2777','#65A30D','#EA580C'];
  var gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border') || '#E4E4E4';
  Chart.defaults.font.family = 'Plus Jakarta Sans, Cairo, sans-serif';

  new Chart(document.getElementById('chartUsers'), {
    type: 'bar',
    data: { labels: C.roleLabels, datasets: [{ data: C.roleData, backgroundColor: palette.slice(0,3), borderRadius: 6 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridColor } }, x: { grid: { display: false } } } }
  });
  new Chart(document.getElementById('chartCats'), {
    type: 'doughnut',
    data: { labels: C.catLabels, datasets: [{ data: C.catData, backgroundColor: palette }] },
    options: { plugins: { legend: { position: 'bottom', rtl: C.rtl, labels: { boxWidth: 12, font: { size: 11 } } } } }
  });
  new Chart(document.getElementById('chartStatus'), {
    type: 'bar',
    data: { labels: C.statusLabels, datasets: [{ data: C.statusData, backgroundColor: palette.slice(0,4), borderRadius: 6 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridColor } }, x: { grid: { display: false } } } }
  });
})();
