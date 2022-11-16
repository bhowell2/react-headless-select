/// <reference types="react" />
/**
 * Simple hook that returns a ref with the current value. This can be
 * used in closures that need a reference to the supplied value to avoid
 * re-creating the closure each time the value changes.
 */
export declare function useCurrentValueRef<T>(curVal: T): import("react").MutableRefObject<T>;
