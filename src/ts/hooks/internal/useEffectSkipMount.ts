import { useEffect, useRef } from 'react'

export const useEffectSkipMount: typeof useEffect = (callback, deps) => {
  const afterMountRef = useRef(false)
  useEffect(() => {
    if (afterMountRef.current) {
      return callback()
    }
    afterMountRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
