var currentAdmin = null;
var allUsersCache = [];

document.addEventListener('DOMContentLoaded', function() {
  loadSharedComponents();
  
  currentAdmin = getCurrentUser();
  if (!currentAdmin || currentAdmin.role !== 'admin') {
    window.location.href = '/pages/auth/login.html';
    return;
  }
  
  var path = window.location.pathname;
  
  if (path.includes('users.html')) {
    loadAllUsers();
    setupUsersEventListeners();
  } 
  else if (path.includes('approvals.html')) {
    loadPendingCompanies();
    loadPendingMentors();
  }
  else {
    renderAdminDashboard();
  }
});
