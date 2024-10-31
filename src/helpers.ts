/**
 * UUIDv4 generator (RFC4122 compliant)
 */
export function uuidv4 (): string {
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    const random = Math.random() * 16 | 0;
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}

export function getHexId (id: number, ext: boolean = false): string {
  let str = id.toString(16).toUpperCase();
  str = str.padStart(ext ? 8 : 3, '0');
  return str;
}

/**
 * Interface for a queued promise in the {@link PromiseQueue}.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface QueuedPromise<T = any> {
  promise: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

/**
 * A simple promise queue to process some tasks in the order they where queued.
 */
export class PromiseQueue {

  /**
   * Queued promises.
   */
  private queue: QueuedPromise[] = [];

  /**
   * Indicator if a promise is working.
   */
  private working: boolean = false;

  /**
   * Enqueue a promise.
   * This will add the given promise to the queue. If the queue is empty, the promise will be started immediately.
   * @param promise Function to create the Promise.
   * @returns A promise wich will be resolved (or rejected) if the enqueued promise is done.
   */
  public async enqueue<T = void> (promise: () => Promise<T>): Promise<T> {
    return await new Promise<T>((resolve, reject) => {
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
  private dequeue (): boolean {
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

    } catch (err) {
      item.reject(err);
      this.working = false;
      this.dequeue();
    }

    return true;
  }
}
