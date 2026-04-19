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