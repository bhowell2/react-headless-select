import { useCallback, useEffect, useRef } from 'react'
import { useLatestRef } from './useLatestRef'

interface UseDebounceFnOptions<F extends (...args: any[]) => void> {
  callback: F
  /**
   * If the callback should be disregarded if it is currently debounced .
   * @default true
   */
  clearOnUnmount?: boolean
  /**
   * Amount of time to debounce the function call.
   * @default 300
   */
  millis?: number
}

export function useDebounceFn<F extends (...args: any[]) => any>({
  callback,
  clearOnUnmount = true,
  millis
}: UseDebounceFnOptions<F>): F {
  const timerId = useRef<NodeJS.Timer | null>(null)
  const callbackRef = useLatestRef(callback)
  useEffect(
    () => () => {
      if (clearOnUnmount && timerId.current !== null) clearTimeout(timerId.current)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  )
  return useCallback((...args: any[]) => {
    if (timerId.current === null) {
      callbackRef.current(...args)
      timerId.current = setTimeout(() => {
        timerId.current = null
      }, millis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) as F
}
