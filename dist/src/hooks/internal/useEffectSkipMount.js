"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEffectSkipMount = void 0;
const react_1 = require("react");
const useEffectSkipMount = (callback, deps) => {
    const afterMountRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (afterMountRef.current) {
            return callback();
        }
        afterMountRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
};
exports.useEffectSkipMount = useEffectSkipMount;
