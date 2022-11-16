"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const boundingRectUtils_1 = require("../utils/boundingRectUtils");
const defaultScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'center'
};
function useScrollIntoView(container, child, behavior = defaultScrollIntoViewOptions) {
    (0, react_1.useLayoutEffect)(() => {
        if (container.current &&
            container.current.getBoundingClientRect &&
            child.current &&
            child.current.getBoundingClientRect &&
            (0, boundingRectUtils_1.isRectOutsideOfRect)(container.current.getBoundingClientRect(), child.current.getBoundingClientRect())) {
            child.current.scrollIntoView(behavior);
        }
    });
}
exports.default = useScrollIntoView;
