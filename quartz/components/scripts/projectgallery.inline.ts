document.addEventListener("nav", () => {
  setupProjectGalleries()
})

window.addEventListener("DOMContentLoaded", () => {
  setupProjectGalleries()
})

function setupProjectGalleries() {
  document.querySelectorAll(".project-gallery").forEach((gallery) => {
    const track = gallery.querySelector(".project-gallery-track") as HTMLElement | null
    const prev = gallery.querySelector(".project-gallery-nav-prev") as HTMLButtonElement | null
    const next = gallery.querySelector(".project-gallery-nav-next") as HTMLButtonElement | null
    if (!track || !prev || !next) return

    const scrollAmount = () => Math.max(track.clientWidth * 0.85, 240)

    const updateButtons = () => {
      const maxScroll = track.scrollWidth - track.clientWidth
      prev.disabled = track.scrollLeft <= 4
      next.disabled = track.scrollLeft >= maxScroll - 4
    }

    prev.addEventListener("click", () => {
      track.scrollBy({ left: -scrollAmount(), behavior: "smooth" })
    })

    next.addEventListener("click", () => {
      track.scrollBy({ left: scrollAmount(), behavior: "smooth" })
    })

    track.addEventListener("scroll", updateButtons, { passive: true })
    window.addEventListener("resize", updateButtons)
    updateButtons()
  })
}
