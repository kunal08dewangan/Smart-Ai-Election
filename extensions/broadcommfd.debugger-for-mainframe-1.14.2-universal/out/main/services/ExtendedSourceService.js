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
exports.ExtendedSourceService = exports.SEPARATOR = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const constants_1 = require("../constants");
const SymbolicSelector_1 = require("./SymbolicSelector");
const Utils_1 = require("./Utils");
exports.SEPARATOR = "_";
class ExtendedSourceService {
    constructor(passwordStorage, launchConfigurationService, commandRunner) {
        this.passwordStorage = passwordStorage;
        this.launchConfigurationService = launchConfigurationService;
        this.commandRunner = commandRunner;
    }
    fetchExtendedSource() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentLaunchConfig = yield this.launchConfigurationService.pickLaunchConfig(undefined, "No launch configuration found", this.isEligibleForFetchingSource);
            if (!currentLaunchConfig) {
                return;
            }
            try {
                yield this.launchConfigurationService.populateLaunchConfiguration(currentLaunchConfig);
                yield this.requestExtendedSource(currentLaunchConfig);
            }
            catch (error) {
                if (error.message) {
                    vscode.window.showErrorMessage(error.message);
                }
                else {
                    vscode.window.showErrorMessage(error);
                }
            }
        });
    }
    isEligibleForFetchingSource(configuration) {
        if (!(configuration['programName'] && configuration['programName'].length > 0)) {
            return false;
        }
        if (configuration['type'] === constants_1.DEBUGGER_TYPE_NAME_BATCH) {
            return ((configuration.protsym && configuration.protsym.length > 0) || !!configuration.DSS);
        }
        return true;
    }
    requestExtendedSource(symbolicRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = Utils_1.Utils.validateCommandResponse(yield this.commandRunner.run(constants_1.FETCH_EXTENDED_SOURCE_SERVICE, symbolicRequest));
                yield this.validateParsedJSON(result, symbolicRequest);
            }
            catch (error) {
                if (error.message) {
                    vscode.window.showErrorMessage(error.message);
                }
                else {
                    vscode.window.showErrorMessage(error);
                }
            }
        });
    }
    processExtendedSourceResponse(result, currentLaunchConfig) {
        try {
            const extSrc = result;
            this.openSrc(extSrc);
        }
        catch (error) {
            if (currentLaunchConfig.interTestUserName &&
                currentLaunchConfig.host &&
                currentLaunchConfig.port)
                this.passwordStorage.reset(currentLaunchConfig.host, currentLaunchConfig.port, currentLaunchConfig.interTestUserName);
            if (error.message) {
                vscode.window.showErrorMessage(error.message);
            }
            else {
                vscode.window.showErrorMessage(error);
            }
        }
    }
    openSrc(extSrc) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const program of Object.keys(extSrc)) {
                const extSrcPath = this.copyExtendedSourceToWorkspace(extSrc[program]);
                const document = yield vscode.workspace.openTextDocument(vscode.Uri.file(extSrcPath));
                yield vscode.window.showTextDocument(document, { preview: false });
                vscode.window.showInformationMessage(`Extended source for ${program} was fetched successfully.`);
            }
        });
    }
    copyExtendedSourceToWorkspace(extSrc) {
        if (!vscode.workspace.workspaceFolders) {
            throw new Error("No workspace opened.");
        }
        const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const srcFileName = extSrc.member +
            exports.SEPARATOR +
            extSrc.date +
            exports.SEPARATOR +
            extSrc.time +
            exports.SEPARATOR +
            extSrc.protsym +
            extSrc.memberExtension;
        const targetPath = path.join(workspaceRootPath, ".c4z", ".extsrcs", srcFileName);
        if (!fs.existsSync(path.dirname(targetPath))) {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        }
        fs.writeFileSync(targetPath, extSrc.source);
        return targetPath;
    }
    processSyncProtsym(key, syncProtsym) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (syncProtsym) {
                    const buttonOptions = [
                        { title: constants_1.YES },
                        { title: constants_1.NO, isCloseAffordance: true },
                    ];
                    const response = yield vscode.window.showWarningMessage(constants_1.SYMBOLIC_SELECT + ". " + constants_1.CONTINUE_OR_NOT, ...buttonOptions);
                    if (!response || response.title === constants_1.NO) {
                        return;
                    }
                    const symbolicList = syncProtsym.map((protsym) => ({
                        label: (0, SymbolicSelector_1.formatTimeStamp)(protsym.date, protsym.time) +
                            "  " +
                            protsym.DSN,
                    }));
                    const optionSelected = yield vscode.window.showQuickPick(symbolicList, {
                        placeHolder: "Select the symbolic listing for the monitor " +
                            key,
                        ignoreFocusOut: true,
                    });
                    if (optionSelected) {
                        const sel = symbolicList.find(item => item.label === optionSelected.label);
                        if (sel) {
                            const index = symbolicList.indexOf(sel);
                            syncProtsym[index].program = key;
                            return syncProtsym[index];
                        }
                    }
                    return;
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    }
    validateParsedJSON(parsedData, symbolicRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const syncProtsymList = [];
            if (parsedData != null && typeof parsedData === "object") {
                const firstEntry = Object.entries(parsedData)[0];
                if (firstEntry) {
                    const [, extendedSourceResponse] = firstEntry;
                    if (this.isValidExtendedSourceResponse(extendedSourceResponse)) {
                        this.processExtendedSourceResponse(parsedData, symbolicRequest);
                    }
                }
                if (!Array.isArray(parsedData) &&
                    Object.keys(parsedData).length > 0) {
                    for (const [key, val] of Object.entries(parsedData)) {
                        const protsymArray = val;
                        if (this.isValidProtsymArray(protsymArray)) {
                            if (protsymArray.length > 1) {
                                const selectedProtsym = yield this.processSyncProtsym(key, protsymArray);
                                if (selectedProtsym)
                                    syncProtsymList.push(selectedProtsym);
                            }
                            else {
                                protsymArray[0].program = key;
                                syncProtsymList.push(protsymArray[0]);
                            }
                        }
                    }
                }
            }
            if (syncProtsymList.length > 0) {
                const clone = Object.assign(Object.assign({}, symbolicRequest), { protsymList: syncProtsymList });
                yield this.requestExtendedSource(clone);
            }
        });
    }
    // Validate if the parsed object matches ExtendedSourceResponse structure
    isValidExtendedSourceResponse(data) {
        return (typeof data.protsym === "string" &&
            typeof data.member === "string" &&
            typeof data.date === "number" &&
            typeof data.time === "number" &&
            typeof data.source === "string");
    }
    isValidProtsymArray(val) {
        return (Array.isArray(val) &&
            val.length > 0 &&
            val.every((protsym) => typeof protsym.date === "number" &&
                typeof protsym.time === "number"));
    }
}
exports.ExtendedSourceService = ExtendedSourceService;
//# sourceMappingURL=ExtendedSourceService.js.map