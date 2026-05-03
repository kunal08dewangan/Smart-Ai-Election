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
exports.EditJCL = exports.editJclScheme = void 0;
const vscode = require("vscode");
const EditJclFileSystemProvider_1 = require("./EditJclFileSystemProvider");
exports.editJclScheme = 'debugger4mf';
class EditJCL {
    constructor(fsProvider) {
        this.fsProvider = new EditJclFileSystemProvider_1.EditJclFileSystemProvider();
        this.fsProvider = fsProvider;
        this.sessions = new Map();
    }
    addSession(session, msgBody) {
        const editJclSession = new DebugSessionEditJCL(this.fsProvider, session, msgBody);
        this.sessions.set(session.id, editJclSession);
    }
    hasSession(sessionId) {
        return this.sessions.has(sessionId);
    }
    openJclInEditor(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.sessions.get(sessionId)) === null || _a === void 0 ? void 0 : _a.openEditJCL();
        });
    }
    removeSession(sessionId) {
        var _a;
        (_a = this.sessions.get(sessionId)) === null || _a === void 0 ? void 0 : _a.closeAllJclTabs();
        const wasDeleted = this.sessions.delete(sessionId);
        return wasDeleted;
    }
    editJclContinue(debugSession) {
        if (debugSession && debugSession.id) {
            const session = this.sessions.get(debugSession.id);
            this.removeSession(debugSession.id);
            if (session) {
                return debugSession.customRequest("editJCL", session.getJclContent());
            }
            else {
                return Promise.reject("EditJCL | Continue | Debugging session not in Edit JCL state");
            }
        }
        return Promise.reject("EditJCL | Continue | Debugging session not provided");
    }
    editJclStop(debugSession) {
        if (debugSession && debugSession.id) {
            const session = this.sessions.get(debugSession.id);
            this.removeSession(debugSession.id);
            if (session) {
                return debugSession.customRequest("editJCL");
            }
            else {
                return Promise.reject("EditJCL | Continue | Debugging session not in Edit JCL state");
            }
        }
        return Promise.reject("EditJCL | Continue | Debugging session not provided");
    }
}
exports.EditJCL = EditJCL;
class DebugSessionEditJCL {
    constructor(fsProvider, session, msgBody) {
        this.fsProvider = fsProvider;
        this.fsProvider = fsProvider;
        this.jclUri = vscode.Uri.from({
            scheme: exports.editJclScheme,
            authority: session.id,
            path: "/" + session.name + "/" + session.configuration.convertedJCL + EditJclFileSystemProvider_1.JCL_EXT
        });
        this.content = msgBody.replace(/^(?:\r\n|\r|\n)/g, "").replace(/(?:\r\n|\r|\n)$/g, "");
    }
    openEditJCL() {
        return __awaiter(this, void 0, void 0, function* () {
            this.fsProvider.writeFile(this.jclUri, new TextEncoder().encode(this.content), { create: true, overwrite: true });
            yield vscode.window.showTextDocument(yield vscode.workspace.openTextDocument(this.jclUri));
        });
    }
    getJclContent() {
        return new TextDecoder().decode(this.fsProvider.readFile(this.jclUri));
    }
    closeAllJclTabs() {
        const jclUri = this.jclUri.toString();
        vscode.window.tabGroups.all
            .flatMap(tg => tg.tabs)
            .filter(tab => tab.input instanceof vscode.TabInputText)
            .filter(tab => tab.input.uri.toString() === jclUri)
            .forEach(tab => vscode.window.tabGroups.close(tab));
    }
}
//# sourceMappingURL=EditJCL.js.map