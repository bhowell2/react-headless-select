import { MutableRefObject, useLayoutEffect } from 'react'
import { isRectOutsideOfRect } from '../utils/boundingRectUtils'

const defaultScrollIntoViewOptions: ScrollIntoViewOptions = {
  behavior: 'auto',
  block: 'center'
}

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

export function useScrollIntoView(
  element?: RefOrElem<HTMLElement | null | undefined>,
  child?: RefOrElem<HTMLElement | null | undefined>,
  behavior = defaultScrollIntoViewOptions,
  enabled = true
) {
  useLayoutEffect(() => {
    if (enabled) {
      const e = getElement(element)
      const c = getElement(child)
      if (
        e &&
        e.getBoundingClientRect &&
        c &&
        c.getBoundingClientRect &&
        isRectOutsideOfRect(e.getBoundingClientRect(), c.getBoundingClientRect())
      ) {
        c.scrollIntoView(behavior)
      }
    }
  })
}
