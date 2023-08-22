"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scollDocumentToVisible = exports.isOffScreen = exports.getVerticalScrollPercentage = void 0;
function getVerticalScrollPercentage(element) {
    if (element) {
        const { clientHeight, scrollHeight, scrollTop } = element;
        if (scrollHeight - clientHeight === 0)
            return 0;
        return scrollTop / (scrollHeight - clientHeight);
    }
    return 0;
}
exports.getVerticalScrollPercentage = getVerticalScrollPercentage;
function isOffScreen() { }
exports.isOffScreen = isOffScreen;
function scollDocumentToVisible() { }
exports.scollDocumentToVisible = scollDocumentToVisible;
