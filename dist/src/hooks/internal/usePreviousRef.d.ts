/**
 * Returns the value from the previous render cycle. When onlyOnValChange = false
 * this will update the value every render cycle, if onlyOnValChange = true this
 * will only update the previous value when the value changes.
 *
 * Note: onlyOnValChange cannot change in the render context as it conditionally
 * calls useEffect.
 */
export declare function usePreviousVal<T>(val: T, onlyOnValChange?: boolean): T | undefined;
