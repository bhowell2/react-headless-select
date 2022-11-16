import React from 'react';
interface RefLike<T> {
    (val: T | null): void;
    current: T | null;
}
/**
 * Creates a ref that passes the value to multiple refs.
 * If a referentially stable function is needed then use this with the
 * useCallback hook.
 */
export declare function refWrapper<T = any>(...refs: Array<React.MutableRefObject<T> | React.RefObject<T>>): RefLike<T>;
export {};
