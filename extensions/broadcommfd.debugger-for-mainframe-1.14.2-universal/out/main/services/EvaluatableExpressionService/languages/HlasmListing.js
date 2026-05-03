"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HlasmListing = void 0;
const AbstractLanguage_1 = require("./AbstractLanguage");
class HlasmListing extends AbstractLanguage_1.AbstractLanguage {
    constructor() {
        super(...arguments);
        this.regex = /[@#$_A-Za-z][@#$_A-Za-z0-9]{0,63}/g;
    }
}
exports.HlasmListing = HlasmListing;
//# sourceMappingURL=HlasmListing.js.map