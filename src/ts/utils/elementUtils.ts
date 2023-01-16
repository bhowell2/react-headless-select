export function getVerticalScrollPercentage(element?: HTMLElement | null) {
  if (element) {
    const { clientHeight, scrollHeight, scrollTop } = element
    if (scrollHeight - clientHeight === 0) return 0
    return scrollTop / (scrollHeight - clientHeight)
  }
  return 0
}

export function isOffScreen() {}

export function scollDocumentToVisible() {}
