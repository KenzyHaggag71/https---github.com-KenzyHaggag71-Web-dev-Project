var currentMentor = null;
var selectedSubmissionId = null;

function showFieldError(fieldEl, message)
{
  if (!fieldEl)
  {
    return;
  }

  var wrapper = fieldEl.closest('.input-group');
  if (!wrapper)
  {
    wrapper = fieldEl.parentElement;
  }

  wrapper.classList.add('input-error');

  var existing = wrapper.parentElement.querySelector('.field-error-msg[data-for="' + fieldEl.id + '"]');
  if (existing)
  {
    existing.remove();
  }

  var errEl = document.createElement('p');
  errEl.className = 'field-error-msg';
  errEl.setAttribute('data-for', fieldEl.id);
  errEl.textContent = message;
  wrapper.insertAdjacentElement('afterend', errEl);
}

function clearFieldError(fieldEl)
{
  if (!fieldEl)
  {
    return;
  }

  var wrapper = fieldEl.closest('.input-group');
  if (!wrapper)
  {
    wrapper = fieldEl.parentElement;
  }

  wrapper.classList.remove('input-error');

  var existing = wrapper.parentElement.querySelector('.field-error-msg[data-for="' + fieldEl.id + '"]');
  if (existing)
  {
    existing.remove();
  }
}

function clearAllErrors(containerEl)
{
  if (!containerEl)
  {
    return;
  }

  var errors = containerEl.querySelectorAll('.input-error');
  for (var i = 0; i < errors.length; i++)
  {
    errors[i].classList.remove('input-error');
  }

  var messages = containerEl.querySelectorAll('.field-error-msg');
  for (var j = 0; j < messages.length; j++)
  {
    messages[j].remove();
  }
}

function isDateNotInPast(dateStr)
{
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var chosen = new Date(dateStr);

  if (chosen >= today)
  {
    return true;
  }

  return false;
}

document.addEventListener(
  'DOMContentLoaded',
  function()
  {
    loadSharedComponents();
    currentMentor = getCurrentUser();

    if (!currentMentor || currentMentor.role !== 'mentor')
    {
      window.location.href = '../../pages/auth/login.html';
      return;
    }

    renderMentorDashboard();
    setupMentorEvents();
  }
);

function setupMentorEvents()
{
  var internshipSelect = document.getElementById('projectInternshipSelect');
  if (internshipSelect)
  {
    internshipSelect.addEventListener(
      'change',
      function()
      {
        clearFieldError(internshipSelect);
        updateProjectInternshipDetails();
      }
    );
  }

  var targetYearSelect = document.getElementById('projectTargetYear');
  if (targetYearSelect)
  {
    targetYearSelect.addEventListener(
      'change',
      function()
      {
        clearFieldError(targetYearSelect);
        toggleMultiUserSelect();
      }
    );
  }

  var fieldIds = ['projectTitle', 'projectDescription', 'projectDeadline', 'projectInstructions'];
  for (var i = 0; i < fieldIds.length; i++)
  {
    var el = document.getElementById(fieldIds[i]);
    if (el)
    {
      el.addEventListener(
        'input',
        function()
        {
          clearFieldError(this);
        }
      );
      el.addEventListener(
        'change',
        function()
        {
          clearFieldError(this);
        }
      );
    }
  }

  var modalFieldIds = ['evaluationGrade', 'evaluationFeedback'];
  for (var j = 0; j < modalFieldIds.length; j++)
  {
    var modalEl = document.getElementById(modalFieldIds[j]);
    if (modalEl)
    {
      modalEl.addEventListener(
        'input',
        function()
        {
          clearFieldError(this);
        }
      );
      modalEl.addEventListener(
        'change',
        function()
        {
          clearFieldError(this);
        }
      );
    }
  }

  document.getElementById('assignProjectBtn').addEventListener('click', assignProject);

  document.getElementById('closeEvaluateModalBtn').addEventListener(
    'click',
    function()
    {
      document.getElementById('evaluateModal').style.display = 'none';
      clearAllErrors(document.getElementById('evaluateModal'));
    }
  );

  document.getElementById('submitEvaluationBtn').addEventListener('click', submitEvaluation);

  document.getElementById('evaluateModal').addEventListener(
    'click',
    function(e)
    {
      if (e.target === this)
      {
        this.style.display = 'none';
        clearAllErrors(this);
      }
    }
  );
}

function renderMentorDashboard()
{
  var allInternships = window.db.getAllInternships();

  var takenInternships = [];
  for (var i = 0; i < allInternships.length; i++)
  {
    if (currentMentor.takenInternships && currentMentor.takenInternships.indexOf(allInternships[i].id) !== -1)
    {
      takenInternships.push(allInternships[i]);
    }
  }

  var select = document.getElementById('projectInternshipSelect');
  if (select)
  {
    if (takenInternships.length === 0)
    {
      select.innerHTML = '<option value="">No internships taken yet</option>';
    }
    else
    {
      var optionsHtml = '<option value="">Select Internship</option>';
      for (var t = 0; t < takenInternships.length; t++)
      {
        optionsHtml = optionsHtml + '<option value="' + takenInternships[t].id + '" data-company="' + escapeHtml(takenInternships[t].company) + '" data-category="' + escapeHtml(takenInternships[t].category) + '">' + escapeHtml(takenInternships[t].title) + ' - ' + escapeHtml(takenInternships[t].company) + '</option>';
      }
      select.innerHTML = optionsHtml;
    }
  }

  populateStudentMultiSelect();

  var mentorProjects = window.db.getProjectsByMentor(currentMentor.id);
  var projectsContainer = document.getElementById('mentorProjectsList');
  if (projectsContainer)
  {
    if (mentorProjects.length === 0)
    {
      projectsContainer.innerHTML = '<p style="text-align:center;padding:2rem;">No projects created yet.</p>';
    }
    else
    {
      var projectsHtml = '';
      for (var p = 0; p < mentorProjects.length; p++)
      {
        var project = mentorProjects[p];
        projectsHtml = projectsHtml + '<div class="project-card">';
        projectsHtml = projectsHtml + '<div class="project-header">';
        projectsHtml = projectsHtml + '<div class="project-title">' + escapeHtml(project.title) + '</div>';
        projectsHtml = projectsHtml + '<span class="submission-status status-pending">Deadline: ' + project.deadline + '</span>';
        projectsHtml = projectsHtml + '</div>';
        projectsHtml = projectsHtml + '<div class="project-meta">';
        projectsHtml = projectsHtml + '<span>' + escapeHtml(project.companyName) + '</span>';
        projectsHtml = projectsHtml + '<span>' + escapeHtml(project.category) + '</span>';
        projectsHtml = projectsHtml + '<span>Assigned to ' + project.assignedTo.length + ' student(s)</span>';
        projectsHtml = projectsHtml + '</div>';
        projectsHtml = projectsHtml + '<p class="project-description">' + escapeHtml(project.description) + '</p>';

        if (project.instructions)
        {
          projectsHtml = projectsHtml + '<p style="color:var(--purple);">' + escapeHtml(project.instructions) + '</p>';
        }

        projectsHtml = projectsHtml + '</div>';
      }
      projectsContainer.innerHTML = projectsHtml;
    }
  }

  var pendingSubmissions = window.db.getPendingSubmissionsForMentor(currentMentor.id);
  var submissionsContainer = document.getElementById('mentorSubmissionsList');
  if (submissionsContainer)
  {
    if (pendingSubmissions.length === 0)
    {
      submissionsContainer.innerHTML = '<p style="text-align:center;padding:2rem;">No pending submissions.</p>';
    }
    else
    {
      var subsHtml = '';

      for (var s = 0; s < pendingSubmissions.length; s++)
      {
        var sub = pendingSubmissions[s];

        var allProjects = window.db.projects();
        var project = null;
        for (var proj = 0; proj < allProjects.length; proj++)
        {
          if (allProjects[proj].id === sub.projectId)
          {
            project = allProjects[proj];
            break;
          }
        }

        var student = window.db.getUserById(sub.studentId);
        var studentProfile = null;
        if (student)
        {
          studentProfile = student.profile || null;
        }

        subsHtml = subsHtml + '<div class="submission-card">';
        subsHtml = subsHtml + '<div class="project-header">';
        subsHtml = subsHtml + '<div class="project-title">' + escapeHtml(sub.title) + '</div>';
        subsHtml = subsHtml + '<button class="evaluate-btn" onclick="openEvaluateModal(' + sub.id + ')">Evaluate</button>';
        subsHtml = subsHtml + '</div>';
        subsHtml = subsHtml + '<div class="project-meta">';

        var studentName = '';
        if (student)
        {
          if (studentProfile && studentProfile.fullName)
          {
            studentName = studentProfile.fullName;
          }
          else
          {
            studentName = student.name;
          }
        }

        subsHtml = subsHtml + '<span>Student: ' + escapeHtml(studentName) + '</span>';

        var projectTitle = '';
        if (project)
        {
          projectTitle = project.title;
        }

        subsHtml = subsHtml + '<span>Project: ' + escapeHtml(projectTitle) + '</span>';
        subsHtml = subsHtml + '</div>';

        if (sub.link)
        {
          subsHtml = subsHtml + '<p><a href="' + sub.link + '" target="_blank" class="submission-link">View Submission</a></p>';
        }

        subsHtml = subsHtml + '<p class="project-description">' + escapeHtml(sub.description || '') + '</p>';
        subsHtml = subsHtml + '</div>';
      }

      submissionsContainer.innerHTML = subsHtml;
    }
  }
}

function populateStudentMultiSelect()
{
  var select = document.getElementById('projectAssignedUsers');
  if (!select)
  {
    return;
  }

  var allUsers = window.db.getAllUsers();
  var students = [];

  for (var i = 0; i < allUsers.length; i++)
  {
    if (allUsers[i].role === 'user' && allUsers[i].status === 'active')
    {
      students.push(allUsers[i]);
    }
  }

  if (students.length === 0)
  {
    select.innerHTML = '<option value="">No students available</option>';
    return;
  }

  var optionsHtml = '';
  for (var s = 0; s < students.length; s++)
  {
    var student = students[s];
    var profile = student.profile || {};
    var displayName = profile.fullName || student.name;
    var major = profile.major || '';

    optionsHtml = optionsHtml + '<option value="' + student.id + '">' + escapeHtml(displayName) + ' (Year ' + student.year + ') - ' + escapeHtml(major) + '</option>';
  }

  select.innerHTML = optionsHtml;
}

function updateProjectInternshipDetails()
{
  var select = document.getElementById('projectInternshipSelect');
  var selectedOption = select.options[select.selectedIndex];

  if (selectedOption && selectedOption.value)
  {
    document.getElementById('projectCompany').value = selectedOption.getAttribute('data-company') || '';
    document.getElementById('projectCategory').value = selectedOption.getAttribute('data-category') || '';
  }
  else
  {
    document.getElementById('projectCompany').value = '';
    document.getElementById('projectCategory').value = '';
  }
}

function toggleMultiUserSelect()
{
  var targetYear = document.getElementById('projectTargetYear').value;
  var multiSelectGroup = document.getElementById('multiUserSelectGroup');

  if (targetYear === 'specific')
  {
    multiSelectGroup.style.display = 'block';
  }
  else
  {
    multiSelectGroup.style.display = 'none';
  }
}

function assignProject()
{
  if (!currentMentor)
  {
    return;
  }

  var form = document.getElementById('assignProjectForm');
  clearAllErrors(form);

  var internshipSelect = document.getElementById('projectInternshipSelect');
  var titleEl = document.getElementById('projectTitle');
  var descriptionEl = document.getElementById('projectDescription');
  var deadlineEl = document.getElementById('projectDeadline');
  var targetYearEl = document.getElementById('projectTargetYear');
  var instructionsEl = document.getElementById('projectInstructions');

  var internshipId = internshipSelect.value;
  var title = titleEl.value.trim();
  var description = descriptionEl.value.trim();
  var deadline = deadlineEl.value;
  var targetYear = targetYearEl.value;
  var instructions = instructionsEl.value.trim();

  var hasError = false;

  if (!internshipId)
  {
    showFieldError(internshipSelect, 'Please select an internship.');
    hasError = true;
  }

  if (!title)
  {
    showFieldError(titleEl, 'Please enter a project title.');
    hasError = true;
  }

  if (!description)
  {
    showFieldError(descriptionEl, 'Please enter a project description.');
    hasError = true;
  }

  if (!deadline)
  {
    showFieldError(deadlineEl, 'Please select a deadline.');
    hasError = true;
  }
  else if (!isDateNotInPast(deadline))
  {
    showFieldError(deadlineEl, 'Deadline cannot be in the past.');
    hasError = true;
  }

  if (!targetYear)
  {
    showFieldError(targetYearEl, 'Please select a year level.');
    hasError = true;
  }

  if (hasError)
  {
    return;
  }

  var allInternships = window.db.getAllInternships();
  var internship = null;
  for (var i = 0; i < allInternships.length; i++)
  {
    if (allInternships[i].id === parseInt(internshipId))
    {
      internship = allInternships[i];
      break;
    }
  }

  if (!internship)
  {
    showToast('Selected internship not found', false);
    return;
  }

  var assignedStudents = [];

  if (targetYear === 'specific')
  {
    var specificSelect = document.getElementById('projectAssignedUsers');
    for (var opt = 0; opt < specificSelect.options.length; opt++)
    {
      if (specificSelect.options[opt].selected)
      {
        assignedStudents.push(parseInt(specificSelect.options[opt].value));
      }
    }

    if (assignedStudents.length === 0)
    {
      showFieldError(specificSelect, 'Please select at least one student.');
      return;
    }
  }
  else if (targetYear === 'both')
  {
    var allUsers = window.db.getAllUsers();
    for (var u = 0; u < allUsers.length; u++)
    {
      if (allUsers[u].role === 'user' && allUsers[u].status === 'active')
      {
        if (allUsers[u].year === 1 || allUsers[u].year === 2)
        {
          assignedStudents.push(allUsers[u].id);
        }
      }
    }

    if (assignedStudents.length === 0)
    {
      showToast('No Year 1 or 2 students found.', false);
      return;
    }
  }
  else
  {
    var allUsers = window.db.getAllUsers();
    for (var us = 0; us < allUsers.length; us++)
    {
      if (allUsers[us].role === 'user' && allUsers[us].status === 'active' && allUsers[us].year === parseInt(targetYear))
      {
        assignedStudents.push(allUsers[us].id);
      }
    }

    if (assignedStudents.length === 0)
    {
      showToast('No Year ' + targetYear + ' students found.', false);
      return;
    }
  }

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

  document.getElementById('projectTitle').value = '';
  document.getElementById('projectDescription').value = '';
  document.getElementById('projectDeadline').value = '';
  document.getElementById('projectInstructions').value = '';
  document.getElementById('projectTargetYear').value = '';
  document.getElementById('multiUserSelectGroup').style.display = 'none';
  clearAllErrors(form);

  showToast('Project assigned to ' + assignedStudents.length + ' student(s)!', true);
  renderMentorDashboard();
}

function openEvaluateModal(submissionId)
{
  selectedSubmissionId = submissionId;

  var subs = window.db.submissions();
  var sub = null;
  for (var i = 0; i < subs.length; i++)
  {
    if (subs[i].id === submissionId)
    {
      sub = subs[i];
      break;
    }
  }

  var student = window.db.getUserById(sub ? sub.studentId : null);
  var allProjects = window.db.projects();
  var project = null;
  for (var p = 0; p < allProjects.length; p++)
  {
    if (allProjects[p].id === (sub ? sub.projectId : null))
    {
      project = allProjects[p];
      break;
    }
  }

  var studentName = '';
  if (student)
  {
    var profile = student.profile || {};
    studentName = profile.fullName || student.name;
  }

  var projectTitle = '';
  if (project)
  {
    projectTitle = project.title;
  }

  document.getElementById('evaluateStudentName').textContent = studentName;
  document.getElementById('evaluateProjectTitle').textContent = projectTitle;
  document.getElementById('evaluationGrade').value = '';
  document.getElementById('evaluationFeedback').value = '';

  document.getElementById('evaluateModal').style.display = 'flex';
}

function submitEvaluation()
{
  if (!selectedSubmissionId)
  {
    return;
  }

  var gradeEl = document.getElementById('evaluationGrade');
  var feedbackEl = document.getElementById('evaluationFeedback');
  var grade = gradeEl.value;
  var feedback = feedbackEl.value.trim();

  clearAllErrors(document.getElementById('evaluateModal'));

  if (!grade)
  {
    showFieldError(gradeEl, 'Please select a grade.');
    return;
  }

  if (!feedback)
  {
    showFieldError(feedbackEl, 'Please provide feedback.');
    return;
  }

  var subs = window.db.submissions();
  var idx = -1;
  for (var i = 0; i < subs.length; i++)
  {
    if (subs[i].id === selectedSubmissionId)
    {
      idx = i;
      break;
    }
  }

  if (idx !== -1)
  {
    subs[idx].status = 'evaluated';
    subs[idx].evaluation = {
      grade: grade,
      feedback: feedback,
      evaluatedAt: new Date().toISOString()
    };
    window.db.saveSubmissions();
  }

  document.getElementById('evaluateModal').style.display = 'none';
  showToast('Evaluation submitted!', true);
  renderMentorDashboard();
}

window.renderMentorDashboard = renderMentorDashboard;
window.openEvaluateModal = openEvaluateModal;
window.assignProject = assignProject;
window.submitEvaluation = submitEvaluation;
window.updateProjectInternshipDetails = updateProjectInternshipDetails;
window.toggleMultiUserSelect = toggleMultiUserSelect;