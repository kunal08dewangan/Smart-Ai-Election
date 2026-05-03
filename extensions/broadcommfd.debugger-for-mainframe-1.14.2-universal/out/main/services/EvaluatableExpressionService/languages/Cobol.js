"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cobol = void 0;
const AbstractLanguage_1 = require("./AbstractLanguage");
class Cobol extends AbstractLanguage_1.AbstractLanguage {
    constructor() {
        super(...arguments);
        this.regex = /[a-zA-Z0-9][-a-zA-Z0-9]{0,30}/g;
    }
}
exports.Cobol = Cobol;
//# sourceMappingURL=Cobol.js.map