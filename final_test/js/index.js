function home() {
    htmlinnerHTML = `<h1>Welcome to the Home Page</h1>`;
}

document.addEventListener('DOMContentLoaded', function () {
  const sections = document.querySelectorAll('main section, .newsletter-section');
  const observer = new window.IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15
    }
  );
  sections.forEach(section => {
    observer.observe(section);
  });
});