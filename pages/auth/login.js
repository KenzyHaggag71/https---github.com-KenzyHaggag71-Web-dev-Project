// Login page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  loadSharedComponents();
  
  var loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }
  
  var loginEmail = document.getElementById('loginEmail');
  var loginPassword = document.getElementById('loginPassword');
  
  if (loginEmail) {
    loginEmail.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleLogin();
    });
  }
  
  if (loginPassword) {
    loginPassword.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleLogin();
    });
  }
});

function handleLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var password = document.getElementById('loginPassword').value;
  var role = document.getElementById('loginRole').value;
  
  if (!email || !password) {
    showToast('Please enter email and password', false);
    return;
  }
  
  var user = window.db.authenticate(email, password, role);
  
  if (!user) {
    showToast('Invalid email, password, or role', false);
    return;
  }
  
  if (user.status === 'blocked') {
    showToast('Account blocked. Contact admin.', false);
    return;
  }
  
  if (user.role === 'company' && user.status === 'pending') {
    showToast('Your company is pending admin approval.', false);
    return;
  }
  
  if (user.role === 'mentor' && user.status === 'pending') {
    showToast('Your mentor application is pending admin approval.', false);
    return;
  }
  
  var currentUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    year: user.year,
    profile: user.profile,
    companyName: user.companyName,
    takenInternships: user.takenInternships || []
  };
  
  localStorage.setItem('ih_current_user', JSON.stringify(currentUser));
  showToast('Welcome, ' + user.name + '!');
  
  setTimeout(function() {
    redirectToRoleDashboard();
  }, 500);
}