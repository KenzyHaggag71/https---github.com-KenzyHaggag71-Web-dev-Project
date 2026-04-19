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

function setupUsersEventListeners() {
  var userSearch = document.getElementById('userSearch');
  if (userSearch) {
    userSearch.addEventListener('input', function(e) {
      filterUsers(e.target.value);
    });
  }
}

function renderAdminDashboard() {
  updateAdminStats();
  loadPendingCompanies();
  loadPendingMentors();
}

function updateAdminStats() {
  var users = window.db.getAllUsers();
  var totalUsers = users.length;
  var totalCompanies = 0;
  var totalMentors = 0;
  var totalStudents = 0;
  var pendingCompanies = 0;
  var pendingMentors = 0;
  
  for (var i = 0; i < users.length; i++) {
    if (users[i].role === 'company') {
      totalCompanies++;
      if (users[i].status === 'pending') pendingCompanies++;
    } else if (users[i].role === 'mentor') {
      totalMentors++;
      if (users[i].status === 'pending') pendingMentors++;
    } else if (users[i].role === 'user') {
      totalStudents++;
    }
  }
  
  var statsContainer = document.getElementById('adminStats');
  if (statsContainer) {
    statsContainer.innerHTML = 
      '<div class="admin-stat-card"><i class="fas fa-users"></i><h3>' + totalUsers + '</h3><p>Total Users</p></div>' +
      '<div class="admin-stat-card"><i class="fas fa-building"></i><h3>' + totalCompanies + '</h3><p>Companies</p><small>' + pendingCompanies + ' pending</small></div>' +
      '<div class="admin-stat-card"><i class="fas fa-chalkboard-teacher"></i><h3>' + totalMentors + '</h3><p>Mentors</p><small>' + pendingMentors + ' pending</small></div>' +
      '<div class="admin-stat-card"><i class="fas fa-user-graduate"></i><h3>' + totalStudents + '</h3><p>Students</p></div>';
  }
}

function loadPendingCompanies() {
  var pendingCompanies = window.db.getPendingCompanies();
  var container = document.getElementById('pendingCompaniesList');
  
  if (!container) return;
  
  if (pendingCompanies.length === 0) {
    container.innerHTML = '<p class="text-center" style="padding: 1rem; color: var(--text-light);">No pending company approvals.</p>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < pendingCompanies.length; i++) {
    var company = pendingCompanies[i];
    html += '<div class="pending-item">' +
      '<div class="pending-info">' +
        '<strong><i class="fas fa-building"></i> ' + escapeHtml(company.companyName || company.name) + '</strong>' +
        '<p>📧 ' + escapeHtml(company.email) + '</p>' +
        '<p>🏭 ' + escapeHtml(company.industry || 'Not specified') + '</p>' +
        (company.description ? '<p>📝 ' + escapeHtml(company.description) + '</p>' : '') +
      '</div>' +
      '<div class="pending-actions">' +
        '<button class="approve-btn" onclick="approveCompany(' + company.id + ')">✅ Approve</button>' +
        '<button class="reject-btn" onclick="rejectCompany(' + company.id + ')">❌ Reject</button>' +
      '</div>' +
    '</div>';
  }
  container.innerHTML = html;
}

function loadPendingMentors() {
  var pendingMentors = window.db.getPendingMentors();
  var container = document.getElementById('pendingMentorsList');
  
  if (!container) return;
  
  if (pendingMentors.length === 0) {
    container.innerHTML = '<p class="text-center" style="padding: 1rem; color: var(--text-light);">No pending mentor applications.</p>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < pendingMentors.length; i++) {
    var mentor = pendingMentors[i];
    html += '<div class="pending-item">' +
      '<div class="pending-info">' +
        '<strong><i class="fas fa-chalkboard-teacher"></i> ' + escapeHtml(mentor.profile?.fullName || mentor.name) + '</strong>' +
        '<p>📧 ' + escapeHtml(mentor.email) + '</p>' +
        '<p>🏫 ' + escapeHtml(mentor.profile?.university || 'Not specified') + ' • Year ' + mentor.year + '</p>' +
        '<p>📚 Major: ' + escapeHtml(mentor.profile?.major || 'Not specified') + '</p>' +
      '</div>' +
      '<div class="pending-actions">' +
        '<button class="approve-btn" onclick="approveMentor(' + mentor.id + ')">✅ Approve</button>' +
        '<button class="reject-btn" onclick="rejectMentor(' + mentor.id + ')">❌ Reject</button>' +
      '</div>' +
    '</div>';
  }
  container.innerHTML = html;
}

function loadAllUsers() {
  var users = window.db.getAllUsers();
  allUsersCache = users.slice();
  renderUsersTable(users);
}

function renderUsersTable(users) {
  var container = document.getElementById('usersTableBody');
  if (!container) return;
  
  if (!users || users.length === 0) {
    container.innerHTML = '<tr><td colspan="6" class="text-center">No users found.</td></tr>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    var statusClass = (user.status === 'active' || user.status === 'approved') ? 'status-active' : (user.status === 'blocked' ? 'status-blocked' : 'status-pending');
    var statusText = (user.status === 'active' || user.status === 'approved') ? 'Active' : (user.status === 'blocked' ? 'Blocked' : 'Pending');
    
    var actions = '';
    if (user.role !== 'admin') {
      if (user.status === 'blocked') {
        actions = '<button class="action-btn unblock-btn" onclick="unblockUser(' + user.id + ')">Unblock</button>';
      } else {
        actions = '<button class="action-btn block-btn" onclick="blockUser(' + user.id + ')">Block</button>';
      }
      actions += '<button class="action-btn delete-btn" onclick="deleteUserAccount(' + user.id + ')">Delete</button>';
    } else {
      actions = '<span style="color: #999;">Admin</span>';
    }
    
    html += '<tr>' +
      '<td>' + user.id + '</td>' +
      '<td>' + escapeHtml(user.name) + '</td>' +
      '<td>' + escapeHtml(user.email) + '</td>' +
      '<td><span class="role-badge">' + user.role + '</span></td>' +
      '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>' +
      '<td>' + actions + '</td>' +
    '</tr>';
  }
  container.innerHTML = html;
}

function filterUsers(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    renderUsersTable(allUsersCache);
    return;
  }
  
  var term = searchTerm.toLowerCase().trim();
  var filtered = [];
  for (var i = 0; i < allUsersCache.length; i++) {
    var user = allUsersCache[i];
    if (user.name.toLowerCase().indexOf(term) !== -1 || 
        user.email.toLowerCase().indexOf(term) !== -1 ||
        user.role.toLowerCase().indexOf(term) !== -1) {
      filtered.push(user);
    }
  }
  renderUsersTable(filtered);
}

function approveCompany(id) {
  var success = window.db.updateUser(id, { status: 'approved' });
  if (success) {
    showToast('Company approved successfully!');
    loadPendingCompanies();
    updateAdminStats();
    loadAllUsers();
  }
}

function rejectCompany(id) {
  if (confirm('Are you sure you want to reject this company?')) {
    window.db.deleteUser(id);
    showToast('Company rejected and removed.');
    loadPendingCompanies();
    updateAdminStats();
    loadAllUsers();
  }
}

function approveMentor(id) {
  var success = window.db.updateUser(id, { status: 'approved' });
  if (success) {
    showToast('Mentor approved successfully!');
    loadPendingMentors();
    updateAdminStats();
    loadAllUsers();
  }
}

function rejectMentor(id) {
  if (confirm('Are you sure you want to reject this mentor application?')) {
    window.db.deleteUser(id);
    showToast('Mentor application rejected.');
    loadPendingMentors();
    updateAdminStats();
    loadAllUsers();
  }
}

function blockUser(id) {
  if (confirm('Block this user? They will not be able to log in.')) {
    var success = window.db.updateUser(id, { status: 'blocked' });
    if (success) {
      showToast('User blocked successfully!');
      loadAllUsers();
      updateAdminStats();
      
      var currentUser = getCurrentUser();
      if (currentUser && currentUser.id === id) {
        logout();
      }
    }
  }
}

function unblockUser(id) {
  var user = window.db.getUserById(id);
  var newStatus = (user && user.role === 'company') ? 'approved' : 'active';
  var success = window.db.updateUser(id, { status: newStatus });
  if (success) {
    showToast('User unblocked successfully!');
    loadAllUsers();
    updateAdminStats();
  }
}

function deleteUserAccount(id) {
  if (confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
    var currentUser = getCurrentUser();
    if (currentUser && currentUser.id === id) {
      showToast('You cannot delete your own account.', false);
      return;
    }
    window.db.deleteUser(id);
    showToast('User deleted successfully!');
    loadAllUsers();
    updateAdminStats();
  }
}

window.approveCompany = approveCompany;
window.rejectCompany = rejectCompany;
window.approveMentor = approveMentor;
window.rejectMentor = rejectMentor;
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.deleteUserAccount = deleteUserAccount;
window.loadAllUsers = loadAllUsers;