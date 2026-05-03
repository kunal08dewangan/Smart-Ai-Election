"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const util_1 = require("util");
class Utils {
    static validateCommandResponse(response) {
        let resultContent;
        try {
            resultContent = JSON.parse(response);
        }
        catch (error) {
            throw new Error(error.message);
        }
        return resultContent;
    }
    static utf8ArrayToStr(array) {
        const bytes = Uint8Array.from(array);
        const decoder = new util_1.TextDecoder('utf-8');
        return decoder.decode(bytes);
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map