"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var helpers_exports = {};
__export(helpers_exports, {
  PromiseQueue: () => PromiseQueue,
  getHexId: () => getHexId,
  uuidv4: () => uuidv4
});
module.exports = __toCommonJS(helpers_exports);
function uuidv4() {
  let uuid = "";
  for (let i = 0; i < 32; i++) {
    const random = Math.random() * 16 | 0;
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += "-";
    }
    uuid += (i === 12 ? 4 : i === 16 ? random & 3 | 8 : random).toString(16);
  }
  return uuid;
}
function getHexId(id, ext = false) {
  let str = id.toString(16).toUpperCase();
  str = str.padStart(ext ? 8 : 3, "0");
  return str;
}
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
  async enqueue(promise) {
    return await new Promise((resolve, reject) => {
      this.queue.push({
        promise,
        resolve,
        reject
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
      item.promise().then((value) => {
        item.resolve(value);
      }).catch((err) => {
        item.reject(err);
      }).finally(() => {
        this.working = false;
        this.dequeue();
      });
    } catch (err) {
      item.reject(err);
      this.working = false;
      this.dequeue();
    }
    return true;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PromiseQueue,
  getHexId,
  uuidv4
});
//# sourceMappingURL=helpers.js.map
