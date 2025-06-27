const header = document.getElementById('main-header');
const navLinks = document.querySelectorAll('.nav-link');

function updateHeader() {
  if (window.scrollY > 0) {
    header.classList.add('bg-white');
    header.classList.remove('bg-transparent');
    navLinks.forEach(link => {
      link.classList.add('scrolled');
      link.classList.remove('top');
    });
  } else {
    header.classList.remove('bg-white');
    header.classList.add('bg-transparent');
    navLinks.forEach(link => {
      link.classList.remove('scrolled');
      link.classList.add('top');
    });
  }
}

// Initial check
updateHeader();

// Add scroll event listener
window.addEventListener('scroll', updateHeader);