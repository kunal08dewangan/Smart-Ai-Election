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
exports.DebugAdapterTrackerFactory = void 0;
const vscode = require("vscode");
const extension_1 = require("../extension");
const BatchlinkQueueService_1 = require("./BatchlinkQueueService");
const path = require("path");
const constants_1 = require("../constants");
const SymbolicSelector_1 = require("./SymbolicSelector");
const SessionSettings_1 = require("../model/SessionSettings");
const Enums_1 = require("../model/Enums");
class DebugAdapterTrackerFactory {
    constructor(passwordStorage, outputChannel, reporter, statementTraceProvider, executionCounter, decorationService, monitoredProgramsViewProvider, sessionSettingsMap, editJCL) {
        this.passwordStorage = passwordStorage;
        this.outputChannel = outputChannel;
        this.reporter = reporter;
        this.statementTraceProvider = statementTraceProvider;
        this.executionCounter = executionCounter;
        this.decorationService = decorationService;
        this.monitoredProgramsViewProvider = monitoredProgramsViewProvider;
        this.editJCL = editJCL;
        this._decorations = [];
        this.sessionSettingsMap = sessionSettingsMap;
    }
    static receiveResponse() {
        return;
    }
    get decorations() {
        return this.decorationService.decorations;
    }
    createDebugAdapterTracker(session) {
        if (!this.sessionSettingsMap.has(session.id)) {
            const sessionSettings = new SessionSettings_1.SessionSettings();
            sessionSettings.setIsAlphabetic(session.configuration.variableOrder === "alphabetical");
            sessionSettings.setIsCounts(session.configuration.executionCounts === true);
            sessionSettings.setIsTrace(session.configuration.statementTrace !== false);
            this.sessionSettingsMap.set(session.id, sessionSettings);
        }
        return {
            onDidSendMessage: (msg) => {
                var _a;
                if (this.isInteresting(msg.command)) {
                    (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_DAP_RESPONSE + msg.command);
                }
                this.processOnDidSendMessage(msg, session);
            },
            onWillReceiveMessage: (msg) => {
                var _a, _b;
                if (this.isInteresting(msg.command)) {
                    (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_DAP_REQUEST + msg.command);
                }
                if (this.editJCL.hasSession(session.id)) {
                    if (msg.command === Enums_1.Commands.CONTINUE) {
                        this.editJCL.editJclContinue(session);
                    }
                    if (msg.command === Enums_1.Commands.TERMINATE || msg.command === Enums_1.Commands.DISCONNECT) {
                        this.editJCL.editJclStop(session);
                    }
                }
                try {
                    if (msg.command === Enums_1.Commands.EVALUATE &&
                        (msg.arguments.context === Enums_1.MESSAGE_CONTEXT.WATCH || msg.type === Enums_1.MESSAGE_TYPE.REQUEST || msg.type === Enums_1.MESSAGE_TYPE.REPLY)) {
                        msg.arguments.expression =
                            msg.arguments.expression.trim();
                        let updateInlineValue = undefined;
                        if (msg.arguments.expression.toUpperCase() === constants_1.INLINE_ON)
                            updateInlineValue = true;
                        else if (msg.arguments.expression.toUpperCase() === constants_1.INLINE_OFF)
                            updateInlineValue = false;
                        if (updateInlineValue !== undefined)
                            this.updateInline(session, updateInlineValue);
                    }
                    if (extension_1.logToConsole) {
                        if (constants_1.ALLOWED_REQUEST_TYPES.includes(msg.command) &&
                            msg.arguments.interTestPassword) {
                            const pass = msg.arguments.interTestPassword;
                            msg.arguments.interTestPassword = "*******";
                            this.outputChannel.appendLine(`onWillReceiveMessage ===> ${JSON.stringify(msg)}`);
                            msg.arguments.interTestPassword = pass;
                            return;
                        }
                        else if (JSON.stringify(msg).includes("interTestPassword")) {
                            return;
                        }
                        this.outputChannel.appendLine(`onWillReceiveMessage ===> ${JSON.stringify(msg)}`);
                    }
                }
                catch (error) {
                    (_b = this.reporter) === null || _b === void 0 ? void 0 : _b.sendTelemetryErrorEvent(constants_1.TELEMETRY_EVENT_DAP_ERROR + error);
                    extension_1.logToConsole === true ? console.error(error) : false;
                }
            },
            onWillStartSession: () => {
                var _a;
                try {
                    if (extension_1.logToConsole) {
                        this.outputChannel.appendLine(`onWillStartSession: ${session.id}`);
                    }
                }
                catch (error) {
                    (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.sendTelemetryErrorEvent(constants_1.TELEMETRY_EVENT_DAP_ERROR + error);
                    extension_1.logToConsole === true ? console.error(error) : false;
                }
            },
            onWillStopSession: () => {
                var _a;
                this.statementTraceProvider.updateStatementTrace(session.id, undefined);
                try {
                    this.sessionSettingsMap.delete(session.id);
                    if (extension_1.logToConsole) {
                        this.outputChannel.appendLine(`onWillStopSession: ${session.id}`);
                    }
                }
                catch (error) {
                    (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.sendTelemetryErrorEvent(constants_1.TELEMETRY_EVENT_DAP_ERROR + error);
                    extension_1.logToConsole === true ? console.error(error) : false;
                }
            },
            onError: (err) => {
                var _a, _b;
                try {
                    if (extension_1.logToConsole) {
                        this.outputChannel.appendLine(`onError: ${err}`);
                    }
                }
                catch (error) {
                    (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.sendTelemetryErrorEvent(constants_1.TELEMETRY_EVENT_DAP_ERROR + error);
                    extension_1.logToConsole === true ? console.error(error) : false;
                }
                /*
                 read error is an error message that does not have any impact on our telemetry data;
                 it happens when the DAP communication ended and maybe some threads were not correctly closed by the editor
                 */
                if (err.message === "read error") {
                    return;
                }
                (_b = this.reporter) === null || _b === void 0 ? void 0 : _b.sendTelemetryErrorEvent(constants_1.TELEMETRY_EVENT_DAP_ERROR + err.message);
            },
            onExit: (code, signal) => {
                var _a;
                try {
                    if (extension_1.logToConsole) {
                        this.outputChannel.appendLine(`onExit: ${code} signal:${signal}`);
                    }
                }
                catch (error) {
                    (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.sendTelemetryErrorEvent(constants_1.TELEMETRY_EVENT_DAP_ERROR + error);
                    extension_1.logToConsole === true ? console.error(error) : false;
                }
            },
        };
    }
    updateInline(session, displayInlineValue) {
        let sessionSettings;
        if (this.sessionSettingsMap.has(session.id))
            sessionSettings = this.sessionSettingsMap.get(session.id);
        if (sessionSettings === undefined)
            sessionSettings = new SessionSettings_1.SessionSettings();
        sessionSettings.setDisplayInlineVariable(displayInlineValue);
        this.sessionSettingsMap.set(session.id, sessionSettings);
    }
    isInteresting(command) {
        return [
            "launch",
            "attach",
            "setVariable",
            "continue",
            "next",
            "terminate",
            "setBreakpoints",
            "disconnect",
            "setDataBreakpoints",
        ].includes(command);
    }
    processResponse(msg, session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (msg.success === false) {
                if (constants_1.ALLOWED_REQUEST_TYPES.includes(msg.command)) {
                    this.passwordStorage.reset(session.configuration.host, session.configuration.port, session.configuration.interTestUserName);
                }
                if (msg.command === Enums_1.Commands.SETVARIABLE) {
                    vscode.window.showWarningMessage(msg.message);
                }
            }
            else {
                switch (msg.command) {
                    case Enums_1.Commands.SETBREAKPOINTS:
                        DebugAdapterTrackerFactory.receiveResponse();
                        return;
                    case Enums_1.Commands.SETVARIABLE:
                        // eslint-disable-next-line no-case-declarations
                        const sessionSettings = this.sessionSettingsMap.get(session.id);
                        if (sessionSettings && sessionSettings.isDisplayInlineVariable()) {
                            sessionSettings.clearCacheInlineValues();
                        }
                        return;
                    case Enums_1.Commands.STACKTRACE:
                        if (this.editJCL.hasSession(session.id)) {
                            msg.body.stackFrames[0].source.path = `debugger4mf://${session.id}/${session.name}/${session.configuration.convertedJCL}.jcl`;
                            yield this.editJCL.openJclInEditor(session.id);
                        }
                }
            }
        });
    }
    processExecutionData(threadId, session) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const executionDataObject = yield session.customRequest("executionData", { threadId: threadId });
                if (executionDataObject) {
                    if (((_a = this.sessionSettingsMap.get(session.id)) === null || _a === void 0 ? void 0 : _a.isCounts()) && executionDataObject.countsTable &&
                        Object.keys(executionDataObject.countsTable).length > 0) {
                        this.executionCounter.store(session.id, executionDataObject.countsTable);
                        this._decorations = [];
                        for (const editor of vscode.window.visibleTextEditors) {
                            this._decorations = this._decorations.concat(this.decorationService.enableCounts(editor));
                        }
                    }
                    const statementTraceRecords = executionDataObject.statementTraceRecords
                        ? executionDataObject.statementTraceRecords
                        : executionDataObject.body.statementTraceRecords;
                    //TODO When DE497702 is fixed , remove this workaround.
                    if (statementTraceRecords) {
                        this.statementTraceProvider.updateStatementTrace(session.id, statementTraceRecords);
                    }
                    else {
                        console.warn("stackFrames are missing in statementTrace response");
                    }
                }
            }
            catch (error) {
                (_b = this.reporter) === null || _b === void 0 ? void 0 : _b.sendTelemetryErrorEvent(constants_1.TELEMETRY_EVENT_DAP_ERROR + error);
                console.error(error);
            }
        });
    }
    processOutput(msgBody, session) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (msgBody.category === "jsonInput") {
                const symbolicOptions = JSON.parse(msgBody.output);
                (0, SymbolicSelector_1.showQuickPick)(symbolicOptions, session);
            }
            if (msgBody.category === "JCL") {
                try {
                    this.editJCL.addSession(session, msgBody.output);
                    msgBody.output = "Edit before submit " + session.configuration.convertedJCL;
                }
                catch (error) {
                    vscode.window.showErrorMessage("Edit JCL error: " + error);
                }
            }
            if (msgBody.category === "notification") {
                if (msgBody.output !== undefined && msgBody.output != null) {
                    const output = msgBody.output;
                    if (output.includes(constants_1.PERMISSION_DENIED) ||
                        output.includes(constants_1.CONNECTION_FAILED) ||
                        output.includes(constants_1.CHARSET_MISMATCH)) {
                        vscode.window.showErrorMessage(output);
                        (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.sendTelemetryErrorEvent(constants_1.TELEMETRY_EVENT_DAP_ERROR + output);
                        this.passwordStorage.reset(session.configuration.host, session.configuration.port, session.configuration.interTestUserName);
                        vscode.debug.stopDebugging(session);
                    }
                    else if (output.includes(constants_1.ATTACHING_SUSPENDED_SESSION)) {
                        vscode.window.showWarningMessage(output);
                    }
                    else if (!output.includes(constants_1.UNABLE_TO_READ_REQUESTED_MEMORY) &&
                        !output.includes(constants_1.SET_VARIABLE_FAILED) &&
                        !output.includes(constants_1.UNABLE_TO_ALTER_REQUESTED_MEMORY)) {
                        if (output.includes(constants_1.VARIABLE_NOT_FOUND_BY_FILTER) &&
                            !output.includes(constants_1.CICS_DEFINED)) {
                            const contextSettings = this.sessionSettingsMap.get(session.id);
                            if (contextSettings) {
                                contextSettings.setIsFiltered(false);
                                this.sessionSettingsMap.set(session.id, contextSettings);
                                vscode.commands.executeCommand("setContext", "filtered", false);
                            }
                            vscode.window.showInformationMessage(output);
                        }
                        else if (output.includes(constants_1.VARIABLE_NOT_FOUND_BY_FILTER) &&
                            output.includes(constants_1.CICS_DEFINED)) {
                            const index = output.indexOf(constants_1.DELIMITER);
                            if (index !== -1) {
                                vscode.window.showInformationMessage(output.substring(index + 1).trim());
                            }
                        }
                        else {
                            vscode.window.showInformationMessage(output);
                        }
                    }
                }
            }
            else if (msgBody.category === "stderr") {
                vscode.commands.executeCommand("workbench.panel.repl.view.focus");
            }
            else if (msgBody.category == "modal") {
                const output = msgBody.output;
                const buttonOptions = [
                    { title: constants_1.YES },
                    { title: constants_1.NO, isCloseAffordance: true },
                ];
                const options = { modal: true };
                const response = yield vscode.window.showErrorMessage(output + ". " + constants_1.CONTINUE_OR_NOT, options, ...buttonOptions);
                if (!response || response.title === constants_1.NO) {
                    session.customRequest("terminate");
                }
            }
            else if (msgBody.category === "source") {
                this.monitoredProgramsViewProvider.addProgram(session.id, msgBody.data);
            }
        });
    }
    processEvent(msg, session) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            switch (msg.event) {
                case Enums_1.Events.BREAKPOINT:
                    if ((_a = msg.body) === null || _a === void 0 ? void 0 : _a.breakpoint)
                        yield BatchlinkQueueService_1.BatchLinkQueueService.addBreakpoint(msg.body.breakpoint);
                    return;
                case Enums_1.Events.STOPPED:
                    if (msg.body.reason != 'jcl') {
                        this.processExecutionData(msg.body.threadId, session);
                    }
                    return;
                case Enums_1.Events.OUTPUT:
                    this.processOutput(msg.body, session);
                    return;
                case Enums_1.Events.PROGRESSUPDATE:
                    // eslint-disable-next-line no-case-declarations
                    const res = constants_1.JOB_ID_REGEX.exec(msg.body.message);
                    if (res !== null) {
                        const args = [
                            res.toString(),
                            session.configuration.ZoweProfileName,
                        ];
                        const setJobCmd = `command:intertest.zowe.jobId?${encodeURIComponent(JSON.stringify(args))}`;
                        vscode.window.showInformationMessage(`Job submitted ` + `[${args[0]}](${setJobCmd})`);
                    }
            }
        });
    }
    processCommand(msgBody, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            if ((_a = msgBody === null || msgBody === void 0 ? void 0 : msgBody.result) === null || _a === void 0 ? void 0 : _a.includes(constants_1.CONSOLE_COMMAND_UNKNOWN)) {
                msgBody.result = constants_1.HELP_COMMAND;
            }
            if ((_b = msgBody === null || msgBody === void 0 ? void 0 : msgBody.result) === null || _b === void 0 ? void 0 : _b.includes(constants_1.EXECUTION_COUNTS)) {
                (_c = this.sessionSettingsMap.get(sessionId)) === null || _c === void 0 ? void 0 : _c.setIsCounts((msgBody === null || msgBody === void 0 ? void 0 : msgBody.result) == constants_1.EXECUTION_COUNTS_ENABLED);
                for (const editor of vscode.window.visibleTextEditors) {
                    const normalized = path.resolve(editor.document.fileName).toLowerCase();
                    const pattern = `${path.sep}.c4z${path.sep}.extsrcs${path.sep}`;
                    if (normalized.includes(pattern)) {
                        if (!((_d = this.sessionSettingsMap.get(sessionId)) === null || _d === void 0 ? void 0 : _d.isCounts())) {
                            this.decorationService.disableCounts(editor);
                        }
                    }
                }
            }
            else if ((_e = msgBody === null || msgBody === void 0 ? void 0 : msgBody.result) === null || _e === void 0 ? void 0 : _e.includes(constants_1.STATEMENT_TRACE)) {
                (_f = this.sessionSettingsMap.get(sessionId)) === null || _f === void 0 ? void 0 : _f.setIsTrace(msgBody.result == "Statement trace enabled");
                this.statementTraceProvider.refresh();
            }
        });
    }
    processOnDidSendMessage(msg, session) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (msg.success == true) {
                this.processCommand(msg.body, session.id);
            }
            switch (msg.type) {
                case Enums_1.MESSAGE_TYPE.RESPONSE:
                    this.processResponse(msg, session);
                    break;
                case Enums_1.MESSAGE_TYPE.EVENT:
                    this.processEvent(msg, session);
                    break;
                default:
                    return;
            }
            try {
                if (extension_1.logToConsole) {
                    this.outputChannel.appendLine(`onDidSendMessage <=== ${JSON.stringify(msg)}`);
                }
            }
            catch (error) {
                (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.sendTelemetryErrorEvent(constants_1.TELEMETRY_EVENT_DAP_ERROR + error);
                extension_1.logToConsole === true ? console.error(error) : false;
            }
        });
    }
}
exports.DebugAdapterTrackerFactory = DebugAdapterTrackerFactory;
//# sourceMappingURL=DebugAdapterTrackerFactory.js.map