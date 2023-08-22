"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePreviousVal = void 0;
/* eslint-disable react-hooks/rules-of-hooks */
const react_1 = require("react");
/**
 * Returns the value from the previous render cycle. When onlyOnValChange = false
 * this will update the value every render cycle, if onlyOnValChange = true this
 * will only update the previous value when the value changes.
 *
 * Note: onlyOnValChange cannot change in the render context as it conditionally
 * calls useEffect.
 */
function usePreviousVal(val, onlyOnValChange = false) {
    const ref = (0, react_1.useRef)();
    if (onlyOnValChange) {
        (0, react_1.useEffect)(() => {
            ref.current = val;
        }, [val]);
    }
    else {
        (0, react_1.useEffect)(() => {
            ref.current = val;
        });
    }
    return ref.current;
}
exports.usePreviousVal = usePreviousVal;
