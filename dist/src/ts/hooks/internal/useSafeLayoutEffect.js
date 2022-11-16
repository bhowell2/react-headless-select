"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSafeLayoutEffect = void 0;
const react_1 = require("react");
exports.useSafeLayoutEffect = typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined'
    ? react_1.useLayoutEffect
    : react_1.useEffect;
