"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorIfDev = exports.warnIfDev = exports.logIfDev = exports.runIfDev = exports.__DEV__ = void 0;
exports.__DEV__ = process.env.NODE_ENV !== 'production';
function runIfDev(fn) {
    if (exports.__DEV__) {
        fn();
    }
}
exports.runIfDev = runIfDev;
function logIfDev(msg, ...args) {
    if (exports.__DEV__) {
        console.log(msg, args);
    }
}
exports.logIfDev = logIfDev;
function warnIfDev(msg, ...args) {
    if (exports.__DEV__) {
        console.warn(msg, args);
    }
}
exports.warnIfDev = warnIfDev;
function errorIfDev(msg, ...args) {
    if (exports.__DEV__) {
        console.error(msg, args);
    }
}
exports.errorIfDev = errorIfDev;
