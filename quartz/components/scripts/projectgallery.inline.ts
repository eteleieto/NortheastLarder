document.addEventListener("nav", () => {
  setupProjectGalleries()
})

window.addEventListener("DOMContentLoaded", () => {
  setupProjectGalleries()
})

function setupProjectGalleries() {
  document.querySelectorAll(".project-gallery").forEach((gallery) => {
    const container = gallery.querySelector(".project-gallery-cards") as HTMLElement | null
    const button = gallery.querySelector(".project-gallery-load-more") as HTMLButtonElement | null
    if (!container || !button) return

    const initial = Number(container.dataset.initial) || 6
    const step = Number(container.dataset.step) || 6
    const cards = Array.from(container.querySelectorAll<HTMLElement>(".card-item-link"))
    let visible = initial

    const update = () => {
      cards.forEach((card, index) => {
        card.classList.toggle("project-gallery-card-hidden", index >= visible)
      })

      if (visible >= cards.length) {
        button.hidden = true
        return
      }

      const remaining = cards.length - visible
      button.textContent =
        remaining <= step ? `Load ${remaining} more` : "Load more"
    }

    const onClick = () => {
      visible = Math.min(visible + step, cards.length)
      update()
    }

    button.addEventListener("click", onClick)
    window.addCleanup?.(() => button.removeEventListener("click", onClick))
    update()
  })
}
