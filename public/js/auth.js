(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

        var toggles = document.querySelectorAll('.password-toggle');
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener('click', function (e) {
        e.preventDefault();
        var input;
        var targetId = this.getAttribute('data-target');
        if (targetId) {
          input = document.getElementById(targetId);
        } else {
          input = this.parentElement.querySelector('input[type="password"], input[type="text"]');
        }
        if (!input) { return; }
        var icon = this.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          if (icon) { icon.className = 'far fa-eye-slash'; }
        } else {
          input.type = 'password';
          if (icon) { icon.className = 'far fa-eye'; }
        }
      });
    }

        var roleTabs = document.querySelectorAll('.signup-role-tab');
    for (var t = 0; t < roleTabs.length; t++) {
      roleTabs[t].addEventListener('click', function () {
        var allTabs = document.querySelectorAll('.signup-role-tab');
        for (var tt = 0; tt < allTabs.length; tt++) {
          allTabs[tt].classList.remove('active');
        }
        this.classList.add('active');

        var role = this.getAttribute('data-role');
        var studentForm = document.getElementById('studentForm');
        var mentorForm  = document.getElementById('mentorForm');
        var companyForm = document.getElementById('companyForm');

        if (studentForm) { studentForm.classList.add('hidden'); }
        if (mentorForm)  { mentorForm.classList.add('hidden'); }
        if (companyForm) { companyForm.classList.add('hidden'); }

        if (role === 'student' && studentForm) { studentForm.classList.remove('hidden'); }
        else if (role === 'mentor' && mentorForm) { mentorForm.classList.remove('hidden'); }
        else if (role === 'company' && companyForm) { companyForm.classList.remove('hidden'); }
      });
    }

        function validateUniversityEmail(email) {
      return /\.edu(\.[a-z]{2})?$/i.test(String(email || '').toLowerCase());
    }

    function attachEmailValidator(inputId) {
      var input = document.getElementById(inputId);
      if (!input) { return; }
      input.addEventListener('input', function () {
        var icon = this.parentElement.querySelector('.email-validation');
        if (!icon) { return; }
        if (this.value.length > 3) {
          if (validateUniversityEmail(this.value)) {
            icon.innerHTML = '<i class="fas fa-check-circle" style="color:#059669"></i>';
          } else {
            icon.innerHTML = '<i class="fas fa-times-circle" style="color:#DC2626"></i>';
          }
        } else {
          icon.innerHTML = '';
        }
      });
    }
    attachEmailValidator('studentEmail');
    attachEmailValidator('mentorEmail');
  });
})();
