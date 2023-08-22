"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refWrapper = void 0;
/**
 * Creates a ref that passes the value to multiple refs.
 * If a referentially stable function is needed then use this with the
 * useCallback hook.
 */
function refWrapper(...refs) {
    const refLike = (val) => {
        for (let i = 0; i < refs.length; i++) {
            ;
            refs[i].current = val;
        }
        refLike.current = val;
    };
    refLike.current = null;
    return refLike;
}
exports.refWrapper = refWrapper;
