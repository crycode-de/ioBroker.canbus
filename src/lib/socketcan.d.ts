declare module 'socketcan' {

  interface CanMessage {
    /**
     * The CAN ID as a number
     */
    id: number;

    /**
     * Extended frame message
     */
    ext?: boolean;

    /**
     * Remote transmission request
     */
    rtr?: boolean;

    /**
     * Error frame
     */
    err?: boolean;

    /**
     * The data of the message. 0 to 8 byte Buffer.
     */
    data: Buffer;

    /**
     * Timestamp of a read message
     */
    ts_sec?: number;

    /**
     * Timestamp microseconds of a read message
     */
    ts_usec?: number;
  }

  interface RxFilter {
    id: number;
    mask: number;
    invert: boolean;
  }

  interface RawChannel {
    /**
     * Add a listener for incomming CAN messages
     */
    addListener(event: 'onMessage', callback: (msg: CanMessage) => void): void;

    /**
     * Add a listener for stopped CAN channel
     */
    addListener(event: 'onStopped', callback: () => void): void;

    /**
     * Start operation on this CAN channel
     */
    start(): this;

    /**
     * Stop any operations on this CAN channel
     */
    stop(): this;

    /**
     * Send a CAN message immediately.
     *
     * PLEASE NOTE: By default, this function may block if the Tx buffer is not available. Please use
     * `createRawChannelWithOptions({non_block_send: false})` to get non-blocking sending activated.
     *
     * @param message object describing the CAN message, keys are id, length, data {Buffer}, ext or rtr
     */
    send(message: CanMessage): number;

    /**
     * Set a list of active filters to be applied for incoming messages
     * @param filters single filter or array of filter e.g. { id: 0x1ff, mask: 0x1ff, invert: false}, result of (id & mask)
     */
    setRxFilters(filters: RxFilter | RxFilter[]): this;

    /**
     * Disable loopback of channel. By default it is activated
     */
    disableLoopback(): this;
  }

  interface RawChannelOptions {
    timstamps?: boolean;
    protocol?: number;
    non_block_send?: boolean;
  }

  /**
   * Create a raw can channel
   * @param channel Channel name (e.g. vcan0)
   * @param timestamps Whether or not timestamps shall be generated when reading a message
   * @param protocol optionally provide another default protocol value (default is 1/CAN_RAW)
   */
  function createRawChannel(channel: string, timestamps?: boolean, protocol?: number): RawChannel;

  /**
   * Create a raw can channel
   * @param channel Channel name (e.g. vcan0)
   * @param options list of options (timestamps, protocol, non_block_send)
   */
  function createRawChannelWithOptions(channel: string, options?: RawChannelOptions): RawChannel;

}