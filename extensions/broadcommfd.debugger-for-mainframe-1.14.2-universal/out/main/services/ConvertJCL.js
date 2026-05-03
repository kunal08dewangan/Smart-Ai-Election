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
exports.ConvertJCL = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
const Utils_1 = require("./Utils");
class ConvertJCL {
    constructor(passwordStorage, launchConfigurationService, commandRunner) {
        this.passwordStorage = passwordStorage;
        this.launchConfigurationService = launchConfigurationService;
        this.commandRunner = commandRunner;
    }
    convert() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const conf = yield this.launchConfigurationService.pickLaunchConfig(undefined, "Can't find launch configuration with original JCL data.", this.hasConvertJCLData);
            if (!conf) {
                return;
            }
            try {
                yield this.launchConfigurationService.populateLaunchConfiguration(conf);
                const result = Utils_1.Utils.validateCommandResponse(yield this.commandRunner.run(constants_1.CONVERT_JCL_SERVICE, conf));
                vscode.window.showInformationMessage(`JCL ${(_a = conf.originalJCL) === null || _a === void 0 ? void 0 : _a.inDSN} was converted to ${result.convertedJCL}.`);
            }
            catch (error) {
                if (conf.host && conf.port && conf.interTestUserName)
                    this.passwordStorage.reset(conf.host, conf.port, conf.interTestUserName);
                if (error.message) {
                    vscode.window.showErrorMessage(error.message);
                }
                else {
                    vscode.window.showErrorMessage(error);
                }
            }
        });
    }
    hasConvertJCLData(configuration) {
        if (!configuration["convertedJCL"]) {
            return false;
        }
        if (!configuration["originalJCL"]) {
            return false;
        }
        const org = configuration["originalJCL"];
        return org["inDSN"] && org["stepName"];
    }
}
exports.ConvertJCL = ConvertJCL;
//# sourceMappingURL=ConvertJCL.js.map