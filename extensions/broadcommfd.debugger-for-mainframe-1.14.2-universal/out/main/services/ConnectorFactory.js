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
exports.ConnectionType = exports.ConnectorFactory = void 0;
const DebugAdapterDescriptorFactory_1 = require("./DebugAdapterDescriptorFactory");
const vscode = require("vscode");
class ConnectorFactory {
    static isSSHConnection(configuration) {
        var _a;
        return !!((_a = configuration.ssh) === null || _a === void 0 ? void 0 : _a.enabled);
    }
    static createDebuggerAdapterDescriptor(session, outputChannel, extensionPath, passwordStorage) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isSSHConnection(session.configuration)) {
                try {
                    const adapter = yield DebugAdapterDescriptorFactory_1.SSHDebugAdapter.make(session, outputChannel, extensionPath, passwordStorage);
                    return new vscode.DebugAdapterInlineImplementation(adapter);
                }
                catch (e) {
                    outputChannel.appendLine(e instanceof Error ? e.message : String(e));
                    throw e;
                }
            }
            else {
                const legacyDebuggerAdapter = new DebugAdapterDescriptorFactory_1.LegacyDebuggerAdapter(extensionPath);
                return legacyDebuggerAdapter.createDebugAdapterDescriptor();
            }
        });
    }
    static getConnectionType(configuration) {
        if (this.isSSHConnection(configuration)) {
            return ConnectionType.SSH;
        }
        else {
            return ConnectionType.LEGACY;
        }
    }
}
exports.ConnectorFactory = ConnectorFactory;
var ConnectionType;
(function (ConnectionType) {
    ConnectionType["SSH"] = "ssh";
    ConnectionType["WEBSOCKET"] = "websocket";
    ConnectionType["LEGACY"] = "legacy";
})(ConnectionType || (exports.ConnectionType = ConnectionType = {}));
//# sourceMappingURL=ConnectorFactory.js.map