const svgCopy =
  '<svg aria-hidden="true" height="16" width="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>'
const svgCheck =
  '<svg aria-hidden="true" height="16" width="16" viewBox="0 0 24 24" fill="none" stroke="rgb(63, 185, 80)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>'

document.addEventListener("nav", () => {
  const els = document.getElementsByTagName("pre")
  for (let i = 0; i < els.length; i++) {
    const codeBlock = els[i].getElementsByTagName("code")[0]
    if (codeBlock) {
      const source = (
        codeBlock.dataset.clipboard ? JSON.parse(codeBlock.dataset.clipboard) : codeBlock.innerText
      ).replace(/\n\n/g, "\n")
      const button = document.createElement("button")
      button.className = "clipboard-button"
      button.type = "button"
      button.innerHTML = svgCopy
      button.ariaLabel = "Copy source"
      function onClick() {
        navigator.clipboard.writeText(source).then(
          () => {
            button.blur()
            button.innerHTML = svgCheck
            setTimeout(() => {
              button.innerHTML = svgCopy
              button.style.borderColor = ""
            }, 2000)
          },
          (error) => console.error(error),
        )
      }
      button.addEventListener("click", onClick)
      window.addCleanup(() => button.removeEventListener("click", onClick))
      els[i].prepend(button)
    }
  }
})
