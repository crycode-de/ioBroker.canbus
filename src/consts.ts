export const INTERFACE_REGEXP = /^[\w-\/]{1,}$/;

export const MESSAGE_ID_REGEXP = /^([0-7][0-9A-F]{2}|[01][0-9A-F]{7})$/;

export const PARSER_ID_REGEXP = /^[0-9a-z-_]{1,64}$/;
export const PARSER_ID_RESERVED = ['rtr', 'raw', 'json', 'send'];