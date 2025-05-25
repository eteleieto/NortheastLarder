import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/hamburgerMenu.scss"

interface HamburgerMenuOptions {
  children: QuartzComponent[]
}

export default ((opts: HamburgerMenuOptions) => {
  const HamburgerMenu: QuartzComponent = (props: QuartzComponentProps) => {
    return (
      <>
        <button id="hamburger-toggle" class="hamburger-toggle" aria-label="Toggle menu">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        <div id="hamburger-overlay" class="hamburger-overlay"></div>
        <nav id="hamburger-menu" class="hamburger-menu">
          <div class="hamburger-content">
            {opts.children.map((Child) => (
              <Child {...props} />
            ))}
          </div>
        </nav>
      </>
    )
  }

  HamburgerMenu.afterDOMLoaded = `
    const hamburgerToggle = document.getElementById('hamburger-toggle');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const hamburgerOverlay = document.getElementById('hamburger-overlay');
    
    function toggleMenu(event) {
      if (event) {
        event.stopPropagation();
      }
      
      const isOpen = hamburgerMenu.classList.contains('open');
      
      if (isOpen) {
        hamburgerMenu.classList.remove('open');
        hamburgerOverlay.classList.remove('open');
        hamburgerToggle.classList.remove('open');
        document.body.style.overflow = '';
      } else {
        hamburgerMenu.classList.add('open');
        hamburgerOverlay.classList.add('open');
        hamburgerToggle.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }
    
    function closeMenu() {
      hamburgerMenu.classList.remove('open');
      hamburgerOverlay.classList.remove('open');
      hamburgerToggle.classList.remove('open');
      document.body.style.overflow = '';
    }
    
    hamburgerToggle?.addEventListener('click', toggleMenu);
    hamburgerOverlay?.addEventListener('click', closeMenu);
    
    // Prevent menu content clicks from closing the menu
    hamburgerMenu?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hamburgerMenu.classList.contains('open')) {
        closeMenu();
      }
    });
  `

  HamburgerMenu.css = style
  return HamburgerMenu
}) satisfies QuartzComponentConstructor<HamburgerMenuOptions> 