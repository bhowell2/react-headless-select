import { MutableRefObject } from 'react';
type RefOrElem<E extends HTMLElement | null | undefined> = MutableRefObject<E> | E;
export declare function getElement<E extends HTMLElement | null | undefined>(e?: RefOrElem<E>): E | null | undefined;
interface ScrollToOptions {
    /**
     * Adds an extra few number of pixels to add some "padding" to
     * the top of the scroll (i.e., does not scroll the element to
     * the edge of the parent).
     *
     * Note: a negative offset will push the element DOWN a bit from
     * the top, while a positive offset will scroll the element PAST
     * the top by that amount.
     */
    additionalOffset?: number;
    /** Allows for returning a dynamic offset. */
    computeOffset?: (container: HTMLElement, elem: HTMLElement) => number | null | undefined;
}
export type ScrollType = 'scrollInto' | 'scrollTo';
export type ScrollOptionsType<T extends ScrollType> = T extends 'scrollInto' ? ScrollIntoViewOptions : T extends 'scrollTo' ? ScrollToOptions : never;
interface UseScrollIntoViewOptions<T extends ScrollType = 'scrollInto'> {
    child: RefOrElem<HTMLElement | null | undefined>;
    container: RefOrElem<HTMLElement | null | undefined>;
    /** @default false (i.e., not disabled, check if should scroll into view) */
    disabled?: boolean;
    options?: ScrollOptionsType<T>;
    /** @default scrollInto */
    type?: T;
}
export declare function useScrollIntoView<T extends ScrollType = 'scrollInto'>({ child, container, disabled, options, type }: UseScrollIntoViewOptions<T>): void;
export {};
