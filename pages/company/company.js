// Company Module JavaScript

var currentCompany = null;

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
    document.getElementById('companyDashboard').innerHTML = '<div class="text-center" style="padding: 3rem;"><i class="fas fa-clock" style="font-size: 3rem; color: var(--warning);"></i><p style="margin-top: 1rem;">Your company account is awaiting admin approval. You will be able to post internships once approved.</p></div>';
    return;
  }
  
  renderCompanyDashboard();
  setupCompanyEventListeners();
});

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
}

function renderCompanyDashboard() {
  renderCompanyListings();
  resetCompanyInternshipForm();
}

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

var editingListingId = null;

function resetCompanyInternshipForm() {
  editingListingId = null;
  document.getElementById('ciEditingId').value = '';
  document.getElementById('ciTitle').value = '';
  document.getElementById('ciLink').value = '';
  document.getElementById('ciType').value = 'Paid';
  document.getElementById('ciCategory').value = 'Computer Science';
  document.getElementById('ciWorkMode').value = 'Hybrid';
  document.getElementById('ciDuration').value = '';
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
  document.getElementById('ciDuration').value = listing.duration || '';
  
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
  document.getElementById('companyPostSection').scrollIntoView({ behavior: 'smooth' });
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
  var duration = document.getElementById('ciDuration').value.trim();
  var priceInput = document.getElementById('ciPriceMonthly').value.trim();
  var location = document.getElementById('ciLocation').value.trim() || 'See listing';
  var description = document.getElementById('ciDescription').value.trim() || 'Apply via the link below. Posted by a verified partner on InternHub.';
  
  if (!title || !linkRaw) {
    showToast('Title and link are required.', false);
    return;
  }
  
  if (!duration) {
    showToast('Please enter a duration.', false);
    return;
  }
  
  var link = linkRaw;
  if (link.indexOf('http://') !== 0 && link.indexOf('https://') !== 0) {
    link = 'https://' + link;
  }
  
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
  }
}

window.editCompanyListing = editCompanyListing;
window.deleteCompanyListing = deleteCompanyListing;
window.cancelCompanyInternshipEdit = cancelCompanyInternshipEdit;// Company Module JavaScript - NO HTML

var currentCompany = null;
var editingListingId = null;

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
  
  var path = window.location.pathname;
  
  if (path.includes('manage-listings.html')) {
    renderCompanyListings();
  } 
  else if (path.includes('post-internship.html')) {
    setupPostInternshipEventListeners();
  }
  else {
    renderCompanyDashboard();
  }
});

function renderCompanyDashboard() {
  renderCompanyListings();
  resetCompanyInternshipForm();
  setupPostInternshipEventListeners();
}

function setupPostInternshipEventListeners() {
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
}

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

function resetCompanyInternshipForm() {
  editingListingId = null;
  document.getElementById('ciEditingId').value = '';
  document.getElementById('ciTitle').value = '';
  document.getElementById('ciLink').value = '';
  document.getElementById('ciType').value = 'Paid';
  document.getElementById('ciCategory').value = 'Computer Science';
  document.getElementById('ciWorkMode').value = 'Hybrid';
  document.getElementById('ciDuration').value = '';
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
  document.getElementById('ciDuration').value = listing.duration || '';
  
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
  var postSection = document.getElementById('companyPostSection');
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
  var duration = document.getElementById('ciDuration').value.trim();
  var priceInput = document.getElementById('ciPriceMonthly').value.trim();
  var location = document.getElementById('ciLocation').value.trim() || 'See listing';
  var description = document.getElementById('ciDescription').value.trim() || 'Apply via the link below. Posted by a verified partner on InternHub.';
  
  if (!title || !linkRaw) {
    showToast('Title and link are required.', false);
    return;
  }
  
  if (!duration) {
    showToast('Please enter a duration.', false);
    return;
  }
  
  var link = linkRaw;
  if (link.indexOf('http://') !== 0 && link.indexOf('https://') !== 0) {
    link = 'https://' + link;
  }
  
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
  }
}

window.editCompanyListing = editCompanyListing;
window.deleteCompanyListing = deleteCompanyListing;
window.cancelCompanyInternshipEdit = cancelCompanyInternshipEdit;