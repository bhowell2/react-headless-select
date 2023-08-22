"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScrollIntoView = exports.getElement = void 0;
const react_1 = require("react");
const boundingRectUtils_1 = require("../utils/boundingRectUtils");
function isMutableRef(r) {
    return r && 'current' in r;
}
function getElement(e) {
    if (isMutableRef(e)) {
        return e.current;
    }
    return e;
}
exports.getElement = getElement;
const defaultScrollIntoViewOptions = {
    behavior: 'auto',
    block: 'nearest',
    inline: 'nearest'
};
function scrollContainerTo(options) {
    var _a;
    const { child, container, scrollToOptions } = options;
    if (!child || !container)
        return;
    const extraOffset = ((_a = scrollToOptions === null || scrollToOptions === void 0 ? void 0 : scrollToOptions.computeOffset) === null || _a === void 0 ? void 0 : _a.call(scrollToOptions, container, child)) ||
        (scrollToOptions === null || scrollToOptions === void 0 ? void 0 : scrollToOptions.additionalOffset) ||
        0;
    container.scrollTo({
        top: child.offsetTop + extraOffset
    });
}
function useScrollIntoView({ child, container, disabled, options, type = 'scrollInto' }) {
    (0, react_1.useLayoutEffect)(() => {
        if (!disabled) {
            const containerInner = getElement(container);
            const childInner = getElement(child);
            if (containerInner &&
                containerInner.getBoundingClientRect &&
                childInner &&
                childInner.getBoundingClientRect &&
                (0, boundingRectUtils_1.isRectOutsideOfRect)(containerInner.getBoundingClientRect(), childInner.getBoundingClientRect())) {
                if (type === 'scrollInto') {
                    childInner.scrollIntoView(options || defaultScrollIntoViewOptions);
                }
                else {
                    scrollContainerTo({
                        child: childInner,
                        container: containerInner,
                        scrollToOptions: options
                    });
                }
            }
        }
    });
}
exports.useScrollIntoView = useScrollIntoView;
