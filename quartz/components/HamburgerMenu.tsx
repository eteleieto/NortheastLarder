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
    // Initialize hamburger behavior on each SPA navigation
    document.addEventListener('nav', () => {
      const hamburgerToggle = document.getElementById('hamburger-toggle');
      const hamburgerMenu = document.getElementById('hamburger-menu');
      const hamburgerOverlay = document.getElementById('hamburger-overlay');

      // On pages like 404, the hamburger may not be present
      if (!hamburgerToggle || !hamburgerMenu || !hamburgerOverlay) {
        return;
      }

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
          document.documentElement.classList.remove('mobile-no-scroll');
        } else {
          hamburgerMenu.classList.add('open');
          hamburgerOverlay.classList.add('open');
          hamburgerToggle.classList.add('open');
          document.body.style.overflow = 'hidden';
          document.documentElement.classList.add('mobile-no-scroll');
        }
      }

      function closeMenu() {
        hamburgerMenu.classList.remove('open');
        hamburgerOverlay.classList.remove('open');
        hamburgerToggle.classList.remove('open');
        document.body.style.overflow = '';
        document.documentElement.classList.remove('mobile-no-scroll');
      }

      // Ensure menu is closed on nav
      closeMenu();

      const onToggleClick = (e) => toggleMenu(e);
      const onOverlayClick = () => closeMenu();
      const onMenuClick = (e) => { e.stopPropagation(); };
      const onKeydown = (e) => {
        if (e.key === 'Escape' && hamburgerMenu.classList.contains('open')) {
          closeMenu();
        }
      };

      hamburgerToggle.addEventListener('click', onToggleClick);
      hamburgerOverlay.addEventListener('click', onOverlayClick);
      // Prevent menu content clicks from closing the menu
      hamburgerMenu.addEventListener('click', onMenuClick);
      document.addEventListener('keydown', onKeydown);

      // Cleanup listeners before the next SPA navigation
      window.addCleanup(() => {
        hamburgerToggle.removeEventListener('click', onToggleClick);
        hamburgerOverlay.removeEventListener('click', onOverlayClick);
        hamburgerMenu.removeEventListener('click', onMenuClick);
        document.removeEventListener('keydown', onKeydown);
      });
    });
  `

  HamburgerMenu.css = style
  return HamburgerMenu
}) satisfies QuartzComponentConstructor<HamburgerMenuOptions> 