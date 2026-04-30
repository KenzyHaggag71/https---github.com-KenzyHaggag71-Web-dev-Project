var currentMentor = null;
var selectedSubmissionId = null;

function showFieldError(fieldEl, message) {
  if (!fieldEl) return;
  var wrapper = fieldEl.closest('.input-group') || fieldEl.parentElement;
  wrapper.classList.add('input-error');

  // Remove any existing error message for this field
  var existing = wrapper.parentElement.querySelector('.field-error-msg[data-for="' + fieldEl.id + '"]');
  if (existing) existing.remove();

  var errEl = document.createElement('p');
  errEl.className = 'field-error-msg';
  errEl.setAttribute('data-for', fieldEl.id);
  errEl.textContent = message;
  wrapper.insertAdjacentElement('afterend', errEl);
}

/** Clears the error state from a single field. */
function clearFieldError(fieldEl) {
  if (!fieldEl) return;
  var wrapper = fieldEl.closest('.input-group') || fieldEl.parentElement;
  wrapper.classList.remove('input-error');
  var existing = wrapper.parentElement.querySelector('.field-error-msg[data-for="' + fieldEl.id + '"]');
  if (existing) existing.remove();
}

/** Clears ALL field errors inside a given container element. */
function clearAllErrors(containerEl) {
  if (!containerEl) return;
  containerEl.querySelectorAll('.input-error').forEach(function(el) { el.classList.remove('input-error'); });
  containerEl.querySelectorAll('.field-error-msg').forEach(function(el) { el.remove(); });
}

/**
 * Validates an email address.
 * Accepted formats: anything@something.edu  or  anything@something.edu.eg
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.edu(\.eg)?$/i.test(email.trim());
}

/**
 * Returns true if a date string (YYYY-MM-DD) is strictly in the future
 * (today is allowed — only strictly past dates are rejected).
 */
function isDateNotInPast(dateStr) {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var chosen = new Date(dateStr);
  return chosen >= today;
}

document.addEventListener('DOMContentLoaded', function() {
  loadSharedComponents();
  
  currentMentor = getCurrentUser();
  if (!currentMentor || currentMentor.role !== 'mentor') {
    window.location.href = '/pages/auth/login.html';
    return;
  }
  
  renderMentorDashboard();
  setupMentorEventListeners();
});

function setupMentorEventListeners() {
  var internshipSelect = document.getElementById('projectInternshipSelect');
  if (internshipSelect) {
    internshipSelect.addEventListener('change', function() {
      clearFieldError(internshipSelect);
      updateProjectInternshipDetails();
    });
  }
  
  var targetYearSelect = document.getElementById('projectTargetYear');
  if (targetYearSelect) {
    targetYearSelect.addEventListener('change', function() {
      clearFieldError(targetYearSelect);
      toggleMultiUserSelect();
    });
  }

  // Live clear errors on input for text/textarea/date fields
  ['projectTitle', 'projectDescription', 'projectDeadline', 'projectInstructions'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function() { clearFieldError(el); });
      el.addEventListener('change', function() { clearFieldError(el); });
    }
  });

  // Live clear for modal fields
  ['evaluationGrade', 'evaluationFeedback'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function() { clearFieldError(el); });
      el.addEventListener('change', function() { clearFieldError(el); });
    }
  });
  
  var assignBtn = document.getElementById('assignProjectBtn');
  if (assignBtn) {
    assignBtn.addEventListener('click', assignProject);
  }
  
  var closeEvaluateBtn = document.getElementById('closeEvaluateModalBtn');
  if (closeEvaluateBtn) {
    closeEvaluateBtn.addEventListener('click', closeEvaluateModal);
  }
  
  var submitEvalBtn = document.getElementById('submitEvaluationBtn');
  if (submitEvalBtn) {
    submitEvalBtn.addEventListener('click', submitEvaluation);
  }
  
  var evalModal = document.getElementById('evaluateModal');
  if (evalModal) {
    evalModal.addEventListener('click', function(e) {
      if (e.target === evalModal) closeEvaluateModal();
    });
  }
}

function renderMentorDashboard() {
  if (!currentMentor) return;
  
  // Populate internship dropdown
  var allInternships = window.db.getAllInternships();
  var takenInternships = [];
  for (var i = 0; i < allInternships.length; i++) {
    if (currentMentor.takenInternships && currentMentor.takenInternships.indexOf(allInternships[i].id) !== -1) {
      takenInternships.push(allInternships[i]);
    }
  }
  
  var internshipSelect = document.getElementById('projectInternshipSelect');
  if (internshipSelect) {
    if (takenInternships.length === 0) {
      internshipSelect.innerHTML = '<option value="">No internships taken yet. Complete internships to assign projects.</option>';
    } else {
      var options = '<option value="">Select Internship</option>';
      for (var t = 0; t < takenInternships.length; t++) {
        options += '<option value="' + takenInternships[t].id + '" data-company="' + escapeHtml(takenInternships[t].company) + '" data-category="' + escapeHtml(takenInternships[t].category) + '">' + escapeHtml(takenInternships[t].title) + ' - ' + escapeHtml(takenInternships[t].company) + '</option>';
      }
      internshipSelect.innerHTML = options;
    }
  }
  
  // Populate student multiselect - FIXED
  populateStudentMultiSelect();
  
  // Render mentor's projects
  var mentorProjects = window.db.getProjectsByMentor(currentMentor.id);
  var projectsContainer = document.getElementById('mentorProjectsList');
  
  if (projectsContainer) {
    if (mentorProjects.length === 0) {
      projectsContainer.innerHTML = '<p class="text-center" style="padding: 2rem; color: var(--text-light);">No projects created yet. Use the form above to assign projects.</p>';
    } else {
      var projectsHtml = '';
      for (var p = 0; p < mentorProjects.length; p++) {
        var project = mentorProjects[p];
        projectsHtml += '<div class="project-card">' +
          '<div class="project-header">' +
            '<div class="project-title">' + escapeHtml(project.title) + '</div>' +
            '<span class="submission-status status-pending" style="background:rgba(245,158,11,0.1);color:#92400e;">Deadline: ' + project.deadline + '</span>' +
          '</div>' +
          '<div class="project-meta">' +
            '<span><i class="fas fa-building"></i> ' + escapeHtml(project.companyName) + '</span>' +
            '<span><i class="fas fa-tag"></i> ' + escapeHtml(project.category) + '</span>' +
            '<span><i class="fas fa-users"></i> Assigned to ' + project.assignedTo.length + ' student(s)</span>' +
          '</div>' +
          '<p class="project-description">' + escapeHtml(project.description) + '</p>';
        if (project.instructions) {
          projectsHtml += '<p class="project-description" style="color: var(--primary);"><i class="fas fa-info-circle"></i> ' + escapeHtml(project.instructions) + '</p>';
        }
        projectsHtml += '</div>';
      }
      projectsContainer.innerHTML = projectsHtml;
    }
  }
  
  // Render pending submissions
  var pendingSubmissions = window.db.getPendingSubmissionsForMentor(currentMentor.id);
  var submissionsContainer = document.getElementById('mentorSubmissionsList');
  
  if (submissionsContainer) {
    if (pendingSubmissions.length === 0) {
      submissionsContainer.innerHTML = '<p class="text-center" style="padding: 2rem; color: var(--text-light);">No pending submissions to evaluate.</p>';
    } else {
      var subsHtml = '';
      for (var sub = 0; sub < pendingSubmissions.length; sub++) {
        var submission = pendingSubmissions[sub];
        var projects = window.db.projects();
        var project = null;
        for (var proj = 0; proj < projects.length; proj++) {
          if (projects[proj].id === submission.projectId) {
            project = projects[proj];
            break;
          }
        }
        var student = window.db.getUserById(submission.studentId);
        subsHtml += '<div class="submission-card">' +
          '<div class="project-header">' +
            '<div class="project-title">' + escapeHtml(submission.title) + '</div>' +
            '<button class="evaluate-btn" onclick="openEvaluateModal(' + submission.id + ')">📝 Evaluate</button>' +
          '</div>' +
          '<div class="project-meta">' +
            '<span><i class="fas fa-user"></i> Student: ' + escapeHtml((student && student.profile) ? (student.profile.fullName || student.name) : (student ? student.name : '')) + '</span>' +
            '<span><i class="fas fa-folder"></i> Project: ' + escapeHtml(project ? project.title : '') + '</span>' +
          '</div>';
        if (submission.link) {
          subsHtml += '<p><a href="' + submission.link + '" target="_blank" class="submission-link"><i class="fas fa-external-link-alt"></i> View Submission</a></p>';
        }
        subsHtml += '<p class="project-description">' + escapeHtml(submission.description || 'No description provided.') + '</p>' +
          '</div>';
      }
      submissionsContainer.innerHTML = subsHtml;
    }
  }
}

// FIXED: Function to populate the multi-select dropdown with students
function populateStudentMultiSelect() {
  var studentSelect = document.getElementById('projectAssignedUsers');
  if (!studentSelect) return;
  
  var students = window.db.getAllUsers();
  var filteredStudents = [];
  for (var s = 0; s < students.length; s++) {
    if (students[s].role === 'user' && students[s].status === 'active') {
      filteredStudents.push(students[s]);
    }
  }
  
  if (filteredStudents.length === 0) {
    studentSelect.innerHTML = '<option value="">No students available</option>';
    return;
  }
  
  var studentOptions = '';
  for (var u = 0; u < filteredStudents.length; u++) {
    var student = filteredStudents[u];
    var displayName = student.profile ? (student.profile.fullName || student.name) : student.name;
    var major = student.profile ? (student.profile.major || 'No major') : 'No major';
    studentOptions += '<option value="' + student.id + '">' + escapeHtml(displayName) + ' (Year ' + student.year + ') - ' + escapeHtml(major) + '</option>';
  }
  studentSelect.innerHTML = studentOptions;
}

function updateProjectInternshipDetails() {
  var select = document.getElementById('projectInternshipSelect');
  var selectedOption = select.options[select.selectedIndex];
  var companyInput = document.getElementById('projectCompany');
  var categoryInput = document.getElementById('projectCategory');
  
  if (selectedOption && selectedOption.value) {
    if (companyInput) companyInput.value = selectedOption.getAttribute('data-company') || '';
    if (categoryInput) categoryInput.value = selectedOption.getAttribute('data-category') || '';
  } else {
    if (companyInput) companyInput.value = '';
    if (categoryInput) categoryInput.value = '';
  }
}

function toggleMultiUserSelect() {
  var targetYear = document.getElementById('projectTargetYear').value;
  var multiSelectGroup = document.getElementById('multiUserSelectGroup');
  if (multiSelectGroup) {
    multiSelectGroup.style.display = targetYear === 'specific' ? 'block' : 'none';
  }
}

// Assign project function with specific per-field validation
function assignProject() {
  if (!currentMentor) return;

  // Clear previous errors
  var form = document.getElementById('assignProjectForm');
  clearAllErrors(form);

  // Collect values
  var internshipSelectEl = document.getElementById('projectInternshipSelect');
  var titleEl            = document.getElementById('projectTitle');
  var descriptionEl      = document.getElementById('projectDescription');
  var deadlineEl         = document.getElementById('projectDeadline');
  var targetYearEl       = document.getElementById('projectTargetYear');
  var instructionsEl     = document.getElementById('projectInstructions');

  var internshipId = internshipSelectEl.value;
  var title        = titleEl.value.trim();
  var description  = descriptionEl.value.trim();
  var deadline     = deadlineEl.value;
  var targetYear   = targetYearEl.value;
  var instructions = instructionsEl.value.trim();

  var hasError = false;

  if (!internshipId) {
    showFieldError(internshipSelectEl, 'Please select an internship from your completed internships.');
    hasError = true;
  }

  if (!title) {
    showFieldError(titleEl, 'Please fill in the Project Title field.');
    hasError = true;
  }

  if (!description) {
    showFieldError(descriptionEl, 'Please fill in the Project Description field.');
    hasError = true;
  }

  if (!deadline) {
    showFieldError(deadlineEl, 'Please select a deadline date.');
    hasError = true;
  } else if (!isDateNotInPast(deadline)) {
    showFieldError(deadlineEl, 'The deadline cannot be a past date. Please choose today or a future date.');
    hasError = true;
  }

  if (!targetYear) {
    showFieldError(targetYearEl, 'Please select a year level to assign this project to.');
    hasError = true;
  }

  if (hasError) return;
  
  // Find the selected internship
  var allInternships = window.db.getAllInternships();
  var internship = null;
  for (var i = 0; i < allInternships.length; i++) {
    if (allInternships[i].id === parseInt(internshipId)) {
      internship = allInternships[i];
      break;
    }
  }
  if (!internship) {
    showToast('Selected internship not found', false);
    return;
  }
  
  var assignedStudents = [];
  
  if (targetYear === 'specific') {
    var specificSelect = document.getElementById('projectAssignedUsers');
    if (specificSelect) {
      for (var opt = 0; opt < specificSelect.options.length; opt++) {
        if (specificSelect.options[opt].selected) {
          assignedStudents.push(parseInt(specificSelect.options[opt].value));
        }
      }
    }
    if (assignedStudents.length === 0) {
      showFieldError(specificSelect, 'Please select at least one student from the list.');
      return;
    }
  } 
  else if (targetYear === 'both') {
    var allUsers = window.db.getAllUsers();
    for (var u = 0; u < allUsers.length; u++) {
      if (allUsers[u].role === 'user' && allUsers[u].status === 'active' && (allUsers[u].year === 1 || allUsers[u].year === 2)) {
        assignedStudents.push(allUsers[u].id);
      }
    }
    if (assignedStudents.length === 0) {
      showToast('No Year 1 or Year 2 students are currently registered in the system.', false);
      return;
    }
  } 
  else {
    var allUsers = window.db.getAllUsers();
    for (var us = 0; us < allUsers.length; us++) {
      if (allUsers[us].role === 'user' && allUsers[us].status === 'active' && allUsers[us].year === parseInt(targetYear)) {
        assignedStudents.push(allUsers[us].id);
      }
    }
    if (assignedStudents.length === 0) {
      showToast('No Year ' + targetYear + ' students are currently registered in the system.', false);
      return;
    }
  }
  
  // Create new project
  var newProject = {
    id: Date.now(),
    mentorId: currentMentor.id,
    internshipId: parseInt(internshipId),
    companyName: internship.company,
    category: internship.category,
    title: title,
    description: description,
    deadline: deadline,
    instructions: instructions,
    assignedTo: assignedStudents,
    createdAt: new Date().toISOString()
  };
  
  var projects = window.db.projects();
  projects.push(newProject);
  window.db.saveProjects();
  
  // Reset form
  document.getElementById('projectTitle').value = '';
  document.getElementById('projectDescription').value = '';
  document.getElementById('projectDeadline').value = '';
  document.getElementById('projectInstructions').value = '';
  document.getElementById('projectTargetYear').value = '';
  document.getElementById('multiUserSelectGroup').style.display = 'none';
  clearAllErrors(document.getElementById('assignProjectForm'));
  
  showToast('Project assigned to ' + assignedStudents.length + ' student(s)!');
  renderMentorDashboard();
}

function openEvaluateModal(submissionId) {
  selectedSubmissionId = submissionId;
  var submissions = window.db.submissions();
  var submission = null;
  for (var i = 0; i < submissions.length; i++) {
    if (submissions[i].id === submissionId) {
      submission = submissions[i];
      break;
    }
  }
  var student = window.db.getUserById(submission ? submission.studentId : null);
  var projects = window.db.projects();
  var project = null;
  for (var p = 0; p < projects.length; p++) {
    if (projects[p].id === (submission ? submission.projectId : null)) {
      project = projects[p];
      break;
    }
  }
  
  var studentNameSpan = document.getElementById('evaluateStudentName');
  var projectTitleSpan = document.getElementById('evaluateProjectTitle');
  var gradeSelect = document.getElementById('evaluationGrade');
  var feedbackTextarea = document.getElementById('evaluationFeedback');
  
  if (studentNameSpan) studentNameSpan.textContent = (student && student.profile) ? (student.profile.fullName || student.name) : (student ? student.name : '');
  if (projectTitleSpan) projectTitleSpan.textContent = project ? project.title : '';
  if (gradeSelect) gradeSelect.value = '';
  if (feedbackTextarea) feedbackTextarea.value = '';
  
  var modal = document.getElementById('evaluateModal');
  if (modal) modal.style.display = 'flex';
}

function closeEvaluateModal() {
  var modal = document.getElementById('evaluateModal');
  if (modal) modal.style.display = 'none';
  clearAllErrors(modal);
  selectedSubmissionId = null;
}

function submitEvaluation() {
  var submissionId = selectedSubmissionId;
  if (!submissionId) return;

  var gradeEl    = document.getElementById('evaluationGrade');
  var feedbackEl = document.getElementById('evaluationFeedback');
  var grade      = gradeEl.value;
  var feedback   = feedbackEl.value.trim();

  // Clear previous modal errors
  clearAllErrors(document.getElementById('evaluateModal'));

  var hasError = false;

  if (!grade) {
    showFieldError(gradeEl, 'Please select a grade before submitting the evaluation.');
    hasError = true;
  }
  if (!feedback) {
    showFieldError(feedbackEl, 'Please provide feedback for the student in the Feedback field.');
    hasError = true;
  }

  if (hasError) return;
  
  var submissions = window.db.submissions();
  var submissionIndex = -1;
  for (var i = 0; i < submissions.length; i++) {
    if (submissions[i].id === submissionId) {
      submissionIndex = i;
      break;
    }
  }
  
  if (submissionIndex !== -1) {
    submissions[submissionIndex].status = 'evaluated';
    submissions[submissionIndex].evaluation = {
      grade: grade,
      feedback: feedback || 'No feedback provided.',
      evaluatedAt: new Date().toISOString()
    };
    window.db.saveSubmissions();
    
    showToast('Evaluation submitted successfully!');
    closeEvaluateModal();
    renderMentorDashboard();
    
    // Also refresh student projects view if open
    if (typeof renderStudentProjects === 'function') {
      renderStudentProjects();
    }
  }
}

// Make functions global for onclick handlers
window.renderMentorDashboard = renderMentorDashboard;
window.updateProjectInternshipDetails = updateProjectInternshipDetails;
window.toggleMultiUserSelect = toggleMultiUserSelect;
window.assignProject = assignProject;
window.openEvaluateModal = openEvaluateModal;
window.closeEvaluateModal = closeEvaluateModal;
window.submitEvaluation = submitEvaluation;