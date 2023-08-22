"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashObject = void 0;
// modeled after: https://gist.github.com/Trindaz/7f3cff734ca247609a7b (had an error)
function hashObject(toHash) {
    const encountered = [];
    function check(obj) {
        const type = typeof obj;
        if (type === 'object') {
            encountered.push(obj);
            const keys = Object.keys(obj).sort();
            const values = [];
            for (let i = 0; i < keys.length; i++) {
                const value = obj[keys[i]];
                if (encountered.indexOf(value) === -1) {
                    values.push(hashObject(value));
                }
                else {
                    values.push('[ ALREADY HASHED OBJECT ]');
                }
            }
            return [keys, values];
        }
        if (obj === null ||
            type === 'undefined' ||
            type === 'boolean' ||
            type === 'string' ||
            type === 'number' ||
            type === 'function' ||
            type === 'bigint') {
            return obj;
        }
    }
    return JSON.stringify(check(toHash));
}
exports.hashObject = hashObject;
