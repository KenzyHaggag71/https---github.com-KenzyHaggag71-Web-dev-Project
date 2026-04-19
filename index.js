document.addEventListener('DOMContentLoaded', function() {
  loadSharedComponents();
  
  var learnMoreBtn = document.getElementById('learnMoreBtn');
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', function() {
      document.getElementById('aboutSection').scrollIntoView({ behavior: 'smooth' });
    });
  }
  
  var categoryCards = document.querySelectorAll('.category-card');
  for (var i = 0; i < categoryCards.length; i++) {
    categoryCards[i].addEventListener('click', function() {
      var category = this.getAttribute('data-category');
    
    });
  }
});
