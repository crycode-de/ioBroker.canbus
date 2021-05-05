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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9oZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOztHQUVHO0FBQ0gsU0FBZ0IsTUFBTTtJQUNwQixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7SUFDZCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUMzQyxJQUFJLElBQUksR0FBRyxDQUFDO1NBQ2I7UUFDRCxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM1RTtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQVZELHdCQVVDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLEVBQVUsRUFBRSxNQUFlLEtBQUs7SUFDdkQsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUN4QyxHQUFHLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUpELDRCQUlDO0FBV0Q7O0dBRUc7QUFDSCxNQUFhLFlBQVk7SUFBekI7UUFFRTs7V0FFRztRQUNLLFVBQUssR0FBb0IsRUFBRSxDQUFDO1FBRXBDOztXQUVHO1FBQ0ssWUFBTyxHQUFZLEtBQUssQ0FBQztJQXVEbkMsQ0FBQztJQXJEQzs7Ozs7T0FLRztJQUNJLE9BQU8sQ0FBWSxPQUF5QjtRQUNqRCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3JDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNkLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxNQUFNO2FBQ1AsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7T0FHRztJQUNLLE9BQU87UUFDYixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDaEIsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxJQUFJO1lBQ0YsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEIsSUFBSSxDQUFDLE9BQU8sRUFBRTtpQkFDWCxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDZCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RCLENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDYixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLENBQUMsQ0FBQztpQkFDRCxPQUFPLENBQUMsR0FBRyxFQUFFO2dCQUNaLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7WUFDaEIsQ0FBQyxDQUFDLENBQUM7U0FFTjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNyQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDaEI7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjtBQWpFRCxvQ0FpRUMifQ==