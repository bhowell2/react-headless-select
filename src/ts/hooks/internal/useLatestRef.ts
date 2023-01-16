import { useRef } from 'react'

/**
 * Simple hook that returns a ref with the current value. This can be
 * used in closures that need a reference to the supplied value to avoid
 * re-creating the closure each time the value changes.
 */
export function useLatestRef<T>(curVal: T) {
  const ref = useRef(curVal)
  ref.current = curVal
  return ref
}
