"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapFunction = void 0;
/**
 * Wraps a function, calling the wrap function and returning
 * the original function's result (not the wrapped function's
 * result). If the original function is not provided, undefined
 * is returned.
 */
function wrapFunction(orig, wrap) {
    return ((...args) => {
        wrap(...args);
        return orig === null || orig === void 0 ? void 0 : orig(...args);
    });
}
exports.wrapFunction = wrapFunction;
