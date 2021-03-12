"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseQueue = exports.getHexId = exports.uuidv4 = void 0;
/**
 * UUIDv4 generator (RFC4122 compliant)
 */
function uuidv4() {
    let uuid = '';
    for (let i = 0; i < 32; i++) {
        const random = Math.random() * 16 | 0;
        if (i == 8 || i == 12 || i == 16 || i == 20) {
            uuid += '-';
        }
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
}
exports.uuidv4 = uuidv4;
function getHexId(id, ext = false) {
    let str = id.toString(16).toUpperCase();
    str = str.padStart(ext ? 8 : 3, '0');
    return str;
}
exports.getHexId = getHexId;
class PromiseQueue {
    constructor() {
        this.prom = Promise.resolve();
    }
    push(next) {
        this.prom = this.prom
            .then(next)
            .catch((e) => {
            // TODO: handle or ignore this error?
        });
        return this;
    }
}
exports.PromiseQueue = PromiseQueue;
//# sourceMappingURL=helpers.js.map