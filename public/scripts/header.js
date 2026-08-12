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

// Mobile menu — the nav is hidden below the `md` breakpoint, so this toggle is
// the only header path to the site's links on a phone.
const menuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (menuToggle && mobileMenu) {
  // aria-expanded is the single source of truth: it drives assistive tech, the
  // Menu/X icon swap (via group-aria-expanded in Header.astro), and isOpen().
  const setMenu = (open) => {
    mobileMenu.classList.toggle('hidden', !open);
    menuToggle.setAttribute('aria-expanded', String(open));
  };

  const isOpen = () => menuToggle.getAttribute('aria-expanded') === 'true';

  menuToggle.addEventListener('click', () => setMenu(!isOpen()));

  // Following a link leaves the menu open behind same-page anchors otherwise.
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) {
      setMenu(false);
      menuToggle.focus();
    }
  });
}
