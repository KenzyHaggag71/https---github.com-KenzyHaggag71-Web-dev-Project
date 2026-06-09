function openSubmitModal(id, title) {
  document.getElementById('submitProjectId').value = id;
  document.getElementById('submitProjectName').textContent = 'Project: ' + title;
  document.getElementById('submitModal').style.display = 'flex';
}
