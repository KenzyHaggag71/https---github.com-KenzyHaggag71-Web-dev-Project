var currentStudent = null;
var selectedInternshipId = null;
var selectedProjectId = null;

document.addEventListener('DOMContentLoaded', function() {
  loadSharedComponents();
  
  currentStudent = getCurrentUser();
  
  // Check which page we're on and initialize accordingly
  var path = window.location.pathname;
  
  if (path.includes('dashboard.html')) {
    if (!currentStudent || currentStudent.role !== 'user') {
      window.location.href = '/pages/auth/login.html';
      return;
    }
    renderSavedInternships();
    setupDashboardEventListeners();
  } 
  else if (path.includes('explore.html')) {
    if (!currentStudent) {
      window.location.href = '/pages/auth/login.html';
      return;
    }
    initExplorePage();
    setupExploreEventListeners();
  }
  else if (path.includes('projects.html')) {
    if (!currentStudent || currentStudent.role !== 'user') {
      window.location.href = '/pages/auth/login.html';
      return;
    }
    renderStudentProjects();
    setupProjectsEventListeners();
  }
  else if (path.includes('companies.html')) {
    if (!currentStudent) {
      window.location.href = '/pages/auth/login.html';
      return;
    }
    renderCompanies();
  }
});

function setupDashboardEventListeners() {
  var closeModalBtn = document.getElementById('closeApplyModalBtn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeApplyModal);
  }
  
  var submitApplyBtn = document.getElementById('submitApplyBtn');
  if (submitApplyBtn) {
    submitApplyBtn.addEventListener('click', submitApplication);
  }
  
  var modal = document.getElementById('applyModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeApplyModal();
    });
  }
}

function renderSavedInternships() {
  var savedIds = JSON.parse(localStorage.getItem('ih_saved') || '[]');
  var allInternships = window.db.getAllInternships();
  var savedInternships = [];
  for (var i = 0; i < allInternships.length; i++) {
    if (savedIds.indexOf(allInternships[i].id) !== -1) {
      savedInternships.push(allInternships[i]);
    }
  }
  renderInternships(savedInternships, 'savedInternshipsContainer');
}

var currentWorkModeFilter = 'all';
var currentSort = 'recent';
var currentCategory = null;

function initExplorePage() {
  var urlParams = new URLSearchParams(window.location.search);
  currentCategory = urlParams.get('category');
  
  if (currentCategory) {
    var headerH1 = document.querySelector('.page-header h1');
    if (headerH1) {
      headerH1.innerHTML = '<i class="fas fa-folder-open"></i> ' + escapeHtml(currentCategory) + ' Internships';
    }
    var headerP = document.querySelector('.page-header p');
    if (headerP) {
      headerP.textContent = 'Explore internships in ' + escapeHtml(currentCategory);
    }
  }
  
  renderFilteredInternships();
}

function setupExploreEventListeners() {
  var modeBtns = document.querySelectorAll('.work-mode-btn');
  for (var i = 0; i < modeBtns.length; i++) {
    modeBtns[i].addEventListener('click', function() {
      var btns = document.querySelectorAll('.work-mode-btn');
      for (var j = 0; j < btns.length; j++) {
        btns[j].classList.remove('active');
      }
      this.classList.add('active');
      currentWorkModeFilter = this.getAttribute('data-mode');
      renderFilteredInternships();
    });
  }
  
  var sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', function(e) {
      currentSort = e.target.value;
      renderFilteredInternships();
    });
  }
  
  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      var term = e.target.value.trim();
      if (term.length >= 2) {
        performSearch(term);
      } else if (term.length === 0) {
        renderFilteredInternships();
      }
    });
  }
  
  var closeModalBtn = document.getElementById('closeApplyModalBtn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeApplyModal);
  }
  
  var submitApplyBtn = document.getElementById('submitApplyBtn');
  if (submitApplyBtn) {
    submitApplyBtn.addEventListener('click', submitApplication);
  }
  
  var modal = document.getElementById('applyModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeApplyModal();
    });
  }
}

function renderFilteredInternships() {
  var internships = currentCategory ? window.db.getInternshipsByCategory(currentCategory) : window.db.getAllInternships();
  var filtered = [];
  
  if (currentWorkModeFilter !== 'all') {
    for (var i = 0; i < internships.length; i++) {
      if (internships[i].workMode === currentWorkModeFilter) {
        filtered.push(internships[i]);
      }
    }
  } else {
    filtered = internships.slice();
  }
  
  if (currentSort === 'stipend-high') {
    filtered.sort(function(a, b) { return (b.price || 0) - (a.price || 0); });
  } else if (currentSort === 'stipend-low') {
    filtered.sort(function(a, b) { return (a.price || 0) - (b.price || 0); });
  } else {
    filtered.sort(function(a, b) { return new Date(b.postedDate) - new Date(a.postedDate); });
  }
  
  renderInternships(filtered, 'internshipsContainer');
}

function performSearch(term) {
  var t = term.toLowerCase().trim();
  var allInternships = window.db.getAllInternships();
  var results = [];
  for (var i = 0; i < allInternships.length; i++) {
    var intern = allInternships[i];
    if (intern.title.toLowerCase().indexOf(t) !== -1 || 
        intern.company.toLowerCase().indexOf(t) !== -1 ||
        intern.description.toLowerCase().indexOf(t) !== -1 || 
        intern.category.toLowerCase().indexOf(t) !== -1) {
      results.push(intern);
    }
  }
  
  if (currentWorkModeFilter !== 'all') {
    var filtered = [];
    for (var r = 0; r < results.length; r++) {
      if (results[r].workMode === currentWorkModeFilter) {
        filtered.push(results[r]);
      }
    }
    results = filtered;
  }
  
  renderInternships(results, 'internshipsContainer');
}