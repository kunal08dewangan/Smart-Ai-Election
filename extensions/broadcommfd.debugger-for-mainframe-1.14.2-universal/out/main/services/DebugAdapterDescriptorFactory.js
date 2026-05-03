"use strict";
/*
 * Copyright (c) 2021 Broadcom.
 * The term "Broadcom" refers to Broadcom Inc. and/or its subsidiaries.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Broadcom, Inc. - initial API and implementation
 */
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
exports.LegacyDebuggerAdapter = exports.SSHDebugAdapter = exports.DebugAdapterDescriptorFactory = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const ConnectorFactory_1 = require("./ConnectorFactory");
const Utils_1 = require("./Utils");
const SSHConnector_1 = require("./SSHConnector");
const constants_1 = require("../constants");
const node_1 = require("vscode-jsonrpc/node");
const jsonrpc_protocol_1 = require("./jsonrpc-protocol");
const CertStore_1 = require("./CertStore");
class DebugAdapterDescriptorFactory {
    constructor(outputChannel, extensionPath, passwordStorage) {
        this.outputChannel = outputChannel;
        this.extensionPath = extensionPath;
        this.passwordStorage = passwordStorage;
    }
    createDebugAdapterDescriptor(session, _executable) {
        return ConnectorFactory_1.ConnectorFactory.createDebuggerAdapterDescriptor(session, this.outputChannel, this.extensionPath, this.passwordStorage);
    }
}
exports.DebugAdapterDescriptorFactory = DebugAdapterDescriptorFactory;
class SSHDebugAdapter {
    constructor(session, outputChannel, passwordStorage, stream, connector, launchConfig) {
        this.session = session;
        this.outputChannel = outputChannel;
        this.passwordStorage = passwordStorage;
        this.connector = connector;
        this.launchConfig = launchConfig;
        this.messageEvent = new vscode.EventEmitter();
        this.sourceDownloaded = false;
        this.setBreakPointMessagesBeforeLaunch = undefined;
        this.writer = new node_1.StreamMessageWriter(stream);
        this.reader = new node_1.StreamMessageReader(stream);
        this.reader.listen((message) => {
            this.onDataFromIdas(message);
        });
        console.log("java started");
        stream.stderr.on("data", (data) => {
            this.handleErrorMessage(data);
        });
        stream.on("exit", () => __awaiter(this, void 0, void 0, function* () {
            this.handleExit();
            console.log("Java app exit");
            this.connector.kill();
        }));
        stream.on("close", () => __awaiter(this, void 0, void 0, function* () {
            console.log("Java app finished");
            vscode.debug.stopDebugging(this.session);
            this.connector.kill();
        }));
    }
    static make(session, outputChannel, extensionPath, passwordStorage) {
        return __awaiter(this, void 0, void 0, function* () {
            const launchConfig = session.configuration;
            const connector = new SSHConnector_1.SSHConnector(launchConfig, extensionPath, passwordStorage, outputChannel);
            try {
                const stream = yield connector.getStream(launchConfig);
                return new SSHDebugAdapter(session, outputChannel, passwordStorage, stream, connector, launchConfig);
            }
            catch (err) {
                if (launchConfig.host && launchConfig.port && launchConfig.interTestUserName)
                    passwordStorage.reset(launchConfig.host, launchConfig.port, launchConfig.interTestUserName);
                connector.kill();
                throw Error(typeof err === "string" ? err : (err instanceof Error ? err.message : String(err)));
            }
        });
    }
    onDidSendMessage(listener, thisArgs, disposables) {
        return this.messageEvent.event(listener, thisArgs, disposables);
    }
    handleMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, jsonrpc_protocol_1.isProtocolMessage)(message)) {
                if ((0, jsonrpc_protocol_1.isRequestMessage)(message) && message.command === "setBreakpoints" && !this.sourceDownloaded) {
                    this.setBreakPointMessagesBeforeLaunch = message;
                }
                else {
                    yield this.writer.write(message);
                }
            }
            else {
                console.warn("Message received by SSHDebugAdapter is not in expected format", message);
            }
        });
    }
    dispose() {
        void this.connector.kill();
        console.log("SSHDebugAdapter.dispose");
    }
    onDataFromIdas(idasMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            this.outputChannel.appendLine('⬅️ Received message: ' + JSON.stringify(idasMessage));
            if ((0, jsonrpc_protocol_1.isSourceEventMessage)(idasMessage)) {
                this.handleSourceEvent(idasMessage.body.data);
                this.sourceDownloaded = true;
                if (this.setBreakPointMessagesBeforeLaunch) {
                    const msg = this.setBreakPointMessagesBeforeLaunch;
                    this.setBreakPointMessagesBeforeLaunch = undefined;
                    yield this.writer.write(msg);
                }
            }
            if (((0, jsonrpc_protocol_1.isEventMessage)(idasMessage) && idasMessage.event === 'terminated')) {
                yield this.connector.kill();
                console.log("Disconnect event received, adapter deleted!");
            }
            this.messageEvent.fire(idasMessage); // ✅ emit full message
        });
    }
    handleSourceEvent(data) {
        const { filePath, content } = data;
        const fullPath = path.join(filePath); // Absolute path from backend, to change to local path from workspace
        const dir = path.dirname(fullPath);
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            if (!fs.existsSync(fullPath)) {
                fs.writeFileSync(fullPath, Utils_1.Utils.utf8ArrayToStr(content), 'utf-8');
            }
        }
        catch (e) {
            console.error('File system error:', e.message);
        }
    }
    handleErrorMessage(data, displayDirectMessage = false) {
        console.log("error: " + data);
        let errorMessage = data.toString().trim();
        if (!displayDirectMessage) {
            errorMessage = errorMessage === constants_1.JAVA_NOT_FOUND_MF ? constants_1.JAVA_NOT_INSTALLED : errorMessage.substring(errorMessage.indexOf("#") + 1, errorMessage.lastIndexOf("#"));
        }
        if (errorMessage.toString().includes(constants_1.BLS_PORT_IN_USE)) {
            vscode.window.showErrorMessage(constants_1.BLSPORT_IN_USE_ERROR);
            return;
        }
        vscode.window.showErrorMessage(errorMessage);
    }
    handleExit() {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.debug.stopDebugging(this.session);
            if (this.launchConfig.host && this.launchConfig.port && this.launchConfig.interTestUserName)
                this.passwordStorage.reset(this.launchConfig.host, this.launchConfig.port, this.launchConfig.interTestUserName);
        });
    }
}
exports.SSHDebugAdapter = SSHDebugAdapter;
class LegacyDebuggerAdapter {
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
    }
    createDebugAdapterDescriptor() {
        const executablePath = vscode.Uri.joinPath(vscode.Uri.file(this.extensionPath), 'bin').fsPath;
        const jarName = 'idas_legacy.jar';
        const jarPath = path.join(executablePath, jarName);
        const vmArgs = (0, CertStore_1.getCertVmArgs)();
        vmArgs.push("-jar", jarPath);
        return new vscode.DebugAdapterExecutable("java", vmArgs);
    }
}
exports.LegacyDebuggerAdapter = LegacyDebuggerAdapter;
//# sourceMappingURL=DebugAdapterDescriptorFactory.js.map