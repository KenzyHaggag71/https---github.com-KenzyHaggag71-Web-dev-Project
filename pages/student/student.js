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

function renderInternships(internshipsList, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  
  if (!internshipsList || internshipsList.length === 0) {
    container.innerHTML = '<div class="text-center" style="padding: 3rem; background: white; border-radius: var(--radius-lg);">' +
      '<i class="fas fa-search" style="font-size: 3rem; color: #999;"></i>' +
      '<p style="margin-top: 1rem; color: var(--text-light);">No internships found.</p>' +
      '</div>';
    return;
  }
  
  var savedInternships = JSON.parse(localStorage.getItem('ih_saved') || '[]');
  var html = '';
  
  for (var i = 0; i < internshipsList.length; i++) {
    var intern = internshipsList[i];
    var saved = savedInternships.indexOf(intern.id) !== -1;
    var wmClass = 'work-mode-' + (intern.workMode || 'Remote').replace(/[^a-zA-Z]/g, '');
    var typeClass = intern.type === 'Paid' ? 'type-paid' : intern.type === 'Volunteer' ? 'type-volunteer' : 'type-unpaid';
    var priceLabel = intern.type === 'Paid' ? intern.stipend : (intern.type || 'Unpaid');
    
    html += '<div class="intern-card">' +
      '<div class="card-header">' +
        '<div class="company-icon"><i class="' + (intern.icon || 'fas fa-briefcase') + '"></i></div>' +
        '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;">' +
          '<span class="work-mode-badge ' + wmClass + '">' + (intern.workMode || 'Remote') + '</span>' +
          '<span class="type-badge ' + typeClass + '">' + (intern.type || 'Paid') + '</span>' +
        '</div>' +
      '</div>' +
      '<h3 class="intern-title">' + escapeHtml(intern.title) + '</h3>' +
      '<div class="company-name"><i class="fas fa-building"></i> ' + escapeHtml(intern.company) + '</div>' +
      '<div class="details">' +
        '<span><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(intern.location) + '</span>' +
        '<span><i class="far fa-calendar-alt"></i> ' + escapeHtml(intern.duration) + '</span>' +
        '<span><i class="fas fa-dollar-sign"></i> ' + escapeHtml(priceLabel) + '</span>' +
      '</div>' +
      '<p class="desc">' + escapeHtml(intern.description) + '</p>';
    
    if (intern.skills && intern.skills.length > 0) {
      html += '<div class="skills-tags-small">';
      for (var s = 0; s < Math.min(intern.skills.length, 4); s++) {
        html += '<span class="skill-tag-small">' + escapeHtml(intern.skills[s]) + '</span>';
      }
      html += '</div>';
    }
    
    html += '<div class="card-footer">' +
        '<button class="apply-btn" data-id="' + intern.id + '">✨ Quick Apply</button>';
    
    if (intern.link) {
      html += '<a href="' + intern.link + '" target="_blank" class="apply-btn" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">🔗 Visit</a>';
    }
    
    html += '<button class="save-btn ' + (saved ? 'saved' : '') + '" data-id="' + intern.id + '">' +
          '<i class="' + (saved ? 'fas' : 'far') + ' fa-bookmark"></i>' +
        '</button>' +
      '</div>' +
    '</div>';
  }
  
  container.innerHTML = html;
  
  var applyBtns = container.querySelectorAll('.apply-btn');
  for (var a = 0; a < applyBtns.length; a++) {
    applyBtns[a].addEventListener('click', function(e) {
      var id = parseInt(this.getAttribute('data-id'));
      openApplyModal(id);
    });
  }
  
  var saveBtns = container.querySelectorAll('.save-btn');
  for (var b = 0; b < saveBtns.length; b++) {
    saveBtns[b].addEventListener('click', function(e) {
      e.stopPropagation();
      var id = parseInt(this.getAttribute('data-id'));
      toggleSaveInternship(id);
    });
  }
}

function toggleSaveInternship(id) {
  var user = getCurrentUser();
  if (!user) {
    window.location.href = '/pages/auth/login.html';
    return;
  }
  
  var saved = JSON.parse(localStorage.getItem('ih_saved') || '[]');
  var idx = saved.indexOf(id);
  
  if (idx === -1) {
    saved.push(id);
    showToast('Internship saved!');
  } else {
    saved.splice(idx, 1);
    showToast('Removed from saved list');
  }
  
  localStorage.setItem('ih_saved', JSON.stringify(saved));
  
  var path = window.location.pathname;
  if (path.includes('dashboard.html')) {
    renderSavedInternships();
  } else if (path.includes('explore.html')) {
    renderFilteredInternships();
  }
}

function openApplyModal(internId) {
  var allInternships = window.db.getAllInternships();
  var intern = null;
  for (var i = 0; i < allInternships.length; i++) {
    if (allInternships[i].id === internId) {
      intern = allInternships[i];
      break;
    }
  }
  if (!intern) return;
  
  var modal = document.getElementById('applyModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalCompany = document.getElementById('modalCompany');
  var modalWorkMode = document.getElementById('modalWorkMode');
  
  if (modalTitle) modalTitle.textContent = intern.title;
  if (modalCompany) modalCompany.textContent = intern.company;
  if (modalWorkMode) modalWorkMode.textContent = intern.workMode || 'Not specified';
  
  var user = getCurrentUser();
  if (user && user.profile) {
    var previewName = document.getElementById('previewName');
    var previewUniversity = document.getElementById('previewUniversity');
    var previewMajor = document.getElementById('previewMajor');
    var applyWarning = document.getElementById('applyWarning');
    
    if (previewName) previewName.textContent = user.profile.fullName || user.name;
    if (previewUniversity) previewUniversity.textContent = user.profile.university || 'Not set';
    if (previewMajor) previewMajor.textContent = user.profile.major || 'Not set';
    if (applyWarning) applyWarning.style.display = 'none';
  } else {
    var applyWarning = document.getElementById('applyWarning');
    if (applyWarning) applyWarning.style.display = 'flex';
  }
  
  if (modal) modal.style.display = 'flex';
  selectedInternshipId = internId;
}

function closeApplyModal() {
  var modal = document.getElementById('applyModal');
  if (modal) modal.style.display = 'none';
  selectedInternshipId = null;
}

function submitApplication() {
  var allInternships = window.db.getAllInternships();
  var intern = null;
  for (var i = 0; i < allInternships.length; i++) {
    if (allInternships[i].id === selectedInternshipId) {
      intern = allInternships[i];
      break;
    }
  }
  if (!intern) return;
  
  var user = getCurrentUser();
  if (!user || !user.profile) {
    showToast('Please complete your profile first', false);
    return;
  }
  
  if (!user.takenInternships) user.takenInternships = [];
  if (user.takenInternships.indexOf(selectedInternshipId) === -1) {
    user.takenInternships.push(selectedInternshipId);
    localStorage.setItem('ih_current_user', JSON.stringify(user));
    
    var userInDB = window.db.getUserById(user.id);
    if (userInDB) {
      userInDB.takenInternships = user.takenInternships;
      window.db.saveUsers();
    }
  }
  
  showToast('Application submitted to ' + intern.company + '!');
  closeApplyModal();
}

function renderCompanies() {
  var users = window.db.getAllUsers();
  var approvedCompanies = [];
  for (var i = 0; i < users.length; i++) {
    if (users[i].role === 'company' && users[i].status === 'approved') {
      approvedCompanies.push(users[i]);
    }
  }
  var container = document.getElementById('companiesContainer');
  
  if (!container) return;
  
  if (approvedCompanies.length === 0) {
    container.innerHTML = '<p class="text-center" style="padding: 2rem;">No approved companies yet.</p>';
    return;
  }
  
  var html = '';
  for (var c = 0; c < approvedCompanies.length; c++) {
    var company = approvedCompanies[c];
    var site = (company.website || '').trim();
    var href = site && (site.indexOf('http') === 0 ? site : 'https://' + site);
    html += '<div class="company-directory-card">' +
      '<div class="company-directory-icon"><i class="fas fa-building"></i></div>' +
      '<h3>' + escapeHtml(company.companyName || company.name) + '</h3>' +
      '<p class="company-directory-meta">' + escapeHtml(company.industry || 'Industry not specified') + '</p>' +
      '<p class="company-directory-desc">' + escapeHtml(company.description || '') + '</p>';
    if (href) {
      html += '<a class="company-directory-link" href="' + escapeHtml(href) + '" target="_blank">Website <i class="fas fa-external-link-alt"></i></a>';
    }
    html += '</div>';
  }
  container.innerHTML = html;
}