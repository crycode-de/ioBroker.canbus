"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARSER_ID_RESERVED = exports.PARSER_ID_REGEXP = exports.MESSAGE_ID_REGEXP_WITH_DLC = exports.MESSAGE_ID_REGEXP = exports.INTERFACE_REGEXP = void 0;
exports.INTERFACE_REGEXP = /^[\w-\/]{1,}$/;
exports.MESSAGE_ID_REGEXP = /^([0-7][0-9A-F]{2}|[01][0-9A-F]{7})$/;
exports.MESSAGE_ID_REGEXP_WITH_DLC = /^([0-7][0-9A-F]{2}|[01][0-9A-F]{7})(-[0-8])?$/;
exports.PARSER_ID_REGEXP = /^[0-9a-z-_]{1,64}$/;
exports.PARSER_ID_RESERVED = ['rtr', 'raw', 'json', 'send'];
//# sourceMappingURL=consts.js.map