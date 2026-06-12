import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/hamburgerMenu.scss"

interface HamburgerMenuOptions {
  children: QuartzComponent[]
}

export default ((opts: HamburgerMenuOptions) => {
  const HamburgerMenu: QuartzComponent = (props: QuartzComponentProps) => {
    return (
      <>
        <button
          id="hamburger-toggle"
          class="hamburger-toggle"
          type="button"
          aria-label="Open menu"
          aria-expanded="false"
          aria-controls="hamburger-menu"
        >
          <svg
            class="hamburger-icon hamburger-icon-menu"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 6h16"></path>
            <path d="M4 12h16"></path>
            <path d="M4 18h16"></path>
          </svg>
          <svg
            class="hamburger-icon hamburger-icon-close"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
        <nav id="hamburger-menu" class="hamburger-menu" aria-hidden="true">
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
    document.addEventListener('nav', () => {
      const hamburgerToggle = document.getElementById('hamburger-toggle');
      const hamburgerMenu = document.getElementById('hamburger-menu');

      if (!hamburgerToggle || !hamburgerMenu) {
        return;
      }

      function setMenuOpen(isOpen) {
        hamburgerMenu.classList.toggle('open', isOpen);
        hamburgerToggle.classList.toggle('open', isOpen);
        hamburgerToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        hamburgerToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        hamburgerMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        document.documentElement.classList.toggle('mobile-no-scroll', isOpen);
      }

      function toggleMenu(event) {
        if (event) {
          event.stopPropagation();
        }
        setMenuOpen(!hamburgerMenu.classList.contains('open'));
      }

      function closeMenu() {
        setMenuOpen(false);
      }

      closeMenu();

      const onToggleClick = (e) => toggleMenu(e);
      const onKeydown = (e) => {
        if (e.key === 'Escape' && hamburgerMenu.classList.contains('open')) {
          closeMenu();
        }
      };

      hamburgerToggle.addEventListener('click', onToggleClick);
      document.addEventListener('keydown', onKeydown);

      window.addCleanup(() => {
        hamburgerToggle.removeEventListener('click', onToggleClick);
        document.removeEventListener('keydown', onKeydown);
      });
    });
  `

  HamburgerMenu.css = style
  return HamburgerMenu
}) satisfies QuartzComponentConstructor<HamburgerMenuOptions>
