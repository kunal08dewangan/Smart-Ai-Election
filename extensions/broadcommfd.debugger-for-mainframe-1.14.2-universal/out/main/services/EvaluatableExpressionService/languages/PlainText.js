"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlainText = void 0;
const constants_1 = require("../../../constants");
const AbstractLanguage_1 = require("./AbstractLanguage");
class PlainText extends AbstractLanguage_1.AbstractLanguage {
    constructor() {
        super(...arguments);
        this.regex = constants_1.VARIABLE_CHECK_FROM_EDITOR_REGEX;
    }
}
exports.PlainText = PlainText;
//# sourceMappingURL=PlainText.js.map