
var currentUser = null;

async function loadSharedComponents() {
  await loadNavbar();
  await loadFooter();
  checkAuthAndUpdateNav();
}

async function loadNavbar() {
  try {
    var response = await fetch('/shared/components/navbar.html');
    var html = await response.text();
    var navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) navbarPlaceholder.innerHTML = html;
    setupNavLinks();
  } catch (error) {
    console.error('Error loading navbar:', error);
  }
}

async function loadFooter() {
  try {
    var response = await fetch('/shared/components/footer.html');
    var html = await response.text();
    var footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) footerPlaceholder.innerHTML = html;
  } catch (error) {
    console.error('Error loading footer:', error);
  }
}

function setupNavLinks() {
  currentUser = getCurrentUser();
  
  var dashboardLink = document.getElementById('navDashboardLink');
  var projectsLink = document.getElementById('navProjectsLink');
  var mentorLink = document.getElementById('navMentorLink');
  var companyLink = document.getElementById('navCompanyLink');
  var adminLink = document.getElementById('navAdminLink');
  var authBtn = document.getElementById('authNavBtn');
  
  if (currentUser) {
    if (dashboardLink) {
      if (currentUser.role === 'user') dashboardLink.href = '/pages/student/dashboard.html';
      else if (currentUser.role === 'mentor') dashboardLink.href = '/pages/mentor/dashboard.html';
      else if (currentUser.role === 'company') dashboardLink.href = '/pages/company/dashboard.html';
      else if (currentUser.role === 'admin') dashboardLink.href = '/pages/admin/dashboard.html';
    }
    
    if (projectsLink && currentUser.role === 'user') {
      projectsLink.style.display = 'inline-block';
      projectsLink.href = '/pages/student/projects.html';
    }
    
    if (mentorLink && currentUser.role === 'mentor') {
      mentorLink.style.display = 'inline-block';
      mentorLink.href = '/pages/mentor/dashboard.html';
    }
    
    if (companyLink && currentUser.role === 'company') {
      companyLink.style.display = 'inline-block';
      companyLink.href = '/pages/company/dashboard.html';
    }
    
    if (adminLink && currentUser.role === 'admin') {
      adminLink.style.display = 'inline-block';
      adminLink.href = '/pages/admin/dashboard.html';
    }
    
    if (authBtn) {
      var icon = currentUser.role === 'admin' ? '👑' : 
                   currentUser.role === 'company' ? '🏢' : 
                   currentUser.role === 'mentor' ? '🎓' : '👨‍🎓';
      authBtn.innerHTML = '<div class="user-avatar">' +
        '<i class="fas fa-user-circle"></i>' +
        '<span>' + escapeHtml(currentUser.name) + ' (' + icon + ')</span>' +
        '<button class="logout-btn" id="logoutBtn">🚪 Logout</button>' +
        '</div>';
      authBtn.href = "javascript:void(0)";
      
      var logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          logout();
        });
      }
    }
  } else {
    if (authBtn) {
      authBtn.innerHTML = '<i class="far fa-user"></i> <span>Sign In</span>';
      authBtn.href = "/pages/auth/login.html";
    }
  }
}