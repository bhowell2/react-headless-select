import { RefObject, useLayoutEffect } from 'react'
import { isRectOutsideOfRect } from '../utils/boundingRectUtils'

const defaultScrollIntoViewOptions: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'center'
}

export default function useScrollIntoView(
  container: RefObject<any>,
  child: RefObject<any>,
  behavior = defaultScrollIntoViewOptions
) {
  useLayoutEffect(() => {
    if (
      container.current &&
      container.current.getBoundingClientRect &&
      child.current &&
      child.current.getBoundingClientRect &&
      isRectOutsideOfRect(
        container.current.getBoundingClientRect(),
        child.current.getBoundingClientRect()
      )
    ) {
      child.current.scrollIntoView(behavior)
    }
  })
}
