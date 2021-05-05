"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserBase = void 0;
/**
 * Abstract base class for all parsers.
 * Each parser must extend this base class, implement the `read()` and `write()`
 * methods and set its `handledDataTypes`.
 */
class ParserBase {
    constructor(adapter, parserConfig) {
        this.cfg = parserConfig;
        this.adapter = adapter;
    }
    /**
     * Check if this parser can handle a data type.
     * @param dataType The data type to check for.
     * @return `true` if this parser can handle the data type.
     */
    static canHandle(dataType) {
        return this.handledDataTypes.includes(dataType);
    }
}
exports.ParserBase = ParserBase;
/**
 * Array of data types this parser can handle.
 */
ParserBase.handledDataTypes = [];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXJzZXJzL2Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUE7Ozs7R0FJRztBQUNILE1BQXNCLFVBQVU7SUFjOUIsWUFBWSxPQUFzQixFQUFFLFlBQWlEO1FBQ25GLElBQUksQ0FBQyxHQUFHLEdBQUcsWUFBWSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUF3QztRQUM5RCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEQsQ0FBQzs7QUExQkgsZ0NBMENDO0FBakNDOztHQUVHO0FBQ3VCLDJCQUFnQixHQUFhLEVBQUUsQ0FBQyJ9