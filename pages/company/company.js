// Company Module JavaScript - NO HTML

var currentCompany = null;
var editingListingId = null;
var selectedStudentId = null;
var selectedInternshipIdForFeedback = null;

document.addEventListener('DOMContentLoaded', function() {
  loadSharedComponents();
  
  currentCompany = getCurrentUser();
  if (!currentCompany || currentCompany.role !== 'company') {
    window.location.href = '/pages/auth/login.html';
    return;
  }
  
  var liveUser = window.db.getUserById(currentCompany.id);
  if (!liveUser || liveUser.status !== 'approved') {
    showToast('Your company account is pending approval.', false);
    var container = document.getElementById('companyListingsContainer');
    if (container) {
      container.innerHTML = '<div class="text-center" style="padding: 3rem;"><i class="fas fa-clock" style="font-size: 3rem; color: var(--warning);"></i><p style="margin-top: 1rem;">Your company account is awaiting admin approval. You will be able to post internships once approved.</p></div>';
    }
    return;
  }
  
  setupTabs();
  renderCompanyListings();
  renderStudentsList();
  populateInternshipFilter();
  setupCompanyEventListeners();
});

function setupTabs() {
  var tabs = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function() {
      var tabId = this.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      var allTabs = document.querySelectorAll('.tab-btn');
      for (var t = 0; t < allTabs.length; t++) {
        allTabs[t].classList.remove('active');
      }
      var allContents = document.querySelectorAll('.tab-content');
      for (var c = 0; c < allContents.length; c++) {
        allContents[c].style.display = 'none';
      }
      
      // Activate current tab
      this.classList.add('active');
      var activeContent = document.getElementById(tabId + 'Tab');
      if (activeContent) activeContent.style.display = 'block';
    });
  }
}

function setupCompanyEventListeners() {
  var submitBtn = document.getElementById('ciSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitCompanyInternship);
  }
  
  var cancelBtn = document.getElementById('ciCancelEditBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelCompanyInternshipEdit);
  }
  
  var typeSelect = document.getElementById('ciType');
  if (typeSelect) {
    typeSelect.addEventListener('change', updateCiPriceRowVisibility);
  }
  
  var linkInput = document.getElementById('ciLink');
  if (linkInput) {
    linkInput.addEventListener('input', validateUrlInput);
  }
  
  var filterSelect = document.getElementById('filterInternshipSelect');
  if (filterSelect) {
    filterSelect.addEventListener('change', function() {
      renderStudentsList();
    });
  }
  
  var closeFeedbackBtn = document.getElementById('closeFeedbackModalBtn');
  if (closeFeedbackBtn) {
    closeFeedbackBtn.addEventListener('click', closeFeedbackModal);
  }
  
  var submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
  if (submitFeedbackBtn) {
    submitFeedbackBtn.addEventListener('click', submitFeedback);
  }
  
  var feedbackModal = document.getElementById('feedbackModal');
  if (feedbackModal) {
    feedbackModal.addEventListener('click', function(e) {
      if (e.target === feedbackModal) closeFeedbackModal();
    });
  }
}

// ========== URL VALIDATION ==========
function validateUrlInput() {
  var urlInput = document.getElementById('ciLink');
  var errorMsg = document.querySelector('.url-error-message');
  var url = urlInput.value.trim();
  
  if (url.length === 0) {
    if (errorMsg) errorMsg.style.display = 'none';
    urlInput.parentElement.classList.remove('error');
    return true;
  }
  
  var isValid = isValidUrl(url);
  
  if (!isValid) {
    if (errorMsg) errorMsg.style.display = 'block';
    urlInput.parentElement.classList.add('error');
    return false;
  } else {
    if (errorMsg) errorMsg.style.display = 'none';
    urlInput.parentElement.classList.remove('error');
    return true;
  }
}

function isValidUrl(string) {
  try {
    // Check if it starts with http:// or https://
    if (!string.startsWith('http://') && !string.startsWith('https://')) {
      return false;
    }
    var url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// ========== DURATION FORMATTING ==========
function formatDuration(value, unit) {
  var unitText = '';
  if (unit === 'days') unitText = value === '1' ? 'day' : 'days';
  else if (unit === 'weeks') unitText = value === '1' ? 'week' : 'weeks';
  else if (unit === 'months') unitText = value === '1' ? 'month' : 'months';
  return value + ' ' + unitText;
}

function parseDuration(durationString) {
  // Parse "12 weeks" into {value: 12, unit: "weeks"}
  var parts = durationString.split(' ');
  if (parts.length === 2) {
    return { value: parts[0], unit: parts[1] };
  }
  return { value: '12', unit: 'weeks' };
}

// ========== RENDER COMPANY LISTINGS ==========
function renderCompanyListings() {
  var companyInternships = window.db.companyInternships();
  var myListings = [];
  for (var i = 0; i < companyInternships.length; i++) {
    if (companyInternships[i].postedByUserId === currentCompany.id) {
      myListings.push(companyInternships[i]);
    }
  }
  
  var container = document.getElementById('companyListingsContainer');
  if (!container) return;
  
  if (myListings.length === 0) {
    container.innerHTML = '<p class="text-center" style="padding: 2rem; color: var(--text-light);">No internships posted yet. Use the form above to create your first listing.</p>';
    return;
  }
  
  var html = '';
  for (var l = 0; l < myListings.length; l++) {
    var listing = myListings[l];
    var priceLabel = listing.type === 'Paid' ? listing.stipend : listing.type;
    html += '<div class="company-listing-card">' +
      '<div class="listing-header">' +
        '<div class="listing-title">' + escapeHtml(listing.title) + '</div>' +
        '<span class="type-badge ' + (listing.type === 'Paid' ? 'type-paid' : (listing.type === 'Volunteer' ? 'type-volunteer' : 'type-unpaid')) + '">' + listing.type + '</span>' +
      '</div>' +
      '<div class="listing-meta">' +
        '<span><i class="fas fa-tag"></i> ' + escapeHtml(listing.category) + '</span>' +
        '<span><i class="fas fa-briefcase"></i> ' + escapeHtml(listing.workMode) + '</span>' +
        '<span><i class="fas fa-dollar-sign"></i> ' + escapeHtml(priceLabel) + '</span>' +
        '<span><i class="far fa-calendar-alt"></i> ' + escapeHtml(listing.duration) + '</span>' +
      '</div>' +
      '<p class="desc">' + escapeHtml(listing.description) + '</p>' +
      '<div class="listing-actions">' +
        '<button class="edit-btn" onclick="editCompanyListing(' + listing.id + ')">✏️ Edit</button>' +
        '<button class="delete-btn" onclick="deleteCompanyListing(' + listing.id + ')">🗑️ Delete</button>' +
      '</div>' +
    '</div>';
  }
  container.innerHTML = html;
}

// ========== RENDER STUDENTS LIST ==========
function renderStudentsList() {
  var allUsers = window.db.getAllUsers();
  var allInternships = window.db.getAllInternships();
  var companyInternships = window.db.companyInternships();
  var myInternshipIds = [];
  
  // Get IDs of internships posted by this company
  for (var i = 0; i < companyInternships.length; i++) {
    if (companyInternships[i].postedByUserId === currentCompany.id) {
      myInternshipIds.push(companyInternships[i].id);
    }
  }
  
  // Get filter value
  var filterInternshipId = document.getElementById('filterInternshipSelect').value;
  
  // Collect all students who applied to my internships
  var studentsMap = {};
  
  for (var u = 0; u < allUsers.length; u++) {
    var user = allUsers[u];
    if (user.role === 'user' && user.takenInternships && user.takenInternships.length > 0) {
      for (var t = 0; t < user.takenInternships.length; t++) {
        var internshipId = user.takenInternships[t];
        if (myInternshipIds.indexOf(internshipId) !== -1) {
          // Check filter
          if (filterInternshipId !== 'all' && parseInt(filterInternshipId) !== internshipId) {
            continue;
          }
          
          var internship = null;
          for (var inv = 0; inv < allInternships.length; inv++) {
            if (allInternships[inv].id === internshipId) {
              internship = allInternships[inv];
              break;
            }
          }
          
          var key = user.id + '_' + internshipId;
          if (!studentsMap[key]) {
            studentsMap[key] = {
              studentId: user.id,
              studentName: user.profile ? (user.profile.fullName || user.name) : user.name,
              studentEmail: user.email,
              studentUniversity: user.profile ? user.profile.university : 'N/A',
              studentMajor: user.profile ? user.profile.major : 'N/A',
              studentYear: user.year || 'N/A',
              internshipId: internshipId,
              internshipTitle: internship ? internship.title : 'Unknown',
              companyName: internship ? internship.company : 'Unknown',
              feedback: getCompanyFeedback(user.id, internshipId)
            };
          }
        }
      }
    }
  }
  
  var studentsArray = [];
  for (var key in studentsMap) {
    studentsArray.push(studentsMap[key]);
  }
  
  var container = document.getElementById('studentsListContainer');
  if (!container) return;
  
  if (studentsArray.length === 0) {
    container.innerHTML = '<p class="text-center" style="padding: 2rem; color: var(--text-light);">No students have applied to your internships yet.</p>';
    return;
  }
  
  var html = '';
  for (var s = 0; s < studentsArray.length; s++) {
    var student = studentsArray[s];
    var hasFeedback = student.feedback && student.feedback.text;
    
    html += '<div class="student-card">' +
      '<div class="student-info">' +
        '<div class="student-name">' + escapeHtml(student.studentName) + '</div>' +
        '<div class="student-details">' +
          '<span><i class="fas fa-envelope"></i> ' + escapeHtml(student.studentEmail) + '</span>' +
          '<span><i class="fas fa-university"></i> ' + escapeHtml(student.studentUniversity) + '</span>' +
          '<span><i class="fas fa-graduation-cap"></i> Year ' + student.studentYear + '</span>' +
          '<span><i class="fas fa-book"></i> ' + escapeHtml(student.studentMajor) + '</span>' +
        '</div>' +
        '<div class="application-info">' +
          '<strong>Applied to:</strong> ' + escapeHtml(student.internshipTitle) + ' at ' + escapeHtml(student.companyName) +
        '</div>';
    
    if (hasFeedback) {
      var ratingStars = '';
      for (var r = 0; r < 5; r++) {
        if (r < student.feedback.rating) {
          ratingStars += '<i class="fas fa-star" style="color: #FFD700;"></i>';
        } else {
          ratingStars += '<i class="far fa-star" style="color: #FFD700;"></i>';
        }
      }
      html += '<div class="feedback-badge feedback-given">' +
        '<i class="fas fa-check-circle"></i> Feedback Given: ' + ratingStars + ' - ' + escapeHtml(student.feedback.text.substring(0, 100)) +
        '</div>';
    } else {
      html += '<div class="feedback-badge feedback-none"><i class="fas fa-clock"></i> No feedback yet</div>';
    }
    
    html += '</div>' +
      '<div class="student-actions">';
    
    if (hasFeedback) {
      html += '<button class="view-feedback-btn" onclick="viewFeedback(' + student.studentId + ', ' + student.internshipId + ', \'' + escapeHtml(student.studentName) + '\', \'' + escapeHtml(student.internshipTitle) + '\')">📖 View Feedback</button>';
    }
    
    html += '<button class="feedback-btn" onclick="openFeedbackModal(' + student.studentId + ', ' + student.internshipId + ', \'' + escapeHtml(student.studentName) + '\', \'' + escapeHtml(student.internshipTitle) + '\')">' +
        '<i class="fas fa-comment"></i> Add Feedback' +
      '</button>' +
    '</div></div>';
  }
  container.innerHTML = html;
}

// ========== FEEDBACK FUNCTIONS ==========
function getCompanyFeedback(studentId, internshipId) {
  var allFeedback = JSON.parse(localStorage.getItem('ih_company_feedback') || '[]');
  for (var i = 0; i < allFeedback.length; i++) {
    if (allFeedback[i].studentId === studentId && 
        allFeedback[i].internshipId === internshipId && 
        allFeedback[i].companyId === currentCompany.id) {
      return allFeedback[i];
    }
  }
  return null;
}

function saveFeedback(studentId, internshipId, rating, text) {
  var allFeedback = JSON.parse(localStorage.getItem('ih_company_feedback') || '[]');
  
  // Remove existing feedback
  allFeedback = allFeedback.filter(function(f) {
    return !(f.studentId === studentId && f.internshipId === internshipId && f.companyId === currentCompany.id);
  });
  
  // Add new feedback
  allFeedback.push({
    studentId: studentId,
    internshipId: internshipId,
    companyId: currentCompany.id,
    rating: rating,
    text: text,
    date: new Date().toISOString()
  });
  
  localStorage.setItem('ih_company_feedback', JSON.stringify(allFeedback));
}

function openFeedbackModal(studentId, internshipId, studentName, internshipTitle) {
  selectedStudentId = studentId;
  selectedInternshipIdForFeedback = internshipId;
  
  var existingFeedback = getCompanyFeedback(studentId, internshipId);
  
  document.getElementById('feedbackStudentName').textContent = studentName;
  document.getElementById('feedbackInternshipTitle').textContent = internshipTitle;
  
  if (existingFeedback) {
    document.getElementById('feedbackRating').value = existingFeedback.rating;
    document.getElementById('feedbackText').value = existingFeedback.text;
  } else {
    document.getElementById('feedbackRating').value = '';
    document.getElementById('feedbackText').value = '';
  }
  
  document.getElementById('feedbackModal').style.display = 'flex';
}

function closeFeedbackModal() {
  document.getElementById('feedbackModal').style.display = 'none';
  selectedStudentId = null;
  selectedInternshipIdForFeedback = null;
}

function submitFeedback() {
  var rating = document.getElementById('feedbackRating').value;
  var text = document.getElementById('feedbackText').value.trim();
  
  if (!rating) {
    showToast('Please select a rating', false);
    return;
  }
  
  if (!text) {
    showToast('Please enter feedback text', false);
    return;
  }
  
  saveFeedback(selectedStudentId, selectedInternshipIdForFeedback, parseInt(rating), text);
  showToast('Feedback saved successfully!');
  closeFeedbackModal();
  renderStudentsList();
}

function viewFeedback(studentId, internshipId, studentName, internshipTitle) {
  var feedback = getCompanyFeedback(studentId, internshipId);
  if (feedback) {
    var ratingStars = '';
    for (var r = 0; r < 5; r++) {
      if (r < feedback.rating) {
        ratingStars += '⭐';
      } else {
        ratingStars += '☆';
      }
    }
    alert('Student: ' + studentName + '\nInternship: ' + internshipTitle + '\n\nRating: ' + ratingStars + ' (' + feedback.rating + '/5)\n\nFeedback:\n' + feedback.text);
  }
}

// ========== POPULATE INTERNSHIP FILTER ==========
function populateInternshipFilter() {
  var companyInternships = window.db.companyInternships();
  var myListings = [];
  for (var i = 0; i < companyInternships.length; i++) {
    if (companyInternships[i].postedByUserId === currentCompany.id) {
      myListings.push(companyInternships[i]);
    }
  }
  
  var filterSelect = document.getElementById('filterInternshipSelect');
  if (!filterSelect) return;
  
  var options = '<option value="all">All Internships</option>';
  for (var l = 0; l < myListings.length; l++) {
    options += '<option value="' + myListings[l].id + '">' + escapeHtml(myListings[l].title) + '</option>';
  }
  filterSelect.innerHTML = options;
}

// ========== CRUD OPERATIONS ==========
function resetCompanyInternshipForm() {
  editingListingId = null;
  document.getElementById('ciEditingId').value = '';
  document.getElementById('ciTitle').value = '';
  document.getElementById('ciLink').value = '';
  document.getElementById('ciType').value = 'Paid';
  document.getElementById('ciCategory').value = 'Computer Science';
  document.getElementById('ciWorkMode').value = 'Hybrid';
  document.getElementById('ciDurationValue').value = '';
  document.getElementById('ciDurationUnit').value = 'weeks';
  document.getElementById('ciPriceMonthly').value = '';
  document.getElementById('ciLocation').value = '';
  document.getElementById('ciDescription').value = '';
  
  var titleEl = document.getElementById('ciFormSectionTitle');
  if (titleEl) titleEl.innerHTML = '<i class="fas fa-plus-circle"></i> Post an internship';
  
  var submitBtn = document.getElementById('ciSubmitBtn');
  if (submitBtn) submitBtn.textContent = 'Publish internship';
  
  var cancelBtn = document.getElementById('ciCancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'none';
  
  updateCiPriceRowVisibility();
  validateUrlInput();
}

function updateCiPriceRowVisibility() {
  var typeSelect = document.getElementById('ciType');
  var priceRow = document.getElementById('ciPriceRow');
  var priceInput = document.getElementById('ciPriceMonthly');
  
  if (!priceRow) return;
  
  var isPaid = typeSelect && typeSelect.value === 'Paid';
  priceRow.style.display = isPaid ? 'flex' : 'none';
  if (priceInput) {
    priceInput.required = isPaid;
  }
}

function cancelCompanyInternshipEdit() {
  resetCompanyInternshipForm();
}

function editCompanyListing(listingId) {
  var companyInternships = window.db.companyInternships();
  var listing = null;
  for (var i = 0; i < companyInternships.length; i++) {
    if (companyInternships[i].id === listingId && companyInternships[i].postedByUserId === currentCompany.id) {
      listing = companyInternships[i];
      break;
    }
  }
  
  if (!listing) {
    showToast('Listing not found.', false);
    return;
  }
  
  editingListingId = listingId;
  document.getElementById('ciEditingId').value = String(listing.id);
  document.getElementById('ciTitle').value = listing.title || '';
  document.getElementById('ciLink').value = listing.link || '';
  document.getElementById('ciType').value = listing.type || 'Paid';
  document.getElementById('ciCategory').value = listing.category || 'Computer Science';
  document.getElementById('ciWorkMode').value = listing.workMode || 'Hybrid';
  
  // Parse duration
  var durationParts = parseDuration(listing.duration);
  document.getElementById('ciDurationValue').value = durationParts.value;
  document.getElementById('ciDurationUnit').value = durationParts.unit;
  
  var priceInput = document.getElementById('ciPriceMonthly');
  if (priceInput) {
    if (listing.type === 'Paid' && listing.price != null && listing.price > 0) {
      priceInput.value = String(Math.round(Number(listing.price)));
    } else {
      priceInput.value = '';
    }
  }
  
  document.getElementById('ciLocation').value = (listing.location === 'See listing' ? '' : (listing.location || ''));
  document.getElementById('ciDescription').value = (listing.description && listing.description !== 'Apply via the link below. Posted by a verified partner on InternHub.') ? listing.description : '';
  
  var titleEl = document.getElementById('ciFormSectionTitle');
  if (titleEl) titleEl.innerHTML = '<i class="fas fa-pen"></i> Edit internship';
  
  var submitBtn = document.getElementById('ciSubmitBtn');
  if (submitBtn) submitBtn.textContent = 'Save changes';
  
  var cancelBtn = document.getElementById('ciCancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'inline-block';
  
  updateCiPriceRowVisibility();
  validateUrlInput();
  
  // Switch to post tab
  var postTab = document.querySelector('.tab-btn[data-tab="post"]');
  if (postTab) postTab.click();
  
  var postSection = document.getElementById('postTab');
  if (postSection) postSection.scrollIntoView({ behavior: 'smooth' });
}

function submitCompanyInternship() {
  if (!currentCompany) {
    showToast('Please sign in as a company', false);
    return;
  }
  
  var liveUser = window.db.getUserById(currentCompany.id);
  if (!liveUser || liveUser.status !== 'approved') {
    showToast('Your company must be approved before posting.', false);
    return;
  }
  
  var title = document.getElementById('ciTitle').value.trim();
  var linkRaw = document.getElementById('ciLink').value.trim();
  var type = document.getElementById('ciType').value;
  var category = document.getElementById('ciCategory').value;
  var workMode = document.getElementById('ciWorkMode').value;
  var durationValue = document.getElementById('ciDurationValue').value.trim();
  var durationUnit = document.getElementById('ciDurationUnit').value;
  var priceInput = document.getElementById('ciPriceMonthly').value.trim();
  var location = document.getElementById('ciLocation').value.trim() || 'See listing';
  var description = document.getElementById('ciDescription').value.trim() || 'Apply via the link below. Posted by a verified partner on InternHub.';
  
  // Validation
  if (!title) {
    showToast('Please enter a title', false);
    return;
  }
  
  if (!linkRaw) {
    showToast('Please enter a URL', false);
    return;
  }
  
  if (!isValidUrl(linkRaw)) {
    showToast('Please enter a valid URL starting with http:// or https://', false);
    return;
  }
  
  if (!durationValue || isNaN(durationValue) || durationValue < 1) {
    showToast('Please enter a valid duration number', false);
    return;
  }
  
  var duration = formatDuration(durationValue, durationUnit);
  
  var link = linkRaw;
  
  var stipend = '';
  var price = 0;
  if (type === 'Paid') {
    var monthly = parseFloat(priceInput);
    if (!priceInput || isNaN(monthly) || monthly < 1) {
      showToast('Enter a monthly stipend of at least $1 for paid internships.', false);
      return;
    }
    price = Math.round(monthly);
    stipend = formatMonthlyStipend(price);
  } else {
    stipend = type === 'Volunteer' ? 'Volunteer' : 'Unpaid';
  }
  
  var companyName = liveUser.companyName || liveUser.name;
  
  if (editingListingId) {
    var companyInternships = window.db.companyInternships();
    var idx = -1;
    for (var i = 0; i < companyInternships.length; i++) {
      if (companyInternships[i].id === editingListingId && companyInternships[i].postedByUserId === currentCompany.id) {
        idx = i;
        break;
      }
    }
    
    if (idx === -1) {
      showToast('Could not update that listing.', false);
      return;
    }
    
    companyInternships[idx] = {
      id: editingListingId,
      title: title,
      company: companyName,
      category: category,
      location: location,
      duration: duration,
      stipend: stipend,
      price: price,
      type: type,
      workMode: workMode,
      description: description,
      icon: 'fas fa-briefcase',
      link: link,
      skills: [],
      postedDate: new Date().toISOString().slice(0, 10),
      postedByUserId: currentCompany.id
    };
    
    window.db.saveCompanyInternships();
    showToast('Internship updated successfully!');
    resetCompanyInternshipForm();
    renderCompanyListings();
    renderStudentsList();
    populateInternshipFilter();
    return;
  }
  
  var newIntern = {
    id: Date.now(),
    title: title,
    company: companyName,
    category: category,
    location: location,
    duration: duration,
    stipend: stipend,
    price: price,
    type: type,
    workMode: workMode,
    description: description,
    icon: 'fas fa-briefcase',
    link: link,
    skills: [],
    postedDate: new Date().toISOString().slice(0, 10),
    postedByUserId: currentCompany.id
  };
  
  var companyInternships = window.db.companyInternships();
  companyInternships.push(newIntern);
  window.db.saveCompanyInternships();
  
  showToast('Internship published successfully!');
  resetCompanyInternshipForm();
  renderCompanyListings();
  renderStudentsList();
  populateInternshipFilter();
}

function deleteCompanyListing(listingId) {
  if (confirm('Are you sure you want to delete this internship listing?')) {
    var companyInternships = window.db.companyInternships();
    var newListings = [];
    for (var i = 0; i < companyInternships.length; i++) {
      if (!(companyInternships[i].id === listingId && companyInternships[i].postedByUserId === currentCompany.id)) {
        newListings.push(companyInternships[i]);
      }
    }
    window.db.companyInternships = function() { return newListings; };
    window.db.saveCompanyInternships();
    showToast('Internship deleted successfully!');
    renderCompanyListings();
    renderStudentsList();
    populateInternshipFilter();
  }
}

// Make functions global
window.editCompanyListing = editCompanyListing;
window.deleteCompanyListing = deleteCompanyListing;
window.cancelCompanyInternshipEdit = cancelCompanyInternshipEdit;
window.openFeedbackModal = openFeedbackModal;
window.viewFeedback = viewFeedback;
