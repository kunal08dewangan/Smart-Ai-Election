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
exports.BatchLinkQueueService = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
const TelemetryReporterService_1 = require("./TelemetryReporterService");
const timers_1 = require("timers");
class BatchLinkQueueService {
    constructor(passwordStorage, launchConfigurationService, commandRunner) {
        this.passwordStorage = passwordStorage;
        this.launchConfigurationService = launchConfigurationService;
        this.commandRunner = commandRunner;
    }
    fetch(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.launchConfigurationService.populateLaunchConfiguration(config);
                const configCopy = Object.assign({}, config);
                const selectedRow = yield this.showRefreshingQuickPick(configCopy);
                if (!selectedRow)
                    return;
                config.batchLinkRow = selectedRow;
                TelemetryReporterService_1.TelemetryReporterService.Instance.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_BATCH_QUEUE_JOBS);
                return config;
            }
            catch (error) {
                if (config.host && config.port && config.interTestUserName)
                    this.passwordStorage.reset(config.host, config.port, config.interTestUserName);
                if (error.message) {
                    throw new Error(error.message);
                }
                throw new Error(error);
            }
        });
    }
    showQueueList(config, queueJobsRaw, quickPick) {
        return __awaiter(this, void 0, void 0, function* () {
            const queueJobs = this.orderJobsArray(queueJobsRaw);
            const jobNames = queueJobs.map((job) => ({
                label: this.getJobIdentifier(job),
            }));
            quickPick.items = jobNames;
            quickPick.busy = false;
            return new Promise((resolve) => {
                quickPick.onDidAccept(() => {
                    quickPick.hide();
                    const selection = quickPick.selectedItems;
                    if (selection.length > 0) {
                        const selectedJobName = selection[0].label;
                        const selectedRow = queueJobs.find((job) => this.getJobIdentifier(job) === selectedJobName);
                        if (selectedRow) {
                            quickPick.hide();
                            resolve(selectedRow);
                        }
                    }
                });
            });
        });
    }
    static addBreakpoint(breakpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            const _detail = JSON.parse(breakpoint.breakpointDetail);
            const loc = new vscode.Location(vscode.Uri.file(breakpoint.source.path), new vscode.Position(breakpoint.line - 1, 0));
            const bp = new vscode.SourceBreakpoint(loc, true, _detail.condition, _detail.hitCondition === "0" ? undefined : _detail.hitCondition, _detail.logMessage);
            vscode.debug.addBreakpoints([bp]);
            return bp;
        });
    }
    getJobIdentifier(job) {
        var _a, _b, _c, _d;
        return `Job = ${(_a = job.jobName) === null || _a === void 0 ? void 0 : _a.trim()}  |  Step = ${(_b = job.stepName) === null || _b === void 0 ? void 0 : _b.trim()}  |  Pgm = ${(_c = job.program) === null || _c === void 0 ? void 0 : _c.trim()}  |  User = ${(_d = job.owner) === null || _d === void 0 ? void 0 : _d.trim()}`;
    }
    orderJobsArray(jobs) {
        return jobs.sort((a, b) => a.owner.localeCompare(b.owner));
    }
    showRefreshingQuickPick(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = [];
            const quickPick = createQueueQuickPick(items);
            quickPick.show();
            const statusBarItem = createStatusitem();
            statusBarItem.show();
            let fetchResponse = yield this.commandRunner.run(constants_1.JAR_BATCH_LINK_QUEUE_SERVICE, config);
            let fetchResponseJson;
            quickPick.show();
            let interval;
            return new Promise((resolve) => {
                let running = false;
                interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        if (running) {
                            return;
                        }
                        running = true;
                        fetchResponse = yield this.commandRunner.run(constants_1.JAR_BATCH_LINK_QUEUE_SERVICE, config);
                        running = false;
                        fetchResponseJson = JSON.parse(fetchResponse);
                        if (fetchResponseJson.error) {
                            vscode.window.showErrorMessage(fetchResponseJson.error);
                            resolve(undefined);
                        }
                    }
                    catch (error) {
                        vscode.window.showErrorMessage(error.message);
                        resolve(undefined);
                        if (config.host && config.port && config.interTestUserName)
                            this.passwordStorage.reset(config.host, config.port, config.interTestUserName);
                        return;
                    }
                    if ('message' in fetchResponseJson) {
                        quickPick.busy = true;
                        quickPick.items = items;
                        quickPick.placeholder = fetchResponseJson.message;
                    }
                    else {
                        statusBarItem.hide();
                        const port = getPortByConfig(config);
                        quickPick.placeholder = constants_1.QUICK_PICK_PLACEHOLDER +
                            config.host +
                            port;
                        resolve(yield this.showQueueList(config, fetchResponseJson, quickPick));
                    }
                }), 3000);
                quickPick.onDidHide(() => {
                    resolve(undefined);
                });
            }).finally(() => {
                (0, timers_1.clearInterval)(interval);
                if (typeof quickPick.dispose === 'function') {
                    quickPick.dispose(); // TypeScript knows this is safe now
                }
                statusBarItem.hide();
            });
        });
    }
}
exports.BatchLinkQueueService = BatchLinkQueueService;
function createQueueQuickPick(items) {
    const quickPick = vscode.window.createQuickPick();
    quickPick.items = items;
    quickPick.title = "List of jobs in the batch link queue.";
    quickPick.placeholder = "No batch Jobs Available";
    quickPick.ignoreFocusOut = true;
    quickPick.busy = true;
    return quickPick;
}
function createStatusitem() {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBarItem.text = '$(sync~spin) Refreshing BatchLinkQueue ...';
    statusBarItem.backgroundColor = new vscode.ThemeColor('#007acc');
    statusBarItem.color = new vscode.ThemeColor('statusBarItem.foreground');
    return statusBarItem;
}
function getPortByConfig(config) {
    let result;
    if (config.port) {
        result = config.port;
    }
    if (config.ssh && config.ssh.enabled) {
        result = config.ssh.sshPort ? config.ssh.sshPort : 22;
    }
    return result ? ":" + result : "";
}
//# sourceMappingURL=BatchlinkQueueService.js.map