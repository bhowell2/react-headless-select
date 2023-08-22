import { MutableRefObject, useLayoutEffect } from 'react'
import { isRectOutsideOfRect } from '../utils/boundingRectUtils'

type RefOrElem<E extends HTMLElement | null | undefined> = MutableRefObject<E> | E
function isMutableRef<E>(r: MutableRefObject<E> | any): r is MutableRefObject<E> {
  return r && 'current' in r
}
export function getElement<E extends HTMLElement | null | undefined>(
  e?: RefOrElem<E>
): E | null | undefined {
  if (isMutableRef(e)) {
    return e.current
  }
  return e
}

interface ScrollToOptions {
  /**
   * Adds an extra few number of pixels to add some "padding" to
   * the top of the scroll (i.e., does not scroll the element to
   * the edge of the parent).
   *
   * Note: a negative offset will push the element DOWN a bit from
   * the top, while a positive offset will scroll the element PAST
   * the top by that amount.
   */
  additionalOffset?: number
  /** Allows for returning a dynamic offset. */
  computeOffset?: (container: HTMLElement, elem: HTMLElement) => number | null | undefined
}

interface ScrollContainerToOptions {
  /**
   * Desired scroll TO element. This is used to calculate where
   * the container should scroll to.
   * */
  child: HTMLElement | null
  /** Container that should scroll to the element. */
  container: HTMLElement | null
  /**
   * If this is not supplied then this will simply call
   * container.scrollTo({ top: child.offsetTop }), otherwise
   * this can be supplied to add in extra offset.
   */
  scrollToOptions?: ScrollToOptions
}

const defaultScrollIntoViewOptions: ScrollIntoViewOptions = {
  behavior: 'auto',
  block: 'nearest',
  inline: 'nearest'
}

function scrollContainerTo(options: ScrollContainerToOptions) {
  const { child, container, scrollToOptions } = options
  if (!child || !container) return
  const extraOffset =
    scrollToOptions?.computeOffset?.(container, child) ||
    scrollToOptions?.additionalOffset ||
    0
  container.scrollTo({
    top: child.offsetTop + extraOffset
  })
}

export type ScrollType = 'scrollInto' | 'scrollTo'
export type ScrollOptionsType<T extends ScrollType> = T extends 'scrollInto'
  ? ScrollIntoViewOptions
  : T extends 'scrollTo'
  ? ScrollToOptions
  : never

interface UseScrollIntoViewOptions<T extends ScrollType = 'scrollInto'> {
  child: RefOrElem<HTMLElement | null | undefined>
  container: RefOrElem<HTMLElement | null | undefined>
  /** @default false (i.e., not disabled, check if should scroll into view) */
  disabled?: boolean
  options?: ScrollOptionsType<T>
  /** @default scrollInto */
  type?: T
}

export function useScrollIntoView<T extends ScrollType = 'scrollInto'>({
  child,
  container,
  disabled,
  options,
  type = 'scrollInto' as T
}: UseScrollIntoViewOptions<T>) {
  useLayoutEffect(() => {
    if (!disabled) {
      const containerInner = getElement(container)
      const childInner = getElement(child)
      if (
        containerInner &&
        containerInner.getBoundingClientRect &&
        childInner &&
        childInner.getBoundingClientRect &&
        isRectOutsideOfRect(
          containerInner.getBoundingClientRect(),
          childInner.getBoundingClientRect()
        )
      ) {
        if (type === 'scrollInto') {
          childInner.scrollIntoView(
            (options as ScrollIntoViewOptions) || defaultScrollIntoViewOptions
          )
        } else {
          scrollContainerTo({
            child: childInner,
            container: containerInner,
            scrollToOptions: options as ScrollToOptions
          })
        }
      }
    }
  })
}
