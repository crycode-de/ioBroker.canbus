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
/**
 * A simple promise queue to process some tasks in the order they where queued.
 */
class PromiseQueue {
    constructor() {
        /**
         * Queued promises.
         */
        this.queue = [];
        /**
         * Indicator if a promise is working.
         */
        this.working = false;
    }
    /**
     * Enqueue a promise.
     * This will add the given promise to the queue. If the queue is empty, the promise will be started immediately.
     * @param promise Function to create the Promise.
     * @returns A promise wich will be resolved (or rejected) if the enqueued promise is done.
     */
    enqueue(promise) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                promise,
                resolve,
                reject,
            });
            this.dequeue();
        });
    }
    /**
     * Dequeue (start) the first promise currently in the queue if there is no working promise.
     * @returns `true` if a new promise from the queue is started or `false` if an other promise is working or the queue is empty.
     */
    dequeue() {
        if (this.working) {
            return false;
        }
        const item = this.queue.shift();
        if (!item) {
            return false;
        }
        try {
            this.working = true;
            item.promise()
                .then((value) => {
                item.resolve(value);
            })
                .catch((err) => {
                item.reject(err);
            })
                .finally(() => {
                this.working = false;
                this.dequeue();
            });
        }
        catch (err) {
            item.reject(err);
            this.working = false;
            this.dequeue();
        }
        return true;
    }
}
exports.PromiseQueue = PromiseQueue;
//# sourceMappingURL=helpers.js.map