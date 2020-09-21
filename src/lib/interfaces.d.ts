declare interface MessageConfig extends ioBroker.AdapterConfigMessage {
  /**
   * The ID of the message as number.
   */
  idNum: number;

  /**
   * The uuid of this message if it is configured.
   * `null` if this message is automatically added.
   */
  uuid: string | null;
}