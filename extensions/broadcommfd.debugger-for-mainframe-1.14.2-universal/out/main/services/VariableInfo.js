"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableInfo = void 0;
const constants_1 = require("../constants");
class VariableInfo {
    constructor(variableName, lineNumber, documentLocal, end) {
        this.parents = [];
        this.variableName = variableName;
        this.lineNumber = lineNumber;
        this.documentLocal = documentLocal;
        this.end = end;
    }
    getVariableNameWithParentsAndLineNumber() {
        const lineNumberLocal = this.lineNumber + 1;
        return this.getVariableNameWithParents() + constants_1.DELIMITER + lineNumberLocal;
    }
    getVariableNameWithParents() {
        let parents = this.generateParents();
        if (parents) {
            parents = "." + parents;
        }
        return this.variableName + parents;
    }
    generateParents() {
        const wordsOfLines = this.parseLine();
        return this.getParentsFromLine(wordsOfLines).join(".");
    }
    parseLine() {
        const temp = [];
        let startIndex = this.end;
        if (!this.documentLocal) {
            return temp;
        }
        let lineNumberOfSelected = this.lineNumber;
        while (lineNumberOfSelected < this.documentLocal.lineCount) {
            const line = this.documentLocal.lineAt(lineNumberOfSelected).text;
            const restOfLine = line.substring(startIndex).split(/(\s+)/).filter(function (e) { return e.trim().length > 0; });
            for (let i = 0; i < restOfLine.length; i++) {
                temp.push(restOfLine[i]);
                if (restOfLine[i].indexOf('.') > -1) {
                    temp[temp.length - 1] = restOfLine[i].substring(0, restOfLine[i].indexOf("."));
                    return temp;
                }
            }
            lineNumberOfSelected++;
            startIndex = 0;
        }
        return temp;
    }
    getParentsFromLine(temp) {
        const parents = [];
        for (let i = 0; i < temp.length; i++) {
            if (i % 2 === 0 && temp[i].toUpperCase() === constants_1.PARENT_KEY_WORD) {
                i++;
                parents.push(temp[i].toUpperCase());
            }
            else {
                break;
            }
        }
        this.parents = parents;
        return parents;
    }
}
exports.VariableInfo = VariableInfo;
//# sourceMappingURL=VariableInfo.js.map