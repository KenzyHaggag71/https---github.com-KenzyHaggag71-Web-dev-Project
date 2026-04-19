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

