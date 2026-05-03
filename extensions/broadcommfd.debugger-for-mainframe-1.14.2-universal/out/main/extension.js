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
exports.ConfigurationProvider = exports.logToConsole = void 0;
exports.activate = activate;
exports.addPasswordToStorage = addPasswordToStorage;
const vscode = require("vscode");
const ExtendedSourceService_1 = require("./services/ExtendedSourceService");
const PasswordStorage_1 = require("./services/PasswordStorage");
const LaunchConfigurationService_1 = require("./services/LaunchConfigurationService");
const CommandRunner_1 = require("./services/CommandRunner");
const ConvertJCL_1 = require("./services/ConvertJCL");
const EditJCL_1 = require("./services/EditJCL");
const DebugAdapterTrackerFactory_1 = require("./services/DebugAdapterTrackerFactory");
const CBPValidator_1 = require("./services/CBPValidator");
const StatementTrace_1 = require("./services/StatementTrace");
const EvaluatableExpressionProvider_1 = require("./services/EvaluatableExpressionService/EvaluatableExpressionProvider");
const ExecutionCounter_1 = require("./services/ExecutionCounter");
const CompositeService_1 = require("./services/CompositeService");
const Cobol_1 = require("./services/EvaluatableExpressionService/languages/Cobol");
const Hlasm_1 = require("./services/EvaluatableExpressionService/languages/Hlasm");
const HlasmListing_1 = require("./services/EvaluatableExpressionService/languages/HlasmListing");
const PlainText_1 = require("./services/EvaluatableExpressionService/languages/PlainText");
const SetVariable_1 = require("./services/SetVariable");
const BatchlinkQueueService_1 = require("./services/BatchlinkQueueService");
const constants_1 = require("./constants");
const MultiStepQuickInput4SchedulingService_1 = require("./services/SchedulingService/MultiStepQuickInput4SchedulingService");
const TelemetryReporterService_1 = require("./services/TelemetryReporterService");
const VariableOrderService_1 = require("./services/VariableOrderService");
const FindVariable_1 = require("./services/FindVariable");
const InlineValuesProvider_1 = require("./services/EvaluatableExpressionService/InlineValuesProvider");
const JobTrackService_1 = require("./services/JobTrackService");
const DebugAdapterDescriptorFactory_1 = require("./services/DebugAdapterDescriptorFactory");
const MonitoredProgramsViewProvider_1 = require("./services/MonitoredProgramsViewProvider");
const EditJclFileSystemProvider_1 = require("./services/EditJclFileSystemProvider");
exports.logToConsole = false;
const outputChannel = vscode.window.createOutputChannel("Broadcom DAP logging");
const passwordStorage = new PasswordStorage_1.PasswordStorage();
let batchLinkQueueService;
let reporter;
const sessionSettingsMap = new Map();
let workspaceFolder;
function activate(context) {
    reporter = new TelemetryReporterService_1.TelemetryReporterService(context);
    const executionCounter = new ExecutionCounter_1.ExecutionCounter();
    const decorationService = new ExecutionCounter_1.DecorationService(executionCounter, sessionSettingsMap);
    decorationService.register(context);
    const javaRunner = new CommandRunner_1.CommandRunner(context.extensionPath, passwordStorage);
    const launchConfigurationService = new LaunchConfigurationService_1.LaunchConfigurationService(passwordStorage);
    const cobolEvaluatableExpressionProvider = new EvaluatableExpressionProvider_1.EvaluatableExpressionProvider(new Cobol_1.Cobol());
    const hlasmEvaluatableExpressionProvider = new EvaluatableExpressionProvider_1.EvaluatableExpressionProvider(new Hlasm_1.Hlasm());
    const hlasmListingEvaluatableExpressionProvider = new EvaluatableExpressionProvider_1.EvaluatableExpressionProvider(new HlasmListing_1.HlasmListing());
    const plainTextEvaluatableExpressionProvider = new EvaluatableExpressionProvider_1.EvaluatableExpressionProvider(new PlainText_1.PlainText());
    const cobolInlineValuesProvider = new InlineValuesProvider_1.InlineValuesProvider(new Cobol_1.Cobol(), sessionSettingsMap);
    const hlasmInlineValuesProvider = new InlineValuesProvider_1.InlineValuesProvider(new Hlasm_1.Hlasm(), sessionSettingsMap);
    const hlasmListingInlineValuesProvider = new InlineValuesProvider_1.InlineValuesProvider(new HlasmListing_1.HlasmListing(), sessionSettingsMap);
    const plainTextListingInlineValuesProvider = new InlineValuesProvider_1.InlineValuesProvider(new PlainText_1.PlainText(), sessionSettingsMap);
    const setVarRequest = new SetVariable_1.SetVariable();
    const varOrderService = new VariableOrderService_1.VariableOrderService(sessionSettingsMap);
    const findVariableRequest = new FindVariable_1.FindVariable(sessionSettingsMap);
    javaRunner.outputChannel = outputChannel;
    if (vscode.workspace.workspaceFolders) {
        workspaceFolder =
            vscode.workspace.workspaceFolders[0].uri.fsPath + "/.c4z/**";
        const roConfig = vscode.workspace
            .getConfiguration("files")
            .get("readonlyInclude");
        roConfig["{**/.c4z/.extsrcs/*.PROTSYM.cbl,**/.c4z/.extsrcs/*.PROTSYM.listing}"] = true;
        vscode.workspace
            .getConfiguration("files")
            .update("readonlyInclude", roConfig, vscode.ConfigurationTarget.Workspace);
    }
    const extendedSourceService = new ExtendedSourceService_1.ExtendedSourceService(passwordStorage, launchConfigurationService, javaRunner);
    batchLinkQueueService = new BatchlinkQueueService_1.BatchLinkQueueService(passwordStorage, launchConfigurationService, javaRunner);
    Object.freeze(batchLinkQueueService);
    const compositeService = new CompositeService_1.CompositeService(passwordStorage, launchConfigurationService, outputChannel, javaRunner);
    const convertJCL = new ConvertJCL_1.ConvertJCL(passwordStorage, launchConfigurationService, javaRunner);
    const editJclFSP = new EditJclFileSystemProvider_1.EditJclFileSystemProvider();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(EditJCL_1.editJclScheme, editJclFSP, {
        isCaseSensitive: true,
        isReadonly: false
    }));
    const editJCL = new EditJCL_1.EditJCL(editJclFSP);
    const cbp = new CBPValidator_1.CBPValidator();
    cbp.workspaceFolder = workspaceFolder;
    const statementTraceProvider = new StatementTrace_1.StatementTraceProvider(sessionSettingsMap);
    const monitoredProgramsViewProvider = new MonitoredProgramsViewProvider_1.MonitoredProgramsViewProvider();
    const provider = new ConfigurationProvider(passwordStorage, varOrderService, launchConfigurationService);
    vscode.debug.onDidTerminateDebugSession(session => {
        if (session.type === constants_1.DEBUGGER_TYPE_NAME_BATCH || session.type === constants_1.DEBUGGER_TYPE_NAME_CICS) {
            monitoredProgramsViewProvider.clearSession(session.id);
        }
    });
    context.subscriptions.push(vscode.debug.onDidChangeActiveDebugSession((event) => {
        if (event) {
            statementTraceProvider.currentSessionId = event.id;
            monitoredProgramsViewProvider.currentSessionId = event.id;
            statementTraceProvider.refresh();
            monitoredProgramsViewProvider.refresh();
            const sessionSettings = sessionSettingsMap.get(event.id);
            if (sessionSettings) {
                vscode.commands.executeCommand("setContext", "filtered", sessionSettings.isFiltered());
                vscode.commands.executeCommand("setContext", "isAlphabetic", sessionSettings.isAlphabetic());
            }
        }
    }));
    const statementTraceTreeView = vscode.window.createTreeView("statementTrace", { treeDataProvider: statementTraceProvider });
    const monitoredProgramsTreeView = vscode.window.createTreeView("monitoredProgramsView", { treeDataProvider: monitoredProgramsViewProvider });
    context.subscriptions.push(statementTraceTreeView.onDidChangeSelection((event) => __awaiter(this, void 0, void 0, function* () {
        if (!event.selection[0]) {
            for (const editor of vscode.window.visibleTextEditors) {
                editor.setDecorations(StatementTrace_1.statementTraceDecoration, []);
            }
        }
        else {
            vscode.commands.executeCommand("statementTrace.locate", event.selection[0]);
        }
    })));
    const registerCommand = (command, callback) => {
        context.subscriptions.push(vscode.commands.registerCommand(command, callback));
    };
    const registerTreeViewNavigationCommand = (command, treeView, provider, providerMethodName, executeCommand = false) => {
        registerCommand(command, () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (treeView.selection.length > 0) {
                const item = provider[providerMethodName](treeView.selection[0]);
                if (item) {
                    yield treeView.reveal(item, { select: true, focus: true });
                    if (executeCommand && ((_a = item.command) === null || _a === void 0 ? void 0 : _a.command)) {
                        yield vscode.commands.executeCommand(item.command.command, ...(item.command.arguments || []));
                    }
                }
            }
        }));
    };
    registerCommand("statementTrace.locate", (node) => __awaiter(this, void 0, void 0, function* () {
        try {
            const editor = yield vscode.window.showTextDocument(node.uri, { preserveFocus: true });
            const position = new vscode.Position(node.statement - 1, 0);
            editor.selections = [
                new vscode.Selection(position, position),
            ];
            const range = new vscode.Range(position, position);
            editor.revealRange(range);
            editor.setDecorations(StatementTrace_1.statementTraceDecoration, []);
            editor.setDecorations(StatementTrace_1.statementTraceDecoration, [range]);
        }
        catch (error) {
            reporter === null || reporter === void 0 ? void 0 : reporter.sendTelemetryErrorEvent(constants_1.TELEMETRY_EVENT_ERROR_STATEMENT_LOCATE + " " + error);
            console.log(JSON.stringify(error));
        }
    }));
    registerCommand("monitoredProgramsView.openFile", (node) => __awaiter(this, void 0, void 0, function* () {
        try {
            const editor = yield vscode.window.showTextDocument(node.uri, { preserveFocus: true });
            let position = new vscode.Position(0, 0);
            if (vscode.debug.activeDebugSession) {
                const trace = statementTraceProvider.getChildren();
                if (trace.length > 0) {
                    const lastTrace = trace[0];
                    if (lastTrace.uri.fsPath === node.uri.fsPath) {
                        position = new vscode.Position(lastTrace.statement - 1, 0);
                    }
                }
            }
            editor.selections = [new vscode.Selection(position, position)];
            editor.revealRange(new vscode.Range(position, position));
        }
        catch (error) {
            vscode.window.showErrorMessage(`Could not open file: ${node.uri.fsPath}. Error: ${error}`);
        }
    }));
    registerTreeViewNavigationCommand("statementTrace.up", statementTraceTreeView, statementTraceProvider, "getAbove");
    registerTreeViewNavigationCommand("statementTrace.down", statementTraceTreeView, statementTraceProvider, "getBelow");
    registerTreeViewNavigationCommand("statementTrace.prev", statementTraceTreeView, statementTraceProvider, "getPrevious");
    registerTreeViewNavigationCommand("statementTrace.next", statementTraceTreeView, statementTraceProvider, "getNext");
    registerTreeViewNavigationCommand("monitoredProgramsView.prev", monitoredProgramsTreeView, monitoredProgramsViewProvider, "getPrevious", true);
    registerTreeViewNavigationCommand("monitoredProgramsView.next", monitoredProgramsTreeView, monitoredProgramsViewProvider, "getNext", true);
    context.subscriptions.push(statementTraceTreeView);
    context.subscriptions.push(monitoredProgramsTreeView);
    registerCommand("statementTrace.refreshView", () => statementTraceProvider.refresh());
    registerCommand("statementTrace.copyStatemenTrace", () => statementTraceProvider.copyStatemetTrace());
    registerCommand("intertest-debug-dap.setVariable", () => setVarRequest.setVariable());
    registerCommand("intertest-debug-dap.filter", () => findVariableRequest.setFilterVariable());
    registerCommand("intertest-debug-dap.gotoVariable", () => findVariableRequest.goToVariable());
    registerCommand("intertest-debug-dap.clearFilter", () => findVariableRequest.clearFilterVariable());
    registerCommand("intertest-debug-dap.sort-ascending", () => varOrderService.sendSortRequest(true));
    registerCommand("intertest-debug-dap.sort-definiton", () => varOrderService.sendSortRequest(false));
    registerCommand("intertest-debug-dap.help-command", () => displayHelpForUnknownCommands());
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(constants_1.DEBUGGER_TYPE_NAME_CICS, provider));
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(constants_1.DEBUGGER_TYPE_NAME_BATCH, provider));
    context.subscriptions.push(provider);
    registerCommand("intertest-debug-dap.batch-convert-jcl", () => {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Converting JCL",
        }, 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (p, t) => {
            reporter === null || reporter === void 0 ? void 0 : reporter.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_CONVERT_JCL);
            return convertJCL.convert();
        });
    });
    registerCommand("intertest-debug-dap.fetch-extended-source", () => {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Fetching Extended Source(s)",
        }, 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (p, t) => {
            reporter === null || reporter === void 0 ? void 0 : reporter.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_FETCH_EXTENDED_SOURCE);
            return extendedSourceService.fetchExtendedSource();
        });
    });
    registerCommand("intertest-debug-dap.list-composite", () => {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Listing composite(s)",
        }, 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (p, t) => {
            //reporter?.sendTelemetryEvent("loadComposite");
            return compositeService.listComposite();
        });
    });
    registerCommand("intertest-debug.show-schedule-table", () => {
        reporter === null || reporter === void 0 ? void 0 : reporter.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_SCHEDULE_TABLE);
        return (0, MultiStepQuickInput4SchedulingService_1.handleSchedulingActivity)(launchConfigurationService, javaRunner);
    });
    const factory = new DebugAdapterTrackerFactory_1.DebugAdapterTrackerFactory(passwordStorage, outputChannel, reporter, statementTraceProvider, executionCounter, decorationService, monitoredProgramsViewProvider, sessionSettingsMap, editJCL);
    context.subscriptions.push(vscode.debug.registerDebugAdapterTrackerFactory(constants_1.DEBUGGER_TYPE_NAME_BATCH, factory));
    context.subscriptions.push(vscode.debug.registerDebugAdapterTrackerFactory(constants_1.DEBUGGER_TYPE_NAME_CICS, factory));
    const sshDebugAdapterDescriptorFactory = new DebugAdapterDescriptorFactory_1.DebugAdapterDescriptorFactory(outputChannel, context.extensionPath, passwordStorage);
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory(constants_1.DEBUGGER_TYPE_NAME_BATCH, sshDebugAdapterDescriptorFactory));
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory(constants_1.DEBUGGER_TYPE_NAME_CICS, sshDebugAdapterDescriptorFactory));
    reporter === null || reporter === void 0 ? void 0 : reporter.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_ACTIVATE);
    vscode.debug.onDidChangeBreakpoints((event) => {
        cbp.processBreakpointChange(event);
    });
    context.subscriptions.push(vscode.debug.onDidChangeActiveDebugSession((event) => {
        var _a;
        for (const editor of vscode.window.visibleTextEditors) {
            if (event && ((_a = sessionSettingsMap.get(event.id)) === null || _a === void 0 ? void 0 : _a.isCounts())) {
                decorationService.enableCounts(editor);
            }
            else
                decorationService.disableCounts(editor);
        }
    }));
    context.subscriptions.push(vscode.debug.onDidStartDebugSession(() => {
        removeDataBreakpoints();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("intertest.zowe.jobId", (jobId, zoweProfileName) => __awaiter(this, void 0, void 0, function* () {
        new JobTrackService_1.JobTrackService().showJobInfoMessage(jobId, zoweProfileName);
    })));
    context.subscriptions.concat([
        vscode.languages.registerEvaluatableExpressionProvider({ language: "cobol", pattern: workspaceFolder }, cobolEvaluatableExpressionProvider),
        vscode.languages.registerEvaluatableExpressionProvider({ language: "hlasm", pattern: workspaceFolder }, hlasmEvaluatableExpressionProvider),
        vscode.languages.registerEvaluatableExpressionProvider({ language: "hlasmListing", pattern: workspaceFolder }, hlasmListingEvaluatableExpressionProvider),
        vscode.languages.registerEvaluatableExpressionProvider({ language: "plaintext", pattern: workspaceFolder }, plainTextEvaluatableExpressionProvider),
        vscode.languages.registerInlineValuesProvider({ language: "plaintext", pattern: workspaceFolder }, plainTextListingInlineValuesProvider),
        vscode.languages.registerInlineValuesProvider({ language: "hlasmListing", pattern: workspaceFolder }, hlasmListingInlineValuesProvider),
        vscode.languages.registerInlineValuesProvider({ language: "hlasm", pattern: workspaceFolder }, hlasmInlineValuesProvider),
        vscode.languages.registerInlineValuesProvider({ language: "cobol", pattern: workspaceFolder }, cobolInlineValuesProvider)
    ]);
    return {
        // to help with the integration test automation
        decorations() {
            return factory.decorations;
        },
    };
}
function addPasswordToStorage(interTestHost, interTestPort, interTestUserName, password) {
    return __awaiter(this, void 0, void 0, function* () {
        passwordStorage.put(interTestHost, interTestPort, interTestUserName, password);
    });
}
class ConfigurationProvider {
    constructor(passwordStorage, varOrder, launchConfigService) {
        this.passwordStorage = passwordStorage;
        this.varOrder = varOrder;
        this.launchConfigService = launchConfigService;
    }
    resolveDebugConfiguration(folder, config, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.commands.executeCommand('setContext', 'filtered', false);
            if (config.request === constants_1.LAUNCH_REQUEST_TYPE) {
                reporter === null || reporter === void 0 ? void 0 : reporter.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_UI_LAUNCH);
            }
            else if (config.request === constants_1.ATTACH_REQUEST_TYPE) {
                reporter === null || reporter === void 0 ? void 0 : reporter.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_UI_ATTACH);
            }
            if (config.logOutput === "console") {
                exports.logToConsole = true;
            }
            else {
                exports.logToConsole = false;
            }
            if (Object.keys(config).length === 0) {
                // empty configuration, missing launch.json
                return null;
            }
            const sshEnabled = getSSHEnabledFromConfig(config);
            const errorMessage = validateProgramAndProtsym(config);
            if (errorMessage) {
                vscode.window.showErrorMessage(errorMessage);
                return null;
            }
            yield this.launchConfigService.updateConfigFromZowe(config);
            if (!config.port) {
                config.port = config.interTestPort;
            }
            let password;
            if (!config.APIMLAuthToken) {
                const errorMessage = validateLaunchConfig(config, sshEnabled);
                if (errorMessage) {
                    vscode.window.showErrorMessage(errorMessage);
                    return null;
                }
                config.interTestUserName = config.interTestUserName.toLocaleUpperCase();
                if (!sshEnabled) {
                    password = yield this.passwordStorage.get(config.host, config.port, config.interTestUserName);
                    if (!password) {
                        throw new Error("Password is not provided.");
                    }
                }
            }
            const isAlphabetic = config.variableOrder === "alphabetical" ? true : false;
            this.varOrder.configVarSortOrder(isAlphabetic);
            if (config.interTestSecure === undefined) {
                config.interTestSecure = true;
            }
            if (password !== undefined)
                config.interTestPassword = password;
            if (config.testMode && config.cicsUserId) {
                const cicsPass = yield this.passwordStorage.getCics(config.host, config.port, config.cicsUserId);
                if (!cicsPass) {
                    throw new Error("CICS Password is not provided.");
                }
                config.cicsPassword = cicsPass;
                this.passwordStorage.putCics(config.host, config.port, config.cicsUserId, cicsPass);
            }
            config.workspaceDirectory = "${workspaceFolder}";
            if (config.request === constants_1.ATTACH_REQUEST_TYPE &&
                config.type === constants_1.DEBUGGER_TYPE_NAME_BATCH) {
                yield evaluateAttachDebugRequest(config);
                const removebpts = [];
                for (const b of vscode.debug.breakpoints) {
                    if (b.condition && b.hitCondition) {
                        removebpts.push(b);
                    }
                }
                if (removebpts.length > 0) {
                    console.log("SEVERE: Multi conditional breakpoint not allowed on one line.");
                }
                vscode.debug.removeBreakpoints(removebpts);
                const result = yield batchLinkQueueService.fetch(config);
                if (!result)
                    throw new Error(constants_1.ATTACH_ABORTED);
            }
            return config;
        });
    }
    dispose() {
        // no-op
    }
}
exports.ConfigurationProvider = ConfigurationProvider;
function evaluateAttachDebugRequest(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const hasProgramName = Array.isArray(config.programName) && config.programName.every(str => str.trim().length > 0);
        const hasProtsym = Array.isArray(config.protsym) && config.protsym.every(str => str.trim().length > 0);
        const hasDSS = config.DSS && config.DSS.length > 0;
        if (!(hasProgramName && (hasProtsym || hasDSS))) {
            const options = { modal: true };
            const USER_RESPONSE = yield vscode.window.showWarningMessage(constants_1.ATTACH_DEBUGGING_DIALOG, options, constants_1.YES, constants_1.NO);
            if (USER_RESPONSE == constants_1.NO || !USER_RESPONSE)
                throw new Error(constants_1.ATTACH_ABORTED);
        }
    });
}
function removeDataBreakpoints() {
    const removebpts = [];
    for (const b of vscode.debug.breakpoints) {
        if ("dataId" in b) {
            removebpts.push(b);
        }
    }
    vscode.debug.removeBreakpoints(removebpts);
}
function getSSHEnabledFromConfig(config) {
    var _a;
    return !!((_a = config.ssh) === null || _a === void 0 ? void 0 : _a.enabled);
}
function validateProgramAndProtsym(config) {
    if (config.programName) {
        if (typeof config.programName !== typeof []) {
            return "ProgramName field in configuration file must be an array.";
        }
        else if (config.programName.length > 30) {
            return "ProgramName field in configuration file cannot contain more than 30 programs.";
        }
    }
    if (config.DSS && typeof config.DSS !== "string") {
        return "DSS field in configuration file must be a string.";
    }
    if (config.protsym) {
        if (typeof config.protsym !== typeof []) {
            return "Protsym field in configuration file must be an array.";
        }
        let limit = 8;
        const regex = new RegExp(config.protsym.join("|"), "i");
        if (config.DSS && regex.test(config.DSS)) {
            limit = 7;
        }
        if (config.protsym.length > limit) {
            return "Protsym and DSS fields in configuration file cannot contain more than 8 PROTSYMs.";
        }
    }
    return undefined;
}
function validateSSHConfig(sshConfig) {
    if (sshConfig.blsPort && sshConfig.blsPortRange) {
        return "You can only specify either blsPort or blsPortRange in SSH configuration.";
    }
    if ((sshConfig.blsPort || sshConfig.blsPortRange) && sshConfig.cciFamilyId) {
        return "You cannot specify both blsPort or blsPortRange and cciFamilyId in SSH configuration.";
    }
    return undefined;
}
function displayHelpForUnknownCommands() {
    outputChannel.appendLine(constants_1.HELP_COMMAND);
    outputChannel.show();
}
function validateLaunchConfig(config, sshEnabled) {
    if (!config.interTestUserName) {
        return "Mandatory parameter 'interTestUserName' is not provided!";
    }
    config.interTestUserName = config.interTestUserName.toLocaleUpperCase();
    if (!config.host) {
        config.host = config.interTestHost;
    }
    if (!config.port) {
        config.port = config.interTestPort;
    }
    if (!config.host) {
        return "Mandatory parameter 'host' is not provided!";
    }
    if (!config.port && !sshEnabled) {
        return "Mandatory parameter 'port' is not provided!";
    }
    if (sshEnabled && config.ssh) {
        return validateSSHConfig(config.ssh);
    }
    return undefined;
}
//# sourceMappingURL=extension.js.map