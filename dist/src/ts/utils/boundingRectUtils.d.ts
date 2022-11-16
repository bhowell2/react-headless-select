/** Returns true if the click occurred outside of the bounding rect. */
export declare function isClickOutsideBoundingRect(boundingRect: ClientRect | DOMRect, clickEvent: MouseEvent): boolean;
/**
 * Returns true if any part of the queryRect is outside of the
 * container rect.
 */
export declare function isRectOutsideOfRect(containerRect: ClientRect | DOMRect, queryRect: ClientRect | DOMRect): boolean;
