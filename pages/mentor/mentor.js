var currentMentor = null;
var selectedSubmissionId = null;

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
    internshipSelect.addEventListener('change', updateProjectInternshipDetails);
  }
  
  var targetYearSelect = document.getElementById('projectTargetYear');
  if (targetYearSelect) {
    targetYearSelect.addEventListener('change', toggleMultiUserSelect);
  }
  
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
  
  // Populate student multiselect 
  populateStudentMultiSelect();
  
  // Render mentor's projects
  var mentorProjects = window.db.getProjectsByMentor(currentMentor.id);
  var projectsContainer = document.getElementById('mentorProjectsList');
  
  if (projectsContainer) {
    if (mentorProjects.length === 0) {
      projectsContainer.innerHTML = '<p class="text-center">No projects created yet. Use the form above to assign projects.</p>';
    } else {
      var projectsHtml = '';
      for (var p = 0; p < mentorProjects.length; p++) {
        var project = mentorProjects[p];
        projectsHtml += '<div class="project-card">' +
          '<div class="project-header">' +
            '<div class="project-title">' + escapeHtml(project.title) + '</div>' +
            '<span class="submission-status status-pending" >Deadline: ' + project.deadline + '</span>' +
          '</div>' +
          '<div class="project-meta">' +
            '<span><i class="fas fa-building"></i> ' + escapeHtml(project.companyName) + '</span>' +
            '<span><i class="fas fa-tag"></i> ' + escapeHtml(project.category) + '</span>' +
            '<span><i class="fas fa-users"></i> Assigned to ' + project.assignedTo.length + ' student(s)</span>' +
          '</div>' +
          '<p class="project-description">' + escapeHtml(project.description) + '</p>';
        if (project.instructions) {
          projectsHtml += '<p class="project-instructions" ><i class="fas fa-info-circle"></i> ' + escapeHtml(project.instructions) + '</p>';
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
      submissionsContainer.innerHTML = '<p class="text-center">No pending submissions to evaluate.</p>';
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

// Fixing Function to multi-select dropdown with students
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

// proper validation
function assignProject() {
  if (!currentMentor) return;
  
  // Get all form values
  var internshipId = document.getElementById('projectInternshipSelect').value;
  var title = document.getElementById('projectTitle').value.trim();
  var description = document.getElementById('projectDescription').value.trim();
  var deadline = document.getElementById('projectDeadline').value;
  var targetYear = document.getElementById('projectTargetYear').value;
  var instructions = document.getElementById('projectInstructions').value.trim();
  
  // Validation
  if (!internshipId) {
    showToast('Please select an internship', false);
    return;
  }
  if (!title) {
    showToast('Please enter a project title', false);
    return;
  }
  if (!description) {
    showToast('Please enter a project description', false);
    return;
  }
  if (!deadline) {
    showToast('Please select a deadline date', false);
    return;
  }
  if (!targetYear) {
    showToast('Please select a target year level', false);
    return;
  }
  
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
  
  // Determine assigned students
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
      showToast('Please select at least one student', false);
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
      showToast('No Year 1 or Year 2 students found', false);
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
      showToast('No Year ' + targetYear + ' students found', false);
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
  
  showToast('Project assigned to ' + assignedStudents.length + ' student(s)!');
  renderMentorDashboard();
}
// Evaluation Modal Functions
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
  selectedSubmissionId = null;
}
//submit evaluation
function submitEvaluation() {
  var submissionId = selectedSubmissionId;
  if (!submissionId) return;
  
  var grade = document.getElementById('evaluationGrade').value;
  var feedback = document.getElementById('evaluationFeedback').value.trim();
  
  if (!grade) {
    showToast('Please select a grade', false);
    return;
  }
  
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