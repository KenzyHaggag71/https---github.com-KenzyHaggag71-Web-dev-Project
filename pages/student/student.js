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