import React from 'react'

interface RefLike<T> {
  (val: T | null): void
  current: T | null
}

/**
 * Creates a ref that passes the value to multiple refs.
 * If a referentially stable function is needed then use this with the
 * useCallback hook.
 */
export function refWrapper<T = any>(
  ...refs: Array<React.MutableRefObject<T> | React.RefObject<T>>
): RefLike<T> {
  const refLike: RefLike<T> = (val) => {
    for (let i = 0; i < refs.length; i++) {
      ;(refs[i] as any).current = val
    }
    refLike.current = val
  }
  refLike.current = null
  return refLike
}
