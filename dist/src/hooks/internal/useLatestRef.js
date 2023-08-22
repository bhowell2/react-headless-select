"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLatestRef = void 0;
const react_1 = require("react");
/**
 * Simple hook that returns a ref with the current value. This can be
 * used in closures that need a reference to the supplied value to avoid
 * re-creating the closure each time the value changes.
 */
function useLatestRef(curVal) {
    const ref = (0, react_1.useRef)(curVal);
    ref.current = curVal;
    return ref;
}
exports.useLatestRef = useLatestRef;
