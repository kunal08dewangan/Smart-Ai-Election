"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoredProgram = exports.MonitoredProgramsViewProvider = void 0;
const vscode = require("vscode");
class MonitoredProgramsViewProvider {
    constructor() {
        this.currentSessionId = undefined;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.programsBySessionId = new Map();
    }
    getTreeItem(element) {
        return element;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getChildren() {
        var _a;
        if (this.currentSessionId)
            return (_a = this.programsBySessionId.get(this.currentSessionId)) !== null && _a !== void 0 ? _a : [];
        return [];
    }
    getParent(element) {
        return undefined;
    }
    /**
     * Logically previous statement, regardless of sorting order
     *
     * @param currentlySelected current statement
     * @returns previous statement, or the same if first statement
     */
    getPrevious(currentlySelected) {
        return this._getAdjacent(currentlySelected, true);
    }
    /**
     * Logically next statement, regardless of sorting order
     *
     * @param currentlySelected current statement
     * @returns next statement, or the same if last statement
     */
    getNext(currentlySelected) {
        return this._getAdjacent(currentlySelected, false);
    }
    _previousIndex(currentIndex) {
        return currentIndex > 0 ? currentIndex - 1 : currentIndex;
    }
    _nextIndex(currentIndex, maxLength) {
        return currentIndex < maxLength - 1 ? currentIndex + 1 : currentIndex;
    }
    _getAdjacent(currentlySelected, previous) {
        if (!this.currentSessionId) {
            return currentlySelected;
        }
        const elements = this.programsBySessionId.get(this.currentSessionId);
        if (!elements) {
            return currentlySelected;
        }
        const currentIndex = elements.indexOf(currentlySelected);
        const index = previous
            ? this._previousIndex(currentIndex)
            : this._nextIndex(currentIndex, elements.length);
        return elements[index];
    }
    addProgram(sessionID, fileData) {
        let programs = this.programsBySessionId.get(sessionID);
        if (!programs) {
            programs = [];
            this.programsBySessionId.set(sessionID, programs);
        }
        programs.push(new MonitoredProgram(fileData.monitoredProgramName, vscode.Uri.file(fileData.filePath)));
        this._onDidChangeTreeData.fire(undefined);
    }
    clearSession(sessionID) {
        this.programsBySessionId.delete(sessionID);
        this._onDidChangeTreeData.fire(undefined);
    }
    clearAllPrograms() {
        this.programsBySessionId.clear();
        this._onDidChangeTreeData.fire(undefined);
    }
}
exports.MonitoredProgramsViewProvider = MonitoredProgramsViewProvider;
class MonitoredProgram extends vscode.TreeItem {
    constructor(label, uri) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.uri = uri;
        this.command = {
            title: 'Open File',
            command: 'monitoredProgramsView.openFile'
        };
        this.command.arguments = [this];
        this.tooltip = uri.fsPath;
    }
}
exports.MonitoredProgram = MonitoredProgram;
//# sourceMappingURL=MonitoredProgramsViewProvider.js.map