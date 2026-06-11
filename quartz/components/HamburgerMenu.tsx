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
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
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
