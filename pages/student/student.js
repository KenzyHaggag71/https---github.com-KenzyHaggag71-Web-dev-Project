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