
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

function getCurrentUser() {
  var userStr = localStorage.getItem('ih_current_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function logout() {
  localStorage.removeItem('ih_current_user');
  window.location.href = '/index.html';
}

function checkAuthAndUpdateNav() {
  currentUser = getCurrentUser();
  setupNavLinks();
}

function showToast(msg, isSuccess) {
  if (isSuccess === undefined) isSuccess = true;
  var toast = document.getElementById('toastMsg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastMsg';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = (isSuccess ? '✓ ' : '⚠ ') + msg;
  toast.style.background = isSuccess ? 'rgba(46,54,72,0.95)' : 'rgba(180,30,30,0.92)';
  toast.style.opacity = '1';
  clearTimeout(toast._tmr);
  toast._tmr = setTimeout(function() { toast.style.opacity = '0'; }, 3500);
}

function isValidUniversityEmail(email) {
  var e = email.toLowerCase().trim();
  return e.endsWith('.edu') || e.endsWith('.edu.eg');
}

function redirectToRoleDashboard() {
  var user = getCurrentUser();
  if (!user) {
    window.location.href = '/pages/auth/login.html';
    return;
  }
  
  switch(user.role) {
    case 'admin':
      window.location.href = '/pages/admin/dashboard.html';
      break;
    case 'company':
      window.location.href = '/pages/company/dashboard.html';
      break;
    case 'mentor':
      window.location.href = '/pages/mentor/dashboard.html';
      break;
    case 'user':
      window.location.href = '/pages/student/dashboard.html';
      break;
    default:
      window.location.href = '/index.html';
  }
}

function formatMonthlyStipend(usd) {
  var n = Math.round(Number(usd));
  if (!Number.isFinite(n) || n < 0) return 'See listing';
  return '$' + n.toLocaleString('en-US') + '/mo';
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.showToast = showToast;
window.isValidUniversityEmail = isValidUniversityEmail;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.logout = logout;
window.redirectToRoleDashboard = redirectToRoleDashboard;
window.checkAuthAndUpdateNav = checkAuthAndUpdateNav;
window.formatMonthlyStipend = formatMonthlyStipend;
window.escapeHtml = escapeHtml;
window.loadSharedComponents = loadSharedComponents;