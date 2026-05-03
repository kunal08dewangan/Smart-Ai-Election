"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SessionSettings_isFiltered, _SessionSettings_isAlphabetic, _SessionSettings_displayInlineVariable, _SessionSettings_isCounts, _SessionSettings_isTrace, _SessionSettings_cacheInlineValues, _SessionSettings_lineNumberOfInlineValues;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionSettings = void 0;
class SessionSettings {
    constructor() {
        _SessionSettings_isFiltered.set(this, void 0);
        _SessionSettings_isAlphabetic.set(this, void 0);
        _SessionSettings_displayInlineVariable.set(this, void 0);
        _SessionSettings_isCounts.set(this, void 0);
        _SessionSettings_isTrace.set(this, void 0);
        _SessionSettings_cacheInlineValues.set(this, void 0);
        _SessionSettings_lineNumberOfInlineValues.set(this, void 0);
        __classPrivateFieldSet(this, _SessionSettings_isFiltered, false, "f");
        __classPrivateFieldSet(this, _SessionSettings_isAlphabetic, false, "f");
        __classPrivateFieldSet(this, _SessionSettings_displayInlineVariable, false, "f");
        __classPrivateFieldSet(this, _SessionSettings_isCounts, false, "f");
        __classPrivateFieldSet(this, _SessionSettings_isTrace, true, "f");
        __classPrivateFieldSet(this, _SessionSettings_cacheInlineValues, [], "f");
        __classPrivateFieldSet(this, _SessionSettings_lineNumberOfInlineValues, -1, "f");
    }
    setIsFiltered(isFiltered) {
        __classPrivateFieldSet(this, _SessionSettings_isFiltered, isFiltered, "f");
    }
    setIsTrace(isTrace) {
        __classPrivateFieldSet(this, _SessionSettings_isTrace, isTrace, "f");
    }
    setIsAlphabetic(isAlphabetic) {
        __classPrivateFieldSet(this, _SessionSettings_isAlphabetic, isAlphabetic, "f");
    }
    isFiltered() {
        return __classPrivateFieldGet(this, _SessionSettings_isFiltered, "f");
    }
    isAlphabetic() {
        return __classPrivateFieldGet(this, _SessionSettings_isAlphabetic, "f");
    }
    setDisplayInlineVariable(displayInlineVariable) {
        __classPrivateFieldSet(this, _SessionSettings_displayInlineVariable, displayInlineVariable, "f");
    }
    isDisplayInlineVariable() {
        return __classPrivateFieldGet(this, _SessionSettings_displayInlineVariable, "f");
    }
    isCounts() {
        return __classPrivateFieldGet(this, _SessionSettings_isCounts, "f");
    }
    setIsCounts(isCounts) {
        __classPrivateFieldSet(this, _SessionSettings_isCounts, isCounts, "f");
    }
    isTrace() {
        return __classPrivateFieldGet(this, _SessionSettings_isTrace, "f");
    }
    addCacheInlineValues(inlineVariable) {
        if (!__classPrivateFieldGet(this, _SessionSettings_cacheInlineValues, "f").includes(inlineVariable)) {
            __classPrivateFieldGet(this, _SessionSettings_cacheInlineValues, "f").push(inlineVariable);
        }
    }
    getCacheInlineValues() {
        return __classPrivateFieldGet(this, _SessionSettings_cacheInlineValues, "f");
    }
    clearCacheInlineValues() {
        __classPrivateFieldSet(this, _SessionSettings_cacheInlineValues, [], "f");
    }
    setLineNumberOfInlineValues(lineNumber) {
        __classPrivateFieldSet(this, _SessionSettings_lineNumberOfInlineValues, lineNumber, "f");
    }
    getLineNumberOfInlineValues() {
        return __classPrivateFieldGet(this, _SessionSettings_lineNumberOfInlineValues, "f");
    }
}
exports.SessionSettings = SessionSettings;
_SessionSettings_isFiltered = new WeakMap(), _SessionSettings_isAlphabetic = new WeakMap(), _SessionSettings_displayInlineVariable = new WeakMap(), _SessionSettings_isCounts = new WeakMap(), _SessionSettings_isTrace = new WeakMap(), _SessionSettings_cacheInlineValues = new WeakMap(), _SessionSettings_lineNumberOfInlineValues = new WeakMap();
//# sourceMappingURL=SessionSettings.js.map