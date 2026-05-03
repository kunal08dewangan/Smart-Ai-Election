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
exports.LaunchConfigurationService = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
const Utils_1 = require("../zoweService/Utils");
class LaunchConfigurationService {
    constructor(passwordStorage) {
        this.passwordStorage = passwordStorage;
    }
    pickLaunchConfig(request_1) {
        return __awaiter(this, arguments, void 0, function* (request, noConfig = "No debug configurations detected.", filter, placeholder) {
            const cfgs = {};
            let currentLaunchConfigName;
            // TODO Support launch configuration with same names
            for (const cfg of yield this.readLaunchConfigurations(request)) {
                if (!filter || filter(cfg)) {
                    cfgs[cfg.name] = cfg;
                }
            }
            if (Object.keys(cfgs).length > 1) {
                currentLaunchConfigName = yield vscode.window.showQuickPick(Object.keys(cfgs), { placeHolder: placeholder });
            }
            else if (Object.keys(cfgs).length < 1) {
                vscode.window.showErrorMessage(noConfig);
                return undefined;
            }
            else {
                currentLaunchConfigName = Object.keys(cfgs)[0];
            }
            if (!currentLaunchConfigName) {
                return undefined;
            }
            return cfgs[currentLaunchConfigName];
        });
    }
    /**
     * Add workspace directory and password if they are missing
     */
    populateLaunchConfiguration(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (configuration.APIMLAuthToken) {
                configuration.APIMLAuthToken = undefined;
                configuration.host = undefined;
                configuration.port = undefined;
            }
            if (configuration.interTestSecure === undefined)
                configuration.interTestSecure = true;
            if ((_a = configuration.ssh) === null || _a === void 0 ? void 0 : _a.enabled) {
                const errorMessage = this.validateLaunchConfig(configuration, true);
                if (errorMessage) {
                    throw new Error(errorMessage);
                }
                return;
            }
            yield this.updateConfigFromZowe(configuration);
            let password;
            if (!configuration.APIMLAuthToken) {
                const errorMessage = this.validateLaunchConfig(configuration);
                if (errorMessage) {
                    throw new Error(errorMessage);
                }
                if (configuration.host &&
                    configuration.port &&
                    configuration.interTestUserName) {
                    password = yield this.passwordStorage.get(configuration.host, configuration.port, configuration.interTestUserName);
                    if (!password) {
                        throw new Error("Password is not provided.");
                    }
                    configuration.interTestPassword = password;
                    this.passwordStorage.put(configuration.host, configuration.port, configuration.interTestUserName, password);
                }
            }
            if (!vscode.workspace.workspaceFolders) {
                throw new Error("No workspace opened.");
            }
            if (configuration.interTestSecure === undefined)
                configuration.interTestSecure = true;
            configuration.workspaceDirectory =
                vscode.workspace.workspaceFolders[0].uri.fsPath;
        });
    }
    readLaunchConfigurations(request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!vscode.workspace.workspaceFolders) {
                throw new Error("No workspace opened.");
            }
            const config = vscode.workspace.getConfiguration("launch", vscode.workspace.workspaceFolders[0].uri);
            const result = [];
            try {
                const cfgs = config.configurations;
                for (const lc of cfgs) {
                    if ((lc.type === constants_1.DEBUGGER_TYPE_NAME_CICS ||
                        lc.type === constants_1.DEBUGGER_TYPE_NAME_BATCH)) {
                        if (request && lc.request !== request) {
                            continue;
                        }
                        if (!lc.host) {
                            lc.host = lc.interTestHost;
                        }
                        if (!lc.port && lc.interTestPort) {
                            lc.port = lc.interTestPort;
                        }
                        result.push(lc);
                    }
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(error.toString());
            }
            return result;
        });
    }
    validateLaunchConfig(config, sshEnabled = false) {
        if (!config.host) {
            config.host = config.interTestHost;
        }
        if (!config.port) {
            config.port = config.interTestPort;
        }
        if (!config.interTestUserName) {
            return "Mandatory parameter 'interTestUserName' is not provided!";
        }
        config.interTestUserName = config.interTestUserName.toLocaleUpperCase();
        if (!config.host) {
            return "Mandatory parameter 'host' is not provided!";
        }
        if (!config.port && !sshEnabled) {
            return "Mandatory parameter 'port' is not provided!";
        }
    }
    updateConfigFromZowe(config) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (config.apimlProfile && !((_a = config.ssh) === null || _a === void 0 ? void 0 : _a.enabled)) {
                const zoweProfile = yield (0, Utils_1.getZowe)(config.apimlProfile);
                if (zoweProfile) {
                    if (config.path) {
                        config.host = zoweProfile.host;
                        config.port = zoweProfile.port;
                    }
                    const apimlAuthToken = yield (0, Utils_1.getTokenFromZoweProfile)(zoweProfile);
                    if (apimlAuthToken && config.path) {
                        config.APIMLAuthToken = apimlAuthToken;
                    }
                    else if (zoweProfile.user && (!config.interTestUserName || config.interTestUserName.toLocaleUpperCase() == zoweProfile.user.toLocaleUpperCase())) {
                        config.interTestUserName = zoweProfile.user;
                        if (zoweProfile.password && config.host && config.port) {
                            this.passwordStorage.put(config.host, config.port, config.interTestUserName, zoweProfile.password);
                            config.interTestPassword = zoweProfile.password;
                        }
                    }
                }
                else {
                    throw new Error("apimlProfile is incorrect");
                }
            }
        });
    }
}
exports.LaunchConfigurationService = LaunchConfigurationService;
//# sourceMappingURL=LaunchConfigurationService.js.map