/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useRef } from 'react'

/**
 * Returns the value from the previous render cycle. When onlyOnValChange = false
 * this will update the value every render cycle, if onlyOnValChange = true this
 * will only update the previous value when the value changes.
 *
 * Note: onlyOnValChange cannot change in the render context as it conditionally
 * calls useEffect.
 */
export function usePreviousVal<T>(val: T, onlyOnValChange = false): T | undefined {
  const ref = useRef<T>()
  if (onlyOnValChange) {
    useEffect(() => {
      ref.current = val
    }, [val])
  } else {
    useEffect(() => {
      ref.current = val
    })
  }
  return ref.current
}
