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
exports.InlineValuesProvider = void 0;
const vscode = require("vscode");
const VariableInfo_1 = require("../VariableInfo");
const Cobol_1 = require("./languages/Cobol");
class InlineValuesProvider {
    constructor(language, sessionSettingsMap) {
        this.decorations = [];
        this.sessionSettingsMap = sessionSettingsMap;
        this.language = language;
        this.contentText = "";
    }
    provideInlineValues(document, viewport, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionSettings = this.getSessionSettings();
            const expression = this.language.regex;
            if (!expression || !sessionSettings || !sessionSettings.isDisplayInlineVariable()) {
                sessionSettings === null || sessionSettings === void 0 ? void 0 : sessionSettings.setLineNumberOfInlineValues(-1);
                this.clearDecorations();
                return;
            }
            const activeSession = vscode.debug.activeDebugSession;
            if (activeSession === undefined)
                return;
            const inlineValues = [];
            const frameId = context.frameId.toString();
            let startLineNumber = context.stoppedLocation.end.line;
            if (startLineNumber != sessionSettings.getLineNumberOfInlineValues()) {
                sessionSettings.clearCacheInlineValues();
            }
            sessionSettings.setLineNumberOfInlineValues(startLineNumber);
            let line = document.lineAt(startLineNumber);
            let lineText = line.text;
            if (sessionSettings.getCacheInlineValues().length > 0) {
                this.generateInlineValueByAddingDecorator(sessionSettings.getCacheInlineValues(), document, context);
                return;
            }
            if (this.language instanceof Cobol_1.Cobol) {
                const inlineVariables = yield this.getLocalValues(frameId, activeSession);
                if (inlineVariables.result) {
                    inlineValues.push(inlineVariables.result);
                    sessionSettings.addCacheInlineValues(inlineVariables.result);
                }
                while (!lineText.trim().endsWith('.') && startLineNumber < document.lineCount) {
                    startLineNumber++;
                    line = document.lineAt(startLineNumber);
                    lineText += line.text;
                }
            }
            if (inlineValues.length == 0) {
                let potentialVariable;
                let result;
                let index = 0;
                do {
                    result = expression.exec(lineText);
                    if (result) {
                        potentialVariable = result[0];
                        index = result.index;
                        const lengthOfLineText = lineText.length;
                        for (; index < lengthOfLineText; ++index) {
                            const charValue = lineText.charAt(index);
                            if (charValue !== ' ') {
                                const response = yield this.addVariable(lineText, index, result.index, potentialVariable.length, startLineNumber, document, activeSession, frameId);
                                if (response) {
                                    index = response.index;
                                    if (!inlineValues.includes(response.inlineTextValue))
                                        inlineValues.push(response.inlineTextValue);
                                }
                                break;
                            }
                        }
                    }
                } while (result);
            }
            this.generateInlineValueByAddingDecorator(inlineValues, document, context);
            this.sessionSettingsMap.set(activeSession.id, sessionSettings);
            return undefined;
        });
    }
    getLocalValues(frameId, session) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield session.customRequest("evaluate", {
                expression: "/LOCALVALUES",
                frameId: frameId,
                context: "repl"
            });
        });
    }
    getSessionSettings() {
        const activeSession = vscode.debug.activeDebugSession;
        return (activeSession && this.sessionSettingsMap.has(activeSession.id)) ? this.sessionSettingsMap.get(activeSession.id) : undefined;
    }
    generateInlineValueByAddingDecorator(inlineValueResult, document, context) {
        const startLineNumber = context.stoppedLocation.end.line;
        const lineText = document.lineAt(startLineNumber).text;
        const range = new vscode.Range(startLineNumber, lineText.trimRight().length, startLineNumber, 0);
        const decoration = {
            renderOptions: {
                after: {
                    margin: "1" + "ch",
                    contentText: inlineValueResult.toString(),
                    backgroundColor: "#ffc80033"
                },
            },
            range,
        };
        const inlineDecorator = vscode.window.createTextEditorDecorationType({});
        vscode.window.visibleTextEditors.forEach((editor) => {
            editor.setDecorations(inlineDecorator, [decoration]);
        });
        this.clearDecorations();
        this.contentText = inlineValueResult.toString();
        this.decorations.push(inlineDecorator);
    }
    addVariable(lineText, index, resultIndex, variableLength, lineNumber, document, session, frameId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            index++;
            const variableEndIndex = resultIndex + variableLength;
            let inlineTextValue;
            const variableName = lineText.substring(resultIndex, variableEndIndex);
            const variableInfo = new VariableInfo_1.VariableInfo(variableName, lineNumber, document, variableEndIndex);
            const parents = variableInfo.parents;
            for (let i = 0; i < parents.length; ++i) {
                index += 2 + parents[i].length;
            }
            const variableResponse = yield this.getValue(variableInfo.getVariableNameWithParentsAndLineNumber(), session, frameId);
            if (variableResponse) {
                inlineTextValue = variableName + "=" + variableResponse.result;
                (_a = this.getSessionSettings()) === null || _a === void 0 ? void 0 : _a.addCacheInlineValues(inlineTextValue);
                return { index, inlineTextValue };
            }
        });
    }
    getValue(variableExpression, session, frameId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield session.customRequest("evaluate", {
                expression: variableExpression,
                context: "inlineValue",
                frameId: frameId
            });
            return response;
        });
    }
    clearDecorations() {
        for (const dec of this.decorations) {
            dec === null || dec === void 0 ? void 0 : dec.dispose();
        }
        this.contentText = "";
        this.decorations = [];
    }
    getDecorations() {
        return this.decorations;
    }
    getContentText() {
        return this.contentText;
    }
    setLanguage(language) {
        this.language = language;
    }
}
exports.InlineValuesProvider = InlineValuesProvider;
//# sourceMappingURL=InlineValuesProvider.js.map