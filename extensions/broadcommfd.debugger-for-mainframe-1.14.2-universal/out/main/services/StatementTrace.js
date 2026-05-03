"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statementTraceDecoration = exports.StatementTraceObject = exports.StatementTrace = exports.StatementTraceProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const vscode_1 = require("vscode");
class StatementTraceProvider {
    constructor(sessionContext) {
        this.currentSessionId = undefined;
        this.statementTraces = new Map();
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.sessionSettings = sessionContext;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        var _a;
        if (this.currentSessionId && ((_a = this.sessionSettings.get(this.currentSessionId)) === null || _a === void 0 ? void 0 : _a.isTrace())) {
            return this.statementTraces.get(this.currentSessionId);
        }
        return [];
    }
    getParent(element) {
        return element;
    }
    /**
     * Logically previous statement, regardless of sorting order
     *
     * @param currentlySelected current statement
     * @returns previous statement, or the same if first statement
     */
    getPrevious(currentlySelected) {
        return this._getAdjacent(currentlySelected, true, this._isReverseOrder());
    }
    /**
     * Logically next statement, regardless of sorting order
     *
     * @param currentlySelected current statement
     * @returns next statement, or the same if last statement
     */
    getNext(currentlySelected) {
        return this._getAdjacent(currentlySelected, false, this._isReverseOrder());
    }
    /**
     * Statement above current, regardless of logical order
     *
     * @param currentlySelected current statement
     * @returns statement above, or the same if first statement in view
     */
    getAbove(currentlySelected) {
        return this._getAdjacent(currentlySelected, true, false);
    }
    /**
     * Statement below current, regardless of logical order
     *
     * @param currentlySelected current statement
     * @returns statement below, or the same if last statement in view
     */
    getBelow(currentlySelected) {
        return this._getAdjacent(currentlySelected, false, false);
    }
    /**
     * True if statement trace is in reverse order (when last executed command is on top)
     */
    _isReverseOrder() {
        return true; //TODO - implement method when switchable sorting of statement trace is introduced
    }
    _previousIndex(currentIndex) {
        return currentIndex > 0 ? currentIndex - 1 : currentIndex;
    }
    _nextIndex(currentIndex, maxLength) {
        return currentIndex < maxLength - 1 ? currentIndex + 1 : currentIndex;
    }
    _getAdjacent(currentlySelected, previous, reverseOrder) {
        const elements = this.statementTraces.get(this.currentSessionId);
        const currentIndex = elements.indexOf(currentlySelected);
        let index = currentIndex;
        if ((previous && reverseOrder) || (!previous && !reverseOrder))
            index = this._nextIndex(currentIndex, elements.length);
        else if ((previous && !reverseOrder) || (!previous && reverseOrder))
            index = this._previousIndex(currentIndex);
        return elements[index];
    }
    updateStatementTrace(sessionId, statementTraceResponse) {
        var _a;
        if (!statementTraceResponse) {
            this.statementTraces.delete(sessionId);
        }
        this.statementTraces.set(sessionId, []);
        try {
            if (statementTraceResponse && statementTraceResponse.length > 0) {
                for (let i = 0; i < statementTraceResponse.length; i++) {
                    const moduleName = statementTraceResponse[i].program;
                    const lineNumber = +statementTraceResponse[i].firstStatement;
                    const path = statementTraceResponse[i].path;
                    if (path == undefined)
                        continue;
                    (_a = this.statementTraces
                        .get(sessionId)) === null || _a === void 0 ? void 0 : _a.push(new StatementTrace(moduleName, lineNumber, this.getStatementText(path, lineNumber), vscode.Uri.file(path), vscode.TreeItemCollapsibleState.None));
                }
            }
            vscode.commands.executeCommand("statementTrace.refreshView");
        }
        catch (error) {
            console.error(error);
        }
    }
    getStatementText(sourcePath, lineNumber) {
        const sourceContent = fs.readFileSync(sourcePath, 'utf8').split("\n");
        return (sourceContent[0].indexOf("Statement") > 0) ?
            sourceContent[lineNumber - 1].substring(sourceContent[0].indexOf("Statement")).trim()
            : sourceContent[lineNumber - 1].trim();
    }
    copyStatemetTrace() {
        vscode_1.env.clipboard.writeText(this.getChildren().join('\n'));
    }
}
exports.StatementTraceProvider = StatementTraceProvider;
class StatementTrace extends vscode.TreeItem {
    constructor(module, statement, text, uri, collapsibleState) {
        super(module + ":" + statement + "  " + text, collapsibleState);
        this.module = module;
        this.statement = statement;
        this.text = text;
        this.uri = uri;
        this.collapsibleState = collapsibleState;
        this.command = {
            title: "Statement trace",
            command: "statementTrace.locate"
        };
        this.tooltip = `${this.module}:${this.statement}  ${this.text}`;
        this.command.arguments = [this];
    }
    toString() {
        return this.module + ":" + this.statement + "  " + this.text;
    }
}
exports.StatementTrace = StatementTrace;
class StatementTraceObject {
    constructor(program, path, firstStatement, lastStatement, seqnumber) {
        this.program = program;
        this.path = path;
        this.firstStatement = firstStatement;
        this.lastStatement = lastStatement;
        this.seqnumber = seqnumber;
    }
}
exports.StatementTraceObject = StatementTraceObject;
exports.statementTraceDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('list.inactiveSelectionBackground'),
    isWholeLine: true
});
//# sourceMappingURL=StatementTrace.js.map