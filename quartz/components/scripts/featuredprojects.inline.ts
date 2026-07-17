document.addEventListener("nav", () => {
  setupFeaturedProjects()
})

window.addEventListener("DOMContentLoaded", () => {
  setupFeaturedProjects()
})

function setupFeaturedProjects() {
  document.querySelectorAll<HTMLElement>(".featured-projects").forEach((carousel) => {
    if (carousel.dataset.ready === "true") return

    const track = carousel.querySelector<HTMLElement>(".featured-projects-track")
    const previous = carousel.querySelector<HTMLButtonElement>(".featured-projects-previous")
    const next = carousel.querySelector<HTMLButtonElement>(".featured-projects-next")
    if (!track || !previous || !next) return

    carousel.dataset.ready = "true"
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let timer: number | undefined

    const stepSize = () => {
      const card = track.querySelector<HTMLElement>(".featured-project-card")
      if (!card) return track.clientWidth
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
      return card.getBoundingClientRect().width + gap
    }

    const updateControls = () => {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
      previous.disabled = track.scrollLeft <= 2
      next.disabled = track.scrollLeft >= maxScroll - 2
    }

    const move = (direction: -1 | 1) => {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
      let target = track.scrollLeft + direction * stepSize()

      if (direction === 1 && track.scrollLeft >= maxScroll - 2) target = 0
      if (direction === -1 && track.scrollLeft <= 2) target = maxScroll

      track.scrollTo({ left: target, behavior: reduceMotion ? "auto" : "smooth" })
    }

    const stopAutoAdvance = () => {
      if (timer !== undefined) window.clearInterval(timer)
      timer = undefined
    }

    const startAutoAdvance = () => {
      stopAutoAdvance()
      if (reduceMotion || track.scrollWidth <= track.clientWidth) return
      timer = window.setInterval(() => move(1), 7000)
    }

    const previousClick = () => move(-1)
    const nextClick = () => move(1)
    const pause = () => stopAutoAdvance()
    const resume = () => startAutoAdvance()

    previous.addEventListener("click", previousClick)
    next.addEventListener("click", nextClick)
    track.addEventListener("scroll", updateControls, { passive: true })
    carousel.addEventListener("mouseenter", pause)
    carousel.addEventListener("mouseleave", resume)
    carousel.addEventListener("focusin", pause)
    carousel.addEventListener("focusout", resume)
    window.addEventListener("resize", updateControls)

    updateControls()
    startAutoAdvance()

    window.addCleanup?.(() => {
      stopAutoAdvance()
      previous.removeEventListener("click", previousClick)
      next.removeEventListener("click", nextClick)
      track.removeEventListener("scroll", updateControls)
      carousel.removeEventListener("mouseenter", pause)
      carousel.removeEventListener("mouseleave", resume)
      carousel.removeEventListener("focusin", pause)
      carousel.removeEventListener("focusout", resume)
      window.removeEventListener("resize", updateControls)
      delete carousel.dataset.ready
    })
  })
}
