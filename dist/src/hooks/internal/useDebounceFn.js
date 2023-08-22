"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDebounceFn = void 0;
const react_1 = require("react");
const useLatestRef_1 = require("./useLatestRef");
function useDebounceFn({ callback, clearOnUnmount = true, millis }) {
    const timerId = (0, react_1.useRef)(null);
    const callbackRef = (0, useLatestRef_1.useLatestRef)(callback);
    (0, react_1.useEffect)(() => () => {
        if (clearOnUnmount && timerId.current !== null)
            clearTimeout(timerId.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (0, react_1.useCallback)((...args) => {
        if (timerId.current === null) {
            callbackRef.current(...args);
            timerId.current = setTimeout(() => {
                timerId.current = null;
            }, millis);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
exports.useDebounceFn = useDebounceFn;
