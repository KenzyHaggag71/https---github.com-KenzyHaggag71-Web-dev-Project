// ========== CENTRAL DATABASE - NO HTML ==========

var DEFAULT_INTERNSHIPS = [
  { id: 1, title: "Software Engineering Intern", company: "Microsoft", category: "Computer Science", location: "Redmond, WA", duration: "12 weeks", stipend: "$8,500/mo", price: 8500, type: "Paid", workMode: "Hybrid", description: "Work on core products like Azure, Office 365, or Windows.", icon: "fab fa-microsoft", link: "https://careers.microsoft.com", skills: ["C#", ".NET", "Azure", "React"], postedDate: "2025-01-15" },
  { id: 2, title: "Frontend Development Intern", company: "Meta", category: "Computer Science", location: "Menlo Park, CA", duration: "12 weeks", stipend: "$8,000/mo", price: 8000, type: "Paid", workMode: "Hybrid", description: "Build responsive web applications using React.", icon: "fab fa-facebook", link: "https://metacareers.com", skills: ["React", "JavaScript", "CSS"], postedDate: "2025-02-01" },
  { id: 3, title: "Backend Engineering Intern", company: "Google", category: "Computer Science", location: "Mountain View, CA", duration: "12-14 weeks", stipend: "$9,000/mo", price: 9000, type: "Paid", workMode: "Hybrid", description: "Design scalable backend systems.", icon: "fab fa-google", link: "https://careers.google.com", skills: ["Go", "Java", "Distributed Systems"], postedDate: "2025-01-10" },
  { id: 4, title: "Mechanical Engineering Intern", company: "Tesla", category: "Engineering", location: "Fremont, CA", duration: "12 weeks", stipend: "$7,200/mo", price: 7200, type: "Paid", workMode: "On-site", description: "Design and test mechanical components for electric vehicles.", icon: "fas fa-car", link: "https://tesla.com/careers", skills: ["CAD", "SolidWorks", "FEA"], postedDate: "2025-01-20" },
  { id: 5, title: "Investment Banking Analyst", company: "Goldman Sachs", category: "Business", location: "New York, NY", duration: "10 weeks", stipend: "$10,000/mo", price: 10000, type: "Paid", workMode: "On-site", description: "Work on M&A deals and financial modeling.", icon: "fas fa-chart-line", link: "https://goldmansachs.com/careers", skills: ["Excel", "Financial Modeling"], postedDate: "2025-01-10" },
  { id: 6, title: "Legal Intern", company: "Kirkland & Ellis", category: "Law", location: "Chicago, IL", duration: "10 weeks", stipend: "$8,500/mo", price: 8500, type: "Paid", workMode: "Hybrid", description: "Work on corporate law cases.", icon: "fas fa-gavel", link: "https://kirkland.com/careers", skills: ["Legal Research", "Writing"], postedDate: "2025-01-20" },
  { id: 7, title: "Pharmacy Intern", company: "CVS Health", category: "Pharmacy", location: "Woonsocket, RI", duration: "12 weeks", stipend: "$4,500/mo", price: 4500, type: "Paid", workMode: "On-site", description: "Work in clinical pharmacy settings.", icon: "fas fa-prescription", link: "https://cvshealth.com/careers", skills: ["Clinical", "Patient Care"], postedDate: "2025-01-15" },
  { id: 8, title: "Architecture Intern", company: "Gensler", category: "Architecture", location: "San Francisco, CA", duration: "12 weeks", stipend: "$5,200/mo", price: 5200, type: "Paid", workMode: "Hybrid", description: "Work on architectural design projects.", icon: "fas fa-building", link: "https://gensler.com/careers", skills: ["Revit", "AutoCAD"], postedDate: "2025-01-20" },
  { id: 9, title: "Journalism Intern", company: "The New York Times", category: "Mass Communication", location: "New York, NY", duration: "10 weeks", stipend: "$4,500/mo", price: 4500, type: "Paid", workMode: "Hybrid", description: "Report and write stories.", icon: "fas fa-newspaper", link: "https://nytimes.com/careers", skills: ["Writing", "Reporting"], postedDate: "2025-01-15" },
  { id: 10, title: "Graphic Design Intern", company: "Adobe", category: "Arts & Design", location: "San Jose, CA", duration: "12 weeks", stipend: "$6,000/mo", price: 6000, type: "Paid", workMode: "Hybrid", description: "Create visual designs.", icon: "fas fa-paint-brush", link: "https://adobe.com/careers", skills: ["Photoshop", "Illustrator"], postedDate: "2025-01-20" },
  { id: 11, title: "Biology Research Intern", company: "Genentech", category: "Science", location: "South San Francisco, CA", duration: "12 weeks", stipend: "$5,800/mo", price: 5800, type: "Paid", workMode: "On-site", description: "Conduct research in molecular biology.", icon: "fas fa-dna", link: "https://gene.com/careers", skills: ["Lab Work", "PCR"], postedDate: "2025-01-15" }
];

var DEFAULT_USERS = [
  { id: 1, name: "Admin User", email: "admin@admin.com", password: "admin123", role: "admin", status: "approved" },
  { id: 2, name: "Microsoft Corp", email: "microsoft@company.com", password: "company123", role: "company", status: "approved", companyName: "Microsoft", industry: "Technology", description: "Leading technology company" },
  { id: 3, name: "John Doe", email: "john@stanford.edu", password: "user123", role: "user", status: "active", year: 2, profile: { fullName: "John Doe", university: "Stanford University", major: "Computer Science", year: 2, skills: ["Python", "JavaScript"] } },
  { id: 4, name: "Jane Smith", email: "jane@mit.edu", password: "user123", role: "user", status: "active", year: 1, profile: { fullName: "Jane Smith", university: "MIT", major: "Engineering", year: 1, skills: ["CAD", "MATLAB"] } },
  { id: 5, name: "Mentor User", email: "mentor@university.edu", password: "mentor123", role: "mentor", status: "approved", year: 3, profile: { fullName: "Mentor User", university: "UC Berkeley", major: "Computer Science", year: 3, skills: ["Python", "Java"] }, takenInternships: [1, 2] }
];

var internships = [];
var users = [];
var companyInternships = [];
var projects = [];
var submissions = [];

function initDatabase() {
  var storedUsers = localStorage.getItem('ih_users');
  if (storedUsers) {
    users = JSON.parse(storedUsers);
  } else {
    users = JSON.parse(JSON.stringify(DEFAULT_USERS));
    saveUsers();
  }
  
  var storedCompany = localStorage.getItem('ih_company_internships');
  if (storedCompany) {
    companyInternships = JSON.parse(storedCompany);
  } else {
    companyInternships = [];
  }
  
  var storedProjects = localStorage.getItem('ih_projects');
  if (storedProjects) {
    projects = JSON.parse(storedProjects);
  } else {
    projects = [];
  }
  
  var storedSubmissions = localStorage.getItem('ih_submissions');
  if (storedSubmissions) {
    submissions = JSON.parse(storedSubmissions);
  } else {
    submissions = [];
  }
  
  rebuildInternshipsList();
}

function rebuildInternshipsList() {
  internships = JSON.parse(JSON.stringify(DEFAULT_INTERNSHIPS));
  for (var i = 0; i < companyInternships.length; i++) {
    internships.push(companyInternships[i]);
  }
}

function saveUsers() {
  localStorage.setItem('ih_users', JSON.stringify(users));
}

function saveCompanyInternships() {
  localStorage.setItem('ih_company_internships', JSON.stringify(companyInternships));
  rebuildInternshipsList();
}

function saveProjects() {
  localStorage.setItem('ih_projects', JSON.stringify(projects));
}

function saveSubmissions() {
  localStorage.setItem('ih_submissions', JSON.stringify(submissions));
}

function getAllInternships() {
  return internships;
}

function getInternshipsByCategory(category) {
  var result = [];
  for (var i = 0; i < internships.length; i++) {
    if (internships[i].category === category) {
      result.push(internships[i]);
    }
  }
  return result;
}

function getAllUsers() {
  return users;
}

function getPendingCompanies() {
  var result = [];
  for (var i = 0; i < users.length; i++) {
    if (users[i].role === 'company' && users[i].status === 'pending') {
      result.push(users[i]);
    }
  }
  return result;
}

function getPendingMentors() {
  var result = [];
  for (var i = 0; i < users.length; i++) {
    if (users[i].role === 'mentor' && users[i].status === 'pending') {
      result.push(users[i]);
    }
  }
  return result;
}

function getProjectsByMentor(mentorId) {
  var result = [];
  for (var i = 0; i < projects.length; i++) {
    if (projects[i].mentorId === mentorId) {
      result.push(projects[i]);
    }
  }
  return result;
}

function getProjectsByStudent(studentId) {
  var result = [];
  for (var i = 0; i < projects.length; i++) {
    if (projects[i].assignedTo && projects[i].assignedTo.indexOf(studentId) !== -1) {
      result.push(projects[i]);
    }
  }
  return result;
}

function getSubmissionsByProject(projectId) {
  var result = [];
  for (var i = 0; i < submissions.length; i++) {
    if (submissions[i].projectId === projectId) {
      result.push(submissions[i]);
    }
  }
  return result;
}

function getSubmissionsByStudent(studentId) {
  var result = [];
  for (var i = 0; i < submissions.length; i++) {
    if (submissions[i].studentId === studentId) {
      result.push(submissions[i]);
    }
  }
  return result;
}

function getPendingSubmissionsForMentor(mentorId) {
  var mentorProjects = getProjectsByMentor(mentorId);
  var mentorProjectIds = [];
  for (var i = 0; i < mentorProjects.length; i++) {
    mentorProjectIds.push(mentorProjects[i].id);
  }
  var result = [];
  for (var s = 0; s < submissions.length; s++) {
    if (mentorProjectIds.indexOf(submissions[s].projectId) !== -1 && submissions[s].status === 'submitted') {
      result.push(submissions[s]);
    }
  }
  return result;
}

function getUserById(id) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === id) return users[i];
  }
  return null;
}

function updateUser(id, updates) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === id) {
      for (var key in updates) {
        users[i][key] = updates[key];
      }
      saveUsers();
      return true;
    }
  }
  return false;
}

function deleteUser(id) {
  var newUsers = [];
  for (var i = 0; i < users.length; i++) {
    if (users[i].id !== id) {
      newUsers.push(users[i]);
    }
  }
  users = newUsers;
  saveUsers();
}

function addUser(user) {
  users.push(user);
  saveUsers();
}

function authenticate(email, password, role) {
  var lowerEmail = email.toLowerCase();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email.toLowerCase() === lowerEmail && users[i].password === password && users[i].role === role) {
      return users[i];
    }
  }
  return null;
}

initDatabase();

window.db = {
  getAllInternships: getAllInternships,
  getInternshipsByCategory: getInternshipsByCategory,
  getAllUsers: getAllUsers,
  getPendingCompanies: getPendingCompanies,
  getPendingMentors: getPendingMentors,
  getProjectsByMentor: getProjectsByMentor,
  getProjectsByStudent: getProjectsByStudent,
  getSubmissionsByProject: getSubmissionsByProject,
  getSubmissionsByStudent: getSubmissionsByStudent,
  getPendingSubmissionsForMentor: getPendingSubmissionsForMentor,
  getUserById: getUserById,
  updateUser: updateUser,
  deleteUser: deleteUser,
  addUser: addUser,
  authenticate: authenticate,
  saveUsers: saveUsers,
  saveCompanyInternships: saveCompanyInternships,
  saveProjects: saveProjects,
  saveSubmissions: saveSubmissions,
  rebuildInternshipsList: rebuildInternshipsList,
  internships: function() { return internships; },
  users: function() { return users; },
  companyInternships: function() { return companyInternships; },
  projects: function() { return projects; },
  submissions: function() { return submissions; }
};