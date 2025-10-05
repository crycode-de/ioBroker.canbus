/*
 * CAN interface for Waveshare 2-Ch CAN to Ethernet adapter
 * https://www.waveshare.com/wiki/2-CH-CAN-TO-ETH
 *
 * Communication is done via a TCP socket connection to the adapter.
 * The adapter sends and receives raw CAN frames in a fixed 13-byte format.
 *
 * Frame (always 13 bytes):
 *  Byte 0   : Frame information byte
 *             Bit7 (0x80): 1 = Extended frame (29-bit ID), 0 = Standard frame (11-bit ID)
 *             Bit6 (0x40): 1 = RTR (Remote Transmission Request), 0 = Data frame
 *             Bit5..4     : Reserved (should be 0)
 *             Bit3..0     : DLC (Data Length Code 0..8)
 *  Byte 1-4 : CAN ID (big endian). For standard frames only the lower 11 bits are used,
 *             for extended frames the lower 29 bits. Example extended: ID 0x12345678 => 12 34 56 78
 *  Byte 5-12: Data bytes (0-8 valid according to DLC). Remaining bytes padded with 0x00.
 *
 * Notes:
 *  - For RTR frames (Bit6=1) no payload bytes are transmitted; the DLC indicates the requested length.
 */
import net from 'node:net';
import { boundMethod } from 'autobind-decorator';
import type { CanMessage } from 'socketcan';

import type { CanBusAdapter } from './main';
import { CanInterface } from './can-interface';

/**
 * Interface to the CAN bus using Waveshare CAN to Ethernet Server.
 */
export class CanInterfaceWaveshareCan2eth extends CanInterface {
  /** Fixed frame size defined by the protocol */
  private static readonly FRAME_SIZE = 13;

  /**
   * The TCP socket to the CAN to Ethernet adapter.
   */
  private socket: net.Socket | null = null;
  /**
   * Number of performed reconnect attempts (resets to 0 after a successful connection).
   */
  private reconnectAttempts = 0;
  /**
   * Timer used for a planned reconnect attempt.
   */
  private reconnectTimer: ioBroker.Timeout | null = null;
  /**
   * Flag set when stop() was called intentionally to prevent automatic reconnects.
   */
  private intentionalDisconnect = false;
  /**
   * Receive buffer for incoming (possibly fragmented or coalesced) TCP data.
   */
  private receiveBuffer: Buffer = Buffer.alloc(0);

  constructor (adapter: CanBusAdapter) {
    super(adapter);
  }

  public async start (): Promise<boolean> {
    this.intentionalDisconnect = false;
    return await this.connect();
  }

  public async stop (): Promise<void> {
    this.intentionalDisconnect = true;
    // cancel a scheduled reconnect
    if (this.reconnectTimer !== null) {
      this.adapter.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    await this.disconnect();
  }

  public isReady (): boolean {
    return this.started && this.socket !== null && !this.socket.destroyed;
  }

  public send (id: number, ext: boolean, data: Buffer, rtr: boolean = false): boolean {
    // Basic connection checks
    if (!this.socket || this.socket.destroyed || !this.started) {
      this.adapter.log.warn('Cannot send CAN frame: socket not connected');
      return false;
    }

    // ID validation
    if (ext) {
      if (id < 0 || id > 0x1FFFFFFF) {
        this.adapter.log.error(`Extended CAN ID out of range: 0x${id.toString(16)}`);
        return false;
      }
    } else {
      if (id < 0 || id > 0x7FF) {
        this.adapter.log.error(`Standard CAN ID out of range: 0x${id.toString(16)}`);
        return false;
      }
    }

    // Data length / DLC
    let dlc = data.length;
    if (dlc > 8) {
      this.adapter.log.warn(`Truncating data from ${dlc} to 8 bytes`);
      dlc = 8;
    }
    if (dlc < 0) dlc = 0; // defensive

    // Build frame buffer (13 bytes fixed)
    const frame = Buffer.alloc(CanInterfaceWaveshareCan2eth.FRAME_SIZE, 0x00);
    // Frame info byte
    frame[0] = (ext ? 0x80 : 0) | (rtr ? 0x40 : 0) | dlc;
    // Write ID (big endian). Only lower bits are valid; higher bits zeroed by mask.
    const maskedId = ext ? (id & 0x1FFFFFFF) : (id & 0x7FF);
    frame.writeUInt32BE(maskedId, 1);
    // Data (only if not RTR). Even if RTR had data buffer, we do not send payload bytes per protocol.
    if (!rtr && dlc > 0) {
      data.subarray(0, dlc).copy(frame, 5);
    }

    this.adapter.log.silly(`TX raw frame: ${frame.toString('hex')}`);
    this.adapter.log.debug(`Sending CAN frame id=0x${id.toString(16)}${ext ? ' (ext)' : ''}${rtr ? ' RTR' : ''} dlc=${dlc} data=${(!rtr && dlc > 0) ? data.subarray(0, dlc).toString('hex') : ''}`);

    try {
      const ok = this.socket.write(frame);
      if (!ok) {
        this.adapter.log.silly('Socket write returned false (backpressure), data buffered internally');
      }
      return true; // Considered queued
    } catch (err) {
      this.adapter.log.error(`Error sending CAN frame: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Connect to the CAN to Ethernet adapter.
   * @returns `true` if connected, `false` in case of an error.
   */
  private async connect (): Promise<boolean> {
    const { ip, port } = this.adapter.config;

    // wait until we are connected or an error occurs
    const connected = await new Promise<boolean>((resolve) => {
      this.adapter.log.debug(`Connecting to CAN to Ethernet adapter at ${ip}:${port}...`);

      this.socket = new net.Socket();

      this.socket.connect(port, ip);

      const connectErrorHandler = (err: Error): void => {
        this.adapter.log.error(`Error connecting to CAN to Ethernet adapter at ${ip}:${port}: ${err.message}`);
        this.socket?.destroy();
        this.socket = null;
        resolve(false);
      };

      this.socket.once('connect', () => {
        this.adapter.log.debug(`Connected to CAN to Ethernet adapter at ${ip}:${port}`);
        this.socket?.removeListener('error', connectErrorHandler);
        resolve(true);
      });

      this.socket.once('error', connectErrorHandler);
    });

    // fail if we could not connect
    if (!connected) {
      this.scheduleReconnect();
      return false;
    }

    // reset reconnect attempts counter on success
    this.reconnectAttempts = 0;

    // listen for incoming data
    this.socket!.on('data', this.handleSocketData);

    // handle runtime errors (after initial connection). We only log them – the 'close' event will trigger the reconnect.
    this.socket!.on('error', (err) => {
      this.adapter.log.warn(`Socket error: ${err.message}`);
    });

    // handle socket closed event (also triggered after 'end')
    this.socket!.on('close', (hadError) => {
      if (this.intentionalDisconnect) {
        this.adapter.log.debug('Socket closed intentionally');
        return;
      }
      this.adapter.log.warn(`Socket closed${hadError ? ' due to a transmission error' : ''}. Will attempt to reconnect.`);
      this.socket = null;

      // mark interface as not started for now
      this.started = false;
      this.emit('stopped');

      this.scheduleReconnect();
    });

    this.started = true;
    this.emit('started');
    this.adapter.log.info('CAN to Ethernet adapter connection established and ready');

    return true;
  }

  /**
   * Disconnect from the CAN to Ethernet adapter.
   */
  private async disconnect (): Promise<void> {
    if (this.socket) {
      this.adapter.log.debug('Disconnecting from CAN to Ethernet adapter...');

      // create a copy of the socket reference and set to null to avoid
      // sending on a closed socket
      const socket = this.socket;
      this.socket = null;

      // wait until the socket is fully closed
      await new Promise<void>((resolve) => {
        // set a timeout in case the socket does not close properly
        const timeout = this.adapter.setTimeout(() => {
          if (!socket.destroyed) {
            this.adapter.log.warn('Timeout while disconnecting from CAN to Ethernet adapter');
            socket.destroy();
          }
        }, 5000);

        // resolve when the socket is closed
        socket.once('close', () => {
          this.adapter.clearTimeout(timeout);
          resolve();
        });

        // in case of an error just destroy the socket
        socket.once('error', (err) => {
          this.adapter.log.error(`Error while disconnecting from CAN to Ethernet adapter: ${err.message}`);
          if (!socket.destroyed) socket.destroy();
        });

        // end the socket connection
        socket.end();
      });

      this.started = false;
      this.emit('stopped');
      this.adapter.log.info('Disconnected from CAN to Ethernet adapter');
    }
  }

  /**
   * Handle incoming data from the CAN to Ethernet adapter.
   * @param received The incoming data buffer.
   */
  @boundMethod
  private handleSocketData (received: Buffer): void {
    // Append incoming data to buffer (TCP may fragment or coalesce multiple frames)
    if (received.length === 0) return;
    this.receiveBuffer = Buffer.concat([ this.receiveBuffer, received ]);
    this.adapter.log.silly(`RX append (${received.length}B): total=${this.receiveBuffer.length} hex=${received.toString('hex')}`);

    // Process as long as at least one full frame (13 bytes) is available
    while (this.receiveBuffer.length >= CanInterfaceWaveshareCan2eth.FRAME_SIZE) {
      const frame = this.receiveBuffer.subarray(0, CanInterfaceWaveshareCan2eth.FRAME_SIZE);
      this.receiveBuffer = this.receiveBuffer.subarray(CanInterfaceWaveshareCan2eth.FRAME_SIZE);

      const frameInfo = frame[0];
      const ext = (frameInfo & 0x80) !== 0; // Extended flag
      const rtr = (frameInfo & 0x40) !== 0; // RTR flag
      const dlc = frameInfo & 0x0F; // DLC

      if (dlc > 8) {
        this.adapter.log.warn(`Invalid DLC (${dlc}) in frame info byte 0x${frameInfo.toString(16)} – discarding frame`);
        continue; // Skip invalid frame
      }

      // Extract CAN ID
      const rawId = frame.readUInt32BE(1);
      const id = ext ? (rawId & 0x1FFFFFFF) : (rawId & 0x7FF);

      // Extract data bytes (for RTR no payload even if padding exists)
      const data = rtr ? Buffer.alloc(0) : frame.subarray(5, 5 + dlc);

      const msg: CanMessage = { id, ext, rtr, data };
      this.adapter.log.debug(`Received CAN frame id=0x${id.toString(16)}${ext ? ' (ext)' : ''}${rtr ? ' RTR' : ''} dlc=${dlc} data=${(!rtr && dlc > 0) ? data.subarray(0, dlc).toString('hex') : ''}`);
      this.emit('message', msg);
    }
  }

  /**
   * Schedule a reconnect attempt with exponential backoff.
   * Backoff: 2s, 4s, 8s, ... up to max 60s.
   */
  private scheduleReconnect (): void {
    if (this.intentionalDisconnect) return; // do not reconnect if stop() requested
    if (this.reconnectTimer) return; // already scheduled

    const delay = Math.min(60000, 2000 * Math.pow(2, this.reconnectAttempts));
    this.adapter.log.debug(`Scheduling reconnect attempt #${this.reconnectAttempts + 1} in ${delay / 1000}s`);

    const t = this.adapter.setTimeout(async () => {
      this.reconnectTimer = null; // timer consumed
      if (this.intentionalDisconnect) return; // double-check

      this.reconnectAttempts++;
      await this.connect();
    }, delay);
    this.reconnectTimer = t ?? null;
  }
}
