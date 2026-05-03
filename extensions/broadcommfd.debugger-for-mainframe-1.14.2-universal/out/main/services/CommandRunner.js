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
exports.CommandRunner = void 0;
const ConnectorFactory_1 = require("./ConnectorFactory");
const SSHConnector_1 = require("./SSHConnector");
const constants_1 = require("../constants");
const LegacyCommandConnector_1 = require("./LegacyCommandConnector");
const node_1 = require("vscode-jsonrpc/node");
const path = require("path");
const jsonrpc_protocol_1 = require("./jsonrpc-protocol");
class CommandRunner {
    constructor(extensionPath, passwordStorage) {
        this.extensionPath = extensionPath;
        this.passwordStorage = passwordStorage;
        this.logToOutputChannel = false;
    }
    run(className, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const type = ConnectorFactory_1.ConnectorFactory.getConnectionType(params);
            if (type === ConnectorFactory_1.ConnectionType.SSH) {
                this.logToOutputChannel = className !== 'com.broadcom.idas.FetchExtendedSource';
                const connector = new SSHConnector_1.SSHConnector(params, this.extensionPath, this.passwordStorage, this.outputChannel);
                const result = yield this.handleMessageTransfer(connector, this.generateExternalCommandParams(className, params), params);
                connector.kill();
                return result;
            }
            else {
                const pathToJar = path.join(this.extensionPath, "bin", "idas_legacy.jar");
                const legacyCommandConnector = new LegacyCommandConnector_1.LegacyCommandConnector(pathToJar, className);
                return legacyCommandConnector.run(params);
            }
        });
    }
    handleMessageTransfer(connector, message, configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const stream = yield connector.getStream(configuration);
                    const errors = [];
                    stream.stderr.on("data", (data) => {
                        errors.push(data);
                    });
                    stream.stderr.on("end", () => {
                        if (errors.length > 0) {
                            reject(this.makeErrorResponse(Buffer.concat(errors)));
                        }
                    });
                    stream.on("exit", (code, signal) => __awaiter(this, void 0, void 0, function* () {
                        if (errors.length === 0 && code) {
                            reject(Error(`Error code: ${code}`));
                        }
                        else if (errors.length === 0 && signal) {
                            reject(Error(`Signal: ${signal}`));
                        }
                        console.log("Java app exit");
                    }));
                    stream.on('error', (err) => {
                        reject(this.makeThrowReponse(err));
                    });
                    stream.stderr.on("error", (err) => reject(this.makeThrowReponse(err)));
                    stream.on("close", () => {
                        if (errors.length > 0)
                            reject(this.makeErrorResponse(Buffer.concat(errors)));
                        else
                            reject(Error("No data"));
                    });
                    const reader = new node_1.StreamMessageReader(stream);
                    reader.onError((err) => reject(this.makeThrowReponse(err)));
                    reader.listen((message) => {
                        var _a;
                        if ((0, jsonrpc_protocol_1.isCommandResponseMessage)(message)) {
                            try {
                                const response = Buffer.from(message.body).toString('utf8');
                                if (this.logToOutputChannel)
                                    (_a = this.outputChannel) === null || _a === void 0 ? void 0 : _a.appendLine('⬅️ Received message: ' + response);
                                const body = JSON.parse(response);
                                if ('error' in body) {
                                    reject(Error(String(body.error)));
                                }
                                // TODO: Use the decoded stuff
                                // TODO: Send the response directly
                                resolve(response);
                            }
                            catch (err) {
                                reject(this.makeThrowReponse(err));
                            }
                        }
                    });
                    const writer = new node_1.StreamMessageWriter(stream);
                    writer.onError((err) => reject(this.makeThrowReponse(err)));
                    yield writer.write(Object.assign(Object.assign({}, message), { jsonrpc: '2.0' }));
                }
                catch (err) {
                    reject(this.makeThrowReponse(err));
                }
            }));
        });
    }
    makeErrorResponse(data) {
        var _a;
        const str = data.toString().trim();
        const error = str === constants_1.JAVA_NOT_FOUND_MF ? constants_1.JAVA_NOT_INSTALLED : str.substring(str.indexOf("#") + 1, str.lastIndexOf("#"));
        if (!this.isEmpty(error)) {
            (_a = this.outputChannel) === null || _a === void 0 ? void 0 : _a.appendLine('⬅️ Received message: ' + JSON.stringify({ error }));
        }
        return Error(error);
    }
    makeThrowReponse(err) {
        return { error: typeof err === "string" ? err : (err instanceof Error ? err.message : String(err)) };
    }
    generateExternalCommandParams(className, configuration) {
        return {
            type: 'request',
            command: 'command',
            arguments: {
                command: className,
                configuration: Buffer.from(JSON.stringify(configuration)).toString("base64")
            }
        };
    }
    isEmpty(value) {
        return !value || value.trim().length === 0;
    }
}
exports.CommandRunner = CommandRunner;
//# sourceMappingURL=CommandRunner.js.map