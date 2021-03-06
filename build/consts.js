"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARSER_COMMON_STATES_REGEXP = exports.PARSER_ID_RESERVED = exports.PARSER_ID_REGEXP = exports.MESSAGE_ID_REGEXP_WITH_DLC = exports.MESSAGE_ID_REGEXP = exports.INTERFACE_REGEXP = void 0;
exports.INTERFACE_REGEXP = /^[\w-\/]{1,}$/;
exports.MESSAGE_ID_REGEXP = /^([0-7][0-9A-F]{2}|[01][0-9A-F]{7})$/;
exports.MESSAGE_ID_REGEXP_WITH_DLC = /^([0-7][0-9A-F]{2}|[01][0-9A-F]{7})(-[0-8])?$/;
exports.PARSER_ID_REGEXP = /^[0-9a-z-_]{1,64}$/;
exports.PARSER_ID_RESERVED = ['rtr', 'raw', 'json', 'send'];
exports.PARSER_COMMON_STATES_REGEXP = /^([^=]+=[^,]+,)*([^=]+=[^,]+)$/;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbnN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBYSxRQUFBLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztBQUVuQyxRQUFBLGlCQUFpQixHQUFHLHNDQUFzQyxDQUFDO0FBQzNELFFBQUEsMEJBQTBCLEdBQUcsK0NBQStDLENBQUM7QUFFN0UsUUFBQSxnQkFBZ0IsR0FBRyxvQkFBb0IsQ0FBQztBQUN4QyxRQUFBLGtCQUFrQixHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFcEQsUUFBQSwyQkFBMkIsR0FBRyxnQ0FBZ0MsQ0FBQyJ9