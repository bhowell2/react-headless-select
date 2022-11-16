"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRectOutsideOfRect = exports.isClickOutsideBoundingRect = void 0;
/** Returns true if the click occurred outside of the bounding rect. */
function isClickOutsideBoundingRect(boundingRect, clickEvent) {
    return (clickEvent.clientX < boundingRect.left ||
        clickEvent.clientX > boundingRect.right ||
        clickEvent.clientY < boundingRect.top ||
        clickEvent.clientY > boundingRect.bottom);
}
exports.isClickOutsideBoundingRect = isClickOutsideBoundingRect;
/**
 * Returns true if any part of the queryRect is outside of the
 * container rect.
 */
function isRectOutsideOfRect(containerRect, queryRect) {
    return (queryRect.left < containerRect.left ||
        queryRect.right > containerRect.right ||
        queryRect.top < containerRect.top ||
        queryRect.bottom > containerRect.bottom);
}
exports.isRectOutsideOfRect = isRectOutsideOfRect;
