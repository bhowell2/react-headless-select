/** Returns true if the click occurred outside of the bounding rect. */
export function isClickOutsideBoundingRect(
  boundingRect: ClientRect | DOMRect,
  clickEvent: MouseEvent
): boolean {
  return (
    clickEvent.clientX < boundingRect.left ||
    clickEvent.clientX > boundingRect.right ||
    clickEvent.clientY < boundingRect.top ||
    clickEvent.clientY > boundingRect.bottom
  )
}

/**
 * Returns true if any part of the queryRect is outside of the
 * container rect.
 */
export function isRectOutsideOfRect(
  containerRect: ClientRect | DOMRect,
  queryRect: ClientRect | DOMRect
): boolean {
  return (
    queryRect.left < containerRect.left ||
    queryRect.right > containerRect.right ||
    queryRect.top < containerRect.top ||
    queryRect.bottom > containerRect.bottom
  )
}
