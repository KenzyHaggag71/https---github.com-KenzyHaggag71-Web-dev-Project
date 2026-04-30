// Signup page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  loadSharedComponents();
  
  setupRoleTabs();
  setupEmailValidation();
  setupSignupButtons();
});

function setupRoleTabs() {
  var tabs = document.querySelectorAll('.signup-role-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function() {
      var role = this.getAttribute('data-role');
      switchRole(role);
    });
  }
}

function switchRole(role) {
  var tabs = document.querySelectorAll('.signup-role-tab');
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].getAttribute('data-role') === role) {
      tabs[i].classList.add('active');
    } else {
      tabs[i].classList.remove('active');
    }
  }
  
  var studentForm = document.getElementById('studentForm');
  var mentorForm = document.getElementById('mentorForm');
  var companyForm = document.getElementById('companyForm');
  
  if (studentForm) studentForm.style.display = role === 'student' ? 'block' : 'none';
  if (mentorForm) mentorForm.style.display = role === 'mentor' ? 'block' : 'none';
  if (companyForm) companyForm.style.display = role === 'company' ? 'block' : 'none';
}

function setupEmailValidation() {
  var studentEmail = document.getElementById('studentEmail');
  var mentorEmail = document.getElementById('mentorEmail');
  
  if (studentEmail) {
    studentEmail.addEventListener('input', function(e) {
      validateEmailField(e.target);
    });
  }
  
  if (mentorEmail) {
    mentorEmail.addEventListener('input', function(e) {
      validateEmailField(e.target);
    });
  }
}

function validateEmailField(input) {
  var icon = input.parentElement.querySelector('.email-validation');
  if (!icon) return;
  
  var isValid = isValidUniversityEmail(input.value);
  if (input.value.length > 3) {
    icon.innerHTML = isValid ? '<i class="fas fa-check-circle" style="color:#22c55e"></i>' : '<i class="fas fa-times-circle" style="color:#ef4444"></i>';
  } else {
    icon.innerHTML = '';
  }
}

function setupSignupButtons() {
  var studentBtn = document.getElementById('studentSignupBtn');
  var mentorBtn = document.getElementById('mentorSignupBtn');
  var companyBtn = document.getElementById('companySignupBtn');
  
  if (studentBtn) studentBtn.addEventListener('click', handleStudentSignup);
  if (mentorBtn) mentorBtn.addEventListener('click', handleMentorSignup);
  if (companyBtn) companyBtn.addEventListener('click', handleCompanySignup);
}

function handleStudentSignup() {
  var name = document.getElementById('studentName').value.trim();
  var email = document.getElementById('studentEmail').value.trim();
  var university = document.getElementById('studentUniversity').value.trim();
  var major = document.getElementById('studentMajor').value;
  var year = document.getElementById('studentYear').value;
  var password = document.getElementById('studentPassword').value;
  var confirm = document.getElementById('studentConfirmPassword').value;
  var terms = document.getElementById('studentTerms').checked;
  
  if (!name || !email || !university || !major || !year || !password) {
    showToast('Please fill in all required fields', false);
    return;
  }
  
  if (!isValidUniversityEmail(email)) {
    showToast('Only .edu or .edu.eg university emails are allowed', false);
    return;
  }
  
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', false);
    return;
  }
  
  if (password !== confirm) {
    showToast('Passwords do not match', false);
    return;
  }
  
  if (!terms) {
    showToast('Please confirm you are a current university student', false);
    return;
  }
  
  var users = window.db.getAllUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email.toLowerCase() === email.toLowerCase()) {
      showToast('Email already registered', false);
      return;
    }
  }
  
  var newUser = {
    id: Date.now(),
    name: name,
    email: email.toLowerCase(),
    password: password,
    role: 'user',
    status: 'active',
    year: parseInt(year),
    profile: {
      fullName: name,
      university: university,
      major: major,
      year: parseInt(year),
      skills: []
    }
  };
  
  window.db.addUser(newUser);
  showToast('Account created! Please sign in.');
  
  setTimeout(function() {
    window.location.href = 'login.html';
  }, 1500);
}

function handleMentorSignup() {
  var name = document.getElementById('mentorName').value.trim();
  var email = document.getElementById('mentorEmail').value.trim();
  var university = document.getElementById('mentorUniversity').value.trim();
  var major = document.getElementById('mentorMajor').value;
  var year = document.getElementById('mentorYear').value;
  var password = document.getElementById('mentorPassword').value;
  var confirm = document.getElementById('mentorConfirmPassword').value;
  var terms = document.getElementById('mentorTerms').checked;
  
  if (!name || !email || !university || !major || !year || !password) {
    showToast('Please fill in all required fields', false);
    return;
  }
  
  if (!isValidUniversityEmail(email)) {
    showToast('Only .edu or .edu.eg university emails are allowed', false);
    return;
  }
  
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', false);
    return;
  }
  
  if (password !== confirm) {
    showToast('Passwords do not match', false);
    return;
  }
  
  if (!terms) {
    showToast('Please confirm you are in Year 2 or above', false);
    return;
  }
  
  var users = window.db.getAllUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email.toLowerCase() === email.toLowerCase()) {
      showToast('Email already registered', false);
      return;
    }
  }
  
  var newUser = {
    id: Date.now(),
    name: name,
    email: email.toLowerCase(),
    password: password,
    role: 'mentor',
    status: 'pending',
    year: parseInt(year),
    profile: {
      fullName: name,
      university: university,
      major: major,
      year: parseInt(year),
      skills: []
    },
    takenInternships: []
  };
  
  window.db.addUser(newUser);
  showToast('Mentor application submitted! Awaiting admin approval.');
  
  setTimeout(function() {
    window.location.href = 'login.html';
  }, 1500);
}

function handleCompanySignup() {
  var companyName = document.getElementById('companyName').value.trim();
  var email = document.getElementById('companyEmail').value.trim();
  var industry = document.getElementById('companyIndustry').value;
  var website = document.getElementById('companyWebsite').value.trim();
  var description = document.getElementById('companyDescription').value.trim();
  var password = document.getElementById('companyPassword').value;
  var confirm = document.getElementById('companyConfirmPassword').value;
  var terms = document.getElementById('companyTerms').checked;
  
  if (!companyName || !email || !industry || !password) {
    showToast('Please fill in all required fields', false);
    return;
  }
  
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', false);
    return;
  }
  
  if (password !== confirm) {
    showToast('Passwords do not match', false);
    return;
  }
  
  if (!terms) {
    showToast('Please confirm you are an authorized representative', false);
    return;
  }
  
  var users = window.db.getAllUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email.toLowerCase() === email.toLowerCase()) {
      showToast('Email already registered', false);
      return;
    }
  }
  
  var newUser = {
    id: Date.now(),
    name: companyName,
    email: email.toLowerCase(),
    password: password,
    role: 'company',
    status: 'pending',
    companyName: companyName,
    industry: industry,
    website: website,
    description: description
  };
  
  window.db.addUser(newUser);
  showToast('Company registered! Awaiting admin approval.');
  
  setTimeout(function() {
    window.location.href = 'login.html';
  }, 1500);
}

window.switchRole = switchRole;