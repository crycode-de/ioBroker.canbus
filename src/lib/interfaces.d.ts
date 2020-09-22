declare interface MessageConfig extends ioBroker.AdapterConfigMessage {
  /**
   * The ID of the message as number.
   */
  idNum: number;

  /**
   * If the ID is in extened frame format.
   */
  ext: boolean;

  /**
   * The uuid of this message if it is configured.
   * `null` if this message is automatically added.
   */
  uuid: string | null;
}