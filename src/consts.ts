export const INTERFACE_REGEXP = /^[\w-/]{1,}$/;

export const MESSAGE_ID_REGEXP = /^([0-7][0-9A-F]{2}|[01][0-9A-F]{7})$/;
export const MESSAGE_ID_REGEXP_WITH_DLC = /^([0-7][0-9A-F]{2}|[01][0-9A-F]{7})(-[0-8])?$/;

export const PARSER_ID_REGEXP = /^[0-9a-z-_]{1,64}$/;
export const PARSER_ID_RESERVED = [ 'rtr', 'raw', 'json', 'send' ];

export const PARSER_COMMON_STATES_REGEXP = /^([^=]+=[^,]+,)*([^=]+=[^,]+)$/;
