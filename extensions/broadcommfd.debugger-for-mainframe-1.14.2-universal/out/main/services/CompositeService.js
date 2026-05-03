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
exports.CompositeService = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
const Utils_1 = require("./Utils");
class CompositeService {
    constructor(passwordStorage, launchConfigurationService, outputChannel, commandRunner) {
        this.passwordStorage = passwordStorage;
        this.launchConfigurationService = launchConfigurationService;
        this.outputChannel = outputChannel;
        this.commandRunner = commandRunner;
    }
    listComposite() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentLaunchConfig = yield this.launchConfigurationService.pickLaunchConfig(undefined, "No composite configuration found", this.isCompositeConfig);
            if (!currentLaunchConfig) {
                return;
            }
            try {
                yield this.launchConfigurationService.populateLaunchConfiguration(currentLaunchConfig);
                const resultContent = Utils_1.Utils.validateCommandResponse(yield this.commandRunner.run(constants_1.LIST_COMPOSITE_SERVICE, currentLaunchConfig));
                const compositeList = resultContent;
                this.outputChannel.appendLine(JSON.stringify(compositeList, undefined, 2));
                for (const loadmodule in compositeList) {
                    let line = `${loadmodule}: [`;
                    for (const csect of compositeList[loadmodule]) {
                        line = line.concat(`"${loadmodule}_${csect.name}",`);
                    }
                    if (line.endsWith(",")) {
                        line = line.substring(0, line.lastIndexOf(","));
                    }
                    this.outputChannel.appendLine(`${line}]`);
                }
            }
            catch (error) {
                if (currentLaunchConfig.host &&
                    currentLaunchConfig.port &&
                    currentLaunchConfig.interTestUserName)
                    this.passwordStorage.reset(currentLaunchConfig.host, currentLaunchConfig.port, currentLaunchConfig.interTestUserName);
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.outputChannel.appendLine(errorMessage);
                vscode.window.showErrorMessage(errorMessage);
            }
            this.outputChannel.show();
        });
    }
    isCompositeConfig(configuration) {
        if (!configuration['programName']) {
            return false;
        }
        for (const pname of configuration['programName']) {
            if (pname.includes('_'))
                return true;
        }
        return false;
    }
}
exports.CompositeService = CompositeService;
//# sourceMappingURL=CompositeService.js.map