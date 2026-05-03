"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluatableExpressionProvider = void 0;
const vscode = require("vscode");
const VariableInfo_1 = require("../VariableInfo");
class EvaluatableExpressionProvider {
    constructor(language) {
        this.language = language;
    }
    provideEvaluatableExpression(document, position) {
        var _a;
        const lineContent = document.lineAt(position.line).text;
        const expression = this.language.regex;
        if (!expression)
            return undefined;
        expression.lastIndex = 0; //suppressing the stateful RegExp object
        let result = expression.exec(lineContent);
        while (result != null) {
            const start = result.index;
            const end = start + result[0].length;
            if (start <= position.character && end >= position.character) {
                if (this.isOverlapingWithSelection(this.getSelection(position), start, end)) {
                    break;
                }
                const variableInfo = new VariableInfo_1.VariableInfo(lineContent.substring(start, end), position.line, document, end);
                return new vscode.EvaluatableExpression(new vscode.Range(position.line, start, position.line, end), variableInfo.getVariableNameWithParentsAndLineNumber());
            }
            result = expression.exec(lineContent);
        }
        const selection = this.getSelection(position);
        if (selection) {
            const lineNumber = (_a = selection.active) === null || _a === void 0 ? void 0 : _a.line;
            const lineContent = document.lineAt(lineNumber).text;
            const expr = lineContent.substring(selection.start.character, selection.end.character);
            const variableInfo = new VariableInfo_1.VariableInfo(expr, position.line, document, selection.end.character);
            return new vscode.EvaluatableExpression(new vscode.Range(lineNumber, selection.start.character, lineNumber, selection.end.character), variableInfo.getVariableNameWithParentsAndLineNumber());
        }
        return undefined;
    }
    getSelection(position) {
        var _a;
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            if (selection &&
                !selection.isEmpty &&
                position.line === ((_a = selection.active) === null || _a === void 0 ? void 0 : _a.line))
                return selection;
        }
        return undefined;
    }
    isOverlapingWithSelection(selection, hoverStart, hoverEnd) {
        if (!selection)
            return false;
        const selectionStart = selection.start.character;
        const selectionEnd = selection.end.character;
        return this.betweenRange(selectionStart, hoverStart, selectionEnd) ||
            this.betweenRange(selectionStart, hoverEnd, selectionEnd) ||
            this.betweenRange(hoverStart, selectionStart, hoverEnd) ||
            this.betweenRange(hoverStart, selectionEnd, hoverEnd);
    }
    betweenRange(start, target, end) {
        return start <= target && end >= target;
    }
}
exports.EvaluatableExpressionProvider = EvaluatableExpressionProvider;
//# sourceMappingURL=EvaluatableExpressionProvider.js.map