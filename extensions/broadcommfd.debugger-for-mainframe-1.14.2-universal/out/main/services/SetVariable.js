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
exports.SetVariable = void 0;
const vscode = require("vscode");
const VariableInfo_1 = require("./VariableInfo");
const TelemetryReporterService_1 = require("./TelemetryReporterService");
const constants_1 = require("../constants");
class SetVariable {
    setVariable() {
        return __awaiter(this, void 0, void 0, function* () {
            const variableInfo = this.getVariableInfo();
            if (variableInfo === null ||
                !variableInfo.variableName ||
                variableInfo.variableName === "") {
                return;
            }
            const selectedVar = variableInfo.variableName;
            const newValue = yield this.getNewValueFromInputBox(selectedVar);
            const session = vscode.debug.activeDebugSession;
            if (!session || !newValue)
                return;
            const varId = yield this.getVarId(session, variableInfo);
            TelemetryReporterService_1.TelemetryReporterService.Instance.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_DEBUG_SET_VARIABLE);
            yield session.customRequest("setVariable", {
                variablesReference: varId,
                name: variableInfo.getVariableNameWithParentsAndLineNumber(),
                value: newValue,
            });
        });
    }
    getVarId(session, variableInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const threads = yield session.customRequest("threads");
            const sTrace = yield session.customRequest("stackTrace", {
                threadId: threads.threads[0].id,
                context: "repl",
            });
            let frameId = sTrace.stackFrames[0].id;
            for (const stackFrame of sTrace.stackFrames) {
                if (((_a = stackFrame.source) === null || _a === void 0 ? void 0 : _a.path) == variableInfo.documentLocal.fileName) {
                    frameId = stackFrame.id;
                }
            }
            const scope = yield session.customRequest("scopes", {
                frameId: frameId,
            });
            const varId = scope.scopes[0].variablesReference;
            return varId;
        });
    }
    getVariableInfo() {
        var _a, _b;
        if (vscode.window.activeTextEditor === null ||
            vscode.window.activeTextEditor === undefined)
            return null;
        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        const selection = editor.selection;
        const lineNumber = (_a = selection.active) === null || _a === void 0 ? void 0 : _a.line;
        let variableName = document.getText(selection).trim();
        let end = 0;
        let searchSelection = selection.active;
        const regexPattern = /.+\(.+\)/;
        if (variableName.includes(constants_1.PARENT_KEY_WORD) ||
            !regexPattern.test(variableName)) {
            searchSelection = selection.start;
        }
        const variableRange = document.getWordRangeAtPosition(searchSelection, constants_1.VARIABLE_CHECK_FROM_EDITOR_REGEX);
        if (variableRange) {
            variableName = document.getText(variableRange).trim();
            end = (_b = variableRange.end) === null || _b === void 0 ? void 0 : _b.character;
        }
        return new VariableInfo_1.VariableInfo(variableName, lineNumber, document, end);
    }
    getNewValueFromInputBox(selectedVar) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = vscode.debug.activeDebugSession;
            if (!session)
                return;
            const newValue = yield vscode.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: "Please enter new value for " + selectedVar + ".",
            });
            return newValue;
        });
    }
}
exports.SetVariable = SetVariable;
//# sourceMappingURL=SetVariable.js.map