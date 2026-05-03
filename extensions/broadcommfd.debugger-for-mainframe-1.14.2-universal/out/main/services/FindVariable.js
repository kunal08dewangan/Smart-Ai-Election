"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindVariable = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
class FindVariable {
    constructor(sessionSettingsMap) {
        this.sessionSettingsMap = sessionSettingsMap;
    }
    setFilterVariable() {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = yield this.filterFromInputBox();
            this.sendRequest(filter);
        });
    }
    goToVariable() {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = this.getVariableNameFromEditor();
            this.sendRequest(filter);
        });
    }
    clearFilterVariable() {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.commands.executeCommand('setContext', 'filtered', false);
            const session = vscode.debug.activeDebugSession;
            if (!session)
                return;
            const sessionSettings = this.sessionSettingsMap.get(session.id);
            if (sessionSettings) {
                sessionSettings.setIsFiltered(false);
                this.sessionSettingsMap.set(session.id, sessionSettings);
            }
            session.customRequest("evaluate", {
                expression: "/VARIABLE CLEAR FILTER",
                context: "repl"
            });
        });
    }
    filterFromInputBox() {
        return __awaiter(this, void 0, void 0, function* () {
            const session = vscode.debug.activeDebugSession;
            if (!session)
                return;
            const newValue = yield vscode.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: "Please enter filter value.",
            });
            return newValue;
        });
    }
    getVariableNameFromEditor() {
        let variableName;
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return variableName;
        const document = editor.document;
        const selection = editor.selection;
        variableName = document.getText(selection).trim();
        if (variableName !== '') {
            return variableName;
        }
        const variableRnge = document.getWordRangeAtPosition(selection.active, constants_1.VARIABLE_CHECK_FROM_EDITOR_REGEX);
        if (variableRnge) {
            variableName = document.getText(variableRnge).trim();
        }
        return variableName;
    }
    sendRequest(filter) {
        const session = vscode.debug.activeDebugSession;
        if (!session || !filter || filter.match(/^ *$/) !== null)
            return;
        session.customRequest("evaluate", {
            expression: "/VARIABLE FILTER " + filter,
            context: "repl"
        });
        const sessionSettings = this.sessionSettingsMap.get(session.id);
        if (sessionSettings) {
            sessionSettings.setIsFiltered(true);
            this.sessionSettingsMap.set(session.id, sessionSettings);
        }
        vscode.commands.executeCommand('setContext', 'filtered', true);
    }
}
exports.FindVariable = FindVariable;
//# sourceMappingURL=FindVariable.js.map