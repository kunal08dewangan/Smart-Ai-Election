"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecorationService = exports.ExecutionCounter = void 0;
const vscode = require("vscode");
const path = require("path");
class ExecutionCounter {
    constructor() {
        this.sessions = {};
    }
    store(sessionId, execCounts) {
        if (this.sessions[sessionId] === undefined) {
            this.sessions[sessionId] = {};
        }
        Object.keys(execCounts).forEach((program) => {
            const execCount = execCounts[program];
            const filePath = this.convertDriveCharLowerCaseAndChangeSeperator(execCount.sourcePath);
            if (this.sessions[sessionId][filePath] === undefined) {
                this.sessions[sessionId][filePath] = [];
            }
            for (const [line, count] of Object.entries(execCount.counts)) {
                this.sessions[sessionId][filePath][+line] = count;
            }
        });
    }
    convertDriveCharLowerCaseAndChangeSeperator(file) {
        let normalized = path.normalize(file);
        const driveLetter = normalized.charAt(0).toLowerCase();
        normalized = driveLetter + normalized.slice(1);
        return normalized;
    }
    get(sessionId, file) {
        file = this.convertDriveCharLowerCaseAndChangeSeperator(file);
        if (this.sessions[sessionId] === undefined) {
            return [];
        }
        if (this.sessions[sessionId][file] == undefined) {
            return [];
        }
        return this.sessions[sessionId][file];
    }
}
exports.ExecutionCounter = ExecutionCounter;
class DecorationService {
    constructor(executionCounter, sessionContext) {
        this.executionCounter = executionCounter;
        this.decorations = [];
        this.sessionContext = sessionContext;
        this.execCountDecoration = vscode.window.createTextEditorDecorationType({});
    }
    register(context) {
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            var _a;
            if (vscode.debug.activeDebugSession) {
                if (!editor || !((_a = this.sessionContext.get(vscode.debug.activeDebugSession.id)) === null || _a === void 0 ? void 0 : _a.isCounts())) {
                    return;
                }
                this.enableCounts(editor);
            }
        }, null, context.subscriptions);
        vscode.window.visibleTextEditors.forEach((editor) => {
            this.enableCounts(editor);
        });
    }
    enableCounts(editor) {
        this.decorations = [];
        if (!vscode.debug.activeDebugSession || !this.isExpandedSource(editor.document.uri)) {
            return [];
        }
        const file = editor.document.uri.fsPath.normalize();
        const lines = this.executionCounter.get(vscode.debug.activeDebugSession.id, file);
        const lineCount = editor.document.lineCount;
        for (let lineNumber = 1; lineNumber < lineCount; lineNumber++) {
            const executionCount = lines[lineNumber + 1];
            const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
            // Create default decoration options
            const decoration = {
                renderOptions: {
                    before: {
                        contentText: "",
                        backgroundColor: "rgba(0, 0, 0, 0)",
                        textDecoration: "none",
                        margin: "0 10px 0 0",
                        width: "35px",
                    },
                },
                range,
            };
            // Check if execution count exists for the line
            if (executionCount !== undefined) {
                const execCountValue = this.formatCountsValue(executionCount);
                // Construct hover message with exact number without any limits
                const execCountHoverValue = `Executed: ${executionCount} time${executionCount > 1 ? 's' : ''}`;
                // Update decoration options for lines with execution count
                decoration.hoverMessage = execCountHoverValue;
                if (decoration.renderOptions) {
                    decoration.renderOptions.before = {
                        contentText: execCountValue,
                        backgroundColor: "rgba(0, 0, 0, 0)",
                        textDecoration: "none",
                        margin: "0 10px 0 0",
                        width: "35px",
                    };
                }
            }
            this.decorations.push(decoration);
        }
        editor.setDecorations(this.execCountDecoration, this.decorations);
        return this.decorations;
    }
    disableCounts(editor) {
        if (vscode.debug.activeDebugSession === undefined) {
            return;
        }
        this.decorations = [];
        editor.setDecorations(this.execCountDecoration, []);
    }
    formatCountsValue(value) {
        const SUFFIXES = ['', 'k', 'm', 'b', 't', 'q'];
        let baseValue = value;
        let suffixIndex = 0;
        const THOUSAND = 1000;
        while (baseValue >= THOUSAND && suffixIndex < SUFFIXES.length - 1) {
            baseValue /= THOUSAND;
            suffixIndex++;
        }
        // Ensure the formatted value has exactly three digits
        const countsValue = baseValue.toString();
        let formattedCountsValue = countsValue.length > 3 ? countsValue.slice(0, 3) : countsValue;
        if (formattedCountsValue.endsWith('.')) {
            formattedCountsValue = formattedCountsValue.slice(0, 2);
        }
        return formattedCountsValue + SUFFIXES[suffixIndex];
    }
    isExpandedSource(uri) {
        if (uri && uri.path) {
            return uri.path.match(/\/\.c4z\/\.extsrcs\//) != null
                && uri.path.match(/\.PROTSYM(\.listing|\.cbl)$/) != null;
        }
        return false;
    }
}
exports.DecorationService = DecorationService;
//# sourceMappingURL=ExecutionCounter.js.map